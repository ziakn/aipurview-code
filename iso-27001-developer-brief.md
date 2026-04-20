# ISO 27001:2022 — Developer Brief

> **Date:** 2026-04-16
> **Goal:** Fix VerifyWise's ISO 27001 structure files so every clause and Annex A control matches the 2022 standard exactly — correct titles, correct numbering, no phantom controls, no missing items.
> **Scope:** Only ISO 27001 structure files in `Servers/structures/ISO-27001/`. Nothing else.

---

## Current state summary

### Clauses (7 files, clauses 4-10)

VW covers clauses 4-10 in `iso27001.clause.struct.ts` using fields: `arrangement`, `title`, `subclauses[]` where each subclause has `arrangement`, `index`, `sub_index` (optional), `title`, `requirement_summary`, `key_questions[]`, `evidence_examples[]`, `implementation_description`, `status`, `owner`, `reviewer`, `approver`, `due_date`, `cross_mappings[]`.

| Clause | Subclauses in VW | Status |
|--------|-----------------|--------|
| 4 — Context | 4 (4.1-4.4) | Complete |
| 5 — Leadership | 3 (5.1-5.3) | Complete |
| 6 — Planning | 3 (6.1.2, 6.1.3, 6.2) | **Missing 6.1.1 and 6.3** |
| 7 — Support | 5 (7.1-7.5) | Complete |
| 8 — Operation | 3 (8.1-8.3) | Complete |
| 9 — Performance evaluation | 3 (9.1-9.3) | Complete |
| 10 — Improvement | 2 (10.1-10.2) | Complete |

### Annex A (4 themes, `iso27001.annex.struct.ts`)

Each annex entry uses: `arrangement`, `index` (category), `category_name`, `controls[]` where each control has `index`, `title`, `requirement_summary`, `key_questions[]`, `evidence_examples[]`, `implementation_description`, `status`, `owner`, `reviewer`, `approver`, `due_date`, `cross_mappings[]`.

| Theme | ISO 27001:2022 count | VW count | Status |
|-------|---------------------|----------|--------|
| A.5 Organizational | 37 | 36 | Missing A.5.37; titles wrong from A.5.14 onward |
| A.6 People | 8 | 8 | Minor title issues at A.6.5, A.6.7, A.6.8 |
| A.7 Physical | 14 | 14 | Titles wrong from A.7.4 onward |
| A.8 Technological | 34 | 35 | Phantom A.8.32-A.8.35; titles wrong throughout |

---

## The hybrid 2013/2022 naming problem

This is the primary issue. VW controls A.5.1 through A.5.13 have correct 2022 titles. From A.5.14 onward, the titles are ISO 27001:2013 control names mapped sequentially into 2022 numbering slots. An auditor comparing VW output against the 2022 standard would flag 40+ mismatches.

### A.5 Organizational controls — title corrections

