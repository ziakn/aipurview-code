jest.mock("../../database/db", () => ({
  sequelize: {
    query: jest.fn().mockResolvedValue([]),
    // upsertFeedTx wraps everything in a transaction; run the callback inline.
    transaction: jest.fn((cb: (t: unknown) => unknown) => cb({})),
  },
}));
import { normalizeSlug, getAppsQuery, upsertFeedTx } from "../aiTrustIndex.utils";
import { sequelize } from "../../database/db";
import { ITrustIndexAppData } from "../../domain.layer/interfaces/i.aiTrustIndex";

describe("normalizeSlug", () => {
  it("lowercases and trims", () => {
    expect(normalizeSlug("  ChatGPT  ")).toBe("chatgpt");
  });
});

describe("getAppsQuery", () => {
  it("only selects active apps and passes the org id for is_tracked", async () => {
    (sequelize.query as jest.Mock)
      .mockResolvedValueOnce([{ total: "0" }]) // count
      .mockResolvedValueOnce([]); // data
    await getAppsQuery(7, { page: 1, pageSize: 25, sort: "score" });
    const sql = (sequelize.query as jest.Mock).mock.calls.map((c) => c[0]).join("\n");
    expect(sql).toMatch(/is_active\s*=\s*true|is_active = TRUE/i);
    const repl = (sequelize.query as jest.Mock).mock.calls[0][1].replacements;
    expect(repl.organizationId).toBe(7);
  });
});

const feedApp = (slug: string): ITrustIndexAppData =>
  ({
    slug,
    name: slug,
    vendor: "V",
    domain: `${slug}.com`,
    category: "Assistant",
    scoreOutOf100: 80,
    letterGrade: "B",
    displayedGrade: "B",
    confidence: "High",
    dealbreakerFlags: [],
    summary: "s",
    highlights: [],
    policyUrl: "https://x.com",
    policyLastUpdated: null,
    modalities: ["text"],
    processesBiometrics: false,
  }) as unknown as ITrustIndexAppData;

describe("upsertFeedTx soft-delete", () => {
  // Simulate the DB: the soft-delete UPDATE returns rows ONLY for pre-existing
  // active slugs that are NOT in the :seen array (mirrors `slug <> ALL(:seen)`).
  // Pre-existing active rows in the simulated table: "a0", "a1", "gone".
  const PREEXISTING_ACTIVE = ["a0", "a1", "gone"];
  function installQueryRouter() {
    (sequelize.query as jest.Mock).mockImplementation(
      (sql: string, opts?: { replacements?: Record<string, unknown> }) => {
        if (/SELECT seeded_at FROM ai_trust_index_meta/.test(sql)) {
          return Promise.resolve([{ seeded_at: new Date() }]); // not first seed
        }
        if (/SELECT material_hash, full_hash FROM ai_trust_index_apps/.test(sql)) {
          return Promise.resolve([]); // treat every fed app as new → INSERT path
        }
        if (/UPDATE ai_trust_index_apps[\s\S]*is_active = FALSE/.test(sql)) {
          const seen = (opts?.replacements?.seen as string[]) ?? [];
          const removed = PREEXISTING_ACTIVE.filter((s) => !seen.includes(s));
          return Promise.resolve(removed.map((slug) => ({ slug })));
        }
        return Promise.resolve([]); // INSERT / meta UPDATE
      },
    );
  }

  beforeEach(() => {
    (sequelize.query as jest.Mock).mockReset();
    installQueryRouter();
  });

  it("does NOT soft-delete an app dropped for a missing field but still present in the feed", async () => {
    // Valid (upserted) app: "a0". Dropped-but-present app: "a1" (passed via presentSlugs).
    // Genuinely absent app: "gone" (not in feed at all).
    const apps = [feedApp("a0")];
    const presentSlugs = ["a0", "a1"]; // a1 was present but dropped upstream
    const { newlyRemoved } = await upsertFeedTx(apps, presentSlugs);

    // a1 must NOT be reported removed (it's present-but-dropped → left alone).
    expect(newlyRemoved).not.toContain("a1");
    // genuinely absent "gone" IS soft-deleted.
    expect(newlyRemoved).toContain("gone");

    // And the soft-delete's :seen set includes both upserted AND dropped-present.
    const updateCall = (sequelize.query as jest.Mock).mock.calls.find((c) =>
      /UPDATE ai_trust_index_apps[\s\S]*is_active = FALSE/.test(c[0]),
    );
    const seen = updateCall![1].replacements.seen as string[];
    expect(seen).toEqual(expect.arrayContaining(["a0", "a1"]));
    expect(seen).not.toContain("gone");
  });

  it("is backward-compatible: without presentSlugs, only upserted slugs are spared", async () => {
    const { newlyRemoved } = await upsertFeedTx([feedApp("a0")]);
    // a1 is now absent from the present set → soft-deleted (today's behavior).
    expect(newlyRemoved).toEqual(expect.arrayContaining(["a1", "gone"]));
    expect(newlyRemoved).not.toContain("a0");
  });
});
