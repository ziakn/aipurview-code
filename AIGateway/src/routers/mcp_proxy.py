"""
Public MCP proxy endpoint — authenticated via agent keys (sk-mcp-*).

AI agents connect here to discover and call MCP tools:
    POST /v1/mcp  — JSON-RPC 2.0 over Streamable HTTP
    GET  /v1/mcp  — SSE keep-alive for server-initiated notifications

The gateway routes tool calls to the correct backend MCP server,
enforcing ACLs, rate limits, and approval requirements.
"""

import asyncio
import json
import logging
import time
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

logger = logging.getLogger("uvicorn")

router = APIRouter()


# ─── JSON-RPC 2.0 Helpers ──────────────────────────────────────────────────


def _jsonrpc_error(id, code: int, message: str) -> dict:
    """Build a JSON-RPC 2.0 error response."""
    return {"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}


def _jsonrpc_result(id, result: dict) -> dict:
    """Build a JSON-RPC 2.0 success response."""
    return {"jsonrpc": "2.0", "id": id, "result": result}


# ─── Auth Helper ────────────────────────────────────────────────────────────


async def _extract_agent_key(request: Request) -> dict:
    """Extract and validate agent key from Authorization header."""
    from services.mcp_proxy_service import authenticate_agent_key

    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing Authorization: Bearer <agent-key>"
        )
    token = auth[7:].strip()
    try:
        return await authenticate_agent_key(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


# ─── POST /v1/mcp — JSON-RPC 2.0 over Streamable HTTP ──────────────────────


@router.post("/v1/mcp")
async def mcp_jsonrpc(request: Request):
    """Handle JSON-RPC 2.0 requests from MCP clients."""
    agent_key = await _extract_agent_key(request)
    org_id = agent_key["organization_id"]

    # Parse JSON-RPC message
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content=_jsonrpc_error(None, -32700, "Parse error"),
            status_code=200,
        )

    msg_id = body.get("id")
    method = body.get("method")
    params = body.get("params", {})

    # Validate JSON-RPC version
    if body.get("jsonrpc") != "2.0":
        return JSONResponse(
            content=_jsonrpc_error(msg_id, -32600, "Invalid JSON-RPC version"),
            status_code=200,
        )

    # ── initialize ──────────────────────────────────────────────────────
    if method == "initialize":
        from services.mcp_session import create_session

        session_id = await create_session(org_id, agent_key.get("id"))

        result = {
            "protocolVersion": "2025-03-26",
            "capabilities": {"tools": {"listChanged": True}},
            "serverInfo": {"name": "VerifyWise MCP Gateway", "version": "1.0.0"},
        }
        response = JSONResponse(content=_jsonrpc_result(msg_id, result))
        response.headers["Mcp-Session-Id"] = session_id
        return response

    # ── notifications/initialized ───────────────────────────────────────
    if method == "notifications/initialized":
        return JSONResponse(content=None, status_code=202)

    # ── tools/list ──────────────────────────────────────────────────────
    if method == "tools/list":
        from crud.mcp_tools import get_all_tools
        from services.mcp_proxy_service import _matches_acl

        all_tools = await get_all_tools(org_id)

        allowed_tools = agent_key.get("allowed_tools")
        blocked_tools = agent_key.get("blocked_tools")

        filtered_tools = [
            t
            for t in all_tools
            if _matches_acl(t["tool_name"], allowed_tools, blocked_tools)
        ]

        tools_list = [
            {
                "name": t["tool_name"],
                "description": t.get("description", ""),
                "inputSchema": t.get("input_schema", {}),
            }
            for t in filtered_tools
        ]
        return JSONResponse(
            content=_jsonrpc_result(msg_id, {"tools": tools_list})
        )

    # ── tools/call ──────────────────────────────────────────────────────
    if method == "tools/call":
        from services.mcp_proxy_service import (
            resolve_tool,
            enforce_tool_acls,
            enforce_mcp_rate_limits,
            forward_tool_call,
        )

        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        if not tool_name:
            return JSONResponse(
                content=_jsonrpc_error(msg_id, -32602, "Missing tool name in params"),
                status_code=200,
            )

        start_time = time.time()

        try:
            # Resolve tool to backend server
            tool = await resolve_tool(org_id, tool_name)

            # Enforce ACLs
            enforce_tool_acls(agent_key, tool_name)

            # Rate limits
            await enforce_mcp_rate_limits(agent_key)

            # Check approval requirement
            if tool.get("requires_approval"):
                return JSONResponse(
                    content=_jsonrpc_error(
                        msg_id, -32001, "Tool requires approval"
                    ),
                    status_code=200,
                )

            # Forward to backend MCP server
            result = await forward_tool_call(tool, tool_name, arguments)

            latency_ms = int((time.time() - start_time) * 1000)
            logger.info(
                "MCP tool call: tool=%s org=%s agent_key=%s latency=%dms",
                tool_name,
                org_id,
                agent_key.get("id"),
                latency_ms,
            )

            return JSONResponse(
                content=_jsonrpc_result(msg_id, result)
            )

        except ValueError as e:
            return JSONResponse(
                content=_jsonrpc_error(msg_id, -32602, str(e)),
                status_code=200,
            )
        except HTTPException:
            raise
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(
                "MCP tool call failed: tool=%s org=%s error=%s latency=%dms",
                tool_name,
                org_id,
                str(e),
                latency_ms,
            )
            return JSONResponse(
                content=_jsonrpc_error(msg_id, -32603, "Internal error"),
                status_code=200,
            )

    # ── Unknown method ──────────────────────────────────────────────────
    return JSONResponse(
        content=_jsonrpc_error(msg_id, -32601, f"Method not found: {method}"),
        status_code=200,
    )


# ─── GET /v1/mcp — SSE keep-alive ──────────────────────────────────────────


@router.get("/v1/mcp")
async def mcp_sse(request: Request):
    """SSE endpoint for server-initiated messages. Keep-alive for v1."""

    async def event_stream():
        while True:
            if await request.is_disconnected():
                break
            yield ": keep-alive\n\n"
            await asyncio.sleep(30)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