| VW # | VW current title | Correct ISO 27001:2022 title | What 2022 requires |
|------|-----------------|------------------------------|-------------------|
| A.5.9 | Inventory of information and assets | Inventory of information and other associated assets | Minor wording — add "other associated" |
| A.5.10 | Acceptable use of information and assets | Acceptable use of information and other associated assets | Minor wording — add "other associated" |
| A.5.14 | Handling of information | Information transfer | Rules, agreements, and procedures for transferring information to/from external parties and within the organization |
| A.5.15 | Access control policy | Access control | Logical and physical access control rules based on business and security requirements |
| A.5.16 | Access to networks and network services | Identity management | Full lifecycle management of identities (creation, verification, provisioning, suspension, deletion) |
| A.5.17 | User registration and de-registration | Authentication information | Allocation and management of authentication information (passwords, tokens, certificates) including initial allocation, replacement, and temporary credentials |
| A.5.18 | Management of privileged access rights | Access rights | Provisioning, reviewing, modifying, and removing access rights in accordance with the access control policy |
| A.5.19 | Management of secret authentication information | Information security in supplier relationships | Processes to manage security risks associated with use of supplier products and services |
| A.5.20 | Review of user access rights | Addressing information security within supplier agreements | Establishing and agreeing relevant security requirements with each supplier based on the type of supplier relationship |
| A.5.21 | Removal or adjustment of access rights | Managing information security in the ICT supply chain | Defining and implementing processes and requirements for managing security risks of the ICT products and services supply chain |
| A.5.22 | Use of secret authentication information | Monitoring, review and change management of supplier services | Regular monitoring, review, evaluation, and change management of supplier security practices and service delivery |
| A.5.23 | Information security in supplier relationships | Information security for use of cloud services | Managing security of cloud service acquisition, use, management, and exit, in accordance with security requirements |
| A.5.24 | Addressing information security within supplier agreements | Information security incident management planning and preparation | Planning and preparing for information security incident management including defining incident response processes, roles, and responsibilities |
| A.5.25 | Information and communication technology supply chain security | Assessment and decision on information security events | Assessing information security events and deciding whether to classify them as information security incidents |
| A.5.26 | Monitoring, review, and change management of supplier services | Response to information security incidents | Responding to information security incidents in accordance with documented procedures |
| A.5.27 | Incident management responsibilities and procedures | Learning from information security incidents | Using knowledge gained from information security incidents to strengthen controls and reduce future incidents |
| A.5.28 | Reporting information security events | Collection of evidence | Establishing and implementing procedures for identification, collection, acquisition, and preservation of digital evidence |
| A.5.29 | Reporting information security weaknesses | Information security during disruption | Maintaining information security at an appropriate level during disruption |
| A.5.30 | Assessment and decision on information security events | ICT readiness for business continuity | Planning, implementing, maintaining, and testing ICT readiness based on business continuity objectives and requirements |
| A.5.31 | Response to information security incidents | Legal, statutory, regulatory and contractual requirements | Identifying, documenting, and keeping up to date all relevant legal, statutory, regulatory, and contractual requirements and the organization's approach to meet them |
| A.5.32 | Learning from information security incidents | Intellectual property rights | Implementing appropriate procedures to protect intellectual property rights |
| A.5.33 | Collection of evidence | Protection of records | Protecting records from loss, destruction, falsification, unauthorized access, and unauthorized release, in compliance with legal, regulatory, contractual, and business requirements |
| A.5.34 | Business continuity planning for information security | Privacy and protection of personal information | Ensuring privacy and protection of personal information as required by applicable legislation, regulations, and contractual requirements |
| A.5.35 | Redundancy of information processing facilities | Independent review of information security | Conducting independent reviews of the organization's approach to managing information security at planned intervals or when significant changes occur |
| A.5.36 | Documented operating procedures | Compliance with policies, rules and standards | Ensuring compliance with the organization's information security policy, topic-specific policies, rules, and standards through regular reviews by management |

**A.5.37 is missing entirely — see "Missing items" section below.**

### A.6 People controls — title corrections

| VW # | VW current title | Correct ISO 27001:2022 title | What 2022 requires |
|------|-----------------|------------------------------|-------------------|
| A.6.5 | Confidentiality or non-disclosure agreements | Responsibilities after termination or change of employment | Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced, and communicated |
| A.6.6 | Remote working | Confidentiality or non-disclosure agreements | Identifying and regularly reviewing requirements for confidentiality or non-disclosure agreements reflecting the organization's needs for protection of information |
| A.6.7 | Termination or change of employment responsibilities | Remote working | Implementing security measures when personnel are working remotely to protect information accessed, processed, or stored outside the organization's premises |
| A.6.8 | User responsibilities | Information security event reporting | Providing a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner |

**Note:** A.6.1 through A.6.4 are correct. The problem begins at A.6.5 where VW has swapped the order of controls 5-7 compared to 2022, and A.6.8 uses a 2013-era title.

### A.7 Physical controls — title corrections

