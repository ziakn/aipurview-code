"""
Proxy service — virtual key authentication, endpoint resolution, budget enforcement,
rate limiting, and spend logging for the AI Gateway.

This is the core orchestration layer that replaces the Express proxy flow,
enabling employees to use the gateway directly with virtual keys.
"""

import hashlib
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as aioredis
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as crypto_padding
from cryptography.hazmat.backends import default_backend
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database.db import get_db

logger = logging.getLogger("uvicorn")

# ─── Redis connection ────────────────────────────────────────────────────────

_redis: Optional[aioredis.Redis] = None


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


# ─── Encryption ──────────────────────────────────────────────────────────────

def decrypt_api_key(encrypted_text: str) -> str:
    """Decrypt an API key encrypted by the Node.js backend (AES-256-CBC, hex IV:data)."""
    if not settings.encryption_key:
        raise ValueError("ENCRYPTION_KEY not configured")
    parts = encrypted_text.split(":")
    if len(parts) != 2:
        raise ValueError("Invalid encrypted format")
    iv_hex, data_hex = parts
    key = settings.encryption_key.encode("ascii").ljust(32, b"0")[:32]
    iv = bytes.fromhex(iv_hex)
    ct = bytes.fromhex(data_hex)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ct) + decryptor.finalize()
    unpadder = crypto_padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()
    return plaintext.decode("utf-8")


# ─── Virtual Key Authentication ──────────────────────────────────────────────

def hash_virtual_key(plain_key: str) -> str:
    """SHA-256 hash a virtual key (matches the Node.js hashVirtualKey function)."""
    return hashlib.sha256(plain_key.encode("utf-8")).hexdigest()


async def authenticate_virtual_key(bearer_token: str) -> dict:
    """
    Validate a virtual key and return its metadata.
    Returns: { id, organization_id, name, allowed_endpoint_ids, max_budget_usd,
               current_spend_usd, rate_limit_rpm, is_active, expires_at }
    Raises ValueError if invalid.
    """
    if not bearer_token.startswith("sk-vw-"):
        raise ValueError("Invalid virtual key format")

    key_hash = hash_virtual_key(bearer_token)
    db = await get_db()
    try:
        result = await db.execute(
            text("""
                SELECT id, organization_id, name, allowed_endpoint_ids,
                       max_budget_usd, current_spend_usd, rate_limit_rpm,
                       is_active, revoked_at, expires_at
                FROM ai_gateway_virtual_keys
                WHERE key_hash = :key_hash
            """),
            {"key_hash": key_hash},
        )
        row = result.mappings().fetchone()
        if not row:
            raise ValueError("Virtual key not found")

        if not row["is_active"]:
            raise ValueError("Virtual key is inactive")
        if row["revoked_at"]:
            raise ValueError("Virtual key has been revoked")
        if row["expires_at"] and row["expires_at"] < datetime.now(timezone.utc):
            raise ValueError("Virtual key has expired")

        # Check per-key budget
        if row["max_budget_usd"] is not None:
            if float(row["current_spend_usd"]) >= float(row["max_budget_usd"]):
                raise ValueError("Virtual key budget exhausted")

        return dict(row)
    finally:
        await db.close()


# ─── Endpoint Resolution ─────────────────────────────────────────────────────

async def resolve_endpoint_for_key(
    organization_id: int,
    endpoint_slug: str,
    allowed_endpoint_ids: list[int],
) -> dict:
    """
    Resolve an endpoint by slug, verify it's in the key's allowed list,
    and decrypt the provider API key.
    Returns: { id, provider, model, max_tokens, temperature, system_prompt,
               rate_limit_rpm, prompt_id, prompt_label, fallback_endpoint_id,
               is_active, decrypted_key }
    """
    db = await get_db()
    try:
        result = await db.execute(
            text("""
                SELECT e.id, e.slug, e.display_name, e.provider, e.model,
                       e.max_tokens, e.temperature, e.system_prompt,
                       e.rate_limit_rpm, e.prompt_id, e.prompt_label,
                       e.fallback_endpoint_id, e.is_active,
                       k.encrypted_key, k.is_active AS key_is_active
                FROM ai_gateway_endpoints e
                JOIN ai_gateway_api_keys k ON e.api_key_id = k.id
                WHERE e.organization_id = :org_id AND e.slug = :slug
            """),
            {"org_id": organization_id, "slug": endpoint_slug},
        )
        row = result.mappings().fetchone()
        if not row:
            raise ValueError(f"Endpoint not found: {endpoint_slug}")
        if not row["is_active"]:
            raise ValueError(f"Endpoint is inactive: {endpoint_slug}")
        if not row["key_is_active"]:
            raise ValueError(f"API key is inactive for endpoint: {endpoint_slug}")

        # Check if endpoint is in the key's allowed list (empty = all allowed)
        if allowed_endpoint_ids and row["id"] not in allowed_endpoint_ids:
            raise ValueError(f"Virtual key does not have access to endpoint: {endpoint_slug}")

        decrypted_key = decrypt_api_key(row["encrypted_key"])

        return {**dict(row), "decrypted_key": decrypted_key}
    finally:
        await db.close()


