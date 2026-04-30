# Fix-pass decisions (rolling, made during review gates)

Capture user decisions made at review gates so they're not lost before the fix pass starts. FIX = doc edit. PRODUCT = the app needs to change, not the doc. SKIP = leave as-is.

## getting-started

- **FIX**: Remove "Controls hub" references from both `getting-started/dashboard.ts` (block 16, sidebar bullet) and `getting-started/quick-start.ts` (block 10, "Assurance → Controls hub"). Verified absent across `Clients/src/` and `Servers/` on 2026-04-29; feature does not exist in the app.

## policies — needs decision (structural)

- The collection has two articles that both cover templates:
  - `policy-approval.ts` (id `policy-approval`, title "Policy templates", content = templates)
  - `policy-templates.ts` (id `policy-templates`, title "Policy templates library", content = templates from a library/browser angle)
- There is **no article** covering the actual policy approval workflow, even though the codebase has approval features.
- **Decision needed:**
  1. Rename `policy-approval.ts` to something semantic (e.g., merge into `policy-templates.ts` or split content cleanly), AND
  2. Decide whether to write a new approval-workflow article (or skip if approvals are documented in `ai-governance/approval-workflows.ts` already — needs check during ai-governance audit).