| VW # | VW current title | Correct ISO 27001:2022 title | What 2022 requires |
|------|-----------------|------------------------------|-------------------|
| A.7.4 | Protecting against physical and environmental threats | Physical security monitoring | Continuously monitoring premises for unauthorized physical access |
| A.7.5 | Working in secure areas | Protecting against physical and environmental threats | Designing and implementing protection against natural disasters, malicious or accidental physical attacks |
| A.7.6 | Visitor access records | Working in secure areas | Designing and implementing security procedures for working in secure areas |
| A.7.7 | Delivery and loading areas | Clear desk and clear screen | Clear desk rules for papers and removable storage media, clear screen rules for information processing facilities |
| A.7.8 | Equipment siting and protection | Equipment siting and protection | Correct (no change needed) |
| A.7.9 | Supporting utilities | Security of assets off-premises | Applying security to off-site assets, considering the different risks of working outside the organization's premises |
| A.7.10 | Cabling security | Storage media | Managing storage media through their lifecycle of acquisition, use, transportation, and disposal in accordance with the classification scheme |
| A.7.11 | Equipment maintenance | Supporting utilities | Protecting information processing facilities from power failures and other disruptions caused by failures in supporting utilities |
| A.7.12 | Secure disposal or re-use of equipment | Cabling security | Protecting power and telecommunications cabling from interception, interference, or damage |
| A.7.13 | Removal of assets | Equipment maintenance | Maintaining equipment correctly to ensure availability, integrity, and continued confidentiality of information |
| A.7.14 | Clear desk and clear screen policy | Secure disposal or re-use of equipment | Verifying that items of equipment containing storage media are securely overwritten or destroyed before disposal or re-use |

**Note:** A.7.1 through A.7.3 are correct. From A.7.4 onward, VW uses 2013-era titles that are offset from the 2022 numbering.

### A.8 Technological controls — title corrections

| VW # | VW current title | Correct ISO 27001:2022 title | What 2022 requires |
|------|-----------------|------------------------------|-------------------|
| A.8.1 | User endpoint devices | User endpoint devices | Correct |
| A.8.2 | Privileged access rights | Privileged access rights | Correct |
| A.8.3 | Access to source code | Information access restriction | Restricting access to information and other associated assets in accordance with the access control topic-specific policy |
| A.8.4 | Change management | Secure authentication | Secure authentication technologies and procedures based on information access restrictions and the access control topic-specific policy |
| A.8.5 | Capacity management | Capacity management | Correct |
| A.8.6 | Development, testing and operational environments | Protection against malware | Implementing detection, prevention, and recovery controls combined with user awareness against malware |
| A.8.7 | Protection of test data | Management of technical vulnerabilities | Obtaining timely information about technical vulnerabilities, evaluating exposure, and taking appropriate measures |
| A.8.8 | Logging and monitoring | Logging | Producing, storing, protecting, and analyzing logs that record activities, exceptions, faults, and other relevant events |
| A.8.9 | Clock synchronization | Clock synchronization | Correct |
| A.8.10 | Protection of log information | Use of privileged utility programs | Restricting and tightly controlling the use of utility programs capable of overriding system and application controls |
| A.8.11 | Administrator and operator logs | Installation of software on operational systems | Implementing procedures and measures to securely manage software installation on operational systems |
| A.8.12 | Fault logging | Logging | Already covered by A.8.8. VW's "Fault logging" is a 2013 concept (A.12.4.1). In 2022, A.8.12 is "Data leakage prevention" — applying data leakage prevention measures to systems, networks, and endpoints |
| A.8.13 | Cryptographic controls policy | Use of cryptography | Defining and implementing rules for effective use of cryptography including key management |
| A.8.14 | Key management | Key management | Correct |
| A.8.15 | Network controls | Network controls | Correct (but VW title matches, so no change needed) |
| A.8.16 | Security of network services | Security of network services | Correct |
| A.8.17 | Segregation of networks | Segregation in networks | Segregating groups of information services, users, and information systems in the organization's networks |
| A.8.18 | Use of network services | Web filtering | Filtering access to external websites to reduce exposure to malicious content |
| A.8.19 | Web filtering | Use of cryptography | VW already has A.8.13 as "Cryptographic controls policy". A.8.19 in 2022 is actually part of the 2022 renumber. Correct 2022 title: this slot does not exist as described. See note below. |
| A.8.20 | Cryptographic key usage | Networks security | Securing networks and network devices, managing, and controlling them to protect information in systems and applications |
| A.8.21 | Backup | Security of network services | Maintaining security of information transferred within an organization and with any external entity via all types of communication facilities |
| A.8.22 | Information transfer policies and procedures | Information transfer | Correct 2022 title is "Information transfer" — rules, procedures, or agreements for information transfer within the organization and between the organization and other parties |
| A.8.23 | Electronic messaging | Deletion of information | Deleting information stored in information systems, devices, or any other storage media when no longer required |
| A.8.24 | Confidentiality of information in networks | Use of cryptography | This is a duplicate/mismap. Correct 2022 A.8.24 is "Use of cryptography" but VW already covers crypto at A.8.13/A.8.20. Actual 2022 A.8.24: **Secure development lifecycle** — establishing and applying rules for the secure development of software and systems |
| A.8.25 | Security of system files | Secure development lifecycle | Correct 2022 title: this is already covered above. Actual 2022 A.8.25: **Security requirements for development and support** |
| A.8.26 | Malware protection | Secure design principles | Establishing, documenting, maintaining, and applying secure design principles for development |
| A.8.27 | Technical vulnerability management | Secure coding | Applying secure coding principles to software development |
| A.8.28 | Configuration management | Configuration management | Correct |
| A.8.29 | Monitoring of system use | Security testing in development and acceptance | Defining and implementing security testing processes in the development lifecycle |
| A.8.30 | Protection of application services | Outsourced development | Directing, monitoring, and reviewing activities related to outsourced system development |
| A.8.31 | Data masking | Separation of development, test and production environments | Separating and securing development, testing, and production environments |
| A.8.32 | Network service security audit | **No ISO 27001:2022 equivalent — REMOVE** | Phantom control |
| A.8.33 | Network service security compliance | **No ISO 27001:2022 equivalent — REMOVE** | Phantom control |
| A.8.34 | Network service security reporting | **No ISO 27001:2022 equivalent — REMOVE** | Phantom control |
| A.8.35 | Network service security improvement | **No ISO 27001:2022 equivalent — REMOVE** | Phantom control |

