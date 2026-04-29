# User guide audit — Phase 2 (full audit) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the remaining 85 user guide articles (plus re-audit 1 from Phase 1 with weak verifications), producing one findings report per article. After each collection, dispatch a verification subagent that spot-checks Verified claims, then write a per-collection summary, then pause for user approval before the next collection.

**Architecture:** No code changes. Per-article: dispatch one Explore subagent with the v2 prompt; produce a findings report. Per-collection: dispatch one verification subagent that spot-checks 2-3 Verified claims per report; write a per-collection summary; pause at a review gate. After all collections: write a global summary. Concurrency capped at 3 simultaneous audit subagents to keep terminal output manageable.

**Tech Stack:** Markdown reports only. Tooling: Explore subagent (for both audit and verification roles), grep/Read for file checks, Playwright MCP only on rare browser escalation.

**Reference spec:** `docs/superpowers/specs/2026-04-29-user-guide-truthfulness-audit-design.md`
**Reference Phase 1 calibration:** `docs/user-guide-audit/_calibration.md`

---

## Sample / scope

- **Total articles in user guide:** 91
- **Already audited in Phase 1:** 6 (`ai-gateway/guardrails`, `ai-gateway/endpoints`, `getting-started/quick-start`, `compliance/eu-ai-act`, `ai-detection/scanning`, `settings/role-configuration`)
- **To audit in Phase 2:** 85 + re-audit `ai-gateway/guardrails` (deleting Phase 1 report first) = **86 audit runs**

The Phase 1 reports for the other 5 sampled articles (`endpoints`, `quick-start`, `eu-ai-act`, `scanning`, `role-configuration`) are reused as-is.

## Collection ordering (smallest-first)

| # | Collection | Articles total | Already audited | Phase 2 audits |
|---|---|---|---|---|
| A | training | 1 | 0 | 1 |
| B | reporting | 2 | 0 | 2 |
| C | getting-started | 4 | 1 | 3 |
| D | policies | 4 | 0 | 4 |
| E | ai-detection | 5 | 1 | 4 |
| F | integrations | 5 | 0 | 5 |
| G | risk-management | 5 | 0 | 5 |
| H | settings | 5 | 1 | 4 |
| I | shadow-ai | 6 | 0 | 6 |
| J | compliance | 8 | 1 | 7 |
| K | llm-evals | 13 | 0 | 13 |
| L | ai-governance | 16 | 0 | 16 |
| M | ai-gateway | 17 | 2 | 16 (incl. re-audit of guardrails) |

Total Phase 2 audit runs: 86. Plus 13 verification-subagent runs (one per collection).

## File structure

```
docs/user-guide-audit/
  _subagent-prompt-v2.md                    # Task 1 — replaces v1 with 5 tweaks
  _verification-subagent-prompt.md          # Task 2 — new prompt for spot-check subagent
  <collection>/
    <article>.md                            # one per article
    _summary.md                             # per-collection summary
    _verification.md                        # per-collection spot-check report
  _summary.md                               # global summary, sorted by severity (final task)
```

---

## Task 1: Write the v2 audit subagent prompt

**Why:** the calibration memo identified 5 specific gaps in v1. v2 closes them. Re-using v1 would re-introduce the failure modes Phase 1 surfaced.

**Files:**
- Create: `docs/user-guide-audit/_subagent-prompt-v2.md`

- [ ] **Step 1: Create the v2 prompt file**

Create `docs/user-guide-audit/_subagent-prompt-v2.md` with the exact content below. The 5 tweaks from the calibration memo are inline.

````markdown
# Audit subagent prompt template — v2

Substitute `<COLLECTION>`, `<ARTICLE>`, and `<REPORT_PATH>` before dispatching. The full prompt is everything below the `---` line.

**Changes from v1 (per Phase 1 calibration memo):**
1. Stronger negative-claim rule
2. No rationalized quantitative claims
3. Explicit ❌ vs ⚠️ examples
4. Example-value verification rule
5. Skip vs ❓ rule

---

You are auditing one VerifyWise user guide article for truthfulness against the codebase. You will write exactly one markdown findings report and return its path. Do not edit the article. Do not edit any code.

## Inputs

- **Article to audit:** `shared/user-guide-content/content/<COLLECTION>/<ARTICLE>.ts`
- **Report to write:** `<REPORT_PATH>`
- **Spec for context (read first, do not re-read after):** `docs/superpowers/specs/2026-04-29-user-guide-truthfulness-audit-design.md`

## Process (do these in order, do not skip)

1. **Read the article.** Articles are TypeScript files exporting an `ArticleContent` object with a `blocks` array. Each block has an index (0-based) — cite block indexes in findings.

