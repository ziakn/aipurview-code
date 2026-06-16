# Phase 3 — Gate file-write tools (tool-agnostic hook)

> **Status:** Design approved 2026-06-16
> **Branch:** (to be created) `feat/mcp-hook-filewrite` off `feat/mcp-hook-approval` (Phase 2)
> **Predecessors:** Phase 1 (`feat/mcp-bash-hook`), Phase 2 (`feat/mcp-hook-approval`) — both unmerged

## Goal

Gate a coding agent's file-write tools (Edit, Write, MultiEdit) through the same hook
that already gates Bash, so guardrail and approval rules apply to **what the agent writes
into files**, not just shell commands.

## The honest framing: this is enablement, not new gateway logic

A code audit during design confirmed the gateway and adapter are **already tool-agnostic**:

- `scan_tool_input` (`AIGateway/src/services/mcp_guardrail_service.py`) serializes **every**
  argument value — strings directly, dicts/lists via `json.dumps` — so it already scans
  `Write.content`, `Edit.new_string` and `MultiEdit.edits[].new_string`. No Bash-specific code.
- `mcp_hook.py` reads `tool_name`/`arguments` generically and never branches on "Bash".
- The adapter sends `tool_name` + `tool_input` for whatever tool fired.

The only reason file writes aren't gated today is that the documented Claude Code config
matches `Bash` alone. Phase 3 makes file-write gating real and proves it.

**No new gateway code, no migration, no new UI.** Rules are authored in the existing
Guardrails screen; results land in the existing Activity / Approvals screens.

## Scope (locked)

| Decision | Choice |
|---|---|
| What is gated | **File content** (the text being written): `Write.content`, `Edit.new_string`, `MultiEdit.edits[].new_string` |
| Matching | Existing content rules (PII / regex / keyword / require_approval). Already tool-agnostic |
| Tool coverage | Generic — any tool by its serialized args. Documented matcher set: **Bash\|Edit\|Write\|MultiEdit** |
| Adapter | **Rename** `vw-bash-hook.sh` → `vw-tool-hook.sh` (internals unchanged). Clean rename, **no back-compat shim** (the script only exists on unmerged branches) |
| New gateway logic | **None** |

### Explicitly out of scope

- **File-path matching** (block-by-destination, e.g. writes to `~/.ssh`, `.env`, outside the
  repo). That is genuinely new gateway logic (path-aware rule matching) → a later phase.
  Phase 3 gating is **content-based** only.
- New UI, new migration, new rule types or actions.
- Cursor / non-Claude-Code adapters.

## What changes

1. **Rename adapter:** `git mv scripts/vw-bash-hook.sh scripts/vw-tool-hook.sh`. Header
   comment "Bash gate" → "tool gate". Internals unchanged (already tool-agnostic). No shim.
2. **Rename README:** `vw-bash-hook.README.md` → `vw-tool-hook.README.md`, reframed from
   "Bash gate" to "tool gate". Documents that guardrail/approval rules now cover file
   content, with the multi-matcher config:
   ```json
   { "hooks": { "PreToolUse": [
     { "matcher": "Bash|Edit|Write|MultiEdit",
       "hooks": [{ "type": "command", "command": "scripts/vw-tool-hook.sh" }] } ] } }
   ```
3. **E2E tests** proving file-write tools are gated identically to Bash.

## Testing

New `AIGateway/tests/test_15_mcp_hook_filewrite.py`, same live-HTTP style:

- **Write + PII content → deny.** PII rule (EMAIL_ADDRESS); POST
  `{tool_name:"Write", arguments:{file_path:"/tmp/x", content:"contact me@evil.com"}}` → `deny`.
  Proves `content` is scanned.
- **Edit + new_string → deny.** POST
  `{tool_name:"Edit", arguments:{file_path:"/tmp/x", old_string:"a", new_string:"secret me@evil.com"}}`
  → `deny`. Proves `new_string` is scanned.
- **MultiEdit + nested new_string → deny.** POST
  `{tool_name:"MultiEdit", arguments:{file_path:"/tmp/x", edits:[{old_string:"a", new_string:"me@evil.com"}]}}`
  → `deny`. Proves the `edits` list is serialized + scanned (verify, don't assume).
- **require_approval on file content → approval_required.** A `require_approval` regex rule
  (e.g. `BEGIN [A-Z ]*PRIVATE KEY`); POST a `Write` whose content matches → `approval_required`.
  Proves the approval path is tool-agnostic.
- **Clean Write → allow.** `{tool_name:"Write", arguments:{content:"hello world"}}` → `allow`.
- **applies_to_tools scoping.** A rule scoped `applies_to_tools:["Write"]` fires on a Write
  but NOT on a Bash call with the same content. Proves per-tool targeting already works.
- **Regression:** Phase 1 (`test_13`) and Phase 2 (`test_14`) suites still pass.

## Adapter rename verification

After `git mv`, confirm the renamed script behaves identically to Phase 1/2:
allow / deny / fail-open / fail-closed / approval-poll all still work (run the same live
checks against a `Write`-shaped stdin payload, e.g.
`{"tool_name":"Write","tool_input":{"content":"..."}}`).

## Merge ordering

Stacks on Phase 2. Merge train: **Phase 1 → Phase 2 → Phase 3 → rename**. The adapter file
is touched by Phase 1 (creates `vw-bash-hook.sh`) and Phase 3 (renames it) — a clean `git mv`
keeps history; reconcile at merge if Phase 1/2 land separately. The Agent-Control rename
branch is independent of this stack except both touch user-facing copy.

## Open questions

None blocking. Deferred: file-path matching (block-by-destination), Cursor adapter.