**Important:** The A.8 mismatches are the most severe. Many VW titles map to completely different security domains than what 2022 defines for that slot. The developer should rebuild A.8 titles from scratch using the table above, removing phantom A.8.32-A.8.35 and adding the correct A.8.32-A.8.34.

---

## Missing items — complete TS content

All new items follow the existing format. Clause subclauses use: `arrangement`, `index`, `sub_index` (optional), `title`, `requirement_summary`, `key_questions[]`, `evidence_examples[]`, `implementation_description`, `status`, `owner`, `reviewer`, `approver`, `due_date`, `cross_mappings[]`. Annex controls use the same fields but with just `index` (no arrangement).

### 1. Clause 6.1.1 — General (actions to address risks and opportunities)

Add as the first subclause in Planning (arrangement 6), before 6.1.2. Use `sub_index: 1`.

```typescript
{
  arrangement: 6, index: 1, sub_index: 1,
  title: "General — actions to address risks and opportunities",
  requirement_summary: "When planning for the ISMS, consider the issues from 4.1 and requirements from 4.2 to determine risks and opportunities that need to be addressed to ensure the ISMS achieves its intended outcomes, prevent or reduce undesired effects, and achieve continual improvement.",
  key_questions: [
    "Have we identified risks and opportunities considering context (4.1) and interested party requirements (4.2)?",
    "Do planned actions integrate into ISMS processes?",
    "How do we evaluate effectiveness of these actions?",
  ],
  evidence_examples: ["Risk and opportunity register linked to context analysis", "Planning integration records", "Effectiveness evaluation records"],
  implementation_description: "Maintain a risk and opportunity register derived from context analysis (4.1) and stakeholder requirements (4.2). Plan actions, integrate them into ISMS processes, and evaluate effectiveness. This general planning step precedes the specific risk assessment (6.1.2) and risk treatment (6.1.3).",
  status: "Not Started", owner: "", reviewer: "", approver: "", due_date: "", cross_mappings: [],
},
```

### 2. Clause 6.3 — Planning of changes (new in 2022)

Add as a new subclause in Planning (arrangement 6), after 6.2. Use `index: 3`.

```typescript
{
  arrangement: 6, index: 3,
  title: "Planning of changes",
  requirement_summary: "When the organization determines the need for changes to the ISMS, the changes shall be carried out in a planned manner.",
  key_questions: [
    "Is there a defined process for planning ISMS changes?",
    "Are changes assessed for impact on risk assessments and the SoA before implementation?",
    "Are responsibilities, timelines, and resources documented?",
  ],
  evidence_examples: ["ISMS change management procedure", "Change request and impact assessment records", "Approval records", "Post-change review records"],
  implementation_description: "Manage ISMS changes through a formal change control process. Assess impact on existing risk assessments, controls, and the Statement of Applicability before approval. This clause is new in ISO 27001:2022.",
  status: "Not Started", owner: "", reviewer: "", approver: "", due_date: "", cross_mappings: [],
},
```

