"""
MCP Gateway proxy service — agent key authentication, tool ACL enforcement,
rate limiting, and tool call forwarding for the MCP Gateway.
"""

import hashlib
import json
import logging
import time
from datetime import datetime, timezone
from typing import Optional

import httpx
import redis.asyncio as aioredis
from fastapi import HTTPException
from sqlalchemy import text

from config import settings
from database.db import get_db

logger = logging.getLogger("uvicorn")

# ─── Redis connection ────────────────────────────────────────────────────────

_redis: Optional[aioredis.Redis] = None


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


# ─── Agent Key Authentication ───────────────────────────────────────────────

def hash_agent_key(plain_key: str) -> str:
    """SHA-256 hash an MCP agent key."""
    return hashlib.sha256(plain_key.encode("utf-8")).hexdigest()


async def authenticate_agent_key(bearer_token: str) -> dict:
    """
    Validate an MCP agent key and return its metadata.
    Raises ValueError if invalid.
    """
    if not bearer_token.startswith("sk-mcp-"):
        raise ValueError("Invalid agent key format")

    key_hash = hash_agent_key(bearer_token)
    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT id, organization_id, name, allowed_tools, blocked_tools,
                       rate_limit_rpm, is_active, revoked_at, expires_at
                FROM ai_gateway_mcp_agent_keys
                WHERE key_hash = :key_hash
            """),
            {"key_hash": key_hash},
        )
        row = result.mappings().fetchone()
        if not row:
            raise ValueError("Agent key not found")
        if not row["is_active"]:
            raise ValueError("Agent key is inactive")
        if row["revoked_at"]:
            raise ValueError("Agent key has been revoked")
        if row["expires_at"] and row["expires_at"] < datetime.now(timezone.utc):
            raise ValueError("Agent key has expired")
        return dict(row)


# ─── Tool ACL Enforcement ──────────────────────────────────────────────────

def _matches_acl(value: str, patterns: list[str]) -> bool:
    """Check if a value matches any pattern in the list. Supports trailing wildcard (e.g. 'github*')."""
    for pattern in patterns:
        if pattern.endswith("*"):
            if value.startswith(pattern[:-1]):
                return True
        elif value == pattern:
            return True
    return False


def enforce_tool_acls(agent_key: dict, tool_name: str) -> None:
    """
    Check allowed_tools/blocked_tools on the agent key.
    Raises ValueError if the tool is not permitted.
    """
    allowed_tools = agent_key.get("allowed_tools") or []
    if allowed_tools and not _matches_acl(tool_name, allowed_tools):
        raise ValueError(f"Agent key does not allow tool: {tool_name}")

    blocked_tools = agent_key.get("blocked_tools") or []
    if blocked_tools and _matches_acl(tool_name, blocked_tools):
        raise ValueError(f"Agent key blocks tool: {tool_name}")


# ─── Rate Limiting ──────────────────────────────────────────────────────────

RATE_LIMIT_WINDOW = 60  # seconds


async def check_rate_limit(key: str, rpm: int) -> bool:
    """Check RPM rate limit using Redis sorted set. Returns True if allowed. Fail-open on Redis error."""
    if rpm <= 0:
        return True
    try:
        r = await _get_redis()
        redis_key = f"gw:rate:mcp:{key}"
        now = time.time()
        window_start = now - RATE_LIMIT_WINDOW

        pipe = r.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zcard(redis_key)
        pipe.zadd(redis_key, {str(now): now})
        pipe.expire(redis_key, RATE_LIMIT_WINDOW + 10)
        results = await pipe.execute()

        count = results[1]  # zcard result before zadd
        return count < rpm
    except Exception as e:
        logger.warning(f"Rate limit check failed (fail-open): {e}")
        return True


async def enforce_mcp_rate_limits(agent_key: dict, tool_name: str) -> None:
    """Check per-agent rate limit. Raises HTTPException(429) if exceeded."""
    if agent_key.get("rate_limit_rpm") and agent_key["rate_limit_rpm"] > 0:
        if not await check_rate_limit(f"mcp:ak:{agent_key['id']}", agent_key["rate_limit_rpm"]):
            raise HTTPException(status_code=429, detail="Agent key rate limit exceeded")


# ─── Tool Resolution ───────────────────────────────────────────────────────

async def resolve_tool(org_id: int, tool_name: str) -> dict:
    """
    Look up which server hosts a tool.
    Raises ValueError if not found or server inactive.
    """
    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT t.id, t.tool_name, t.description, t.input_schema, t.risk_level,
                       t.requires_approval, t.server_id,
                       s.url, s.auth_type, s.auth_config, s.is_active AS server_active
                FROM ai_gateway_mcp_tools t
                JOIN ai_gateway_mcp_servers s ON t.server_id = s.id
                WHERE t.organization_id = :org_id
                  AND t.tool_name = :tool_name
                  AND t.is_active = true
            """),
            {"org_id": org_id, "tool_name": tool_name},
        )
        row = result.mappings().fetchone()
        if not row:
            raise ValueError(f"Tool not found: {tool_name}")
        if not row["server_active"]:
            raise ValueError(f"Server hosting tool '{tool_name}' is inactive")
        return dict(row)


