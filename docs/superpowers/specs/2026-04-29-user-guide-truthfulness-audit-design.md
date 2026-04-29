# User guide truthfulness audit — design

**Date:** 2026-04-29
**Owner:** gorkem
**Status:** Draft, pending implementation plan

## Problem

The VerifyWise user guide has 91 articles across 13 collections in `shared/user-guide-content/content/`. The app changes faster than the docs, so individual claims (button labels, default values, behavior descriptions, compliance mappings) drift out of sync with the product. We need a systematic way to find every drifted claim so we can decide what to fix.

## Goals

- Verify every verifiable claim in every article against the actual codebase and (when needed) the running app.
- Produce findings reports per article that distinguish "wrong", "partial", and "unverifiable" with concrete evidence.
- Keep fixes separate from findings so each finding can be reviewed and accepted/rejected before any doc is edited.
- Calibrate the method on a small sample before committing to the full 91-article audit.

## Non-goals

- Content-quality rewrites (clarity, tone, SEO).
- Link/image dead-detection (separate concern).
- Translation/i18n verification.
- Auto-fixing without review.

## Approach

Three phases: **calibration sample**, **full audit**, **fix pass**. Each phase has an explicit review gate.

**Implementation-plan scope:** the first implementation plan covers Phase 1 only. Phases 2 and 3 are conditional on Phase 1 outcomes (the calibration memo decides whether the method is good enough to scale, what to tweak, and what order to audit collections in). When Phase 1 completes and the user approves expansion, a follow-up plan will be written for Phases 2 and 3. This spec describes all three phases for context, but does not commit to scheduling Phases 2 and 3 ahead of calibration.

### Phase 1 — Calibration sample (6 articles)

Audit a deliberately diverse 6-article sample to stress-test the audit method before scaling.

**Sample selection criteria:**

1. Span content shapes — UI-heavy flow article, behavior/quantitative reference article, compliance/cross-doc overview article.
2. Span code stacks — Clients (React), Servers (Node/Express), AIGateway (Python).
3. Span volatility — at least one recently-changed collection, at least one stable collection.

**Proposed sample:**

| # | Collection | Article | Why |
|---|---|---|---|
| 1 | `ai-gateway` | `guardrails.ts` | UI + quantitative + compliance + negative claims; high-density target. |
| 2 | `ai-gateway` | `endpoints.ts` | Config/reference style; tests cross-doc verification (guardrails references it). |
| 3 | `getting-started` | `quick-start.ts` | Pure UI/flow; tests button-label and step-ordering accuracy. |
| 4 | `compliance` | TBD (highest-claim-density article) | Compliance-claim heavy; tests low-confidence handling. |
| 5 | `ai-detection` | TBD (recently-changed) | Likely drift surface per memory ("currently implementing scheduled scans"). |
| 6 | `settings` | TBD (low-churn) | Baseline for what a stable doc looks like. |

Articles 4-6 finalized by checking git churn before the sample run.

**Output of Phase 1:**

- 6 findings reports (one per sampled article).
- One calibration memo (`docs/user-guide-audit/_calibration.md`) answering: did the report template capture what we needed; were claim types over- or under-flagged; was browser escalation calibrated; what did each article cost in time and tokens; is the 91-article rollout feasible.

**Phase 1 review gate:** user reviews the 6 reports + memo, decides to (a) proceed to Phase 2 as-is, (b) tweak the method and re-sample, or (c) abort.

### Phase 2 — Full audit (remaining ~85 articles, collection by collection)

After calibration approval, audit the remaining articles **collection by collection**, in the order set by the user. One Explore subagent per collection produces findings reports using the strict template (see "Findings report format" below). Main thread aggregates.

After each collection, user reviews that collection's reports before the next collection starts. This keeps feedback loops tight and lets the method evolve mid-audit if needed.

**Output of Phase 2:**

- One findings report per article at `docs/user-guide-audit/<collection>/<article>.md`.
- One per-collection summary at `docs/user-guide-audit/<collection>/_summary.md`.
- One global summary at `docs/user-guide-audit/_summary.md` — table of every article with verdict + finding count, sorted by severity.

### Phase 3 — Fix pass

Fixes happen only after audit reports are reviewed. Mixing fixes with findings makes it impossible to see what was wrong.

**Per-collection fix flow:**

1. User annotates each finding in the report with `FIX` / `SKIP` / `PRODUCT`. `PRODUCT` = "the app is wrong, not the doc". Unmarked findings default to `SKIP`.
2. Auditor reads the annotated report, generates one Edit per `FIX` finding, applies them.
3. Self-check: re-run verification on each fixed claim against current code; catches cases where the suggested fix was itself wrong.
4. Two-target write per memory rule: every doc edit goes to both `shared/user-guide-content/content/<collection>/<slug>.ts` (in-app) AND `~/website/verifywise/content/user-guide/<collection>/<slug>.ts` (website). Only the verifywise repo is committed; the website repo is never touched as a commit target.
5. One branch + one commit + one PR per collection (`fix/user-guide-audit-<collection>`). PRs only created with explicit user approval.
6. `PRODUCT` findings collected into `docs/user-guide-audit/_product-issues.md` for separate triage. Not fixed in this audit.

## Audit method (per article)

For each article, the auditor:

