# EU AI Act — Developer Brief

> **Date:** 2026-04-16
> **Goal:** Make VerifyWise's EU AI Act requirements and controls comprehensive, correctly worded, and filterable by role (provider/deployer/both) and risk tier (prohibited/high-risk/limited-risk/GPAI).
> **Scope:** Only EU AI Act compliance tracker structure files. Nothing else.

---

## Current state

13 TS files in `Servers/structures/EU-AI-Act/compliance-tracker/controls/`, exporting 174 controls across 13 categories. These are registered in `controlCategories.struct.ts`.

**What works:** Deployer obligations for high-risk AI (Art 26, 27), post-market monitoring (Art 72), incident reporting (Art 73), AI literacy (Art 4), human oversight (Art 14), corrective actions (Art 20), EU database (Art 71). These are solid.

**What's broken or missing:**

| Problem | Severity |
|---------|----------|
| Zero coverage of prohibited practices (Art 5) | Critical — enforceable since Feb 2025, 35M EUR / 7% penalties |
| File 13 (GPAI) duplicates file 12 instead of covering actual GPAI obligations (Art 51-55) | Critical — enforceable since Aug 2025 |
| No provider-side requirements: QMS (Art 17), risk management system (Art 9), data governance (Art 10), technical documentation (Art 11), record-keeping (Art 12), accuracy/robustness (Art 15) | Major — these are the core high-risk provider obligations |
| No risk classification workflow (Art 6-7) | Major — determines whether other articles apply |
| Missing deployer-specific requirements: log retention (Art 26.5), DPIA integration (Art 26.6), right to explanation (Art 85) | Major |
| Art 50 only covers AI-interaction disclosure; deep fakes, emotion recognition, AI-generated text labeling are missing | Major |
| No conformity assessment, CE marking, EU declaration, certificate tracking (Art 43-48) | Medium |
| No documentation retention obligations (Art 18-19) | Medium |
| No authorized representative requirements (Art 22, 54) | Medium — only for non-EU actors |
| No role or risk-tier metadata on any requirement — can't filter by provider/deployer or risk level | Structural |
| Naming: UI says "Controls" and "Assessments" but should say "Requirements" and "Controls" | Naming |

---

## Naming change

Across the entire UI (not just EU AI Act):
- What is currently labeled **"Controls"** → rename to **"Requirements"** (these are the regulatory obligations)
- What is currently labeled **"Assessments"** → rename to **"Controls"** (these are what you implement to meet requirements)

This matches the EU AI Act's own language (Chapter III: "Requirements for high-risk AI systems") and standard GRC terminology.

**Files to update:** Search the `Clients/` codebase for every UI label, page title, sidebar item, tab label, breadcrumb, and tooltip that says "Controls" or "Assessments" in the context of compliance frameworks. The backend route names and data structures can stay as-is — this is a display-layer change.

---

## Metadata to add

Every category in `controlCategories.struct.ts` and every requirement/sub-requirement needs:

```typescript
{
  order_no: 1,
  title: "AI literacy",
  article: "Art. 4",                          // NEW
  roles: ["provider", "deployer"],            // NEW: "provider" | "deployer"
  riskTiers: ["general"],                     // NEW: "prohibited" | "high-risk" | "limited-risk" | "gpai" | "general"
  deadline: "2025-02-02",                     // NEW: when this obligation becomes enforceable
  penaltyTier: "minor",                       // NEW: "prohibited" (7%) | "standard" (3%) | "minor" (1.5%)
  controls: AIliteracy,
}
```

The frontend will use `roles` and `riskTiers` to filter. When a user sets up their EU AI Act tracker, they select:
- **Role:** Provider / Deployer / Both
- **Risk tiers that apply:** multi-select from Prohibited screening, High-risk, Limited-risk, GPAI

Only matching requirements are shown.

---

## Role/tier selection UI

The user needs to answer two questions before seeing EU AI Act requirements:

