"""
Public proxy endpoints — authenticated via virtual keys (no JWT required).

Employees point their OpenAI SDK here:
    client = OpenAI(base_url="https://gateway.company.com/v1", api_key="sk-vw-xxx")

These endpoints handle the full request lifecycle:
    1. Authenticate virtual key
    2. Resolve endpoint (provider, model, API key)
    3. Check budget + rate limits
    4. Run guardrails on input
    5. Forward to LLM via litellm
    6. Log spend + reconcile budget
"""

import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from src.services.proxy_service import (
    authenticate_virtual_key,
    resolve_endpoint_for_key,
    resolve_endpoint_by_id,
    check_org_budget,
    reconcile_budget,
    check_rate_limit,
    log_spend,
    get_guardrail_config,
    log_guardrail_detection,
)
from src.services.cost_service import estimate_prompt_cost
from src.services.llm_service import chat_completion, embedding, stream_chat_completion
from src.services.guardrail_service import scan_text

logger = logging.getLogger("uvicorn")

router = APIRouter()

MAX_FALLBACK_DEPTH = 3


# ─── Request Models ──────────────────────────────────────────────────────────

class ProxyChatRequest(BaseModel):
    model: str  # endpoint slug
    messages: list[dict]
    stream: bool = False
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None


class ProxyEmbeddingRequest(BaseModel):
    model: str  # endpoint slug
    input: str | list[str]


# ─── Auth Helper ─────────────────────────────────────────────────────────────

