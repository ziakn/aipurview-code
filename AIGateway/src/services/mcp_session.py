"""
MCP Gateway session manager — manages client-to-gateway and gateway-to-backend sessions.
"""

import json
import logging
import uuid
from typing import Optional

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger("uvicorn")

SESSION_TTL = 3600  # 1 hour

_redis: Optional[aioredis.Redis] = None


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def create_session() -> str:
    """Create a new gateway session. Returns session ID."""
    session_id = str(uuid.uuid4())
    r = await _get_redis()
    await r.set(f"gw:mcp:session:{session_id}", json.dumps({}), ex=SESSION_TTL)
    return session_id


async def get_backend_session(session_id: str, server_id: int) -> Optional[str]:
    """Get the backend session ID for a given gateway session and server."""
    r = await _get_redis()
    data = await r.get(f"gw:mcp:session:{session_id}")
    if not data:
        return None
    sessions = json.loads(data)
    return sessions.get(str(server_id))


async def set_backend_session(session_id: str, server_id: int, backend_session_id: str) -> None:
    """Store a backend session ID for a gateway session."""
    r = await _get_redis()
    key = f"gw:mcp:session:{session_id}"
    data = await r.get(key)
    sessions = json.loads(data) if data else {}
    sessions[str(server_id)] = backend_session_id
    await r.set(key, json.dumps(sessions), ex=SESSION_TTL)


async def destroy_session(session_id: str) -> None:
    """Delete a gateway session."""
    r = await _get_redis()
    await r.delete(f"gw:mcp:session:{session_id}")


async def session_exists(session_id: str) -> bool:
    """Check if a session exists."""
    r = await _get_redis()
    return await r.exists(f"gw:mcp:session:{session_id}") > 0
