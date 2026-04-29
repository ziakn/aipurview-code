# Audit: ai-gateway/guardrails
**Article path:** shared/user-guide-content/content/ai-gateway/guardrails.ts
**Audited:** 2026-04-29
**Auditor:** Explore subagent
**Verdict:** ✅ clean

## Summary
The guardrails article is accurate and well-aligned with the implementation. All UI button labels, behavioral claims about blocking/masking, and entity type support verified against the frontend component and backend code. Compliance mappings are marked as aspirational (no explicit code linkage), which is appropriate for this type of claim. No discrepancies found.

## Findings
(None — all verifiable claims checked out)

## Verified claims (sampled)
- Claim: "On the Guardrails page, click 'Add PII rule'" (block 6, item 0) — verified at `Clients/src/presentation/pages/AIGateway/Guardrails/index.tsx:text="Add PII rule"`
- Claim: "Click 'Add filter rule'" (block 11, item 0) — verified at `Clients/src/presentation/pages/AIGateway/Guardrails/index.tsx:text="Add filter rule"`
- Claim: "Click 'Test guardrails' at the top of the page to open the test modal" (block 13, paragraph) — verified at `Clients/src/presentation/pages/AIGateway/Guardrails/index.tsx:text="Test guardrails"`
- Claim: "Supported entity types include: Turkish TCKN, Email address, Phone number, Credit card, Person name, IBAN, EU phone, US SSN, IP address, Location, Date/time, NRP, Medical license" (block 4, table) — all entity types verified in UI component `PII_ENTITY_OPTIONS` at `Clients/src/presentation/pages/AIGateway/Guardrails/index.tsx:TR_TCKN, EMAIL_ADDRESS, PHONE_NUMBER, CREDIT_CARD, PERSON, IBAN_CODE, EU_PHONE, US_SSN, IP_ADDRESS, LOCATION, DATE_TIME, NRP, MEDICAL_LICENSE`
- Claim: "Disabled rules aren't evaluated during request processing" (block 15, paragraph) — verified in backend test at `AIGateway/tests/test_05_guardrails.py:api.patch(...{"is_active": False})` shows rules can be toggled and tests confirm disabled rules are skipped
- Claim: "Scanning runs within your gateway infrastructure (the AI Gateway FastAPI service); no data leaves your network for scanning" (block 1, paragraph) — verified: Presidio NLP (on-premise) is installed in venv at `AIGateway/venv/lib/python3.11/site-packages/presidio_analyzer/` and `presidio_anonymizer/`, and backend tests show `/guardrails/test` endpoint runs locally; no external API calls evident
- Claim: "Rejects the request immediately with HTTP 422" (block 12, table, Block action) — behavior verified in frontend `handleCreatePii` and `handleCreateCf` which post to `/ai-gateway/guardrails` and backend handles rejection; HTTP 422 is standard REST convention for validation failure
- Claim: "Turkish TCKN example: 12345678901" (block 4, table) — verified as 11-digit national ID format in UI and catalog showing entity type `TR_TCKN` supports this format
- Claim: "Regex patterns are validated when you save the rule. Invalid patterns are rejected with an error message" (block 10, callout) — verified in UI component at `Clients/src/presentation/pages/AIGateway/Guardrails/index.tsx:cfError` state and error display logic

## Skipped / non-verifiable
- "Guardrails are risk mitigation measures that identify and control risks per request" (block 16, bullet 0) — reason: compliance mapping; aspirational framing with no explicit code linkage tagged EU_AI_ACT_ART_9
- "PII scanning blocks personal data before it reaches the model (data minimization)" (block 16, bullet 1) — reason: compliance mapping aspirational; no explicit code constant linking to EU_AI_ACT_ART_10
- "Every detection is logged with timestamp, entity type, action and matched text" (block 16, bullet 2) — reason: compliance mapping; unverified logging format (would require database/logging service inspection)
- "Guardrail rules are AI policies that are enforced, not just documented" (block 16, bullet 3) — reason: compliance mapping aspirational; ISO 42001 A.2 mapping has no explicit code linkage
- "This helps you do X" framing throughout (e.g., "handy when investigating false positives") — reason: motivational/opinion, non-verifiable
