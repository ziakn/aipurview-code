# User guide audit — Phase 1 (calibration sample) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit 6 deliberately-diverse user guide articles to validate the truthfulness-audit method before scaling to all 91. Produce 6 findings reports plus a calibration memo that decides whether to proceed to Phase 2.

**Architecture:** No code changes. The "implementation" is a sequence of audits, each producing a markdown findings report following the strict template from the spec. One Explore subagent per article, dispatched from the main thread with a standardized prompt. Reports land under `docs/user-guide-audit/`. After all 6 reports exist, the main thread writes a calibration memo aggregating cost, quality signals, and a go/no-go recommendation.

**Tech Stack:** Markdown reports only. Tooling: Explore subagent (for code-side claim verification), Playwright MCP (for browser verification when escalated), grep/Read (for file-existence checks), git log (for cross-reference checks).

**Reference spec:** `docs/superpowers/specs/2026-04-29-user-guide-truthfulness-audit-design.md`

---

## File structure

Files created during this phase, all under `docs/user-guide-audit/`:

```
docs/user-guide-audit/
  ai-gateway/
    guardrails.md          # Task 2 output
    endpoints.md           # Task 3 output
  getting-started/
    quick-start.md         # Task 4 output
  compliance/
    eu-ai-act.md           # Task 5 output
  ai-detection/
    scanning.md            # Task 6 output
  settings/
    role-configuration.md  # Task 7 output
  _calibration.md          # Task 8 output
  _subagent-prompt.md      # Task 1 output (the reusable prompt template)
```

No source code is touched. No tests are added (this is an audit, not a feature). The "verification" is a checklist run by the human at the Phase 1 review gate (Task 9).

---

## Task 1: Write the reusable subagent prompt template

**Why first:** every audit task in this plan dispatches an Explore subagent with the same prompt. Defining it once prevents drift between tasks 2-7 and lets the calibration memo (Task 8) say "the prompt was identical for all 6 articles" — a precondition for treating cost/quality numbers as comparable.

**Files:**
- Create: `docs/user-guide-audit/_subagent-prompt.md`

- [ ] **Step 1: Create the directory and prompt file**

```bash
mkdir -p docs/user-guide-audit
```

Create `docs/user-guide-audit/_subagent-prompt.md` with the exact content below. This is the prompt template; tasks 2-7 substitute `<COLLECTION>`, `<ARTICLE>`, and `<REPORT_PATH>` before dispatching.

````markdown
# Audit subagent prompt template

Substitute `<COLLECTION>`, `<ARTICLE>`, and `<REPORT_PATH>` before dispatching. The full prompt is everything below the `---` line.

---

You are auditing one VerifyWise user guide article for truthfulness against the codebase. You will write exactly one markdown findings report and return its path. Do not edit the article. Do not edit any code.

## Inputs

- **Article to audit:** `shared/user-guide-content/content/<COLLECTION>/<ARTICLE>.ts`
- **Report to write:** `<REPORT_PATH>`
- **Spec for context (read first, do not re-read after):** `docs/superpowers/specs/2026-04-29-user-guide-truthfulness-audit-design.md`

## Process (do these in order, do not skip)

1. **Read the article.** Open it with the Read tool. Note that articles are TypeScript files exporting an `ArticleContent` object with a `blocks` array. Each block has an index (0-based) — you'll cite block indexes in findings.

2. **Read the spec's "Audit method" and "Claim taxonomy" sections** to refresh the rules. After this, do not re-read the spec — the rules below are sufficient.

3. **Extract every verifiable claim.** A claim is anything specific: button label, field name, menu path, expected outcome, default value, permission requirement, API behavior, regulatory mapping, cross-doc reference, example value in a table. Skip pure opinion/motivation framing.

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
   - **Quantitative:** find the constant / enum / regex / config in code. Cite it.
   - **Reference:** confirm file/endpoint/link exists. For external links, do not fetch — note "external link, not fetched".
   - **Cross-doc:** confirm the referenced `shared/user-guide-content/content/<otherCollection>/<otherSlug>.ts` exists AND its content matches the description in the link block.
   - **Compliance:** mark **low-confidence by default**. Only mark ✅ if there's an explicit code linkage (e.g., a constant tagged `EU_AI_ACT_ART_9` or a comment in the implementing file). Otherwise flag as a finding with status ⚠️ and note "aspirational mapping — no code linkage found".
   - **Negative:** require a code-path trace. Do not mark ✅ on a negative claim with weak evidence. If you cannot trace the absence, mark ❓ unverifiable, not ✅.
   - **Example:** verify the example actually works (e.g., does the regex match it; does the recognizer accept this format).

