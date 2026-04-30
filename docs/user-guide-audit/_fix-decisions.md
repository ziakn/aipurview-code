# Fix-pass decisions (rolling, made during review gates)

Capture user decisions made at review gates so they're not lost before the fix pass starts. FIX = doc edit. PRODUCT = the app needs to change, not the doc. SKIP = leave as-is.

## getting-started

- **FIX**: Remove "Controls hub" references from both `getting-started/dashboard.ts` (block 16, sidebar bullet) and `getting-started/quick-start.ts` (block 10, "Assurance → Controls hub"). Verified absent across `Clients/src/` and `Servers/` on 2026-04-29; feature does not exist in the app.
