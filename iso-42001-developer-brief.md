# ISO 42001 — Developer Brief

> **Date:** 2026-04-16
> **Goal:** Make VerifyWise's ISO 42001 clause tracker and annex controls comprehensive, correctly worded, and aligned with the standard's actual structure.
> **Scope:** Only ISO 42001 structure files in `Servers/structures/ISO-42001/`. Nothing else.

---

## The +3 numbering convention

VW renumbers Annex A controls with a +3 offset from ISO 42001:

| ISO 42001 | VW internal | Topic |
|-----------|-------------|-------|
| A.2 | A.5 | AI policies |
| A.3 | A.6 | Internal organization |
| A.4 | A.7 | Resources for AI systems |
| A.5 | A.8 | AI system lifecycle |
| A.6 | A.9 | Data for AI systems |
| A.7 | A.10 | ICT |
| A.8 | A.11 | Third-party relationships |
| A.9 | **A.12** | Interested parties (missing) |
| A.10 | **A.13** | Use of AI systems (missing) |

New files must follow this convention. ISO A.9 becomes VW A.12, ISO A.10 becomes VW A.13.

---

## Current state summary

### Clauses (7 files, 24 subclauses)

| Clause | Subclauses in VW | Notes |
|--------|-----------------|-------|
| 4 — Context of the organization | 4 (4.1-4.4) | Complete |
| 5 — Leadership | 3 (5.1-5.3) | Complete |
| 6 — Planning | 2 (6.1, 6.2) | 6.1 merges 6.1.1-6.1.4 into one item. **6.3 missing entirely.** |
| 7 — Support | 5 (7.1-7.5) | Complete |
| 8 — Operation | 5 (8.1-8.5) | **8.5 "Third-party relationships" does not exist in ISO 42001 clause 8.** |
| 9 — Performance evaluation | 3 (9.1-9.3) | Complete |
| 10 — Improvement | 2 (10.1-10.2) | Complete |

### Annex (7 files, 37 sub-controls)

| VW # | ISO # | Sub-controls | Notes |
|-------|-------|-------------|-------|
| A.5 | A.2 | 8 | Complete. Contains some items from A.3 (roles/segregation). |
| A.6 | A.3 | 2 | Complete |
| A.7 | A.4 | 5 | Complete |
| A.8 | A.5 | 9 | Complete |
| A.9 | A.6 | 6 | **Missing A.6.2.4-A.6.2.8** (5 sub-controls for labeling, bias, retention, deletion, transfer) |
| A.10 | A.7 | 4 | Complete |
| A.11 | A.8 | 3 | Complete |
| A.12 | A.9 | — | **Entirely missing** |
| A.13 | A.10 | — | **Entirely missing** |

### Format reference

**Clause subclause files** use: `title`, `order_no`, `summary`, `questions` (string[]), `evidence_examples` (string[]), `implementation_description`, `auditor_feedback`.

**Annex category files** use: `sub_id` (number like 1.1), `order_no`, `title`, `description`, `guidance`, `is_applicable` (boolean), `implementation_description`, `auditor_feedback`. When `is_applicable` is false, includes `justification_for_exclusion`.

---

## Structural issue: clause 8.5

VW has a clause 8.5 "Third-party relationships" under Operation. ISO 42001 clause 8 only goes to 8.4 (AI system lifecycle). Third-party relationships belong exclusively in Annex A.8 (VW A.11).

**Action:** Remove order_no 5 from `08-operation.subclause.ts`. The content is already covered by `11-third-party-relationships.annexcategory.ts`.

---

## Missing items — complete TS content

### 1. Clause 6.1 — split into 6.1.1 through 6.1.4

Replace the single merged item (order_no 1) in `06-planning.subclause.ts` with four separate items:

