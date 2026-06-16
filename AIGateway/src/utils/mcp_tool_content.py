"""
Field-aware content extraction for tool-call scanning.

For file-write tools we want guardrails to scan only what is being WRITTEN
(content / new_string), not what is being removed (old_string) or where it goes
(file_path). Scanning old_string would block an agent from deleting a line that
contains PII; scanning file_path causes false positives on paths.

For every other tool (Bash, MCP-proxied tools, unknown tools) we return the full
arguments unchanged, preserving existing behavior and over-scanning rather than
under-scanning when we do not recognize a tool.

Only the SCAN uses this subset. Audit logging and approval argument-hashing keep
using the full arguments (the path is part of a call's identity and record).
"""

from typing import Any

# tool_name -> list of argument keys whose values are "written content".
# Hardcoded: covers the file-write tools coding agents expose today.
# To gate a new write-like tool, add its tool_name -> written-content field(s)
# here (MultiEdit is special-cased below because its content lives in a list).
# A tool not listed here is over-scanned on its full args, never under-scanned.
FILE_WRITE_CONTENT_FIELDS: dict[str, list[str]] = {
    "Write": ["content"],
    "Edit": ["new_string"],
    "NotebookEdit": ["new_source"],
}


def extract_scannable_content(tool_name: str, arguments: dict) -> dict:
    """Return the subset of `arguments` that should be scanned for content.

    File-write tools -> only the written-content fields.
    MultiEdit -> the new_string of every edit (its content lives in a list).
    Everything else (Bash, MCP, unknown) -> the full arguments, unchanged.

    A call with no written content (a pure deletion, e.g. an Edit with only
    old_string, or a MultiEdit with no new_string anywhere) returns {}. The
    scanners treat that as nothing-to-scan and allow it. This is intentional:
    guardrails (including prompt-injection) gate what is WRITTEN, not what is
    removed.
    """
    if not isinstance(arguments, dict):
        return {}

    if tool_name == "MultiEdit":
        edits = arguments.get("edits")
        new_strings: list[Any] = []
        if isinstance(edits, list):
            for edit in edits:
                if isinstance(edit, dict) and "new_string" in edit:
                    new_strings.append(edit["new_string"])
        if not new_strings:
            return {}  # no written content -> nothing to scan
        return {"new_strings": new_strings}

    fields = FILE_WRITE_CONTENT_FIELDS.get(tool_name)
    if fields is None:
        # Unknown / non-file-write tool: scan everything (preserves Bash + MCP).
        return arguments

    return {k: arguments[k] for k in fields if k in arguments}
