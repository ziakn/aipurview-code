import json
from typing import Optional

from sqlalchemy import text

from database.db import get_db


async def create_approval_request(org_id: int, data: dict) -> dict:
    arguments_json = json.dumps(data.get("arguments")) if data.get("arguments") is not None else None

    async with get_db() as db:
        result = await db.execute(
            text("""
                INSERT INTO ai_gateway_mcp_approval_requests (
                    organization_id,
                    agent_key_id,
                    tool_id,
                    tool_name,
                    arguments,
                    expires_at
                ) VALUES (
                    :org_id,
                    :agent_key_id,
                    :tool_id,
                    :tool_name,
                    :arguments::jsonb,
                    :expires_at
                )
                RETURNING
                    id,
                    organization_id,
                    agent_key_id,
                    tool_id,
                    tool_name,
                    arguments,
                    status,
                    decided_by,
                    decided_at,
                    decision_reason,
                    expires_at,
                    created_at
            """),
            {
                "org_id": org_id,
                "agent_key_id": data.get("agent_key_id"),
                "tool_id": data.get("tool_id"),
                "tool_name": data.get("tool_name"),
                "arguments": arguments_json,
                "expires_at": data.get("expires_at"),
            },
        )
        await db.commit()
        row = result.mappings().first()
        if row is None:
            return {}
        return dict(row)
    return {}


async def get_pending_approvals(org_id: int) -> list[dict]:
    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT
                    ar.id,
                    ar.organization_id,
                    ar.agent_key_id,
                    ar.tool_id,
                    ar.tool_name,
                    ar.arguments,
                    ar.status,
                    ar.expires_at,
                    ar.created_at,
                    ak.name AS agent_key_name
                FROM ai_gateway_mcp_approval_requests ar
                LEFT JOIN ai_gateway_mcp_agent_keys ak
                    ON ak.id = ar.agent_key_id
                    AND ak.organization_id = ar.organization_id
                WHERE ar.organization_id = :org_id
                  AND ar.status = 'pending'
                  AND ar.expires_at > NOW()
                ORDER BY ar.created_at DESC
            """),
            {"org_id": org_id},
        )
        rows = result.mappings().all()
        return [dict(row) for row in rows]
    return []


async def get_approval_history(
    org_id: int, limit: int = 50, offset: int = 0
) -> list[dict]:
    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT
                    ar.id,
                    ar.organization_id,
                    ar.agent_key_id,
                    ar.tool_id,
                    ar.tool_name,
                    ar.arguments,
                    ar.status,
                    ar.decided_by,
                    ar.decided_at,
                    ar.decision_reason,
                    ar.expires_at,
                    ar.created_at,
                    ak.name AS key_name,
                    u.name AS decided_by_name
                FROM ai_gateway_mcp_approval_requests ar
                LEFT JOIN ai_gateway_mcp_agent_keys ak
                    ON ak.id = ar.agent_key_id
                    AND ak.organization_id = ar.organization_id
                LEFT JOIN users u
                    ON u.id = ar.decided_by
                WHERE ar.organization_id = :org_id
                  AND ar.status != 'pending'
                ORDER BY ar.decided_at DESC
                LIMIT :limit
                OFFSET :offset
            """),
            {"org_id": org_id, "limit": limit, "offset": offset},
        )
        rows = result.mappings().all()
        return [dict(row) for row in rows]
    return []


async def get_approval_status(org_id: int, request_id: int) -> Optional[dict]:
    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT
                    id,
                    organization_id,
                    agent_key_id,
                    tool_id,
                    tool_name,
                    arguments,
                    status,
                    decided_by,
                    decided_at,
                    decision_reason,
                    expires_at,
                    created_at
                FROM ai_gateway_mcp_approval_requests
                WHERE organization_id = :org_id
                  AND id = :request_id
            """),
            {"org_id": org_id, "request_id": request_id},
        )
        row = result.mappings().first()
        if row is None:
            return None
        return dict(row)
    return None


async def decide_approval(
    org_id: int, request_id: int, data: dict
) -> Optional[dict]:
    async with get_db() as db:
        result = await db.execute(
            text("""
                UPDATE ai_gateway_mcp_approval_requests
                SET
                    status = :status,
                    decided_by = :user_id,
                    decided_at = NOW(),
                    decision_reason = :reason
                WHERE id = :request_id
                  AND organization_id = :org_id
                  AND status = 'pending'
                RETURNING
                    id,
                    organization_id,
                    agent_key_id,
                    tool_id,
                    tool_name,
                    arguments,
                    status,
                    decided_by,
                    decided_at,
                    decision_reason,
                    expires_at,
                    created_at
            """),
            {
                "request_id": request_id,
                "org_id": org_id,
                "status": data.get("status"),
                "user_id": data.get("user_id"),
                "reason": data.get("reason"),
            },
        )
        await db.commit()
        row = result.mappings().first()
        if row is None:
            return None
        return dict(row)
    return None
