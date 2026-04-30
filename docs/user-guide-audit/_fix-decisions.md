# Fix-pass decisions (rolling, made during review gates)

Capture user decisions made at review gates so they're not lost before the fix pass starts. FIX = doc edit. PRODUCT = the app needs to change, not the doc. SKIP = leave as-is.

## getting-started

- **FIX**: Remove "Controls hub" references from both `getting-started/dashboard.ts` (block 16, sidebar bullet) and `getting-started/quick-start.ts` (block 10, "Assurance → Controls hub"). Verified absent across `Clients/src/` and `Servers/` on 2026-04-29; feature does not exist in the app.

## compliance/ce-marking — SKIPPED (needs product input)

- Audit Findings 1+2: doc lists Title Case status values for declaration ("Draft, Ready for signature, Signed, Archived") and registration ("Not registered, Pending, Registered, Rejected"), but backend only has `"draft"` and `"not_registered"` as defaults — no formal enum exists. The other values may be UI display labels, may be aspirational, or may simply not exist yet. Needs product confirmation of the intended status set before fixing the doc.

## ai-governance/model-lifecycle — SKIPPED (needs investigation)

- Audit Finding 1: doc lists 7 governance workflow statuses; code's Status.ts enum has 7 different status values for control assessments (Draft, Awaiting review, Awaiting approval, Implemented, etc.). These appear to serve different purposes — needs verification of which enum the project UI actually uses.

## ai-gateway/mcp-guardrails — SKIPPED (needs investigation)

- Article claims JSON-RPC error code `-32003` for guardrail blocks. Auditor couldn't find a matching constant in code. Either the code is right and the doc number is wrong, or the auditor missed it. Needs a quick AI Gateway code review before fixing.

## ai-gateway/settings — SKIPPED (auth contract clarity)

- Audit Finding 2: doc says "Requests without a valid key receive a 401 response", but the OpenAPI route definition has `requiresAuth: false` with only 201/500 responses. The doc claim is likely correct in practice (auth middleware runs upstream of the route), but the API contract doesn't reflect it. Either fix the OpenAPI definition or rephrase the doc — needs product decision.

## policies — needs decision (structural)

- The collection has two articles that both cover templates:
  - `policy-approval.ts` (id `policy-approval`, title "Policy templates", content = templates)
  - `policy-templates.ts` (id `policy-templates`, title "Policy templates library", content = templates from a library/browser angle)
- There is **no article** covering the actual policy approval workflow, even though the codebase has approval features.
- **Decision needed:**
  1. Rename `policy-approval.ts` to something semantic (e.g., merge into `policy-templates.ts` or split content cleanly), AND
  2. Decide whether to write a new approval-workflow article (or skip if approvals are documented in `ai-governance/approval-workflows.ts` already — needs check during ai-governance audit).