async def _extract_virtual_key(request: Request) -> dict:
    """Extract and validate virtual key from Authorization header."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <virtual-key>")
    token = auth[7:].strip()
    try:
        return await authenticate_virtual_key(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


# ─── Guardrail Scanning ─────────────────────────────────────────────────────

async def _run_guardrails(
    organization_id: int,
    messages: list[dict],
    endpoint_id: int,
) -> list[dict]:
    """Scan all user messages through guardrails. Returns possibly-masked messages."""
    rules, guardrail_settings = await get_guardrail_config(organization_id)
    if not rules:
        return messages

    updated = list(messages)
    for i, msg in enumerate(updated):
        if msg.get("role") != "user" or not isinstance(msg.get("content"), str):
            continue

        result = scan_text(
            text=msg["content"],
            guardrail_rules=[{"guardrail_type": r["guardrail_type"], "config": r["config"],
                              "action": r["action"], "is_active": True, "id": r["id"], "name": r["name"]}
                             for r in rules],
            settings=guardrail_settings,
        )

        # Log detections
        for detection in result.get("detections", []):
            try:
                await log_guardrail_detection(
                    organization_id=organization_id,
                    guardrail_id=detection.get("guardrail_id"),
                    endpoint_id=endpoint_id,
                    guardrail_type=detection.get("guardrail_type", ""),
                    action_taken="blocked" if result.get("blocked") else detection.get("action", "allowed"),
                    matched_text=detection.get("matched_text", ""),
                    entity_type=detection.get("entity_type", ""),
                    execution_time_ms=result.get("execution_time_ms", 0),
                )
            except Exception as e:
                logger.error(f"Failed to log guardrail detection: {e}")

        if result.get("blocked"):
            raise HTTPException(
                status_code=400,
                detail=f"Request blocked by guardrail: {result.get('block_reason', 'policy violation')}",
            )

        if result.get("masked_text"):
            updated[i] = {**msg, "content": result["masked_text"]}

    return updated


# ─── Chat Completions ────────────────────────────────────────────────────────

@router.post("/v1/chat/completions")
async def proxy_chat(request: Request, body: ProxyChatRequest):
    """OpenAI-compatible chat completions endpoint with virtual key auth."""
    vk = await _extract_virtual_key(request)
    org_id = vk["organization_id"]
    endpoint_slug = body.model  # "model" field is the endpoint slug

    try:
        endpoint = await resolve_endpoint_for_key(
            org_id, endpoint_slug, vk.get("allowed_endpoint_ids") or [],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Rate limit: per-endpoint + per-key
    if endpoint.get("rate_limit_rpm") and endpoint["rate_limit_rpm"] > 0:
        if not await check_rate_limit(f"ep:{endpoint['id']}", endpoint["rate_limit_rpm"]):
            raise HTTPException(status_code=429, detail="Endpoint rate limit exceeded")
    if vk.get("rate_limit_rpm") and vk["rate_limit_rpm"] > 0:
        if not await check_rate_limit(f"vk:{vk['id']}", vk["rate_limit_rpm"]):
            raise HTTPException(status_code=429, detail="Virtual key rate limit exceeded")

    # Cost estimation + budget check
    estimated_cost = estimate_prompt_cost(
        model=endpoint["model"],
        messages=body.messages,
        max_tokens=body.max_tokens or endpoint.get("max_tokens") or 4096,
    )
    if not await check_org_budget(org_id, estimated_cost):
        raise HTTPException(status_code=402, detail="Organization budget limit exceeded")

    # Guardrails
    scanned_messages = await _run_guardrails(org_id, body.messages, endpoint["id"])

    # Build final messages (system prompt prepended if configured)
    final_messages = scanned_messages
    if endpoint.get("system_prompt"):
        final_messages = [{"role": "system", "content": endpoint["system_prompt"]}] + scanned_messages

    # Build kwargs
    kwargs = {}
    if body.temperature is not None or endpoint.get("temperature") is not None:
        kwargs["temperature"] = body.temperature if body.temperature is not None else float(endpoint["temperature"])
    if body.max_tokens is not None or endpoint.get("max_tokens") is not None:
        kwargs["max_tokens"] = body.max_tokens or endpoint["max_tokens"]
    if body.top_p is not None:
        kwargs["top_p"] = body.top_p

    start_time = time.time()

    if body.stream:
        return await _handle_stream(
            org_id, vk, endpoint, final_messages, kwargs, estimated_cost, start_time,
        )

    return await _handle_completion(
        org_id, vk, endpoint, final_messages, kwargs, estimated_cost, start_time,
    )


async def _handle_completion(
    org_id: int, vk: dict, endpoint: dict,
    messages: list[dict], kwargs: dict,
    estimated_cost: float, start_time: float,
    _depth: int = 0,
):
    """Non-streaming completion with fallback support."""
    try:
        result = await chat_completion(
            model=endpoint["model"],
            messages=messages,
            api_key=endpoint["decrypted_key"],
            **kwargs,
        )

        latency_ms = int((time.time() - start_time) * 1000)
        usage = result.get("usage", {})
        cost = result.get("cost_usd", 0)

        await log_spend(
            organization_id=org_id,
            endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"],
            provider=endpoint["provider"],
            model=result.get("model", endpoint["model"]),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            cost_usd=cost,
            latency_ms=latency_ms,
            metadata={"virtual_key_id": str(vk["id"])},
        )
        await reconcile_budget(org_id, estimated_cost, cost)

        return JSONResponse(content=result)

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)

        # Log failed request
        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=endpoint["model"], prompt_tokens=0, completion_tokens=0,
            total_tokens=0, cost_usd=0, latency_ms=latency_ms, status_code=500,
        )
        await reconcile_budget(org_id, estimated_cost, 0)

        # Fallback
        if endpoint.get("fallback_endpoint_id") and _depth < MAX_FALLBACK_DEPTH:
            fallback = await resolve_endpoint_by_id(org_id, endpoint["fallback_endpoint_id"])
            if fallback:
                logger.info(f"Falling back to {fallback['slug']} (depth {_depth + 1})")
                return await _handle_completion(
                    org_id, vk, fallback, messages, kwargs, 0, time.time(), _depth + 1,
                )

        raise HTTPException(status_code=502, detail=f"LLM provider error: {str(e)[:200]}")


async def _handle_stream(
    org_id: int, vk: dict, endpoint: dict,
    messages: list[dict], kwargs: dict,
    estimated_cost: float, start_time: float,
):
    """Streaming completion — returns SSE response."""

    async def _stream_generator():
        total_prompt = 0
        total_completion = 0
        total_cost = 0.0
        final_model = endpoint["model"]

        try:
            async for chunk_str in stream_chat_completion(
                model=endpoint["model"],
                messages=messages,
                api_key=endpoint["decrypted_key"],
                **kwargs,
            ):
                yield chunk_str

                # Parse SSE for usage data
                if chunk_str.startswith("data: ") and chunk_str.strip() != "data: [DONE]":
                    try:
                        chunk = json.loads(chunk_str[6:])
                        if "usage" in chunk:
                            total_prompt = chunk["usage"].get("prompt_tokens", total_prompt)
                            total_completion = chunk["usage"].get("completion_tokens", total_completion)
                        if "cost_usd" in chunk:
                            total_cost = chunk["cost_usd"]
                        if "model" in chunk:
                            final_model = chunk["model"]
                    except (json.JSONDecodeError, KeyError):
                        pass

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)[:200]})}\n\n"
        finally:
            latency_ms = int((time.time() - start_time) * 1000)
            await log_spend(
                organization_id=org_id, endpoint_id=endpoint["id"],
                virtual_key_id=vk["id"], provider=endpoint["provider"],
                model=final_model,
                prompt_tokens=total_prompt, completion_tokens=total_completion,
                total_tokens=total_prompt + total_completion,
                cost_usd=total_cost, latency_ms=latency_ms,
                metadata={"virtual_key_id": str(vk["id"])},
            )
            await reconcile_budget(org_id, estimated_cost, total_cost)

    return StreamingResponse(_stream_generator(), media_type="text/event-stream")


# ─── Embeddings ──────────────────────────────────────────────────────────────

@router.post("/v1/embeddings")
async def proxy_embeddings(request: Request, body: ProxyEmbeddingRequest):
    """OpenAI-compatible embeddings endpoint with virtual key auth."""
    vk = await _extract_virtual_key(request)
    org_id = vk["organization_id"]
    endpoint_slug = body.model

    try:
        endpoint = await resolve_endpoint_for_key(
            org_id, endpoint_slug, vk.get("allowed_endpoint_ids") or [],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Rate limit
    if endpoint.get("rate_limit_rpm") and endpoint["rate_limit_rpm"] > 0:
        if not await check_rate_limit(f"ep:{endpoint['id']}", endpoint["rate_limit_rpm"]):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

    # Guardrails on embedding input
    input_texts = body.input if isinstance(body.input, list) else [body.input]
    scanned_texts = []
    for text_item in input_texts:
        scanned = await _run_guardrails(
            org_id, [{"role": "user", "content": text_item}], endpoint["id"],
        )
        scanned_texts.append(scanned[0].get("content", text_item))

    # Cost estimation + budget
    estimated_cost = estimate_prompt_cost(
        model=endpoint["model"],
        messages=[{"role": "user", "content": " ".join(scanned_texts)}],
    )
    if not await check_org_budget(org_id, estimated_cost):
        raise HTTPException(status_code=402, detail="Budget limit exceeded")

    start_time = time.time()

    try:
        result = await embedding(
            model=endpoint["model"],
            input_text=scanned_texts if isinstance(body.input, list) else scanned_texts[0],
            api_key=endpoint["decrypted_key"],
        )

        latency_ms = int((time.time() - start_time) * 1000)
        usage = result.get("usage", {})
        cost = result.get("cost_usd", 0)

        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=result.get("model", endpoint["model"]),
            prompt_tokens=usage.get("prompt_tokens", 0), completion_tokens=0,
            total_tokens=usage.get("total_tokens", 0),
            cost_usd=cost, latency_ms=latency_ms,
            metadata={"virtual_key_id": str(vk["id"])},
        )
        await reconcile_budget(org_id, estimated_cost, cost)

        return JSONResponse(content=result)

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        await log_spend(
            organization_id=org_id, endpoint_id=endpoint["id"],
            virtual_key_id=vk["id"], provider=endpoint["provider"],
            model=endpoint["model"], prompt_tokens=0, completion_tokens=0,
            total_tokens=0, cost_usd=0, latency_ms=latency_ms, status_code=500,
        )
        await reconcile_budget(org_id, estimated_cost, 0)
        raise HTTPException(status_code=502, detail=f"Embedding error: {str(e)[:200]}")


# ─── Models List ─────────────────────────────────────────────────────────────

@router.get("/v1/models")
async def list_models_for_key(request: Request):
    """List available endpoint slugs for the authenticated virtual key."""
    vk = await _extract_virtual_key(request)
    from src.database.db import get_db
    from sqlalchemy import text as sql_text

    db = await get_db()
    try:
        allowed = vk.get("allowed_endpoint_ids") or []
        if allowed:
            result = await db.execute(
                sql_text("""
                    SELECT slug AS id, display_name AS name, provider, model
                    FROM ai_gateway_endpoints
                    WHERE organization_id = :org_id AND is_active = true
                      AND id = ANY(:ids)
                    ORDER BY display_name
                """),
                {"org_id": vk["organization_id"], "ids": allowed},
            )
        else:
            result = await db.execute(
                sql_text("""
                    SELECT slug AS id, display_name AS name, provider, model
                    FROM ai_gateway_endpoints
                    WHERE organization_id = :org_id AND is_active = true
                    ORDER BY display_name
                """),
                {"org_id": vk["organization_id"]},
            )
        models = [dict(r) for r in result.mappings().fetchall()]
        return {"object": "list", "data": [{"id": m["id"], "object": "model", "owned_by": m["provider"]} for m in models]}
    finally:
        await db.close()
