# Core Governance OS — Implementation Report

> **Date:** 2026-05-05
> **Branch:** `mo-344-may-5-core-governance-os`

## Module Overview

Core Governance OS is a cross-framework intelligence layer that connects EU AI Act, ISO 42001, ISO 27001, and NIST AI RMF into a unified governance view. Rather than managing each compliance framework in isolation, Governance OS reveals where controls overlap, recommends which frameworks to prioritize based on organizational context, and measures coverage across projects.

### Three Core Tools

| Tab | Purpose |
|-----|---------|
| **Framework Mapper** | Explore control-to-control mappings between any two frameworks. See which controls are direct equivalents, partial overlaps, or related by topic. |
| **Scenario Builder** | Get personalized framework recommendations based on industry, region, risk level, and use case type. Select a scenario to set your org's governance strategy. |
| **Unified Insights** | Per-project coverage analysis showing how well each project satisfies its assigned frameworks, with gap and synergy detection. |

### Key Benefits

- **Reduce duplicate work** — Direct mappings mean one implementation satisfies two frameworks simultaneously.
- **Prioritize intelligently** — The recommendation engine tells you which frameworks matter most for your context instead of guessing.
- **Measure progress holistically** — Coverage analysis shows gaps and synergies across all active frameworks per project.
- **Educate stakeholders** — Every element has detailed explanations (modals, tooltips) so users understand what they're doing and why.

---

## Work Completed This Session

### Fix 1: Tab Default Value

**Problem:** The page defaulted to a `"overview"` tab that didn't exist, causing blank content on load.

**Fix:** Changed default to `"mapper"` (the first real tab) and removed the orphaned `<TabPanel value="overview">` block.

**File:** `Clients/src/presentation/pages/GovernanceOS/index.tsx`

---

### Fix 2: UI Spacing & Custom Components

**Problem:** Raw MUI `<FormControl><Select><MenuItem>` was used instead of the project's custom `Select` component. Spacing was tighter than other pages.

**Fix:**
- Replaced all raw MUI selects with the project's `Select` component from `components/Inputs/Select` (consistent styling, label handling, placeholder support).
- Changed layout from nested `Box` with manual margins to `Stack spacing={3}` for major sections and `spacing={2}` for card lists — matching Framework and RiskManagement pages.
- Increased card padding from `p: 1.5`/`p: 2` to `p: 2`/`p: 2.5` for breathing room.
- Fixed MUI "out-of-range value" warning in project select by using `""` as empty state instead of `0`.

**Files:**
- `Clients/src/presentation/components/GovernanceOS/FrameworkSelector.tsx`
- `Clients/src/presentation/pages/GovernanceOS/ScenarioBuilder.tsx`
- `Clients/src/presentation/pages/GovernanceOS/UnifiedInsights.tsx`
- `Clients/src/presentation/pages/GovernanceOS/FrameworkMapper.tsx`
- `Clients/src/presentation/components/GovernanceOS/MappingCard.tsx`
- `Clients/src/presentation/components/GovernanceOS/CoverageChart.tsx`

---

### Fix 3: Select Button Behavior & User Education

**Problem:** The "Select" button on scenario cards was a stub (`console.info` only). Users had no idea what selecting a scenario meant or what to do next.

**Fix:**
- Wired up `useGovernancePreferences` and `useUpdatePreferences` hooks so clicking "Select" saves the scenario via `PUT /api/governance-os/preferences`.
- Added `isSelected` visual state (green border, accent background, "Selected" with checkmark, disabled state).
- Added `VWTooltip` on the Select button explaining what it does on hover.
- Added an (i) `Info` icon button on every scenario card that opens a `StandardModal` with:
  - **What is this scenario?** — description of the governance strategy
  - **What happens when you select it?** — bullet list of concrete outcomes
  - **Next steps after selecting** — numbered action plan guiding users through Framework page, controls review, Unified Insights, Framework Mapper, and Dashboard
  - **Framework priority order** — color-coded cards for primary/secondary/supplementary with role explanations
  - **Best suited for** — industry, region, use case context
  - **Recommendation match** — score explanation (for recommended results)
  - **Rationale** — if available from the engine