```typescript
{
  title: "General — actions to address risks and opportunities",
  order_no: 1,
  summary:
    "When planning for the AIMS, consider the issues from 4.1, requirements from 4.2, and determine risks and opportunities that need to be addressed to ensure the AIMS can achieve its intended outcomes, prevent or reduce undesired effects, and achieve continual improvement.",
  questions: [
    "Have we identified risks and opportunities considering the context (4.1) and interested parties (4.2)?",
    "Do our planned actions integrate into AIMS processes?",
    "How do we evaluate the effectiveness of these actions?",
  ],
  evidence_examples: [
    "Risk and opportunity register linked to context analysis",
    "Planning records showing integration into AIMS processes",
    "Effectiveness evaluation records",
  ],
  implementation_description:
    "The organization maintains a risk and opportunity register derived from context analysis and stakeholder requirements, with planned actions integrated into AIMS processes.",
  auditor_feedback:
    "Linkage between context analysis and risk register is clear. Ensure effectiveness evaluations are documented at each review cycle.",
},
{
  title: "AI risk assessment",
  order_no: 2,
  summary:
    "Define and apply an AI risk assessment process that establishes risk criteria, identifies risks to individuals, groups, and societies from AI systems, analyzes and evaluates those risks, and selects treatment options.",
  questions: [
    "Is there a documented AI risk assessment methodology with defined risk criteria?",
    "Are risks to individuals, groups, and societies from AI systems systematically identified?",
    "How are identified risks analyzed (likelihood, severity, affected parties)?",
    "How are risks evaluated against acceptance criteria?",
  ],
  evidence_examples: [
    "AI risk assessment methodology document",
    "Risk criteria definitions (likelihood scales, impact scales, acceptance thresholds)",
    "AI risk assessment reports per system",
    "Risk register with analysis and evaluation results",
  ],
  implementation_description:
    "A documented AI risk assessment methodology defines criteria for likelihood and impact. Risks are identified per AI system, analyzed against defined scales, and evaluated against acceptance thresholds.",
  auditor_feedback:
    "Risk assessment methodology is sound. Ensure risk criteria explicitly address societal-level impacts alongside individual impacts.",
},
{
  title: "AI risk treatment",
  order_no: 3,
  summary:
    "Define and apply an AI risk treatment process to select appropriate treatment options, determine controls (referencing Annex A), produce a Statement of Applicability, and formulate a risk treatment plan.",
  questions: [
    "How are risk treatment options selected for each identified AI risk?",
    "Is there a Statement of Applicability (SoA) documenting which Annex A controls apply and which are excluded with justification?",
    "Is there a documented risk treatment plan with owners, timelines, and resources?",
    "Have risk owners approved the risk treatment plan and accepted residual risks?",
  ],
  evidence_examples: [
    "AI risk treatment plan",
    "Statement of Applicability (SoA)",
    "Risk owner approval records",
    "Residual risk acceptance documentation",
  ],
  implementation_description:
    "Risk treatment options are selected per risk. A Statement of Applicability maps all Annex A controls with inclusion/exclusion justifications. The treatment plan is approved by risk owners.",
  auditor_feedback:
    "SoA is maintained. Verify that residual risk acceptance is formally documented for each treated risk.",
},
{
  title: "AI system impact assessment",
  order_no: 4,
  summary:
    "Define and apply an AI system impact assessment process to assess potential consequences — positive and negative — of AI systems on individuals, groups, and societies, considering the AI system lifecycle.",
  questions: [
    "Is there a documented impact assessment methodology for AI systems?",
    "Are both positive and negative impacts on individuals, groups, and societies assessed?",
    "At which lifecycle stages are impact assessments conducted or updated?",
    "How are impact assessment results fed into risk treatment and system design decisions?",
  ],
  evidence_examples: [
    "AI impact assessment methodology",
    "Completed impact assessment reports per AI system",
    "Records linking impact findings to design or treatment decisions",
  ],
  implementation_description:
    "Impact assessments are conducted before deployment and updated at major lifecycle changes. Results feed directly into the risk treatment plan and system design reviews.",
  auditor_feedback:
    "Impact assessments cover both positive and negative outcomes. Recommend strengthening the link between impact findings and control selection.",
},
```

Keep the existing order_no 2 item ("AI objectives and planning to achieve them") but renumber it to order_no 5.

### 2. Clause 6.3 — Planning of changes (new)

Add as order_no 6 in `06-planning.subclause.ts`:

```typescript
{
  title: "Planning of changes",
  order_no: 6,
  summary:
    "When the organization determines the need for changes to the AIMS, the changes shall be carried out in a planned manner.",
  questions: [
    "Is there a defined process for planning changes to the AIMS?",
    "Are changes assessed for their impact on AIMS integrity, AI risk assessments, and the Statement of Applicability before implementation?",
    "Are responsibilities, timelines, and resources for changes documented?",
  ],
  evidence_examples: [
    "Change management procedure for the AIMS",
    "Change request and impact assessment records",
    "Approval records for AIMS changes",
    "Post-change review records",
  ],
  implementation_description:
    "Changes to the AIMS are managed through a formal change control process that assesses impact on existing risk assessments, controls, and the SoA before approval.",
  auditor_feedback:
    "Change management process exists. Ensure post-change reviews verify that AIMS integrity is maintained.",
},
```