2. **Read the spec's "Audit method" and "Claim taxonomy" sections** to refresh the rules. After this, do not re-read the spec.

3. **Extract every verifiable claim.** A claim is anything specific: button label, field name, menu path, expected outcome, default value, permission requirement, API behavior, regulatory mapping, cross-doc reference, example value in a table.

4. **Classify each claim** using the taxonomy:
   - **UI claim** — labels, buttons, fields, menus, modals, layouts
   - **Behavior claim** — what happens (state change, side effect, navigation, validation)
   - **Quantitative claim** — HTTP codes, defaults, retention windows, regex coverage, exact counts
   - **Reference claim** — file path, API endpoint, env var, external link
   - **Cross-doc claim** — references to other articles in this user guide
   - **Compliance claim** — regulatory or framework mappings (EU AI Act, ISO 42001, NIST)
   - **Negative claim** — claims that something *doesn't* happen
   - **Example claim** — concrete examples in tables/code blocks
   - **Non-verifiable** — opinion, motivation; log in Skipped section, do not verify

5. **Verify each claim** using the method for its type:
   - **UI:** grep `Clients/src/` for the *exact quoted string*. Cite `path:line`.
   - **Behavior:** trace controller / util / hook / service. Cite the file:line where the behavior is implemented.
   - **Quantitative:** find the constant / enum / regex / config in code. Cite the actual line. **Rationalization is not verification — phrases like "standard REST convention", "common pattern", "typical default" are NOT acceptable evidence. If you cannot find the actual line, mark ❓.**
   - **Reference:** confirm file/endpoint/link exists. For external links, do not fetch — note "external link, not fetched".
   - **Cross-doc:** confirm the referenced `shared/user-guide-content/content/<otherCollection>/<otherSlug>.ts` exists AND its content matches the description in the link block.
   - **Compliance:** mark **low-confidence by default**. Only mark ✅ if there's an explicit code linkage (e.g., a constant tagged `EU_AI_ACT_ART_9` or a comment in the implementing file). Otherwise flag as a finding with status ⚠️ and note "aspirational mapping — no code linkage found".
   - **Negative:** **Presence of a local package, or absence of one specific external call, is NOT sufficient.** You must trace the actual request-handling code path that would have produced the negated behavior. If the trace is too long or you cannot complete it, mark ❓ unverifiable, NOT ✅.
   - **Example:** **Verify the example value actually works against the recognizer/parser/regex.** The existence of the entity type, format name, or feature in the catalog is NOT sufficient. For instance, if the doc shows "12345678901" as a Turkish TCKN example, check whether Presidio's TR_TCKN recognizer actually accepts that string (it has a checksum). If you cannot test the example, mark ❓.

6. **Cluster check.** When you find a discrepancy, scan adjacent claims in the same article — drift clusters.

7. **Browser escalation.** Only if a claim involves rendered output that cannot be inferred from code (chart shape, toast position, conditional UI gated on data state, multi-step wizard rendering). Save screenshots to `docs/user-guide-audit/<COLLECTION>/_screenshots/<ARTICLE>-<n>.png`. Local dev creds: email `gorkem.cetin@verifywise.ai`, password `Verifywise#1`.

8. **Write the findings report** to `<REPORT_PATH>` using exactly the template below.

## Status classification — explicit examples

Use **❌ wrong** when the doc says one specific thing and the code says a different specific thing:
- Doc: "Click 'Save'" — Code: button is labeled "Submit" → ❌
- Doc: "100+ patterns" — Code: 83 patterns → ❌
- Doc: "Status options are Waiting, In progress, Done" — Code: "Not started, In progress, Done" → ❌

Use **⚠️ partial** only when the doc is mostly right but missing detail or has a minor mismatch:
- Doc: "Lists 5 fields" — Code: lists 5 of 6 fields, one missing → ⚠️
- Doc: "Returns 4xx error" — Code: returns 422 specifically → ⚠️ (right shape, missing precision)

Do NOT downgrade clear contradictions to ⚠️.

## Skip vs ❓ unverifiable

- **Skip** is reserved for: opinion ("this helps you do X"), motivation, external regulatory definitions, time estimates depending on user proficiency.
- **❓ unverifiable** is for: a verifiable-type claim (UI/Behavior/Quantitative/Reference/Cross-doc/Negative/Example) where you couldn't complete the verification with available tools or in reasonable time.

If you find an OWASP-style behavior claim and cannot trace the implementation, that is a ❓ finding, NOT a Skip.

## Findings report template (copy this structure exactly)