async def resolve_endpoint_by_id(organization_id: int, endpoint_id: int) -> Optional[dict]:
    """Resolve an endpoint by ID (for fallback chains)."""
    db = await get_db()
    try:
        result = await db.execute(
            text("""
                SELECT e.id, e.slug, e.display_name, e.provider, e.model,
                       e.is_active, e.fallback_endpoint_id,
                       k.encrypted_key, k.is_active AS key_is_active
                FROM ai_gateway_endpoints e
                JOIN ai_gateway_api_keys k ON e.api_key_id = k.id
                WHERE e.organization_id = :org_id AND e.id = :id
            """),
            {"org_id": organization_id, "id": endpoint_id},
        )
        row = result.mappings().fetchone()
        if not row or not row["is_active"] or not row["key_is_active"]:
            return None
        return {**dict(row), "decrypted_key": decrypt_api_key(row["encrypted_key"])}
    finally:
        await db.close()


# ─── Budget Enforcement ──────────────────────────────────────────────────────

async def check_org_budget(organization_id: int, estimated_cost: float) -> bool:
    """
    Check if org budget allows the request. Returns True if allowed.
    Uses atomic UPDATE with WHERE clause to prevent TOCTOU.
    """
    if estimated_cost <= 0:
        return True

    db = await get_db()
    try:
        result = await db.execute(
            text("""
                UPDATE ai_gateway_budgets
                SET current_spend_usd = current_spend_usd + :cost,
                    updated_at = NOW()
                WHERE organization_id = :org_id
                  AND (NOT is_hard_limit OR current_spend_usd + :cost <= monthly_limit_usd)
                RETURNING id, current_spend_usd, monthly_limit_usd, is_hard_limit, alert_threshold_pct
            """),
            {"org_id": organization_id, "cost": estimated_cost},
        )
        await db.commit()
        row = result.mappings().fetchone()
        # If no row returned and budget exists with hard limit, it means budget exceeded
        if row is None:
            # Check if budget exists at all
            check = await db.execute(
                text("SELECT is_hard_limit FROM ai_gateway_budgets WHERE organization_id = :org_id"),
                {"org_id": organization_id},
            )
            budget = check.mappings().fetchone()
            if budget and budget["is_hard_limit"]:
                return False
            # No budget configured or soft limit — allow through
            return True
        return True
    finally:
        await db.close()


async def reconcile_budget(organization_id: int, estimated_cost: float, actual_cost: float):
    """Adjust budget after request completes: remove estimate, add actual."""
    adjustment = actual_cost - estimated_cost
    if abs(adjustment) < 0.000001:
        return
    db = await get_db()
    try:
        await db.execute(
            text("""
                UPDATE ai_gateway_budgets
                SET current_spend_usd = GREATEST(0, current_spend_usd + :adjustment),
                    updated_at = NOW()
                WHERE organization_id = :org_id
            """),
            {"org_id": organization_id, "adjustment": adjustment},
        )
        await db.commit()
    finally:
        await db.close()


# ─── Rate Limiting ───────────────────────────────────────────────────────────

RATE_LIMIT_WINDOW = 60  # seconds