### 3. Annex A.12 — Interested parties (ISO A.9)

Create new file `12-interested-parties.annexcategory.ts`:

```typescript
import { AnnexCategoryISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";

export const InterestedParties: Partial<
  AnnexCategoryStructISO & AnnexCategoryISO
>[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Notification to interested parties",
    description:
      "Notifying affected individuals and relevant parties about AI system use and its potential impacts.",
    guidance:
      "The organization should establish processes for notifying interested parties about AI system deployment, its purpose, and potential impacts on them, in accordance with applicable legal, regulatory, and contractual requirements.",
    is_applicable: true,
    implementation_description:
      "Notification processes are in place to inform affected parties about AI system deployment and impacts.",
    auditor_feedback:
      "Notification mechanisms exist. Verify coverage across all deployed AI systems.",
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Communication with interested parties",
    description:
      "Establishing effective communication channels with interested parties regarding AI systems.",
    guidance:
      "The organization should establish and maintain communication channels that allow interested parties to raise questions, provide feedback, and receive information about the organization's AI systems and their governance.",
    is_applicable: true,
    implementation_description:
      "Communication channels (helpdesk, public disclosure, feedback forms) enable interested party engagement on AI topics.",
    auditor_feedback:
      "Communication channels are defined. Ensure responsiveness is measured and reported.",
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Addressing interested parties' concerns",
    description:
      "Processes for receiving, evaluating, and responding to concerns raised by interested parties about AI systems.",
    guidance:
      "The organization should establish processes for receiving, recording, evaluating, and responding to concerns raised by interested parties regarding the development, deployment, or operation of AI systems, including mechanisms for escalation and resolution.",
    is_applicable: true,
    implementation_description:
      "A formal process for receiving, tracking, and resolving concerns about AI systems from interested parties is operational.",
    auditor_feedback:
      "Concern resolution process exists. Recommend tracking resolution times and satisfaction outcomes.",
  },
];
```

Register in `annex.struct.ts`:

```typescript
{
  title: "A.12 Interested parties",
  annex_no: 12,
  annexcategories: InterestedParties,
},
```

### 4. Annex A.13 — Use of AI systems (ISO A.10)

Create new file `13-use-of-AI-systems.annexcategory.ts`:

```typescript
import { AnnexCategoryISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryISO.model";
import { AnnexCategoryStructISO } from "../../../../domain.layer/frameworks/ISO-42001/annexCategoryStructISO.model";

export const UseOfAISystems: Partial<
  AnnexCategoryStructISO & AnnexCategoryISO
>[] = [
  {
    sub_id: 1.1,
    order_no: 1,
    title: "Responsible use of AI",
    description:
      "Ensuring AI systems are used responsibly and in accordance with organizational policies and ethical principles.",
    guidance:
      "The organization should establish policies and procedures to ensure AI systems are used responsibly, including appropriate human oversight, monitoring of outcomes, and adherence to ethical principles and organizational AI policy throughout operation.",
    is_applicable: true,
    implementation_description:
      "Responsible use policies define human oversight requirements, monitoring obligations, and ethical boundaries for AI system operation.",
    auditor_feedback:
      "Responsible use policies are documented. Verify operational adherence through periodic spot checks.",
  },
  {
    sub_id: 2.1,
    order_no: 2,
    title: "Intended use documentation",
    description:
      "Documenting the intended purpose, conditions of use, and known limitations of AI systems.",
    guidance:
      "The intended purpose, operational conditions, known limitations, and boundaries of each AI system should be clearly documented and communicated to users and operators to prevent misuse and ensure appropriate application.",
    is_applicable: true,
    implementation_description:
      "Each AI system has documented intended use specifications including purpose, operational boundaries, known limitations, and prohibited uses.",
    auditor_feedback:
      "Intended use documentation exists for major systems. Ensure coverage extends to all deployed AI systems including embedded components.",
  },
  {
    sub_id: 3.1,
    order_no: 3,
    title: "Transparency for users of AI systems",
    description:
      "Providing users with clear information about AI system behavior, capabilities, and limitations.",
    guidance:
      "Users of AI systems should be provided with clear, accessible information about how the AI system works, what it can and cannot do, the basis for its outputs, and how to interpret results, appropriate to the user's role and context.",
    is_applicable: true,
    implementation_description:
      "User-facing documentation and in-system disclosures explain AI behavior, output interpretation, confidence levels, and limitations.",
    auditor_feedback:
      "Transparency measures are in place. Recommend testing user comprehension to validate effectiveness.",
  },
];
```