### 3. A.5.37 — Documented operating procedures

Add as index 37 in the A.5 array. Use the existing boilerplate pattern for `key_questions` and `evidence_examples` (matching A.5.3+ template).

- **title:** `"Documented operating procedures"`
- **implementation_description:** `"Document operating procedures for information processing facilities and make them available to personnel who need them. Includes procedures for system start-up/shut-down, backup, equipment maintenance, media handling, and safety. Review when operational changes occur."`

### 4. Phantom A.8.32-A.8.35 — remove and replace

Remove the last four A.8 controls (indexes 32-35). Add three correct ones using the existing boilerplate pattern:

- **A.8.32** — title: `"Change management"`, implementation: "Control changes to information processing facilities through formal procedures including submission, assessment, authorization, implementation, and review."
- **A.8.33** — title: `"Test information"`, implementation: "Select, protect, and manage test information. Avoid production data with personal/sensitive content; apply masking or anonymization when production data must be used."
- **A.8.34** — title: `"Protection of information systems during audit testing"`, implementation: "Plan and coordinate audit tests to minimize business disruption. Restrict scope and schedule tests outside business hours where possible."

---

## Wording review

Beyond title corrections, several patterns need attention:

1. **Templated questions and evidence.** From A.5.3 onward, most annex controls use identical boilerplate for `key_questions` and `evidence_examples` (seven generic questions like "Do we have a written, approved process for '{title}'?"). Only A.5.1 and A.5.2 have control-specific content. Each control should have questions tailored to what that specific control requires under 2022.

2. **Templated `implementation_description`.** Many controls (A.5.3 onward) use the placeholder "Describe how '{title}' is planned, implemented, communicated, and reviewed." These need real implementation guidance specific to each control.

3. **A.6 order issue.** VW's A.6.5 is "Confidentiality or non-disclosure agreements" but 2022 A.6.5 is "Responsibilities after termination or change of employment." The controls A.6.5 through A.6.7 are in wrong order — they need to be resequenced to match 2022.

4. **Clause cross-mappings.** Several clause cross-mappings reference incorrect ISO 42001 clauses (e.g., clause 4.3 "Determining the scope" maps to ISO 42001 clause 8 "Operation" — this should map to ISO 42001 clause 4.3 "Scope"). These should be reviewed against the ISO 42001 developer brief.

---

## Summary of all changes

| # | Action | File | Priority |
|---|--------|------|----------|
| 1 | Add clause 6.1.1 (general risk planning) | `iso27001.clause.struct.ts` | High |
| 2 | Add clause 6.3 (planning of changes) | `iso27001.clause.struct.ts` | High |
| 3 | Fix A.5.9-A.5.10 minor wording | `iso27001.annex.struct.ts` | Low |
| 4 | Rename A.5.14 through A.5.36 (23 controls) | `iso27001.annex.struct.ts` | Critical |
| 5 | Add A.5.37 Documented operating procedures | `iso27001.annex.struct.ts` | High |
| 6 | Resequence A.6.5-A.6.7 to match 2022 order | `iso27001.annex.struct.ts` | High |
| 7 | Rename A.6.8 to "Information security event reporting" | `iso27001.annex.struct.ts` | High |
| 8 | Rename A.7.4-A.7.14 (11 controls) | `iso27001.annex.struct.ts` | Critical |
| 9 | Rename A.8.3-A.8.31 (rebuild titles) | `iso27001.annex.struct.ts` | Critical |
| 10 | Remove phantom A.8.32-A.8.35 | `iso27001.annex.struct.ts` | High |
| 11 | Add correct A.8.32-A.8.34 (3 new controls) | `iso27001.annex.struct.ts` | High |
| 12 | Replace boilerplate questions/evidence with control-specific content | `iso27001.annex.struct.ts` | Medium |
| 13 | Replace placeholder implementation_description text | `iso27001.annex.struct.ts` | Medium |
| 14 | Review and fix cross_mappings to ISO 42001 | Both files | Low |

**Total title corrections needed:** ~50 controls across A.5, A.6, A.7, and A.8.