async def check_rate_limit(key: str, rpm: int) -> bool:
    """Check RPM rate limit using Redis sorted set. Returns True if allowed."""
    if rpm <= 0:
        return True

    r = await _get_redis()
    redis_key = f"gw:rate:{key}"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW

    pipe = r.pipeline()
    pipe.zremrangebyscore(redis_key, 0, window_start)
    pipe.zcard(redis_key)
    pipe.zadd(redis_key, {str(now): now})
    pipe.expire(redis_key, RATE_LIMIT_WINDOW + 10)
    results = await pipe.execute()

    count = results[1]  # zcard result
    return count < rpm


# ─── Spend Logging ───────────────────────────────────────────────────────────

async def log_spend(
    organization_id: int,
    endpoint_id: int,
    virtual_key_id: int,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost_usd: float,
    latency_ms: int,
    status_code: int = 200,
    metadata: Optional[dict] = None,
):
    """Insert a spend log entry and update virtual key spend."""
    db = await get_db()
    try:
        # Insert spend log
        await db.execute(
            text("""
                INSERT INTO ai_gateway_spend_logs
                    (organization_id, endpoint_id, provider, model,
                     prompt_tokens, completion_tokens, total_tokens,
                     cost_usd, latency_ms, status_code, metadata, virtual_key_id)
                VALUES
                    (:org_id, :endpoint_id, :provider, :model,
                     :prompt_tokens, :completion_tokens, :total_tokens,
                     :cost_usd, :latency_ms, :status_code, :metadata::jsonb, :vk_id)
            """),
            {
                "org_id": organization_id,
                "endpoint_id": endpoint_id,
                "provider": provider,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
                "status_code": status_code,
                "metadata": "{}" if not metadata else str(metadata).replace("'", '"'),
                "vk_id": virtual_key_id,
            },
        )

        # Update virtual key spend
        if cost_usd > 0:
            await db.execute(
                text("""
                    UPDATE ai_gateway_virtual_keys
                    SET current_spend_usd = current_spend_usd + :cost,
                        updated_at = NOW()
                    WHERE id = :vk_id
                """),
                {"cost": cost_usd, "vk_id": virtual_key_id},
            )

        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log spend: {e}")
        await db.rollback()
    finally:
        await db.close()


# ─── Guardrail Scanning ─────────────────────────────────────────────────────

async def get_guardrail_config(organization_id: int) -> tuple[list, dict]:
    """Fetch active guardrail rules and settings for an org."""
    db = await get_db()
    try:
        rules_result = await db.execute(
            text("""
                SELECT id, guardrail_type, name, config, scope, action, is_active
                FROM ai_gateway_guardrails
                WHERE organization_id = :org_id AND is_active = true
                ORDER BY guardrail_type, created_at
            """),
            {"org_id": organization_id},
        )
        rules = [dict(r) for r in rules_result.mappings().fetchall()]

        settings_result = await db.execute(
            text("""
                SELECT pii_on_error, content_filter_on_error,
                       pii_replacement_format, content_filter_replacement,
                       log_retention_days, log_request_body, log_response_body
                FROM ai_gateway_guardrail_settings
                WHERE organization_id = :org_id
            """),
            {"org_id": organization_id},
        )
        settings_row = settings_result.mappings().fetchone()
        guardrail_settings = dict(settings_row) if settings_row else {}

        return rules, guardrail_settings
    finally:
        await db.close()


async def log_guardrail_detection(
    organization_id: int,
    guardrail_id: Optional[int],
    endpoint_id: int,
    guardrail_type: str,
    action_taken: str,
    matched_text: str,
    entity_type: str,
    execution_time_ms: int,
):
    """Log a guardrail detection."""
    db = await get_db()
    try:
        await db.execute(
            text("""
                INSERT INTO ai_gateway_guardrail_logs
                    (organization_id, guardrail_id, endpoint_id,
                     guardrail_type, action_taken, matched_text,
                     entity_type, execution_time_ms)
                VALUES
                    (:org_id, :guardrail_id, :endpoint_id,
                     :guardrail_type, :action_taken, :matched_text,
                     :entity_type, :exec_time)
            """),
            {
                "org_id": organization_id,
                "guardrail_id": guardrail_id,
                "endpoint_id": endpoint_id,
                "guardrail_type": guardrail_type,
                "action_taken": action_taken,
                "matched_text": matched_text,
                "entity_type": entity_type,
                "exec_time": execution_time_ms,
            },
        )
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log guardrail detection: {e}")
        await db.rollback()
    finally:
        await db.close()