Register in `annex.struct.ts`:

```typescript
{
  title: "A.13 Use of AI systems",
  annex_no: 13,
  annexcategories: UseOfAISystems,
},
```

### 5. Annex A.9 — missing data sub-controls (A.6.2.4 through A.6.2.8)

Add to `09-data-for-AI-systems.annexcategory.ts` after the existing 6 items:

```typescript
{
  sub_id: 7.1,
  order_no: 7,
  title: "Data labeling and annotation",
  description:
    "Managing data labeling and annotation processes for AI systems.",
  guidance:
    "Data labeling and annotation processes should be defined, documented, and quality-controlled to ensure labels are accurate, consistent, and appropriate for the intended AI system purpose. Labeler qualifications and inter-annotator agreement should be monitored.",
  is_applicable: true,
  implementation_description:
    "Data labeling processes include defined guidelines, qualified annotators, and quality checks for consistency.",
  auditor_feedback:
    "Labeling processes are documented. Recommend measuring inter-annotator agreement formally.",
},
{
  sub_id: 8.1,
  order_no: 8,
  title: "Data bias assessment",
  description:
    "Assessing and mitigating bias in data used for AI systems.",
  guidance:
    "Data used for AI systems should be assessed for potential biases that could lead to unfair, discriminatory, or harmful outcomes. Identified biases should be documented and mitigated through appropriate techniques.",
  is_applicable: true,
  implementation_description:
    "Bias assessments are conducted on training and evaluation datasets. Identified biases are documented with mitigation strategies.",
  auditor_feedback:
    "Bias assessment processes exist. Ensure assessments are repeated when data sources change.",
},
{
  sub_id: 9.1,
  order_no: 9,
  title: "Data retention",
  description:
    "Defining and implementing data retention policies for AI-related data.",
  guidance:
    "Retention periods for data used in AI systems — including training data, validation data, model outputs, and logs — should be defined based on legal, regulatory, and operational requirements, and enforced through documented procedures.",
  is_applicable: true,
  implementation_description:
    "Data retention policies define periods for training data, model artifacts, and operational logs in compliance with regulatory requirements.",
  auditor_feedback:
    "Retention policies are documented. Verify automated enforcement of retention periods.",
},
{
  sub_id: 10.1,
  order_no: 10,
  title: "Data deletion and disposal",
  description:
    "Secure deletion and disposal of AI-related data.",
  guidance:
    "Data used in AI systems should be securely deleted or disposed of when no longer needed or when retention periods expire, ensuring that deletion is complete and verifiable, particularly for personal or sensitive data.",
  is_applicable: true,
  implementation_description:
    "Secure deletion procedures ensure complete removal of expired AI data with verification records.",
  auditor_feedback:
    "Deletion procedures exist. Recommend periodic verification that deletion is complete across all storage locations including backups.",
},
{
  sub_id: 11.1,
  order_no: 11,
  title: "Data transfer",
  description:
    "Managing the transfer of data used in AI systems.",
  guidance:
    "Transfer of data used in AI systems — whether internal or to third parties — should be governed by documented procedures addressing authorization, encryption, contractual safeguards, and compliance with data protection regulations including cross-border transfer restrictions.",
  is_applicable: true,
  implementation_description:
    "Data transfer procedures govern authorization, encryption, and contractual requirements for internal and external transfers.",
  auditor_feedback:
    "Transfer controls are in place. Ensure cross-border transfer assessments are documented for all AI data sharing arrangements.",
},
```

---

## Wording review of existing files

### Clause files

**Clause 6, order_no 1 (6.1 merged):**
- Current title: `"Actions to address risks and opportunities (Includes Risk Assessment, Treatment, Impact Assessment)"` — ISO 42001 uses four distinct subclauses (6.1.1 General, 6.1.2 AI risk assessment, 6.1.3 AI risk treatment, 6.1.4 AI system impact assessment). Merging them prevents independent tracking. **Fix: split as described above.**

**Clause 8, order_no 5 (8.5):**
- Current title: `"Third-party relationships"` — This subclause does not exist in ISO 42001. The standard's clause 8 covers only 8.1-8.4. Third-party relationships are addressed in Annex A.8 (VW A.11). **Fix: remove this item.**

**Clause 8, order_no 4 (8.4):**
- Current title: `"AI System Lifecycle"` — Should use sentence case: "AI system lifecycle". Minor formatting issue.

