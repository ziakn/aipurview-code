# VerifyWise Bash gate (Claude Code hook)

Gates Claude Code's built-in **Bash** tool through the VerifyWise AI Gateway.
Before a shell command runs, the gateway scans it against your org's MCP
guardrail rules and the call is allowed or denied. Every call is recorded in
the MCP Audit Log.

## Setup

1. Mint an agent key: VerifyWise → AI Gateway → MCP Gateway → **Agent Keys** →
   create. Copy the `sk-mcp-...` value (shown once).
2. Add the guardrail rules you want enforced under MCP Gateway → **Guardrails**.
3. Set env vars (e.g. in your shell profile):

   ```bash
   export VW_GATEWAY_URL=http://localhost:8100   # your gateway URL
   export VW_AGENT_KEY=sk-mcp-...
   # optional:
   export VW_FAIL_MODE=open   # open (default) | closed
   export VW_TIMEOUT=3        # seconds
   export VW_APPROVAL_WAIT=120         # max seconds to block on human approval
   export VW_APPROVAL_FAIL_MODE=closed # closed (default) | open — on approval timeout
   ```

4. Wire the hook in `.claude/settings.json`:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         { "matcher": "Bash",
           "hooks": [{ "type": "command", "command": "scripts/vw-bash-hook.sh" }] }
       ]
     }
   }
   ```

## Behavior

| Situation | Result |
|---|---|
| Command passes guardrails | runs (exit 0) |
| Guardrail blocks (or a mask rule matches) | blocked (exit 2), reason shown to the agent |
| Command matches a require-approval rule | hook blocks up to `VW_APPROVAL_WAIT`; approved → runs, denied → blocked |
| Approval not decided in time | `VW_APPROVAL_FAIL_MODE=closed` (default) → blocked; `open` → runs |
| Gateway rate-limits the call | `VW_FAIL_MODE=open` (default) → runs; `closed` → blocked |
| Gateway unreachable / timeout | `VW_FAIL_MODE=open` → runs; `closed` → blocked |

Requires `curl` and `jq` on PATH.