6. **Cluster check.** When you find a discrepancy, scan adjacent claims in the same article — drift clusters. If feature X was renamed, multiple blocks may reference the old name.

7. **Browser escalation.** Only if a claim involves rendered output that cannot be inferred from code (chart shape, toast position, conditional UI gated on data state, multi-step wizard rendering). Do not run the browser unless escalation is genuinely needed; the parent thread is tracking time and tokens. If you escalate, save screenshots to `docs/user-guide-audit/<COLLECTION>/_screenshots/<ARTICLE>-<n>.png` and cite them in evidence. Local dev creds are in the parent's memory: email `gorkem.cetin@verifywise.ai`, password `Verifywise#1`. Use `/run-verifywise` workflow.

8. **Write the findings report** to `<REPORT_PATH>` using exactly the template below. Do not deviate from the template — the parent thread aggregates these reports by parsing them.

## Findings report template (copy this structure exactly)

```markdown
# Audit: <COLLECTION>/<ARTICLE>
**Article path:** shared/user-guide-content/content/<COLLECTION>/<ARTICLE>.ts
**Audited:** <YYYY-MM-DD>
**Auditor:** Explore subagent
**Verdict:** ✅ clean | ⚠️ minor issues (N) | ❌ significant issues (N)

## Summary
<2-3 sentences describing the article's overall state>

## Findings
### Finding 1 — <one-line title>
- **Type:** UI | Behavior | Quantitative | Reference | Cross-doc | Compliance | Negative | Example
- **Status:** ❌ wrong | ⚠️ partial | ❓ unverifiable
- **Doc says:** "<exact quote>" (block index N)
- **Reality:** <what the code/UI actually shows>
- **Evidence:** `path/to/file.tsx:123` (or screenshot path, or "no match found in Clients/src/")
- **Suggested fix:** <one sentence>
- **Confidence:** high | medium | low

### Finding 2 — ...

## Verified claims (sampled)
- Claim: "<quote>" (block N) — verified at `path:line`
- Claim: "<quote>" (block N) — verified at `path:line`
- Claim: "<quote>" (block N) — verified at `path:line`
(3-5 entries minimum — required as proof-of-work)

## Skipped / non-verifiable
- "<quote>" (block N) — reason: <opinion/motivation/external link/etc>
```

## Constraints (hard rules)

- **Do not edit the article or any source code.** This is an audit, not a fix pass.
- **Do not mark ✅ on negative claims with weak evidence.** Use ❓ if you can't trace the absence.
- **Do not mark ✅ on compliance claims without explicit code linkage.** Default is ⚠️ "aspirational mapping".
- **Verified claims section is mandatory.** 3-5 entries minimum, even if there are zero findings — this is proof you actually verified, not just skimmed.
- **Cite block indexes** in "Doc says" so the fix pass can target the exact block.
- **Stay within the article.** Don't audit other articles even if they look related — that's a separate task.

## Output

Return: the path to the report you wrote, plus a one-line summary like "Wrote `<REPORT_PATH>` — verdict: ❌ significant issues (5)". Nothing else. The parent thread reads the report directly.
````

- [ ] **Step 2: Verify the file exists and is readable**

Run: `ls -la docs/user-guide-audit/_subagent-prompt.md && wc -l docs/user-guide-audit/_subagent-prompt.md`
Expected: file exists, ~80-100 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/user-guide-audit/_subagent-prompt.md
git commit -m "docs(user-guide-audit): add reusable subagent prompt template

Defines the audit prompt used identically across all 6 calibration
articles, so quality and cost numbers are comparable in the
calibration memo."
```

---

## Task 2: Audit ai-gateway/guardrails.ts

**Files:**
- Create: `docs/user-guide-audit/ai-gateway/guardrails.md`

- [ ] **Step 1: Create collection directory**

```bash
mkdir -p docs/user-guide-audit/ai-gateway
```

- [ ] **Step 2: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. The prompt is the content of `docs/user-guide-audit/_subagent-prompt.md` from the `---` line onward, with these substitutions:

- `<COLLECTION>` → `ai-gateway`
- `<ARTICLE>` → `guardrails`
- `<REPORT_PATH>` → `docs/user-guide-audit/ai-gateway/guardrails.md`

Description for the Agent call: `"Audit guardrails article"`.

- [ ] **Step 3: Verify the report exists and follows the template**

Run: `ls docs/user-guide-audit/ai-gateway/guardrails.md && head -20 docs/user-guide-audit/ai-gateway/guardrails.md`
Expected: file exists; first 20 lines match the template (title, audited date, verdict, summary heading).

Inspect manually that the report has:
- A `## Findings` section (may be empty if verdict is ✅ clean)
- A `## Verified claims (sampled)` section with at least 3 entries
- A `## Skipped / non-verifiable` section