```markdown
# Audit: <COLLECTION>/<ARTICLE>
**Article path:** shared/user-guide-content/content/<COLLECTION>/<ARTICLE>.ts
**Audited:** <YYYY-MM-DD>
**Auditor:** Explore subagent (v2)
**Verdict:** ✅ clean | ⚠️ minor issues (N) | ❌ significant issues (N)

## Summary
<2-3 sentences>

## Findings
### Finding 1 — <one-line title>
- **Type:** UI | Behavior | Quantitative | Reference | Cross-doc | Compliance | Negative | Example
- **Status:** ❌ wrong | ⚠️ partial | ❓ unverifiable
- **Doc says:** "<exact quote>" (block index N)
- **Reality:** <what the code/UI actually shows>
- **Evidence:** `path/to/file.tsx:123`
- **Suggested fix:** <one sentence>
- **Confidence:** high | medium | low

## Verified claims (sampled)
- Claim: "<quote>" (block N) — verified at `path:line`
(3-5 entries minimum)

## Skipped / non-verifiable
- "<quote>" (block N) — reason: <opinion/motivation/external link/etc>
```

## Constraints (hard rules)

- Do not edit the article or any source code.
- Do not mark ✅ on negative claims with weak evidence. Use ❓ if you can't trace the absence via the actual request-handling code path.
- Do not mark ✅ on compliance claims without explicit code linkage. Default is ⚠️ "aspirational mapping".
- Do not rationalize quantitative claims. Cite the actual code line.
- Verify example values actually work against the recognizer/parser, not just that the entity type exists.
- Use ❓ (not Skip) for verifiable-type claims you couldn't verify.
- Verified claims section is mandatory. 3-5 entries minimum.
- Cite block indexes in "Doc says".

## Output

Return: the path to the report you wrote, plus a one-line summary. Nothing else.
````

- [ ] **Step 2: Verify the file exists**

Run: `wc -l docs/user-guide-audit/_subagent-prompt-v2.md`
Expected: ~110-130 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/user-guide-audit/_subagent-prompt-v2.md
git commit -m "docs(user-guide-audit): add v2 audit prompt with 5 calibration tweaks

Closes the failure modes identified in Phase 1: weak negative-claim
verification, rationalized quantitative claims, ❌/⚠️ classification
drift, under-checked example values, and Skip/❓ confusion."
```

---

## Task 2: Write the verification subagent prompt

**Why:** the calibration memo recommended a per-collection spot-check subagent that re-validates 2-3 Verified claims per report. Catches false-positive verifications without parent re-checking by hand.

**Files:**
- Create: `docs/user-guide-audit/_verification-subagent-prompt.md`

- [ ] **Step 1: Create the verification prompt file**

Create `docs/user-guide-audit/_verification-subagent-prompt.md` with the content below.

````markdown
# Verification subagent prompt template

Substitute `<COLLECTION>` and `<REPORT_LIST>` before dispatching. `<REPORT_LIST>` is a newline-separated list of report paths.

---

You are spot-checking the audit reports for the `<COLLECTION>` collection. Your job is to detect false-positive verifications — cases where the audit subagent claimed "verified at file:line" but the citation doesn't actually support the claim.

## Inputs

- **Reports to spot-check:**
<REPORT_LIST>

## Process

For each report:

1. **Read the report.** Note the article path, the verdict, and especially the "Verified claims (sampled)" section.

2. **Pick 2 random verified claims.** Pseudo-randomly: take the 2nd and the 4th, or the 1st and last if fewer than 4.

3. **Re-verify each spot-checked claim:**
   - Open the cited file at the cited line range with the Read tool.
   - Confirm the cited code actually supports the claim. The code at that line should match what the claim says happens / what the UI shows / what the value is.
   - If the citation is wrong (file doesn't have that text, line doesn't show that behavior), or the claim's interpretation of the code is wrong, that's a **failed spot-check**.

4. **Record results.** For each report, note: (a) which claims you spot-checked, (b) whether each held up, (c) any failed spot-checks with explanation.

## Output

Write a single combined report to `docs/user-guide-audit/<COLLECTION>/_verification.md` with this structure:

```markdown
# Verification spot-checks — <COLLECTION>
**Date:** <YYYY-MM-DD>
**Reports spot-checked:** <N>
**Claims re-verified:** <N> (2 per report)
**Failed spot-checks:** <N>

## Per-report results

### <article-name>.md
- ✅ "<claim quote>" (verified at `path:line`) — confirmed: <one-line note>
- ❌ "<claim quote>" (verified at `path:line`) — FAILED: <explanation>

### <article-name>.md
...

## Summary