**Files:**
- `Clients/src/presentation/components/GovernanceOS/ScenarioCard.tsx`
- `Clients/src/presentation/pages/GovernanceOS/ScenarioBuilder.tsx`
- `Clients/src/domain/interfaces/i.governanceOs.ts`

---

### Fix 4: MappingCard Detail Modal

**Problem:** Mapping cards showed minimal info with no context about what the mapping means or how to use it.

**Fix:** Made each mapping card clickable (cursor pointer, info icon on right). Clicking opens a `StandardModal` with:
- **Mapping relationship** — visual source -> target control cards
- **Mapping strength** — badge + full explanation of what direct/partial/related means in practice
- **What this means for you** — actionable guidance tailored to the strength level
- **Additional details** — governance domain chip, confidence score
- **Rationale** — detailed reasoning behind the mapping

**File:** `Clients/src/presentation/components/GovernanceOS/MappingCard.tsx`

---

### Fix 5: Coverage SQL Errors (500 Internal Server Error)

**Problem:** Two SQL issues:
1. Query referenced `project_frameworks` but the actual table is `projects_frameworks` (plural, per consolidated migration).
2. When a project had only one framework, `IN (:otherIds)` received an empty array causing `syntax error at or near ")"`.

**Fix:**
- Corrected table name to `projects_frameworks`.
- Added `if (otherIds.length > 0)` guard — when only one framework exists, mapped/gap/synergy are 0 by definition (no cross-framework analysis possible).

**File:** `Servers/utils/governanceCoverage.utils.ts`

---

### Fix 6: User Guide & Entity Tips

**Problem:** No documentation existed for the module.

**Fix:**
- Created user guide article at `shared/user-guide-content/content/ai-governance/governance-os.ts` with sections on Framework Mapper, Scenario Builder, and Unified Insights.
- Added 4 rotating entity tips in `Clients/src/application/config/entityTips.ts` covering mappings, recommendations, coverage, and domains.
- Registered the article in content index and `userGuideConfig.ts` (bumped ai-governance collection to 17 articles).

**Files:**
- `shared/user-guide-content/content/ai-governance/governance-os.ts` (new)
- `shared/user-guide-content/content/index.ts`
- `shared/user-guide-content/userGuideConfig.ts`
- `Clients/src/application/config/entityTips.ts`

---

## Commits (12 total, one per file/logical change)

```
be7ab482c fix(governance-os): fix SQL errors in coverage computation (table name and empty array)
d8dcf8108 feat(governance-os): add user guide article for Core Governance OS
e089478a0 feat(governance-os): add governance-os entity tips for tip box
82c72bd76 refactor(governance-os): use custom Select, fix out-of-range warning, and improve spacing in UnifiedInsights
5598cd929 refactor(governance-os): use custom Select, wire up preferences, and improve spacing in ScenarioBuilder
d3ffd3c7b refactor(governance-os): improve FrameworkMapper spacing with Stack layout
06345e926 fix(governance-os): increase spacing in CoverageChart for consistency
314dd317b feat(governance-os): add info modal, tooltip, and next steps guidance to ScenarioCard
a4b5a65db feat(governance-os): add clickable detail modal to MappingCard with explanations
3965ffea7 refactor(governance-os): replace raw MUI Select with custom Select component in FrameworkSelector
691aad08e feat(governance-os): add isSelected prop to IScenarioCardProps interface
8cdfbc88f fix(governance-os): set default tab to mapper and remove orphaned overview panel
```

---

## Verification

- Frontend build passes: `cd Clients && npm run build`
- Backend build passes: `cd Servers && npm run build`
- TypeScript type check passes: `cd Clients && npx tsc --noEmit`
- Working tree is clean (all changes committed)
- Branch: `mo-344-may-5-core-governance-os`
