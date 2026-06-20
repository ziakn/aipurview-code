// Servers/utils/__tests__/aiTrustIndexHash.test.ts
import { computeHashes } from "../aiTrustIndexHash";
import { ITrustIndexAppData } from "../../domain.layer/interfaces/i.aiTrustIndex";

const baseApp: ITrustIndexAppData = {
  slug: "claude", name: "Claude", vendor: "Anthropic", domain: "claude.ai",
  category: "Assistant", scoreOutOf100: 83, letterGrade: "B", displayedGrade: "B",
  confidence: "High", dealbreakerFlags: [], summary: "Strong policy.",
  highlights: [{ label: "Training", text: "Opt-out." }, { label: "Deletion", text: "30 days." }],
  policyUrl: "https://anthropic.com/legal/privacy", policyLastUpdated: "2026-06-08",
  modalities: ["text"], processesBiometrics: false,
  iconUrl: "https://icons.duckduckgo.com/ip3/claude.ai.ico",
};

describe("computeHashes", () => {
  it("is stable across object key and array ordering (no false 'changed')", () => {
    const a = computeHashes(baseApp);
    const reordered: ITrustIndexAppData = {
      ...baseApp,
      modalities: [...baseApp.modalities].reverse(),
      highlights: [...baseApp.highlights].reverse(),
      dealbreakerFlags: [],
    };
    const b = computeHashes(reordered);
    expect(b.fullHash).toBe(a.fullHash);
    expect(b.materialHash).toBe(a.materialHash);
  });

  it("ignores iconUrl in both hashes (cosmetic/derived)", () => {
    const a = computeHashes(baseApp);
    const b = computeHashes({ ...baseApp, iconUrl: "https://example.com/other.ico" });
    expect(b.fullHash).toBe(a.fullHash);
    expect(b.materialHash).toBe(a.materialHash);
  });

  it("ignores policyUrl query/fragment in full hash", () => {
    const a = computeHashes(baseApp);
    const b = computeHashes({ ...baseApp, policyUrl: baseApp.policyUrl + "?v=2#section" });
    expect(b.fullHash).toBe(a.fullHash);
  });

  it("changes full hash but NOT material hash when only summary is reworded", () => {
    const a = computeHashes(baseApp);
    const b = computeHashes({ ...baseApp, summary: "A reworded summary." });
    expect(b.materialHash).toBe(a.materialHash);
    expect(b.fullHash).not.toBe(a.fullHash);
  });

  it("changes material hash when grade changes", () => {
    const a = computeHashes(baseApp);
    const b = computeHashes({ ...baseApp, letterGrade: "C", displayedGrade: "C", scoreOutOf100: 60 });
    expect(b.materialHash).not.toBe(a.materialHash);
  });
});