**Question 1: What is your role?**
- **Provider** — you develop, train, or place AI systems on the market
- **Deployer** — you use AI systems developed by others in your operations
- **Both** — you both develop and deploy AI systems (common when fine-tuning models or building on foundation models)

**Question 2: Which risk categories apply to your AI systems?** (multi-select)
- **Prohibited screening** — verify none of your AI uses fall under Art 5 prohibited practices (recommended for all)
- **High-risk** — AI systems in Annex III areas (biometrics, critical infrastructure, employment, credit, law enforcement, etc.)
- **Limited-risk** — AI systems with transparency obligations (chatbots, deep fakes, emotion recognition)
- **GPAI** — you provide general-purpose AI models (foundation models)

Based on selection, show filtered requirements. A deployer selecting "High-risk" + "Prohibited screening" sees: Art 4, Art 5, Art 26, Art 27, Art 49(2), Art 73(5), Art 85. A provider selecting "High-risk" sees: Art 4, Art 5, Art 6-17, Art 18-22, Art 43-49, Art 72-73.

---

## New files to create

### File: `00-prohibited-practices.controls.ts` — Art 5

**Article:** Art. 5 | **Roles:** provider, deployer | **Tier:** prohibited | **Deadline:** 2025-02-02 | **Penalty:** 35M EUR / 7%

This is a checklist — each sub-requirement is a prohibited practice the organization must confirm it does NOT engage in.

**Category title:** "Prohibited AI practices"

**Requirements (8):**

1. **Subliminal manipulation** (Art 5.1.a)
   - Title: "The organization does not deploy AI systems that use subliminal techniques beyond a person's consciousness to materially distort behavior, causing or likely to cause physical or psychological harm."
   - Sub-controls:
     - "We have reviewed all AI systems for subliminal or manipulative techniques that operate below conscious awareness."
     - "We have documented the assessment confirming no AI system uses techniques intended to materially distort a person's behavior in a manner likely to cause harm."

2. **Exploitation of vulnerabilities** (Art 5.1.b)
   - Title: "The organization does not deploy AI systems that exploit vulnerabilities of specific groups due to age, disability, or social or economic situation to materially distort behavior, causing or likely to cause harm."
   - Sub-controls:
     - "We have assessed whether any AI system specifically targets or disproportionately affects vulnerable groups (children, elderly, persons with disabilities, economically disadvantaged persons)."
     - "We have documented safeguards preventing AI systems from exploiting group-specific vulnerabilities."

3. **Social scoring** (Art 5.1.c)
   - Title: "The organization does not use AI systems for social scoring — evaluating or classifying natural persons based on social behavior or personal characteristics, leading to detrimental or unfavorable treatment unrelated to the context of data collection."
   - Sub-controls:
     - "We have confirmed no AI system assigns scores or classifications to individuals based on social behavior or inferred personal traits for purposes unrelated to the original data collection context."
     - "We have reviewed all scoring, ranking, or classification systems to ensure none constitute general-purpose social scoring."

4. **Real-time remote biometric identification** (Art 5.1.d)
   - Title: "The organization does not use real-time remote biometric identification systems in publicly accessible spaces for law enforcement purposes, except under the narrow exceptions permitted by the regulation."
   - Sub-controls:
     - "We have confirmed no real-time remote biometric identification system is deployed in publicly accessible spaces."
     - "If any exception applies (targeted search for victims, prevention of imminent threat, locating suspects of serious crime), we have documented the specific legal basis, prior judicial authorization, and necessity assessment."

5. **Emotion recognition in workplace/education** (Art 5.1.e)
   - Title: "The organization does not use AI systems for emotion recognition in workplace or educational settings, except for medical or safety purposes."
   - Sub-controls:
     - "We have confirmed no AI system infers emotions of employees, job candidates, or students based on biometric data."
     - "If emotion recognition is used for medical or safety reasons, we have documented the specific justification and obtained any required consent."

