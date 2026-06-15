"""
Hook-only matcher for require_approval guardrail rules.

Imported ONLY by mcp_hook.py — never by the shared scan_text / scan_tool_input.
Matches the serialized command string against active require_approval rules
(regex or keyword), reusing the same config shape and ReDoS guard as the
content-filter scanner.
"""

import json
import logging
import re
from typing import Optional

from sqlalchemy import text

from database.db import get_db

logger = logging.getLogger("uvicorn")

_REDOS_CAP = 50000  # mirror guardrail_service._run_regex_safe


def _serialize(arguments: dict) -> str:
    parts: list[str] = []
    for value in arguments.values():
        if isinstance(value, str):
            parts.append(value)
        elif isinstance(value, (dict, list)):
            parts.append(json.dumps(value))
    return "\n".join(parts)


def _matches(config: dict, text_in: str) -> bool:
    filter_type = config.get("type", "keyword")
    pattern_str = config.get("pattern", "")
    if not pattern_str:
        return False
    scan = text_in[:_REDOS_CAP]
    try:
        if filter_type == "keyword":
            escaped = re.escape(pattern_str)
            raw = r"\b" + escaped + r"\b" if " " not in pattern_str else escaped
        else:
            raw = pattern_str
        return re.search(raw, scan, re.IGNORECASE) is not None
    except re.error as e:
        logger.warning(f"Invalid require_approval pattern '{pattern_str[:50]}': {e}")
        return False


async def check_require_approval(org_id: int, tool_name: str, arguments: dict) -> Optional[dict]:
    """Return the first active require_approval rule matching the command, else None."""
    input_text = _serialize(arguments)
    if not input_text.strip():
        return None

    async with get_db() as db:
        result = await db.execute(
            text("""
                SELECT id, name, config
                FROM ai_gateway_mcp_guardrail_rules
                WHERE organization_id = :org_id
                  AND rule_type = 'require_approval'
                  AND is_active = true
                  AND (
                      applies_to_tools IS NULL
                      OR array_length(applies_to_tools, 1) IS NULL
                      OR :tool_name = ANY(applies_to_tools)
                  )
                ORDER BY created_at
            """),
            {"org_id": org_id, "tool_name": tool_name},
        )
        rules = [dict(r) for r in result.mappings().fetchall()]

    for rule in rules:
        if _matches(rule.get("config") or {}, input_text):
            return rule
    return None
