"""
Native tool-call hook endpoint — adjudicates a coding agent's own tool calls
(e.g. Claude Code's built-in Bash) WITHOUT forwarding or executing them.

    POST /v1/mcp/hook  -> {"decision": "allow" | "deny" | "approval_required" | "rate_limited", ...}

Authenticated via agent keys (sk-mcp-*). Reuses the existing MCP guardrail scan,
audit log, rate limiter, and approval flow. MASK detections are treated as DENY.
require_approval rules (matched in the hook-only mcp_approval_match module) create
an approval request and tell the caller to poll. Rate-limit exceed is reported as
a distinct decision so the adapter can apply its infra fail-mode.
"""

import logging
import time
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from crud.mcp_approvals import create_approval_request, get_approved_request, get_pending_request
from services.mcp_audit_service import log_tool_call
from services.mcp_approval_match import check_require_approval
from services.mcp_guardrail_service import scan_tool_input
from services.mcp_proxy_service import extract_agent_key, enforce_mcp_rate_limits
from utils.mcp_arguments import hash_arguments
from utils.notifications import notify_approval_pending

logger = logging.getLogger("uvicorn")

router = APIRouter()


@router.post("/v1/mcp/hook")
async def mcp_hook(request: Request):
    """Adjudicate a native tool call. Never forwards or executes it."""
    agent_key = await extract_agent_key(request)
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

    async def _audit(status: str, summary: str, is_error: bool = False):
        await log_tool_call(
            organization_id=org_id,
            agent_key_id=agent_key["id"],
            server_id=None,
            tool_name=tool_name,
            arguments=arguments,
            result_status=status,
            result_summary=summary,
            is_error=is_error,
            latency_ms=int((time.time() - start_time) * 1000),
            session_id=session_id,
        )

    # ── Guardrail scan (UNCHANGED shared path): block / mask -> deny ─────────
    # Policy (block / mask / require_approval) is evaluated BEFORE the rate
    # limit so a rate-limited agent cannot burst past its cap to get a
    # policy-violating command allowed (rate_limited fails open by default).
    scan_result = await scan_tool_input(org_id, tool_name, arguments)
    mask_hit = any(getattr(d, "action", None) == "mask" for d in scan_result.detections)
    if scan_result.blocked or mask_hit:
        reason = scan_result.block_reason
        if not reason and mask_hit:
            reason = "mask rule matched (masking not supported for native tool calls)"
        reason = reason or "policy violation"
        detections = [
            {"rule": d.guardrail_type, "action": d.action, "snippet": d.entity_type}
            for d in scan_result.detections
        ]
        await _audit("blocked", f"Hook deny: {reason}")
        return JSONResponse(content={"decision": "deny", "reason": reason, "detections": detections})

    # ── require_approval (hook-only matcher): create/reuse approval request ──
    approval_rule = await check_require_approval(org_id, tool_name, arguments)
    if approval_rule:
        args_hash = hash_arguments(arguments)
        approved = await get_approved_request(org_id, agent_key["id"], tool_name, args_hash)
        if not approved:
            pending = await get_pending_request(org_id, agent_key["id"], tool_name, args_hash)
            if pending:
                approval = pending
            else:
                expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=settings.mcp_approval_expiry_seconds
                )
                approval = await create_approval_request(org_id, {
                    "agent_key_id": agent_key["id"],
                    "tool_id": None,
                    "tool_name": tool_name,
                    "arguments": arguments,
                    "arguments_hash": args_hash,
                    "expires_at": expires_at,
                })
                await notify_approval_pending(org_id, {
                    "approval_id": approval.get("id"),
                    "tool_name": tool_name,
                    "agent_key_id": agent_key["id"],
                    "agent_key_name": agent_key.get("name"),
                })
            await _audit("approval_required", f"Approval request {approval.get('id')} created")
            exp = approval.get("expires_at")
            return JSONResponse(content={
                "decision": "approval_required",
                "approval_id": approval.get("id"),
                "poll_endpoint": f"/v1/mcp/approvals/{approval.get('id')}/status",
                "expires_at": exp.isoformat() if hasattr(exp, "isoformat") else str(exp),
            })
        # else: already approved for this exact call — fall through to allow

    # ── Rate limit (infra, not policy) ──────────────────────────────────────
    # Checked last: only a call that already passed every policy gate can be
    # reported as rate_limited, so the adapter's fail-open on rate_limited can
    # never release a command that a guardrail or approval rule would stop.
    try:
        await enforce_mcp_rate_limits(agent_key, tool_name)
    except HTTPException as e:
        if e.status_code == 429:
            await _audit("rate_limited", "Hook rate limited")
            return JSONResponse(content={"decision": "rate_limited", "reason": "rate limit exceeded"})
        raise

    await _audit("success", "Hook allow")
    return JSONResponse(content={"decision": "allow"})