6. **Biometric categorization by sensitive attributes** (Art 5.1.f)
   - Title: "The organization does not use AI systems for biometric categorization that individually categorize natural persons to deduce or infer race, political opinions, trade union membership, religious or philosophical beliefs, sex life, or sexual orientation."
   - Sub-controls:
     - "We have confirmed no AI system uses biometric data (facial images, fingerprints, voice, gait) to infer sensitive personal attributes."
     - "We have reviewed all biometric processing systems and documented that none classify individuals by protected characteristics."

7. **Untargeted facial image scraping** (Art 5.1.g)
   - Title: "The organization does not create or expand facial recognition databases through untargeted scraping of facial images from the internet or CCTV footage."
   - Sub-controls:
     - "We have confirmed no AI system collects facial images from public internet sources or surveillance cameras for building facial recognition databases."
     - "Any facial recognition system in use relies only on lawfully obtained, purpose-specific image datasets."

8. **Individual predictive policing** (Art 5.1.h)
   - Title: "The organization does not use AI systems to make individual risk assessments of natural persons for predicting criminal offenses based solely on profiling or personality traits."
   - Sub-controls:
     - "We have confirmed no AI system predicts the likelihood of a natural person committing a criminal offense based solely on profiling, prior offending, or personality assessment."
     - "Any crime-related AI system supplements, rather than replaces, human assessment and is based on objective, verifiable facts directly linked to criminal activity."

---

### File: Rewrite `13-general-purpose-ai.control.ts` — Art 51-55

**Current problem:** File 13 contains incident monitoring controls copied from file 12. It does NOT cover actual GPAI obligations.

**Article:** Art. 51-55 | **Roles:** provider | **Tier:** gpai | **Deadline:** 2025-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "General-purpose AI model obligations"

**Requirements (5):**

1. **GPAI model classification** (Art 51)
   - Title: "Classify general-purpose AI models and determine whether they pose systemic risk."
   - Sub-controls:
     - "We have assessed whether any GPAI model meets the systemic risk threshold (cumulative compute >10^25 FLOPs, or Commission designation)."
     - "We maintain documentation of the classification determination and update it when model capabilities or compute thresholds change."

2. **Technical documentation and downstream transparency** (Art 52.1.a-b)
   - Title: "Maintain technical documentation and provide information to downstream AI system providers."
   - Sub-controls:
     - "We have drawn up and maintain technical documentation of the model including training process, testing, and evaluation results, per Annex XI."
     - "We provide downstream AI system providers with sufficient information and documentation to understand the model's capabilities and limitations and comply with their own obligations."
     - "We maintain an up-to-date technical summary of the model's characteristics available to the AI Office upon request."

3. **Copyright compliance and training data transparency** (Art 52.1.c-d)
   - Title: "Establish a copyright compliance policy and publish a training content summary."
   - Sub-controls:
     - "We have established and implemented a policy to comply with Union copyright law, including the text and data mining opt-out mechanism under Directive (EU) 2019/790."
     - "We have drawn up and made publicly available a sufficiently detailed summary of the content used for training the model, following the template provided by the AI Office."

4. **Systemic risk obligations** (Art 53) — only for GPAI models with systemic risk
   - Title: "Assess and mitigate systemic risks for models classified as posing systemic risk."
   - Sub-controls:
     - "We perform model evaluations including adversarial testing to identify and mitigate systemic risks."
     - "We have assessed possible systemic risks, including their sources, that may stem from the development, placing on the market, or use of the model."
     - "We track, document, and report serious incidents and possible corrective measures to the AI Office and relevant national authorities without undue delay."
     - "We ensure an adequate level of cybersecurity protection for the model and its physical infrastructure."

5. **Authorized representative and codes of practice** (Art 54-55)
   - Title: "Appoint an EU authorized representative (if non-EU provider) and adhere to codes of practice."
   - Sub-controls:
     - "If established outside the Union, we have appointed an authorized representative established in the Union before making a GPAI model available on the Union market."
     - "We participate in or adhere to codes of practice covering the obligations in Articles 52 and 53, or demonstrate equivalent alternative means of compliance."

---

### File: `14-risk-classification.controls.ts` — Art 6-7

