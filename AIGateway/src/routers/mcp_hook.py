"""
Native tool-call hook endpoint — adjudicates a coding agent's own tool calls
(e.g. Claude Code's built-in Bash) WITHOUT forwarding or executing them.

    POST /v1/mcp/hook  — returns {"decision": "allow"} or {"decision": "deny", ...}

Authenticated via agent keys (sk-mcp-*), same as the MCP proxy. Reuses the
existing MCP guardrail scan and audit log. MASK detections are treated as DENY:
a shell command cannot be safely rewritten, so a mask rule blocks it.
"""

import logging
import time

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from services.mcp_audit_service import log_tool_call
from services.mcp_guardrail_service import scan_tool_input
from services.mcp_proxy_service import authenticate_agent_key

logger = logging.getLogger("uvicorn")

router = APIRouter()


async def _extract_agent_key(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <agent-key>")
    token = auth[7:].strip()
    try:
        return await authenticate_agent_key(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/v1/mcp/hook")
async def mcp_hook(request: Request):
    """Adjudicate a native tool call. Never forwards or executes it."""
    agent_key = await _extract_agent_key(request)
    org_id = agent_key["organization_id"]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    tool_name = body.get("tool_name")
    arguments = body.get("arguments") or {}
    session_id = body.get("session_id")

    if not tool_name or not isinstance(arguments, dict):
        raise HTTPException(status_code=400, detail="tool_name (str) and arguments (object) are required")

    start_time = time.time()
    scan_result = await scan_tool_input(org_id, tool_name, arguments)

    # MASK is treated as DENY for native tool calls — a shell command cannot be
    # safely rewritten, so any mask detection blocks the call.
    mask_hit = any(getattr(d, "action", None) == "mask" for d in scan_result.detections)
    deny = bool(scan_result.blocked or mask_hit)

    if deny:
        reason = scan_result.block_reason
        if not reason and mask_hit:
            reason = "mask rule matched (masking not supported for native tool calls)"
        reason = reason or "policy violation"
        detections = [
            {"rule": d.guardrail_type, "action": d.action, "snippet": d.entity_type}
            for d in scan_result.detections
        ]
        await log_tool_call(
            organization_id=org_id,
            agent_key_id=agent_key["id"],
            server_id=None,
            tool_name=tool_name,
            arguments=arguments,
            result_status="blocked",
            result_summary=f"Hook deny: {reason}",
            is_error=False,
            latency_ms=int((time.time() - start_time) * 1000),
            session_id=session_id,
        )
        return JSONResponse(content={"decision": "deny", "reason": reason, "detections": detections})

    await log_tool_call(
        organization_id=org_id,
        agent_key_id=agent_key["id"],
        server_id=None,
        tool_name=tool_name,
        arguments=arguments,
        result_status="success",
        result_summary="Hook allow",
        is_error=False,
        latency_ms=int((time.time() - start_time) * 1000),
        session_id=session_id,
    )
    return JSONResponse(content={"decision": "allow"})