<one paragraph: was the audit subagent reliable? any patterns in the failures? recommendation: trust the collection's reports as-is, or re-audit specific articles?>
```

## Constraints

- Do not edit any reports, articles, or code.
- Do not re-audit — only spot-check the claims the audit subagent already produced.
- If a citation is "no match found in Clients/src/" for a finding (negative confirmation), don't try to verify it — that's a finding, not a verified claim.
- Pick claims to spot-check pseudo-randomly across types (UI, Behavior, Quantitative, etc.) when possible — don't only spot-check easy UI grep claims.

## Output

Return: the path to the verification report, plus a one-line summary like "Wrote `docs/user-guide-audit/<COLLECTION>/_verification.md` — N reports spot-checked, N failures". Nothing else.
````

- [ ] **Step 2: Verify the file exists**

Run: `wc -l docs/user-guide-audit/_verification-subagent-prompt.md`
Expected: ~50-80 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/user-guide-audit/_verification-subagent-prompt.md
git commit -m "docs(user-guide-audit): add verification subagent prompt

Per-collection spot-checker that re-validates 2 verified claims per
report, catching false-positive verifications without parent
attention. Recommended in Phase 1 calibration memo."
```

---

## Common pattern for collection tasks

Tasks 3-15 below all follow the same pattern. Documenting it once here; each collection task inlines its specific article list and substitutions.

**Per-collection workflow:**

