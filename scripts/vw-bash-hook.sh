#!/usr/bin/env bash
# VerifyWise Bash gate — Claude Code PreToolUse hook.
# Reads the tool call as JSON on stdin, asks the AI Gateway to adjudicate,
# and exits 0 (allow) or non-zero (deny). Fails open by default so a gateway
# outage never halts your workflow.
#
# Env:
#   VW_GATEWAY_URL  (required)  e.g. http://localhost:8100
#   VW_AGENT_KEY    (required)  sk-mcp-...
#   VW_FAIL_MODE    (optional)  open | closed   (default: open)
#   VW_TIMEOUT      (optional)  seconds          (default: 3)
set -uo pipefail

FAIL_MODE="${VW_FAIL_MODE:-open}"
TIMEOUT="${VW_TIMEOUT:-3}"

fail() {  # $1 = stderr message
  echo "vw-bash-hook: $1" >&2
  if [ "$FAIL_MODE" = "closed" ]; then exit 2; fi
  exit 0   # fail-open
}

[ -n "${VW_GATEWAY_URL:-}" ] || fail "VW_GATEWAY_URL not set"
[ -n "${VW_AGENT_KEY:-}" ]   || fail "VW_AGENT_KEY not set"
command -v jq   >/dev/null 2>&1 || fail "jq not found"
command -v curl >/dev/null 2>&1 || fail "curl not found"

input="$(cat)"
tool_name="$(printf '%s' "$input" | jq -r '.tool_name // .tool.name // "unknown"')"
arguments="$(printf '%s' "$input" | jq -c '.tool_input // .arguments // {}')"

payload="$(jq -nc --arg t "$tool_name" --argjson a "$arguments" '{tool_name:$t, arguments:$a}')"

http_code="$(curl -s -o /tmp/vw_hook_resp.$$ -w '%{http_code}' --max-time "$TIMEOUT" \
  -X POST "$VW_GATEWAY_URL/v1/mcp/hook" \
  -H "Authorization: Bearer $VW_AGENT_KEY" \
  -H "Content-Type: application/json" \
  -d "$payload")" || { rm -f "/tmp/vw_hook_resp.$$"; fail "gateway unreachable"; }

resp="$(cat "/tmp/vw_hook_resp.$$" 2>/dev/null)"
rm -f "/tmp/vw_hook_resp.$$"

[ "$http_code" = "200" ] || fail "gateway returned HTTP $http_code"
[ -n "$resp" ] || fail "empty gateway response"

decision="$(printf '%s' "$resp" | jq -r '.decision // "error"')"
case "$decision" in
  allow) exit 0 ;;
  deny)
    reason="$(printf '%s' "$resp" | jq -r '.reason // "policy violation"')"
    echo "Blocked by VerifyWise: $reason" >&2
    exit 2 ;;
  *) fail "unexpected gateway response: $resp" ;;
esac
