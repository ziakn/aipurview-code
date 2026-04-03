from typing import Optional

from sqlalchemy import text
from database.db import get_db


async def get_audit_logs(
    org_id: int,
    limit: int = 50,
    offset: int = 0,
    filters: Optional[dict] = None,
) -> list[dict]:
    """Paginated audit logs with optional filters, joined with agent key name."""
    filters = filters or {}

    where_clauses = ["al.organization_id = :org_id"]
    params: dict = {"org_id": org_id, "limit": limit, "offset": offset}

    if filters.get("agent_key_id"):
        where_clauses.append("al.agent_key_id = :agent_key_id")
        params["agent_key_id"] = int(filters["agent_key_id"])

    if filters.get("tool_name"):
        where_clauses.append("al.tool_name = :tool_name")
        params["tool_name"] = filters["tool_name"]

    if filters.get("result_status"):
        where_clauses.append("al.result_status = :result_status")
        params["result_status"] = filters["result_status"]

    if filters.get("start_date"):
        where_clauses.append("al.created_at >= :start_date")
        params["start_date"] = filters["start_date"]

    if filters.get("end_date"):
        where_clauses.append("al.created_at <= :end_date")
        params["end_date"] = filters["end_date"]

    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT
            al.id,
            al.organization_id,
            al.agent_key_id,
            al.server_id,
            al.tool_name,
            al.arguments,
            al.result_status,
            al.result_summary,
            al.is_error,
            al.latency_ms,
            al.session_id,
            al.metadata,
            al.created_at,
            ak.name AS agent_key_name
        FROM ai_gateway_mcp_audit_logs al
        LEFT JOIN ai_gateway_mcp_agent_keys ak ON ak.id = al.agent_key_id
        WHERE {where_sql}
        ORDER BY al.created_at DESC
        LIMIT :limit OFFSET :offset
    """

    async with get_db() as db:
        result = await db.execute(text(sql), params)
        rows = result.mappings().all()
        return [dict(row) for row in rows]
    return []


async def get_audit_stats(org_id: int, days: int = 7) -> dict:
    """Aggregate audit stats for the given org over the last N days."""
    # Validate days as int to safely interpolate into INTERVAL
    days = int(days)

    sql = f"""
        SELECT
            COUNT(*) AS total_calls,
            COUNT(*) FILTER (WHERE is_error) AS error_count,
            COALESCE(AVG(latency_ms), 0) AS avg_latency_ms,
            COUNT(DISTINCT tool_name) AS unique_tools,
            COUNT(DISTINCT agent_key_id) AS unique_agents
        FROM ai_gateway_mcp_audit_logs
        WHERE organization_id = :org_id
          AND created_at >= NOW() - INTERVAL '{days} days'
    """

    async with get_db() as db:
        result = await db.execute(text(sql), {"org_id": org_id})
        row = result.mappings().first()
        if row is None:
            return {
                "total_calls": 0,
                "error_count": 0,
                "avg_latency_ms": 0,
                "unique_tools": 0,
                "unique_agents": 0,
            }
        return {
            "total_calls": row["total_calls"],
            "error_count": row["error_count"],
            "avg_latency_ms": round(float(row["avg_latency_ms"]), 2),
            "unique_tools": row["unique_tools"],
            "unique_agents": row["unique_agents"],
        }


async def get_audit_stats_by_tool(org_id: int, days: int = 7) -> list[dict]:
    """Audit stats grouped by tool_name over the last N days."""
    days = int(days)

    sql = f"""
        SELECT
            tool_name,
            COUNT(*) AS count,
            COUNT(*) FILTER (WHERE is_error) AS error_count,
            COALESCE(AVG(latency_ms), 0) AS avg_latency_ms
        FROM ai_gateway_mcp_audit_logs
        WHERE organization_id = :org_id
          AND created_at >= NOW() - INTERVAL '{days} days'
        GROUP BY tool_name
        ORDER BY count DESC
    """

    async with get_db() as db:
        result = await db.execute(text(sql), {"org_id": org_id})
        rows = result.mappings().all()
        return [
            {
                "tool_name": row["tool_name"],
                "count": row["count"],
                "error_count": row["error_count"],
                "avg_latency_ms": round(float(row["avg_latency_ms"]), 2),
            }
            for row in rows
        ]


async def get_audit_stats_by_agent(org_id: int, days: int = 7) -> list[dict]:
    """Audit stats grouped by agent key over the last N days."""
    days = int(days)

    sql = f"""
        SELECT
            al.agent_key_id,
            ak.name AS agent_key_name,
            COUNT(*) AS count,
            COUNT(*) FILTER (WHERE al.is_error) AS error_count,
            COALESCE(AVG(al.latency_ms), 0) AS avg_latency_ms
        FROM ai_gateway_mcp_audit_logs al
        LEFT JOIN ai_gateway_mcp_agent_keys ak ON ak.id = al.agent_key_id
        WHERE al.organization_id = :org_id
          AND al.created_at >= NOW() - INTERVAL '{days} days'
        GROUP BY al.agent_key_id, ak.name
        ORDER BY count DESC
    """

    async with get_db() as db:
        result = await db.execute(text(sql), {"org_id": org_id})
        rows = result.mappings().all()
        return [
            {
                "agent_key_id": row["agent_key_id"],
                "agent_key_name": row["agent_key_name"],
                "count": row["count"],
                "error_count": row["error_count"],
                "avg_latency_ms": round(float(row["avg_latency_ms"]), 2),
            }
            for row in rows
        ]