**Article:** Art. 6-7 | **Roles:** provider | **Tier:** high-risk | **Deadline:** 2026-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "High-risk AI system classification"

**Requirements (2):**

1. **Annex I classification (product safety)** (Art 6.1)
   - Title: "Determine whether the AI system is a safety component of, or is itself, a product covered by EU harmonization legislation listed in Annex I."
   - Sub-controls:
     - "We have assessed whether the AI system falls under Annex I product safety legislation (machinery, toys, lifts, medical devices, vehicles, aviation, marine equipment, etc.)."
     - "If the system is a safety component or requires third-party conformity assessment under Annex I legislation, we have classified it as high-risk."

2. **Annex III classification (standalone high-risk)** (Art 6.2-3, Art 7)
   - Title: "Determine whether the AI system falls into a high-risk use case listed in Annex III."
   - Sub-controls:
     - "We have assessed the AI system against all eight Annex III areas: (1) biometrics, (2) critical infrastructure, (3) education and vocational training, (4) employment and worker management, (5) access to essential services, (6) law enforcement, (7) migration/asylum/border control, (8) administration of justice and democratic processes."
     - "We have documented the classification determination including the specific Annex III area and use case."
     - "If the system performs a narrow procedural task, improves a previous human activity, detects decision patterns without replacing human assessment, or performs a preparatory task, we have assessed whether the Art 6(3) exception applies and documented the reasoning."

---

### File: `15-quality-management-system.controls.ts` — Art 17

**Article:** Art. 17 | **Roles:** provider | **Tier:** high-risk | **Deadline:** 2026-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "Quality management system"

**Requirements (3):**

1. **QMS establishment** (Art 17.1)
   - Title: "Establish and maintain a quality management system documented in a systematic and orderly manner in the form of written policies, procedures, and instructions."
   - Sub-controls:
     - "We have a documented QMS that covers the strategy for regulatory compliance, including conformity assessment procedures and procedures for the management of modifications to the high-risk AI system (Art 17.1.a-b)."
     - "Our QMS includes documented design and development procedures, including design control and design verification (Art 17.1.c)."
     - "Our QMS includes testing and validation procedures before, during, and after development, and the frequency of these tests (Art 17.1.d)."
     - "Our QMS includes technical specifications including standards to be applied, and where relevant harmonized standards are not fully applied, the means to ensure the system meets applicable requirements (Art 17.1.e)."
     - "Our QMS includes data management procedures covering data collection, analysis, labeling, storage, filtration, mining, aggregation, retention, and any other operation regarding data for training, validation, and testing (Art 17.1.f)."
     - "Our QMS includes a risk management system per Article 9 (Art 17.1.g)."
     - "Our QMS includes a post-market monitoring system per Article 72 (Art 17.1.h)."
     - "Our QMS includes procedures for reporting serious incidents per Article 73 (Art 17.1.i)."
     - "Our QMS includes communication procedures with national competent authorities, notified bodies, other operators, and customers (Art 17.1.j)."
     - "Our QMS includes systems and procedures for record-keeping of relevant documentation and information (Art 17.1.k)."
     - "Our QMS includes resource management procedures, including supply-chain related measures (Art 17.1.l)."
     - "Our QMS includes an accountability framework for management and other staff regarding all aspects of the QMS (Art 17.1.m)."

2. **Proportionality** (Art 17.2)
   - Title: "Implement QMS measures proportionate to the size of the organization, taking into account simplified requirements for SMEs."
   - Sub-controls:
     - "We have assessed the proportionality of our QMS measures relative to our organization's size and the nature of our AI systems."

3. **Existing QMS integration** (Art 17.3)
   - Title: "For providers subject to sectoral Union legislation, integrate AI Act QMS elements into existing quality management obligations."
   - Sub-controls:
     - "If we are already subject to sectoral QMS requirements (medical devices, automotive, etc.), we have integrated the AI Act QMS elements into our existing quality management system."

---

### File: `16-provider-documentation.controls.ts` — Art 9-12, 15, 18-19

