// Servers/utils/__tests__/aiTrustIndexFeed.test.ts
import { validateFeed } from "../aiTrustIndexFeed";

const app = (slug: string) => ({
  slug, name: slug, vendor: "V", domain: `${slug}.com`, category: "Assistant",
  scoreOutOf100: 50, letterGrade: "C", displayedGrade: "C", confidence: "High",
  dealbreakerFlags: [], summary: "s", highlights: [], policyUrl: "https://x.com",
  policyLastUpdated: null, modalities: ["text"], processesBiometrics: false,
});
const feed = (n: number, extra = {}) => ({
  feedVersion: 1, count: n, apps: Array.from({ length: n }, (_, i) => app(`a${i}`)), ...extra,
});

describe("validateFeed", () => {
  it("accepts a healthy feed", () => {
    const r = validateFeed(feed(37), 37);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.apps).toHaveLength(37);
  });
  it("rejects a non-1 feedVersion", () => {
    expect(validateFeed(feed(37, { feedVersion: 2 }), 37)).toMatchObject({ ok: false });
  });
  it("rejects when count !== apps.length", () => {
    expect(validateFeed({ feedVersion: 1, count: 99, apps: [app("a")] }, 37)).toMatchObject({ ok: false });
  });
  it("rejects an empty / below-absolute-floor feed", () => {
    expect(validateFeed(feed(0), 37)).toMatchObject({ ok: false });
    expect(validateFeed(feed(5), 37)).toMatchObject({ ok: false }); // < 10 absolute floor
  });
  it("rejects a feed below 50% of last good count", () => {
    expect(validateFeed(feed(15), 40)).toMatchObject({ ok: false }); // 15 < 20
  });
  it("accepts when no prior good count exists (first seed) if above absolute floor", () => {
    expect(validateFeed(feed(12), null)).toMatchObject({ ok: true });
  });
  it("drops individual apps missing required fields but keeps the run", () => {
    const bad = feed(12);
    delete (bad.apps[0] as any).slug;
    const r = validateFeed(bad, null);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.apps).toHaveLength(11);
  });
});