1. **Setup** — `mkdir -p docs/user-guide-audit/<collection>`.
2. **Audit dispatch** — for each article in the collection that hasn't been audited yet, dispatch one Explore subagent with the v2 prompt. Cap at 3 concurrent.
3. **Per-article verification** — read each report, check template compliance (verdict line, ## Findings, ## Verified claims with ≥3 entries, ## Skipped). If a report fails the template, re-dispatch with corrective note.
4. **Audit commit** — one commit per collection, message format: `docs(user-guide-audit): audit <collection> collection (N articles)`.
5. **Verification subagent dispatch** — one Explore subagent with the verification prompt, given the list of article reports for this collection. Output goes to `<collection>/_verification.md`.
6. **Per-collection summary** — write `docs/user-guide-audit/<collection>/_summary.md` with: list of articles + their verdicts, total findings by status, link to verification report, brief assessment.
7. **Verification + summary commit** — one commit, message: `docs(user-guide-audit): <collection> spot-checks and summary`.
8. **Review gate** — present the per-collection summary to the user, list paths, ask "next collection or stop?". WAIT for explicit approval.

**Concurrency rule:** dispatch up to 3 audit subagents in parallel per single message (multiple Agent tool calls in one assistant turn). Wait for all to complete before processing or dispatching the next batch.

**Dispatch substitutions for v2 prompt:** copy the content of `docs/user-guide-audit/_subagent-prompt-v2.md` from below the `---` line, with literal substitutions for `<COLLECTION>`, `<ARTICLE>`, `<REPORT_PATH>`.

**Dispatch substitutions for verification prompt:** same pattern; `<REPORT_LIST>` is a newline-separated list of `docs/user-guide-audit/<collection>/<article>.md` paths.

---

## Task 3: Audit collection A — training (1 article)

**Articles to audit:** `training/training-tracking`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/training
```

- [ ] **Step 2: Dispatch audit subagent**

Dispatch one Explore subagent for `training/training-tracking` with the v2 prompt, substituting `<COLLECTION>=training`, `<ARTICLE>=training-tracking`, `<REPORT_PATH>=docs/user-guide-audit/training/training-tracking.md`.

- [ ] **Step 3: Verify report**

Read the report. Confirm template compliance. Re-dispatch if non-compliant.

- [ ] **Step 4: Commit audit**

```bash
git add docs/user-guide-audit/training/
git commit -m "docs(user-guide-audit): audit training collection (1 article)"
```

- [ ] **Step 5: Dispatch verification subagent**

Dispatch one Explore subagent with the verification prompt. `<COLLECTION>=training`. `<REPORT_LIST>` = `docs/user-guide-audit/training/training-tracking.md`.

- [ ] **Step 6: Write per-collection summary**

Create `docs/user-guide-audit/training/_summary.md`:

```markdown
# Collection summary — training
**Date:** 2026-04-29
**Articles audited:** 1
**Verification:** see `_verification.md`

## Verdicts

| Article | Verdict | ❌ | ⚠️ | ❓ |
|---|---|---|---|---|
| training-tracking | <verdict> | <n> | <n> | <n> |

## Verification

<paste the Summary paragraph from _verification.md>

## Assessment

<one paragraph: any pattern in findings; ready to move on or warrants tweaks>
```

- [ ] **Step 7: Commit verification + summary**

```bash
git add docs/user-guide-audit/training/_verification.md docs/user-guide-audit/training/_summary.md
git commit -m "docs(user-guide-audit): training spot-checks and summary"
```

- [ ] **Step 8: Review gate**

Present to the user: paths to all training reports + summary + verification. Ask: "Proceed to collection B (reporting)?". Wait for explicit yes/no.

---

## Task 4: Audit collection B — reporting (2 articles)

**Articles:** `reporting/dashboard-analytics`, `reporting/generating-reports`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/reporting
```

- [ ] **Step 2: Dispatch 2 audit subagents in parallel** (one assistant turn, 2 Agent tool calls):

- Subagent 1: `<COLLECTION>=reporting`, `<ARTICLE>=dashboard-analytics`, `<REPORT_PATH>=docs/user-guide-audit/reporting/dashboard-analytics.md`
- Subagent 2: `<COLLECTION>=reporting`, `<ARTICLE>=generating-reports`, `<REPORT_PATH>=docs/user-guide-audit/reporting/generating-reports.md`

- [ ] **Step 3: Verify reports** (template compliance for each).

- [ ] **Step 4: Commit audits**

```bash
git add docs/user-guide-audit/reporting/
git commit -m "docs(user-guide-audit): audit reporting collection (2 articles)"
```

- [ ] **Step 5: Dispatch verification subagent** with `<REPORT_LIST>` listing both reports.

- [ ] **Step 6: Write per-collection summary** (same template as Task 3 Step 6).

- [ ] **Step 7: Commit verification + summary**

```bash
git add docs/user-guide-audit/reporting/_verification.md docs/user-guide-audit/reporting/_summary.md
git commit -m "docs(user-guide-audit): reporting spot-checks and summary"
```

- [ ] **Step 8: Review gate** — wait for user approval before next collection.

---

## Task 5: Audit collection C — getting-started (3 remaining)

**Articles:** `getting-started/dashboard`, `getting-started/installing`, `getting-started/welcome` (skip `quick-start` — already audited).

- [ ] **Step 1:** Directory exists from Phase 1; no setup needed.

- [ ] **Step 2: Dispatch 3 audit subagents in parallel** (one assistant turn):

- Subagent 1: `<ARTICLE>=dashboard`, report → `docs/user-guide-audit/getting-started/dashboard.md`
- Subagent 2: `<ARTICLE>=installing`, report → `docs/user-guide-audit/getting-started/installing.md`
- Subagent 3: `<ARTICLE>=welcome`, report → `docs/user-guide-audit/getting-started/welcome.md`

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit**

```bash
git add docs/user-guide-audit/getting-started/dashboard.md docs/user-guide-audit/getting-started/installing.md docs/user-guide-audit/getting-started/welcome.md
git commit -m "docs(user-guide-audit): audit remaining getting-started articles (3)"
```

- [ ] **Step 5: Dispatch verification subagent** with `<REPORT_LIST>` of all 4 reports in this collection (the new 3 + existing `quick-start.md`).

- [ ] **Step 6: Write per-collection summary** including all 4 articles.

- [ ] **Step 7: Commit verification + summary.**

- [ ] **Step 8: Review gate.**

---

## Task 6: Audit collection D — policies (4 articles)

**Articles:** `policies/policy-approval`, `policies/policy-management`, `policies/policy-templates`, `policies/policy-versioning`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/policies
```

- [ ] **Step 2: Dispatch in 2 batches of up to 3 subagents** (4 articles, max 3 concurrent):

Batch 1 (parallel): `policy-approval`, `policy-management`, `policy-templates`.
Wait for all 3 to complete.
Batch 2: `policy-versioning` (single).

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/policies/
git commit -m "docs(user-guide-audit): audit policies collection (4 articles)"
```

- [ ] **Step 5: Dispatch verification subagent** with all 4 reports.

- [ ] **Step 6: Write per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 7: Audit collection E — ai-detection (4 remaining)

**Articles:** `ai-detection/history`, `ai-detection/repositories`, `ai-detection/risk-scoring`, `ai-detection/settings` (skip `scanning` — already audited).

- [ ] **Step 1:** Directory exists.

- [ ] **Step 2: Dispatch in 2 batches**:

Batch 1: `history`, `repositories`, `risk-scoring`.
Batch 2: `settings`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/ai-detection/history.md docs/user-guide-audit/ai-detection/repositories.md docs/user-guide-audit/ai-detection/risk-scoring.md docs/user-guide-audit/ai-detection/settings.md
git commit -m "docs(user-guide-audit): audit remaining ai-detection articles (4)"
```

- [ ] **Step 5: Dispatch verification subagent** with all 5 reports in collection.

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 8: Audit collection F — integrations (5 articles)

**Articles:** `integrations/api-access`, `integrations/automations`, `integrations/integration-overview`, `integrations/plugins`, `integrations/slack-integration`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/integrations
```

- [ ] **Step 2: Dispatch in 2 batches**:

Batch 1 (3): `api-access`, `automations`, `integration-overview`.
Batch 2 (2): `plugins`, `slack-integration`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/integrations/
git commit -m "docs(user-guide-audit): audit integrations collection (5 articles)"
```

- [ ] **Step 5: Dispatch verification subagent.**

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 9: Audit collection G — risk-management (5 articles)

**Articles:** `risk-management/quantitative-risk-assessment`, `risk-management/risk-assessment`, `risk-management/risk-mitigation`, `risk-management/vendor-management`, `risk-management/vendor-risks`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/risk-management
```

- [ ] **Step 2: Dispatch in 2 batches**:

Batch 1 (3): `quantitative-risk-assessment`, `risk-assessment`, `risk-mitigation`.
Batch 2 (2): `vendor-management`, `vendor-risks`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/risk-management/
git commit -m "docs(user-guide-audit): audit risk-management collection (5 articles)"
```

- [ ] **Step 5: Dispatch verification subagent.**

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 10: Audit collection H — settings (4 remaining)

**Articles:** `settings/notifications`, `settings/organization-settings`, `settings/super-admin`, `settings/user-management` (skip `role-configuration` — already audited).

- [ ] **Step 1:** Directory exists.

- [ ] **Step 2: Dispatch in 2 batches**:

Batch 1 (3): `notifications`, `organization-settings`, `super-admin`.
Batch 2 (1): `user-management`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/settings/notifications.md docs/user-guide-audit/settings/organization-settings.md docs/user-guide-audit/settings/super-admin.md docs/user-guide-audit/settings/user-management.md
git commit -m "docs(user-guide-audit): audit remaining settings articles (4)"
```

- [ ] **Step 5: Dispatch verification subagent** with all 5 reports.

- [ ] **Step 6: Per-collection summary** (5 articles total).

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 11: Audit collection I — shadow-ai (6 articles)

**Articles:** `shadow-ai/ai-tools`, `shadow-ai/insights`, `shadow-ai/integration-guide`, `shadow-ai/rules`, `shadow-ai/settings`, `shadow-ai/user-activity`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/shadow-ai
```

- [ ] **Step 2: Dispatch in 2 batches**:

Batch 1 (3): `ai-tools`, `insights`, `integration-guide`.
Batch 2 (3): `rules`, `settings`, `user-activity`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/shadow-ai/
git commit -m "docs(user-guide-audit): audit shadow-ai collection (6 articles)"
```

- [ ] **Step 5: Dispatch verification subagent.**

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 12: Audit collection J — compliance (7 remaining)

**Articles:** `compliance/assessments`, `compliance/ce-marking`, `compliance/fria`, `compliance/iso-27001`, `compliance/iso-42001`, `compliance/nist-ai-rmf`, `compliance/post-market-monitoring` (skip `eu-ai-act` — already audited).

- [ ] **Step 1:** Directory exists.

- [ ] **Step 2: Dispatch in 3 batches**:

Batch 1 (3): `assessments`, `ce-marking`, `fria`.
Batch 2 (3): `iso-27001`, `iso-42001`, `nist-ai-rmf`.
Batch 3 (1): `post-market-monitoring`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/compliance/assessments.md docs/user-guide-audit/compliance/ce-marking.md docs/user-guide-audit/compliance/fria.md docs/user-guide-audit/compliance/iso-27001.md docs/user-guide-audit/compliance/iso-42001.md docs/user-guide-audit/compliance/nist-ai-rmf.md docs/user-guide-audit/compliance/post-market-monitoring.md
git commit -m "docs(user-guide-audit): audit remaining compliance articles (7)"
```

- [ ] **Step 5: Dispatch verification subagent** with all 8 reports.

- [ ] **Step 6: Per-collection summary** (8 articles total).

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 13: Audit collection K — llm-evals (13 articles)

**Articles:** `llm-evals/bias-audits`, `llm-evals/ci-cd-integration`, `llm-evals/configuration`, `llm-evals/configuring-scorers`, `llm-evals/leaderboard`, `llm-evals/llm-arena`, `llm-evals/llm-evals-overview`, `llm-evals/managing-datasets`, `llm-evals/models`, `llm-evals/playground`, `llm-evals/reports`, `llm-evals/running-experiments`, `llm-evals/settings`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/llm-evals
```

- [ ] **Step 2: Dispatch in 5 batches** (13 articles, max 3 concurrent):

Batch 1 (3): `bias-audits`, `ci-cd-integration`, `configuration`.
Batch 2 (3): `configuring-scorers`, `leaderboard`, `llm-arena`.
Batch 3 (3): `llm-evals-overview`, `managing-datasets`, `models`.
Batch 4 (3): `playground`, `reports`, `running-experiments`.
Batch 5 (1): `settings`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/llm-evals/
git commit -m "docs(user-guide-audit): audit llm-evals collection (13 articles)"
```

- [ ] **Step 5: Dispatch verification subagent.**

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 14: Audit collection L — ai-governance (16 articles)

**Articles:** `ai-governance/agent-discovery`, `ai-governance/ai-trust-center`, `ai-governance/approval-workflows`, `ai-governance/datasets`, `ai-governance/entity-graph`, `ai-governance/evidence-collection`, `ai-governance/incident-management`, `ai-governance/intake-forms`, `ai-governance/linked-models`, `ai-governance/model-inventory`, `ai-governance/model-lifecycle`, `ai-governance/project-overview`, `ai-governance/share-links`, `ai-governance/task-management`, `ai-governance/use-cases`, `ai-governance/watchtower`

- [ ] **Step 1: Setup**

```bash
mkdir -p docs/user-guide-audit/ai-governance
```

- [ ] **Step 2: Dispatch in 6 batches** (16 articles, max 3 concurrent):

Batch 1 (3): `agent-discovery`, `ai-trust-center`, `approval-workflows`.
Batch 2 (3): `datasets`, `entity-graph`, `evidence-collection`.
Batch 3 (3): `incident-management`, `intake-forms`, `linked-models`.
Batch 4 (3): `model-inventory`, `model-lifecycle`, `project-overview`.
Batch 5 (3): `share-links`, `task-management`, `use-cases`.
Batch 6 (1): `watchtower`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/ai-governance/
git commit -m "docs(user-guide-audit): audit ai-governance collection (16 articles)"
```

- [ ] **Step 5: Dispatch verification subagent.**

- [ ] **Step 6: Per-collection summary.**

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 15: Audit collection M — ai-gateway (15 remaining + 1 re-audit)

**Articles:** `ai-gateway/analytics`, `ai-gateway/getting-started`, `ai-gateway/guardrails` (re-audit), `ai-gateway/logs`, `ai-gateway/mcp-agent-keys`, `ai-gateway/mcp-approvals`, `ai-gateway/mcp-audit`, `ai-gateway/mcp-guardrails`, `ai-gateway/mcp-overview`, `ai-gateway/mcp-servers`, `ai-gateway/mcp-tools`, `ai-gateway/models`, `ai-gateway/playground`, `ai-gateway/prompts`, `ai-gateway/settings`, `ai-gateway/virtual-keys` (skip `endpoints` — already audited and quality was good).

- [ ] **Step 1: Delete the v1 guardrails report**

```bash
rm docs/user-guide-audit/ai-gateway/guardrails.md
git add docs/user-guide-audit/ai-gateway/guardrails.md
git commit -m "docs(user-guide-audit): remove v1 guardrails report for re-audit

Phase 1 review found 3 weak verifications in this report. Re-audit
with v2 prompt as part of the ai-gateway collection."
```

- [ ] **Step 2: Dispatch in 6 batches** (16 articles to audit, max 3 concurrent):

Batch 1 (3): `analytics`, `getting-started`, `guardrails` (re-audit).
Batch 2 (3): `logs`, `mcp-agent-keys`, `mcp-approvals`.
Batch 3 (3): `mcp-audit`, `mcp-guardrails`, `mcp-overview`.
Batch 4 (3): `mcp-servers`, `mcp-tools`, `models`.
Batch 5 (3): `playground`, `prompts`, `settings`.
Batch 6 (1): `virtual-keys`.

- [ ] **Step 3: Verify reports.**

- [ ] **Step 4: Commit audits.**

```bash
git add docs/user-guide-audit/ai-gateway/
git commit -m "docs(user-guide-audit): audit ai-gateway collection (16 articles, incl. guardrails re-audit)"
```

- [ ] **Step 5: Dispatch verification subagent** with all 17 reports (16 new + existing `endpoints.md`).

- [ ] **Step 6: Per-collection summary** (17 articles total).

- [ ] **Step 7: Commit.**

- [ ] **Step 8: Review gate.**

---

## Task 16: Write the global summary

**Files:**
- Create: `docs/user-guide-audit/_summary.md`

- [ ] **Step 1: Aggregate all 91 article reports**

Read each `docs/user-guide-audit/<collection>/<article>.md`. Extract: collection, article, verdict, finding count by status, browser-escalation yes/no.

- [ ] **Step 2: Write the global summary**

Create `docs/user-guide-audit/_summary.md` with this structure:

```markdown
# User guide audit — global summary

**Date:** <YYYY-MM-DD>
**Articles audited:** 91
**Phase 1:** 6 articles (calibration sample, Phase 1 reports retained except `ai-gateway/guardrails` re-audited in Phase 2)
**Phase 2:** 86 articles (85 new + 1 re-audit)

## Articles by severity

Sorted by severity (❌ first, then ⚠️, then ❓, then ✅).

| Article | Collection | Verdict | ❌ | ⚠️ | ❓ | Browser? |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |

## Findings by type

| Type | ❌ | ⚠️ | ❓ | Total |
|---|---|---|---|---|
| UI | ... | ... | ... | ... |
| Behavior | ... | ... | ... | ... |
| Quantitative | ... | ... | ... | ... |
| Reference | ... | ... | ... | ... |
| Cross-doc | ... | ... | ... | ... |
| Compliance | ... | ... | ... | ... |
| Negative | ... | ... | ... | ... |
| Example | ... | ... | ... | ... |

## Verification subagent results

| Collection | Reports spot-checked | Failed spot-checks | Notes |
|---|---|---|---|
| ... | ... | ... | ... |

## Recommended next steps

<one paragraph: where to focus the fix pass; any patterns of drift; whether to also surface PRODUCT findings as a separate stream>
```

- [ ] **Step 3: Verify**

Run: `wc -l docs/user-guide-audit/_summary.md && grep -c "^|" docs/user-guide-audit/_summary.md`
Expected: substantive (~150+ lines), at least 91 article rows + headers.

- [ ] **Step 4: Commit**

```bash
git add docs/user-guide-audit/_summary.md
git commit -m "docs(user-guide-audit): global summary of all 91 articles

Sorted by severity. Surfaces drift patterns by claim type and
flags collections that need fix-pass attention first."
```

---

## Task 17: Phase 2 close-out

**Files:** none (this is a hand-off).

- [ ] **Step 1: Present results to user**

Single message with:
- Path to global summary
- Top-line numbers (total articles, total findings, breakdown by severity)
- Number of failed spot-checks across all collections
- Two next-step options:
  1. **Move to Phase 3 (fix pass).** User annotates each report with FIX/SKIP/PRODUCT, auditor applies edits per spec.
  2. **Pause and review at leisure.** Plan stops here.

- [ ] **Step 2: Wait for user decision.**

If Phase 3, write a Phase 3 plan (separate file). If pause, do nothing further on this branch.

---

## Self-review (run before handing off to execution)

This plan was self-reviewed against the spec on 2026-04-29:

**Spec coverage check:**
- Spec Phase 2 "remaining ~85 articles, collection by collection" → Tasks 3-15 cover all 13 collections ✅
- Spec "user reviews each collection's reports before next collection starts" → review gate in every task Step 8 ✅
- Spec "one findings report per article at `docs/user-guide-audit/<collection>/<article>.md`" → exact path used in every dispatch ✅
- Spec "per-collection summary at `docs/user-guide-audit/<collection>/_summary.md`" → Step 6 in every task ✅
- Spec "global summary at `docs/user-guide-audit/_summary.md`, sorted by severity" → Task 16 ✅
- Calibration memo's 5 prompt tweaks → all five present in v2 prompt (Task 1) ✅
- Calibration memo's verification subagent → Task 2 + dispatched in every task Step 5 ✅
- Calibration memo's smallest-first ordering → Tasks 3-15 ordered by article count ✅
- User's open-question answers (re-audit guardrails, add verification subagent, smallest-first) → all three implemented ✅

**Out of scope per spec, confirmed not in this plan:**
- Phase 3 fix pass — Task 17 hands off; no fixes applied in Phase 2.
- PR creation — explicitly forbidden without user approval per CLAUDE.md.

**Type/name consistency check:**
- All article paths use `shared/user-guide-content/content/<collection>/<article>.ts` consistently
- All report paths use `docs/user-guide-audit/<collection>/<article>.md` consistently
- Substitution tokens `<COLLECTION>`, `<ARTICLE>`, `<REPORT_PATH>`, `<REPORT_LIST>` match between v2 prompt and verification prompt
- Article counts match `find` output: 1+2+4+4+5+5+5+5+6+8+13+16+17 = 91 total; minus 6 already audited = 85 + 1 re-audit = 86 audit runs in Phase 2 ✓

**Placeholder scan:**
- No "TBD" / "TODO" / "fill in details" in execution steps
- Angle-bracket placeholders in templates (`<verdict>`, `<n>`, `<one paragraph>`) are runtime substitutions, not unresolved plan content

**Concurrency check:**
- Every batch keeps to ≤3 concurrent subagents per the user's stated preference
- Batches always complete before the next batch starts (sequential between batches, parallel within)