# ─── Auth Header Builder ───────────────────────────────────────────────────

def _build_auth_headers(auth_type: str, auth_config: dict) -> dict:
    """Build authentication headers for backend MCP server requests."""
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {auth_config.get('token', '')}"}
    elif auth_type == "api_key":
        header_name = auth_config.get("header", "x-api-key")
        return {header_name: auth_config.get("key", "")}
    return {}


# ─── Server Tool Discovery ─────────────────────────────────────────────────

async def discover_server_tools(
    org_id: int,
    server_id: int,
    server_url: str,
    auth_type: str,
    auth_config: dict,
) -> list[dict]:
    """
    Connect to a backend MCP server and discover its tools.
    Sends initialize + tools/list, then upserts discovered tools into the database.
    Returns list of discovered tools.
    """
    headers = {
        "Content-Type": "application/json",
        **_build_auth_headers(auth_type, auth_config),
    }

    async with httpx.AsyncClient(timeout=30) as client:
        # Step 1: Initialize the MCP session
        init_payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {
                    "name": "VerifyWise MCP Gateway",
                    "version": "1.0.0",
                },
            },
        }
        init_resp = await client.post(server_url, json=init_payload, headers=headers)
        init_resp.raise_for_status()
        init_data = init_resp.json()
        if "error" in init_data:
            raise ValueError(f"MCP initialize failed: {init_data['error']}")

        # Capture backend session ID if returned
        backend_session_id = init_resp.headers.get("mcp-session-id")
        if backend_session_id:
            headers["Mcp-Session-Id"] = backend_session_id

        # Step 2: List tools
        list_payload = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {},
        }
        list_resp = await client.post(server_url, json=list_payload, headers=headers)
        list_resp.raise_for_status()
        list_data = list_resp.json()
        if "error" in list_data:
            raise ValueError(f"MCP tools/list failed: {list_data['error']}")

    tools = list_data.get("result", {}).get("tools", [])
    discovered_tool_names = set()
    discovered_tools = []

    async with get_db() as db:
        for tool in tools:
            tool_name = tool.get("name", "")
            description = tool.get("description", "")
            input_schema = tool.get("inputSchema", {})
            discovered_tool_names.add(tool_name)

            await db.execute(
                text("""
                    INSERT INTO ai_gateway_mcp_tools
                        (organization_id, server_id, tool_name, description,
                         input_schema, is_active)
                    VALUES
                        (:org_id, :server_id, :tool_name, :description,
                         :input_schema::jsonb, true)
                    ON CONFLICT (organization_id, server_id, tool_name)
                    DO UPDATE SET
                        description = EXCLUDED.description,
                        input_schema = EXCLUDED.input_schema,
                        is_active = true,
                        updated_at = NOW()
                """),
                {
                    "org_id": org_id,
                    "server_id": server_id,
                    "tool_name": tool_name,
                    "description": description,
                    "input_schema": json.dumps(input_schema),
                },
            )

            discovered_tools.append({
                "tool_name": tool_name,
                "description": description,
                "input_schema": input_schema,
            })

        # Deactivate tools that are no longer advertised by the server
        if discovered_tool_names:
            await db.execute(
                text("""
                    UPDATE ai_gateway_mcp_tools
                    SET is_active = false, updated_at = NOW()
                    WHERE organization_id = :org_id
                      AND server_id = :server_id
                      AND is_active = true
                      AND tool_name != ALL(:tool_names)
                """),
                {
                    "org_id": org_id,
                    "server_id": server_id,
                    "tool_names": list(discovered_tool_names),
                },
            )
        else:
            # No tools discovered — deactivate all tools for this server
            await db.execute(
                text("""
                    UPDATE ai_gateway_mcp_tools
                    SET is_active = false, updated_at = NOW()
                    WHERE organization_id = :org_id
                      AND server_id = :server_id
                      AND is_active = true
                """),
                {"org_id": org_id, "server_id": server_id},
            )

        await db.commit()

    logger.info(
        f"Discovered {len(discovered_tools)} tools from server {server_id} "
        f"for org {org_id}"
    )
    return discovered_tools


# ─── Tool Call Forwarding ──────────────────────────────────────────────────

async def forward_tool_call(
    server_url: str,
    auth_type: str,
    auth_config: dict,
    tool_name: str,
    arguments: dict,
    session_id: Optional[str] = None,
) -> dict:
    """
    Forward a tools/call request to the backend MCP server.
    Returns the result dict from the JSON-RPC response.
    Raises ValueError if the server returns an error.
    """
    headers = {
        "Content-Type": "application/json",
        **_build_auth_headers(auth_type, auth_config),
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(server_url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    if "error" in data:
        error = data["error"]
        message = error.get("message", str(error)) if isinstance(error, dict) else str(error)
        raise ValueError(f"Tool call failed: {message}")

    return data.get("result", {})