**Article:** Art. 9-12, 15, 18-19 | **Roles:** provider | **Tier:** high-risk | **Deadline:** 2026-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "Provider technical requirements"

These are the core Art 8-15 requirements that VerifyWise partially covers in scattered files. This file consolidates them with correct article references.

**Requirements (6):**

1. **Risk management system** (Art 9)
   - Title: "Establish, implement, document, and maintain a continuous iterative risk management system throughout the entire lifecycle of the high-risk AI system."
   - Sub-controls:
     - "We have established a risk management system that identifies and analyzes known and reasonably foreseeable risks to health, safety, or fundamental rights (Art 9.2.a)."
     - "We estimate and evaluate the risks that may emerge when the system is used in accordance with its intended purpose and under conditions of reasonably foreseeable misuse (Art 9.2.b)."
     - "We evaluate risks arising from analysis of data gathered from the post-market monitoring system (Art 9.2.c)."
     - "We adopt risk management measures that consist of elimination or reduction of risks through adequate design and development, and where appropriate, implementation of adequate mitigation and control measures (Art 9.4)."
     - "Testing procedures are suitable to identify the most appropriate and targeted risk management measures (Art 9.5)."
     - "We test the high-risk AI system against preliminarily defined metrics and probabilistic thresholds appropriate to the intended purpose (Art 9.6)."
     - "Residual risks associated with each hazard and the overall residual risk are judged to be acceptable (Art 9.7)."

2. **Data and data governance** (Art 10)
   - Title: "Ensure training, validation, and testing datasets meet quality criteria and are subject to appropriate data governance practices."
   - Sub-controls:
     - "We have documented data governance practices covering design choices, data collection processes, data preparation operations (annotation, labeling, cleaning, updating, enrichment, aggregation), assumptions about what the data measures and represents, prior assessments of data availability and suitability, examination for possible biases, and identification of relevant data gaps or shortcomings (Art 10.2)."
     - "Training, validation, and testing datasets are relevant, sufficiently representative, and as free of errors and as complete as possible in view of the intended purpose (Art 10.3)."
     - "Datasets take into account the specific geographical, contextual, behavioral, or functional setting within which the high-risk AI system is intended to be used (Art 10.4)."
     - "Where strictly necessary for bias detection and correction, the provider may process special categories of personal data subject to appropriate safeguards for fundamental rights (Art 10.5)."

3. **Technical documentation** (Art 11, Annex IV)
   - Title: "Draw up technical documentation before placing on market or putting into service, and keep it up to date."
   - Sub-controls:
     - "We have drawn up technical documentation demonstrating compliance with requirements in Chapter III Section 2, and providing authorities and notified bodies with all necessary information to assess compliance (Art 11.1)."
     - "Technical documentation includes: general description, detailed description of elements and development process, information about monitoring/functioning/control, description of the risk management system, description of relevant changes made through the system's lifecycle, list of harmonized standards applied, and a copy of the EU declaration of conformity (Annex IV)."

4. **Record-keeping and automatic logging** (Art 12)
   - Title: "Design high-risk AI systems with logging capabilities enabling the recording of events relevant for identifying risk and facilitating post-market monitoring."
   - Sub-controls:
     - "The logging capabilities enable recording of the period of each use, the reference database against which input data has been checked, input data for which the search has led to a match, and the identification of natural persons involved in the verification of results (Art 12.2)."
     - "Logging is proportionate to the intended purpose and the applicable legal obligations under Union or national law (Art 12.3)."

5. **Accuracy, robustness, and cybersecurity** (Art 15)
   - Title: "Design high-risk AI systems to achieve an appropriate level of accuracy, robustness, and cybersecurity and to perform consistently in those respects throughout their lifecycle."
   - Sub-controls:
     - "Levels of accuracy and the relevant accuracy metrics are declared in the instructions for use (Art 15.2)."
     - "The system is designed to be resilient regarding errors, faults, or inconsistencies in the environment, and is robust with regard to unauthorized third-party attempts to alter its use, outputs, or performance (Art 15.4)."
     - "Technical solutions to address AI-specific vulnerabilities include measures to prevent, detect, respond to, resolve, and control for data poisoning attacks, model poisoning, adversarial examples or model evasion, confidentiality attacks, or model flaws (Art 15.5)."

