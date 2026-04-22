# EU AI Act Controls — Fix Notes

> Date: 2026-04-22
> Scope: Corrections to role/risk-tier assignments in the 8 new control files
> Reference: `docs/research/eu-ai-act-role-tier-analysis.md` (Table A)

---

## Fix 1 — Row 2: `08-transparency-obligations-for-providers.controls.ts`

**Current:** Art 50, roles: `provider`, risk tier: `limited-risk`

**Problem:** Article 50 assigns transparency obligations to both providers AND deployers. The file title says "for providers" but the regulation is broader:

| Article | Obligation | Who |
|---------|-----------|-----|
| Art 50(1) | Inform persons they are interacting with AI (chatbots) | Provider |
| Art 50(2) | Inform persons exposed to emotion recognition / biometric categorization | Provider AND Deployer |
| Art 50(3) | Label deepfake content as AI-generated | Provider |
| Art 50(4) | Label AI-generated text on public interest matters | Provider |

**Fix:** Change roles from `provider` to `provider, deployer`. Consider renaming the file to `08-transparency-obligations.controls.ts` (drop "for-providers") since Art 50(2) explicitly requires deployers to inform exposed persons.

**Regulation text (Art 50(2)):** "Providers and deployers of an emotion recognition system or a biometric categorisation system shall inform the natural persons exposed thereto of the operation of the system."

---

## Fix 2 — Row 3: `13-general-purpose-ai.control.ts`

**Current:** Art 51-55, roles: `provider`, risk tier: `gpai`

**Problem:** Chapter V of the EU AI Act spans Articles 51-56, not 51-55. Article 56 covers codes of practice, which are a core GPAI compliance mechanism (participation in codes of practice provides a presumption of conformity under Art 52(3)).

**Fix:** Change article range from `Art 51-55` to `Art 51-56`.

**What Article 56 requires:**
- The AI Office facilitates drawing up codes of practice for GPAI obligations
- Codes cover: technical documentation, copyright policy, training content summaries (Art 52 obligations)
- For systemic risk models: risk assessment, mitigation, incident reporting, cybersecurity (Art 55 obligations)
- Participation in codes of practice provides presumption of conformity

**Why it matters:** If this control file doesn't reference Art 56, implementers may miss that adherence to codes of practice is the primary compliance path for GPAI providers, especially before harmonized standards exist.

---

## Fix 3 — Row 6: `16-provider-documentation.controls.ts`

**Current:** Art 9-12, 15, 18-19, roles: `provider`, risk tier: `high-risk`

**Problem:** The file covers provider documentation obligations but omits two core articles that are fundamentally about documentation:

| Article | Title | Why it's a documentation obligation |
|---------|-------|-------------------------------------|
| Art 13 | Transparency and provision of information to deployers | Requires providers to design systems for transparency AND provide deployers with "instructions for use" containing: provider identity, system characteristics, performance metrics, known limitations, human oversight measures, expected lifetime, and maintenance info |
| Art 14 | Human oversight | Requires providers to design systems enabling human oversight AND document the oversight measures in instructions for use (Art 14(1) cross-refs Art 13) |

**Current coverage:**
- Art 9 (risk management) -- included
- Art 10 (data governance) -- included
- Art 11 (technical documentation / Annex IV) -- included
- Art 12 (record-keeping / logging) -- included
- Art 15 (accuracy, robustness, cybersecurity) -- included
- Art 18 (documentation retention for authorities) -- included
- Art 19 (automatically generated logs) -- included

**Missing:**
- Art 13 (transparency / instructions for use) -- NOT included
- Art 14 (human oversight design + documentation) -- NOT included

**Fix:** Change article list from `Art 9-12, 15, 18-19` to `Art 9-15, 18-19`.

This is a natural range (9 through 15) which covers all the high-risk system requirements that have documentation components. The gap between 12 and 15 (skipping 13-14) appears to be an oversight rather than intentional.

**Note:** Art 13 and Art 14 may already have dedicated control files (e.g., file 03 for human oversight, file 08 for transparency). If so, this file should still reference them since Art 16 (provider obligations umbrella) requires providers to ensure compliance with ALL of Arts 8-15. The documentation file should at minimum cross-reference these articles even if detailed sub-controls live elsewhere.

---

## Summary of changes

| Row | File | Change | From | To |
|-----|------|--------|------|-----|
| 2 | 08-transparency-obligations-for-providers | Add deployer role | `provider` | `provider, deployer` |
| 3 | 13-general-purpose-ai | Extend article range | `Art 51-55` | `Art 51-56` |
| 6 | 16-provider-documentation | Add missing articles | `Art 9-12, 15, 18-19` | `Art 9-15, 18-19` |

---

## Reference table confirmation

The file `docs/research/eu-ai-act-role-tier-analysis.md` (Table A) exists and is the source of truth for the 13 existing control files. It was last updated 2026-04-16 and contains 77 article-level obligation mappings with role, risk tier, and VerifyWise coverage status. The table confirms all three fixes above:
- Table A row for Art 50(2): roles = `P/D` (provider AND deployer)
- Table A rows for Art 55-56: listed under GPAI tier
- Table A rows for Art 13-14: roles = `P`, tier = `High-risk`