**Clause 9, order_no 3 (9.3):**
- Current summary mentions "continuing suitability, adequacy, and effectiveness" which is correct ISO language. No issue.
- Current implementation_description says "annually" but ISO 42001 says "at planned intervals" — the implementation can choose annually, but the summary should not prescribe a specific frequency. Currently OK since only the implementation_description says annually.

### Annex files

**A.5 (VW) / A.2 (ISO) — `05-organizational-policies-and-governance.annexcategory.ts`:**
- This file contains 8 sub-controls spanning what ISO 42001 organizes as A.2 (AI policies, sub_ids 1-2) and A.3 (Internal organization, sub_ids 3-6). Items with sub_id 3.1, 3.2, 4.1, 5.1, 5.2, and 6.1 belong in the A.3 group (VW A.6), not A.2 (VW A.5).
- Specifically: sub_id 3.1 "AI roles and responsibilities" and sub_id 3.2 "Segregation of duties" duplicate the content already in `06-internal-organization.annexcategory.ts` (which has its own sub_id 1.1 and 1.2 with the same titles). **Fix: remove sub_ids 3.1 and 3.2 from A.5 to eliminate duplication, and move sub_ids 4.1 (Accountability), 5.1 (Contact with authorities), 5.2 (Contact with special interest groups), and 6.1 (AI in project management) to A.6 where they belong per ISO A.3.**

**A.8 (VW) / A.5 (ISO) — `08-AI-system-lifecycle.annexcategory.ts`:**
- Sub_id 1.1 "AI system lifecycle management" is not a distinct control in ISO 42001 Annex A.5 — the standard starts at A.5.2. This appears to be an umbrella item. Not harmful but not traceable to a specific ISO control. Consider marking it as an organizational note rather than a control, or removing it.

**A.9 (VW) / A.6 (ISO) — `09-data-for-AI-systems.annexcategory.ts`:**
- Sub_id 2.1 is titled "Data acquisition" — ISO A.6.1.2 titles this as a sub-control under data quality, not a standalone item. The current flat structure loses the hierarchy where A.6.1 (Quality), A.6.1.2 (Acquisition), A.6.1.3 (Preparation) are children of A.6.1, while A.6.2 (Provenance) through A.6.2.8 form a second group. Not a blocking issue since VW uses a flat sub_id scheme, but the developer should be aware the ISO structure has two parent groups here.

**A.10 (VW) / A.7 (ISO) — `10-ict.annexcategory.ts`:**
- Sub_id 4.1 "Resilience of AI systems" is marked `is_applicable: false` with justification "Current AI deployments are limited." This is a structure file that seeds defaults for all organizations — applicability should default to `true` and let each organization decide. **Fix: set `is_applicable: true` and remove `justification_for_exclusion`.**

**A.7 (VW) / A.4 (ISO) — `07-resource-for-AI-systems.annexcategory.ts`:**
- Same issue: sub_id 4.1 "System resources" is marked `is_applicable: false`. Structure files should default all controls to applicable. **Fix: set `is_applicable: true` and remove `justification_for_exclusion`.**

---

## Summary of changes

| Action | File | Priority |
|--------|------|----------|
| Split 6.1 into 6.1.1-6.1.4 (4 items) | `06-planning.subclause.ts` | High |
| Add 6.3 Planning of changes | `06-planning.subclause.ts` | High |
| Remove 8.5 Third-party relationships | `08-operation.subclause.ts` | High |
| Create A.12 Interested parties (3 sub-controls) | New: `12-interested-parties.annexcategory.ts` | High |
| Create A.13 Use of AI systems (3 sub-controls) | New: `13-use-of-AI-systems.annexcategory.ts` | High |
| Add A.6.2.4-A.6.2.8 data sub-controls (5 items) | `09-data-for-AI-systems.annexcategory.ts` | High |
| Register A.12 and A.13 in annex.struct.ts | `annex.struct.ts` | High |
| Remove duplicate roles/segregation from A.5 | `05-organizational-policies-and-governance.annexcategory.ts` | Medium |
| Move A.3 items (accountability, authorities, interest groups, project mgmt) from A.5 file to A.6 file | Both A.5 and A.6 files | Medium |
| Set all `is_applicable` defaults to `true` | `07-resource-for-AI-systems.annexcategory.ts`, `10-ict.annexcategory.ts` | Medium |
| Fix "AI System Lifecycle" casing to "AI system lifecycle" | `08-AI-system-lifecycle.annexcategory.ts` | Low |