If the report is missing any of these or doesn't follow the template, re-dispatch the subagent with a corrective note: `"Your previous report at <path> did not follow the template. The template is non-negotiable. Re-read _subagent-prompt.md and produce a compliant report."`

- [ ] **Step 4: Record cost metrics**

Note in scratch (you'll use this in Task 8): subagent wall-clock time, approximate token usage if available, whether browser was escalated, finding count. Just keep these in your context — Task 8 aggregates them.

- [ ] **Step 5: Commit**

```bash
git add docs/user-guide-audit/ai-gateway/guardrails.md
git commit -m "docs(user-guide-audit): audit ai-gateway/guardrails

Calibration sample article 1 of 6."
```

---

## Task 3: Audit ai-gateway/endpoints.ts

**Files:**
- Create: `docs/user-guide-audit/ai-gateway/endpoints.md`

- [ ] **Step 1: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. Prompt: content of `docs/user-guide-audit/_subagent-prompt.md` from the `---` line, with:

- `<COLLECTION>` → `ai-gateway`
- `<ARTICLE>` → `endpoints`
- `<REPORT_PATH>` → `docs/user-guide-audit/ai-gateway/endpoints.md`

Description: `"Audit endpoints article"`.

- [ ] **Step 2: Verify the report**

Run: `ls docs/user-guide-audit/ai-gateway/endpoints.md && head -20 docs/user-guide-audit/ai-gateway/endpoints.md`
Expected: file exists; template-compliant.

If template violations, re-dispatch with the corrective prompt from Task 2 Step 3.

- [ ] **Step 3: Record cost metrics** (same as Task 2 Step 4).

- [ ] **Step 4: Commit**

```bash
git add docs/user-guide-audit/ai-gateway/endpoints.md
git commit -m "docs(user-guide-audit): audit ai-gateway/endpoints

Calibration sample article 2 of 6."
```

---

## Task 4: Audit getting-started/quick-start.ts

**Files:**
- Create: `docs/user-guide-audit/getting-started/quick-start.md`

- [ ] **Step 1: Create collection directory**

```bash
mkdir -p docs/user-guide-audit/getting-started
```

- [ ] **Step 2: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. Prompt with:

- `<COLLECTION>` → `getting-started`
- `<ARTICLE>` → `quick-start`
- `<REPORT_PATH>` → `docs/user-guide-audit/getting-started/quick-start.md`

Description: `"Audit quick-start article"`.

- [ ] **Step 3: Verify the report** (same checks as Task 2 Step 3).

- [ ] **Step 4: Record cost metrics**.

- [ ] **Step 5: Commit**

```bash
git add docs/user-guide-audit/getting-started/quick-start.md
git commit -m "docs(user-guide-audit): audit getting-started/quick-start

Calibration sample article 3 of 6."
```

---

## Task 5: Audit compliance/eu-ai-act.ts

**Files:**
- Create: `docs/user-guide-audit/compliance/eu-ai-act.md`

- [ ] **Step 1: Create collection directory**

```bash
mkdir -p docs/user-guide-audit/compliance
```

- [ ] **Step 2: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. Prompt with:

- `<COLLECTION>` → `compliance`
- `<ARTICLE>` → `eu-ai-act`
- `<REPORT_PATH>` → `docs/user-guide-audit/compliance/eu-ai-act.md`

Description: `"Audit eu-ai-act article"`.

This article is expected to be compliance-claim heavy. Watch in Step 3 that the subagent applied the **low-confidence-by-default** rule for compliance claims (most should be ⚠️ or ❓, not ✅, unless explicit code linkage exists).

- [ ] **Step 3: Verify the report** (same checks as Task 2 Step 3, plus the compliance-confidence check above).

- [ ] **Step 4: Record cost metrics**.

- [ ] **Step 5: Commit**

```bash
git add docs/user-guide-audit/compliance/eu-ai-act.md
git commit -m "docs(user-guide-audit): audit compliance/eu-ai-act

Calibration sample article 4 of 6."
```

---

## Task 6: Audit ai-detection/scanning.ts

**Files:**
- Create: `docs/user-guide-audit/ai-detection/scanning.md`

- [ ] **Step 1: Create collection directory**

```bash
mkdir -p docs/user-guide-audit/ai-detection
```

- [ ] **Step 2: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. Prompt with:

- `<COLLECTION>` → `ai-detection`
- `<ARTICLE>` → `scanning`
- `<REPORT_PATH>` → `docs/user-guide-audit/ai-detection/scanning.md`

Description: `"Audit ai-detection scanning article"`.

This is the highest-churn article in the sample (6 commits in 3 months) — drift is likely. Expect more findings here than in stable articles.

- [ ] **Step 3: Verify the report** (same checks as Task 2 Step 3).

- [ ] **Step 4: Record cost metrics**.

- [ ] **Step 5: Commit**

```bash
git add docs/user-guide-audit/ai-detection/scanning.md
git commit -m "docs(user-guide-audit): audit ai-detection/scanning

Calibration sample article 5 of 6."
```

---

## Task 7: Audit settings/role-configuration.ts

**Files:**
- Create: `docs/user-guide-audit/settings/role-configuration.md`

- [ ] **Step 1: Create collection directory**

```bash
mkdir -p docs/user-guide-audit/settings
```

- [ ] **Step 2: Dispatch the audit subagent**

Use the Agent tool with `subagent_type: "Explore"`. Prompt with:

- `<COLLECTION>` → `settings`
- `<ARTICLE>` → `role-configuration`
- `<REPORT_PATH>` → `docs/user-guide-audit/settings/role-configuration.md`

Description: `"Audit role-configuration article"`.

This is the low-churn baseline. If this article also has many findings, that's a strong signal that drift is system-wide and not concentrated in churned modules — the calibration memo should highlight this.

- [ ] **Step 3: Verify the report** (same checks as Task 2 Step 3).

- [ ] **Step 4: Record cost metrics**.

- [ ] **Step 5: Commit**

```bash
git add docs/user-guide-audit/settings/role-configuration.md
git commit -m "docs(user-guide-audit): audit settings/role-configuration

Calibration sample article 6 of 6."
```

---

## Task 8: Write the calibration memo

**Files:**
- Create: `docs/user-guide-audit/_calibration.md`

- [ ] **Step 1: Read all 6 reports**

Use Read to load each of:
- `docs/user-guide-audit/ai-gateway/guardrails.md`
- `docs/user-guide-audit/ai-gateway/endpoints.md`
- `docs/user-guide-audit/getting-started/quick-start.md`
- `docs/user-guide-audit/compliance/eu-ai-act.md`
- `docs/user-guide-audit/ai-detection/scanning.md`
- `docs/user-guide-audit/settings/role-configuration.md`

For each, extract: verdict, finding count by status (❌/⚠️/❓), finding count by type, browser-escalation yes/no, time/tokens recorded in Tasks 2-7.

- [ ] **Step 2: Write the calibration memo**

Create `docs/user-guide-audit/_calibration.md` with this structure (fill in real numbers from Step 1):

```markdown
# Calibration memo — Phase 1 results

**Date:** <YYYY-MM-DD>
**Spec:** docs/superpowers/specs/2026-04-29-user-guide-truthfulness-audit-design.md
**Plan:** docs/superpowers/plans/2026-04-29-user-guide-audit-phase1-calibration.md

## Sample summary

| # | Collection | Article | Verdict | ❌ | ⚠️ | ❓ | Browser? | Time | Tokens (approx) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ai-gateway | guardrails | <verdict> | <n> | <n> | <n> | yes/no | <m> | <k> |
| ... |

**Totals:** <X> findings across <Y> articles. <Z>% of articles required browser escalation.

## Method evaluation

### Did the report template capture what we needed?
<honest assessment — did any finding feel awkward to express in the template? Did the template force useful structure or fight against it?>

### Were claim types over- or under-flagged?
<break down by type — were UI claims caught reliably; were compliance claims correctly defaulted to low-confidence; did negative claims get the right scrutiny>

### Was browser escalation calibrated?
<too eager? too reluctant? for which articles? was the escalation actually necessary or could code grep have answered it?>

### Did the cluster check pay off?
<for articles with findings, did the subagent find related drift in adjacent blocks, or did findings come up isolated?>

### Cost feasibility for full rollout
<extrapolate sample numbers to 91 articles. Time, tokens, calendar time. Is this feasible? What's the bottleneck?>

## Quality concerns

<any signals that subagents are waving claims through, or producing false-positive findings, or missing types of claims; concrete examples from the reports>

## Recommendation

One of:
- **Proceed to Phase 2 as-is.** Reasoning: ...
- **Tweak the method, then re-sample.** Specific tweaks: ... Re-sample size: ...
- **Tweak the method, proceed to Phase 2 without re-sampling.** Specific tweaks: ... Why re-sample isn't needed: ...
- **Abort.** Reasoning: ...

## Open questions for the user

<anything that needs a human decision before Phase 2 — e.g., "Is it acceptable that compliance articles produce mostly ⚠️ findings, given the low-confidence-by-default rule?" or "Should we audit Spanish/German translations separately?">
```

- [ ] **Step 3: Verify the memo is complete**

Run: `wc -l docs/user-guide-audit/_calibration.md && grep -c "^##" docs/user-guide-audit/_calibration.md`
Expected: substantive memo (>50 lines), at least 5 `##` sections.

Visually check that no section is empty or contains placeholder text.

- [ ] **Step 4: Commit**

```bash
git add docs/user-guide-audit/_calibration.md
git commit -m "docs(user-guide-audit): Phase 1 calibration memo

Aggregates findings from 6-article calibration sample. Recommends
whether to proceed to Phase 2 (full audit) as-is, with tweaks, or
abort. User reviews this before any further audit work."
```

---

## Task 9: Phase 1 review gate (human)

**Files:** none (this is a hand-off, not a code step)

This task is not executed by the agent. After Task 8, present the user with:

- The 6 findings reports (paths)
- The calibration memo (path)
- The recommendation from the memo
- A direct ask: "Proceed to Phase 2 as-is, tweak and re-sample, tweak and proceed, or abort?"

Wait for user decision. Do not start Phase 2 without explicit approval. Do not open a PR for the audit reports without explicit approval (per CLAUDE.md PR rule).

- [ ] **Step 1: Present the artifacts to the user**

Single message with:
- Bullet list of the 6 report paths with their verdicts
- Path to the calibration memo
- Quote the memo's "Recommendation" section verbatim
- Ask the four-option question above

- [ ] **Step 2: Wait for user decision**

Do not proceed. Do not infer. The user explicitly chooses one of the four options.

- [ ] **Step 3: Record the decision**

If the user approves any path forward, append to the calibration memo a section:

```markdown
## Phase 1 outcome (<YYYY-MM-DD>)

User decision: <one of the four options, plus any tweaks they specified>
Next action: <write Phase 2 plan / re-sample / nothing>
```

Commit this addendum:

```bash
git add docs/user-guide-audit/_calibration.md
git commit -m "docs(user-guide-audit): record Phase 1 review outcome"
```

---

## Self-review (run before handing off to execution)

This plan was self-reviewed against the spec on 2026-04-29:

**Spec coverage check:**
- Spec Phase 1 calibration sample (6 articles) → Tasks 2-7 (one per article) ✅
- Spec sample selection criteria (content shape, code stack, volatility) → finalized in plan header (articles 4-6 chosen by git churn) ✅
- Spec "audit method per article" (read → classify → verify → escalate → write findings → cluster check) → embedded in `_subagent-prompt.md` (Task 1) ✅
- Spec claim taxonomy (9 types) → embedded in subagent prompt ✅
- Spec findings report template → embedded in subagent prompt and verified per task ✅
- Spec calibration memo (template captures, type calibration, browser, cost feasibility) → Task 8 step 2 includes all four sections ✅
- Spec Phase 1 review gate (4 options: proceed / tweak-resample / tweak-proceed / abort) → Task 9 ✅

**Out of scope per spec, confirmed not in this plan:**
- Phase 2 full audit — explicitly deferred to a follow-up plan after the review gate
- Phase 3 fix pass — same
- PR creation — explicitly forbidden without user approval per CLAUDE.md

**Type/name consistency check:**
- All report paths use the form `docs/user-guide-audit/<collection>/<article>.md` consistently
- Calibration memo path is `_calibration.md` everywhere it's referenced
- Subagent prompt path is `_subagent-prompt.md` everywhere
- Substitution token names (`<COLLECTION>`, `<ARTICLE>`, `<REPORT_PATH>`) match between Task 1 (definition) and Tasks 2-7 (usage)

**Placeholder scan:**
- No "TBD" / "TODO" / "fill in details" in execution steps
- The calibration memo template has angle-bracket placeholders that are *meant* to be filled at runtime (verdict, finding counts, cost numbers) — these are substitutions, not unresolved plan content