6. **Documentation and log retention** (Art 18-19)
   - Title: "Keep technical documentation and automatically generated logs available for the period required by law."
   - Sub-controls:
     - "Technical documentation is kept at the disposal of national competent authorities for a period of 10 years after the system has been placed on the market or put into service (Art 18.1)."
     - "Automatically generated logs are kept for a period appropriate to the intended purpose of the high-risk AI system, of at least six months unless provided otherwise in applicable Union or national law (Art 19.1)."

---

### File: `17-conformity-and-market-access.controls.ts` — Art 22, 43-44, 47-48

**Article:** Art. 22, 43-44, 47-48 | **Roles:** provider | **Tier:** high-risk | **Deadline:** 2026-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "Conformity assessment and market access"

**Requirements (4):**

1. **Authorized representative** (Art 22)
   - Title: "Non-EU providers must appoint an authorized representative established in the Union before placing a high-risk AI system on the market."
   - Sub-controls:
     - "If established outside the Union, we have appointed an authorized representative in the Union by written mandate (Art 22.1)."
     - "The authorized representative is mandated to: verify the EU declaration of conformity and technical documentation have been drawn up, keep a copy of the EU declaration and technical documentation at the disposal of authorities for 10 years, provide authorities with all information and documentation necessary to demonstrate conformity, and cooperate with authorities on any action they take (Art 22.2)."

2. **Conformity assessment procedure** (Art 43)
   - Title: "Complete the applicable conformity assessment procedure before placing the system on the market or putting it into service."
   - Sub-controls:
     - "We have determined whether the conformity assessment procedure is based on internal control (Annex VI) or involves assessment by a notified body (Annex VII), based on the specific high-risk classification."
     - "Where the AI system is intended to be used for biometric categorization, emotion recognition, or any Annex III area requiring third-party assessment, we have engaged a notified body."
     - "We repeat the conformity assessment procedure whenever a substantial modification is made to the system."

3. **EU declaration of conformity** (Art 47)
   - Title: "Draw up a written or electronic EU declaration of conformity for each high-risk AI system and keep it at the disposal of authorities for 10 years."
   - Sub-controls:
     - "The EU declaration of conformity contains: name and type of the AI system, name and address of the provider, a statement that the EU declaration of conformity is issued under the sole responsibility of the provider, reference to harmonized standards or common specifications used, reference to any notified body involved, and a dated signature (Annex V)."

4. **CE marking** (Art 48)
   - Title: "Affix the CE marking visibly, legibly, and indelibly to the high-risk AI system or its data plate/documentation."
   - Sub-controls:
     - "The CE marking is affixed before the system is placed on the market."
     - "Where no physical product exists, the CE marking is included in the accompanying documentation."
     - "The CE marking is subject to the general principles set out in Article 30 of Regulation (EC) No 765/2008."

---

### File: `18-deployer-data-rights.controls.ts` — Art 26(5-6), Art 85

**Article:** Art. 26(5-6), Art. 85 | **Roles:** deployer | **Tier:** high-risk | **Deadline:** 2026-08-02 | **Penalty:** 15M EUR / 3%

**Category title:** "Deployer data protection and explanation obligations"

**Requirements (3):**

1. **Log retention** (Art 26.5)
   - Title: "Keep logs automatically generated by the high-risk AI system, to the extent such logs are under your control, for at least six months."
   - Sub-controls:
     - "We have established a log retention policy specifying the minimum retention period (6 months or as required by applicable sector-specific or national law)."
     - "We have implemented technical measures to ensure automatic log storage and prevent premature deletion."

