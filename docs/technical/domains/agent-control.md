# Agent Control — native tool-call governance

> **Status:** Shipped to `develop` (PRs #4078, #4083, #4084). Last updated 2026-06-16.

Agent Control gates a coding agent's tool calls through the AI Gateway's guardrails,
human-approval and audit machinery. It covers two entry paths that share one governance
layer:

- **MCP proxy** (`POST /v1/mcp`) — the agent calls a tool *through* the gateway, which
  forwards the JSON-RPC call to a registered MCP server.
- **Native hook** (`POST /v1/mcp/hook`) — the agent runs its *own* built-in tool (Bash,
  Edit, Write, MultiEdit, NotebookEdit). The gateway **adjudicates** (allow / deny /
  approval_required / rate_limited) and **never forwards or executes** the call. A
  dev-machine adapter (`scripts/vw-tool-hook.sh`, a Claude Code `PreToolUse` hook) calls
  this endpoint before the tool runs.

"Agent Control" is the UI name for this section (renamed from "MCP Gateway"). Mental model:
the **AI Gateway** governs what the AI *says* (model calls, spend); **Agent Control** governs
what the AI *does* (tool calls).

## Request flow (the hook, `AIGateway/src/routers/mcp_hook.py`)

```
extract_agent_key (sk-mcp-*)                    -- shared with the proxy
  → scan_tool_input(field_aware=True)           -- guardrail scan; block/mask → deny
  → check_require_approval                      -- hook-only; match → create/reuse approval
  → enforce_mcp_rate_limits                     -- LAST, and skipped on an approved re-call
  → allow
```

Every path writes an audit row (`log_tool_call`). Audit and the approval argument-hash use
the **full** arguments; only the guardrail scan uses the field-aware subset.

## Field-aware scanning (`AIGateway/src/utils/mcp_tool_content.py`)

`extract_scannable_content(tool_name, arguments)` returns the subset to scan:

| Tool | Scanned field(s) |
|---|---|
| `Write` | `content` |
| `Edit` | `new_string` |
| `MultiEdit` | each `edits[].new_string`, joined raw |
| `NotebookEdit` | `new_source` |
| Bash / MCP / unknown | full `arguments` |

Only **written** content is scanned, not `old_string` (removed text) or `file_path`. So
*deleting* a line containing PII is allowed; *writing* PII is denied. A pure deletion (no
written content) returns `{}` and is allowed.

**Critical:** this is **opt-in** via `scan_tool_input(..., field_aware=True)`. The hook passes
`True`; the **MCP proxy passes the default `False`** (full-args scan). Without this, a proxied
MCP tool that happens to be named `Write`/`Edit` would have its args narrowed and bypass
guardrails. (Closed in review.)

## Human approval (`require_approval` rule type)

A guardrail rule with `rule_type = "require_approval"` (regex/keyword on the command, matched
in `services/mcp_approval_match.py`) routes a matching call through the existing approval flow
instead of denying it. The adapter blocks and polls `GET /v1/mcp/approvals/{id}/status`;
approved → run, denied → block, timeout → `VW_APPROVAL_FAIL_MODE` (default deny).

- Approvals are **argument-scoped** (SHA-256 of full args) — approving one call doesn't
  authorize a different one.
- Native approvals carry `tool_id IS NULL`; proxy approvals carry a `tool_id`. Lookups are
  scoped by `native=True/False` so a native-hook approval can never authorize a proxy call of
  the same name+args. (Migration `a0006` made `tool_id` nullable.)
- An already-approved re-call **skips** the rate limiter so an approval is never wasted.

## Adapter (`scripts/vw-tool-hook.sh` + README)

Claude Code config matcher: `Bash|Edit|Write|MultiEdit|NotebookEdit`. Env: `VW_GATEWAY_URL`,
`VW_AGENT_KEY` (sk-mcp-*), `VW_FAIL_MODE` (open|closed, default open — for gateway-unreachable
and rate_limited), `VW_TIMEOUT`, `VW_APPROVAL_WAIT`, `VW_APPROVAL_FAIL_MODE` (default closed).

## UI

No bespoke screens. Rules are authored in **Guardrails**, decisions made in **Approvals**,
and every call appears in **Activity** (the renamed Audit Log) — all under the **Agent Control**
sidebar group. Servers/Tools keep "MCP" in their labels (genuinely MCP-protocol concepts).

## Not yet built (Phase 4+)

- **Path-based gating** — block/approve writes by *destination* (`~/.ssh`, `.env`, outside the
  repo). Genuinely new matching logic.
- Cursor / non-Claude-Code adapter; an Agent Control overview/landing page; a priority rule
  engine; tamper-evident audit; metering MCP calls into the existing budgets.

## Known issue

The i18n CI audit hard-gates `de`/`fr` coverage but **not `es`**, so Spanish translation gaps
can land on `develop` unnoticed. Worth extending the gate to `es` or running a periodic
es-coverage sweep.

## Design history

The spec/plan trail for each increment lives under `docs/superpowers/`:
`2026-06-15-mcp-bash-hook-*` (Phase 1), `2026-06-15-mcp-hook-approval-*` (Phase 2),
`2026-06-16-mcp-hook-filewrite-*` (Phase 3), `2026-06-16-agent-control-rename-*` (rename).