1. **Read the article** at `shared/user-guide-content/content/<collection>/<slug>.ts` and extract every verifiable claim. A claim is anything specific: button label, field name, menu path, expected outcome, default value, permission requirement, API behavior, regulatory mapping, cross-doc reference.
2. **Classify each claim** using the taxonomy below.
3. **Verify each claim** using the verification method for its type.
4. **Escalate to browser** only when a rendered behavior cannot be confirmed from code (chart shape, toast position, conditional UI gated on data state, multi-step wizard rendering).
5. **Write findings** for inaccurate / partial / unverifiable claims using the report template.
6. **Cluster check:** when a discrepancy is found, also check adjacent claims in the same article — drift clusters around a single underlying change (e.g., one feature renamed → 4 places to update).

### Claim taxonomy

| Type | Verification method |
|---|---|
| **UI claim** — labels, buttons, fields, menus, modals, layouts | Grep `Clients/src/` for the *exact quoted string*. Confirm component is reachable from documented path. |
| **Behavior claim** — what happens (state change, side effect, navigation, validation) | Trace controller / util / hook. Confirm described outcome matches code. |
| **Quantitative claim** — HTTP codes, defaults, retention windows, regex coverage | Find the constant / enum / regex in code. |
| **Reference claim** — file path, API endpoint, env var, external link | Verify the file / endpoint / link exists. |
| **Cross-doc claim** — references to other articles in the user guide | Verify referenced article exists AND its description matches that article's actual content. |
| **Compliance claim** — regulatory or framework mappings (EU AI Act, ISO 42001, etc.) | Mark **low-confidence** unless explicit code linkage exists. Aspirational mappings flagged as findings. |
| **Negative claim** — claims that something *doesn't* happen ("no data leaves the network", "disabled rules aren't evaluated") | Require code-path trace. Do not mark ✅ on weak evidence. Escalate if uncertain. |
| **Example claim** — examples in tables, code blocks ("12345678901" as TCKN example) | Verify the example actually works against the recognizer / parser, not just that the entity name exists. |
| **Non-verifiable** — opinion, motivation, "this helps you do X" framing | Skip. Logged in the "Skipped" section of the report. |

### Verification status values

- ✅ **accurate** — claim verified against code/UI, evidence cited.
- ⚠️ **partial** — claim is mostly right but missing detail or has a minor mismatch.
- ❌ **wrong** — claim contradicts code/UI.
- ❓ **unverifiable** — couldn't confirm or refute with available tools; logged with reason.

## Findings report format

Saved to `docs/user-guide-audit/<collection>/<article>.md`. Strict template so reports are skim-able and aggregable.

```markdown
# Audit: <collection>/<article>
**Article path:** shared/user-guide-content/content/<collection>/<article>.ts
**Audited:** YYYY-MM-DD
**Auditor:** <subagent name | manual>
**Verdict:** ✅ clean | ⚠️ minor issues (N) | ❌ significant issues (N)

## Summary
<2-3 sentences: overall state of the article>

## Findings
### Finding 1 — <one-line title>
- **Type:** UI | Behavior | Quantitative | Reference | Cross-doc | Compliance | Negative | Example
- **Status:** ❌ wrong | ⚠️ partial | ❓ unverifiable
- **Doc says:** "<exact quote>" (block index N)
- **Reality:** <what the code/UI actually shows>
- **Evidence:** `path/to/file.tsx:123` (or screenshot path, or "no match found in Clients/src/")
- **Suggested fix:** <one sentence — what the doc should say, or "remove claim", or "needs product decision">
- **Confidence:** high | medium | low

### Finding 2 — ...

## Verified claims (sampled)
<3-5 claims that were checked and found accurate — positive evidence the audit ran>

## Skipped / non-verifiable
<claims the auditor decided not to verify, with reason>
```

**Why this shape:**

- Verdict at top — directory listing of audit reports is itself a dashboard.
- Block index in "Doc says" — articles are arrays of blocks; pinpointing the block makes the fix trivial.
- Confidence field — forces the auditor to admit weak evidence (especially for negative and compliance claims).
- Verified claims section — without it, "no findings" is ambiguous between "doc is good" and "auditor was lazy".
- Skipped section — makes audit boundaries explicit.

## Aggregation

After each phase, generate `docs/user-guide-audit/_summary.md`:

| Article | Collection | Verdict | Findings | Severity |
|---|---|---|---|---|
| ... | ... | ❌ | 7 | high |

Sorted by severity. Acts as the user's dashboard for the whole audit.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Subagents waving through claims with weak evidence | Strict per-type verification rules; mandatory "Verified claims" section; confidence field on every finding. |
| Negative claims marked ✅ without proper trace | Explicit rule in subagent prompt: do not mark ✅ on negative claims without a code-path trace; escalate if uncertain. |
| Compliance mappings rubber-stamped | Mark **low-confidence by default**; require explicit code linkage to mark ✅. |
| Drift clusters missed (one finding implies more nearby) | "Cluster check" step in audit method. |
| Token cost runaway across 91 articles | Sample first; calibration memo explicitly answers cost feasibility before Phase 2 commits. |
| Audit reports rotting before fix phase | Per-collection fix immediately follows per-collection audit; do not let all 91 audits sit before any fix. |
| Website repo accidentally committed | Two-target write rule; only `verifywise` repo is git-committed. |

## Open questions

None — design fully specified by user during brainstorming.

## Out of scope (explicit non-goals, repeated for clarity)

- Rewriting unclear or low-quality prose.
- Verifying that screenshots match current UI (separate visual-regression problem).
- Auditing translations or other locales.
- Auditing plugin-marketplace docs.
- Auto-fixing without per-finding user approval.