2. **Data protection impact assessment** (Art 26.6)
   - Title: "Use information provided by the provider under Article 13 to comply with the obligation to carry out a data protection impact assessment under GDPR Article 35."
   - Sub-controls:
     - "Before deploying the high-risk AI system, we have conducted or updated a DPIA that incorporates the AI system's data processing characteristics as described in the provider's instructions for use."
     - "The DPIA addresses the specific risks posed by AI-assisted decision-making to the rights and freedoms of natural persons."

3. **Right to explanation** (Art 85)
   - Title: "Provide affected persons with clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken."
   - Sub-controls:
     - "When a high-risk AI system is used to make or assist in making decisions that have legal effects or similarly significant effects on natural persons, we provide the affected person with an explanation of the AI system's role."
     - "The explanation covers the main elements of the decision taken, including the role the AI system played, and is provided in a clear and meaningful manner."
     - "We have established a process for affected persons to request and receive such explanations in a timely manner."

---

### Expand existing file: `08-transparency-obligations-for-providers.control.ts`

Add the following requirements to the existing file:

**Requirement: Emotion recognition disclosure** (Art 50.2)
- Title: "Inform natural persons exposed to an emotion recognition system or a biometric categorization system about its operation."
- Sub-controls:
  - "We inform individuals that they are being exposed to an emotion recognition system, and provide information about the categories of data processed (biometric data type, purpose, storage duration)."
  - "Where applicable, we comply with GDPR requirements for processing biometric and special category data."

**Requirement: Deep fake labeling** (Art 50.3)
- Title: "Label AI-generated or manipulated image, audio, or video content that constitutes a deep fake."
- Sub-controls:
  - "All AI-generated or substantially manipulated image, audio, and video content is clearly and prominently labeled as artificially generated or manipulated."
  - "The labeling is machine-readable where technically feasible, using standardized metadata or watermarking."
  - "An exception applies only where the content is part of a manifestly artistic, creative, satirical, or fictional work, and does not affect the obligation to label for downstream recipients."

**Requirement: AI-generated text on public interest** (Art 50.4)
- Title: "Label AI-generated text published to inform the public on matters of public interest."
- Sub-controls:
  - "AI-generated text that is published for the purpose of informing the public on matters of public interest is labeled as artificially generated, unless it has undergone human review and editorial control and a natural person holds editorial responsibility."

---

## What to do with existing files (wording review)

The existing 13 files cover their articles partially but many sub-controls are vaguely worded or miss specific regulatory language. The developer should:

1. **Add article references to every requirement and sub-control.** Currently none of the existing controls reference which article or paragraph they implement. Add `article: "Art. 26(2)"` to each.

2. **Review each sub-control against the actual article text.** The current wording uses paraphrased language like "We ensure executive leadership takes responsibility for decisions related to AI risks." The EU AI Act says specific things — the sub-controls should track the specific obligations, not general good practices.

3. **For each existing file, cross-check against the article × role × tier table** in `docs/research/eu-ai-act-role-tier-analysis.md` (Table A) and confirm every article paragraph that applies is represented as a sub-control.

---

## Summary of changes

| Action | Files affected |
|--------|---------------|
| Create `00-prohibited-practices.controls.ts` | New file |
| Rewrite `13-general-purpose-ai.control.ts` | Replace contents entirely |
| Create `14-risk-classification.controls.ts` | New file |
| Create `15-quality-management-system.controls.ts` | New file |
| Create `16-provider-documentation.controls.ts` | New file |
| Create `17-conformity-and-market-access.controls.ts` | New file |
| Create `18-deployer-data-rights.controls.ts` | New file |
| Expand `08-transparency-obligations-for-providers.control.ts` | Add 3 requirements |
| Update `controlCategories.struct.ts` | Add new imports + metadata fields |
| Add metadata to all 13 existing files | `article`, `roles`, `riskTiers`, `deadline`, `penaltyTier` |
| Rename UI labels | "Controls" → "Requirements", "Assessments" → "Controls" |
| Add role/tier selection flow | Frontend: selection UI before showing EU AI Act requirements |
| Review wording of all existing sub-controls | All 13 existing files |
