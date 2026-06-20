jest.mock("../../database/db", () => ({
  sequelize: { query: jest.fn().mockResolvedValue([]) },
}));
import { normalizeSlug, getAppsQuery } from "../aiTrustIndex.utils";
import { sequelize } from "../../database/db";

describe("normalizeSlug", () => {
  it("lowercases and trims", () => {
    expect(normalizeSlug("  ChatGPT  ")).toBe("chatgpt");
  });
});

describe("getAppsQuery", () => {
  it("only selects active apps and passes the org id for is_tracked", async () => {
    (sequelize.query as jest.Mock).mockResolvedValueOnce([{ total: "0" }]) // count
      .mockResolvedValueOnce([]); // data
    await getAppsQuery(7, { page: 1, pageSize: 25, sort: "score" });
    const sql = (sequelize.query as jest.Mock).mock.calls.map((c) => c[0]).join("\n");
    expect(sql).toMatch(/is_active\s*=\s*true|is_active = TRUE/i);
    const repl = (sequelize.query as jest.Mock).mock.calls[0][1].replacements;
    expect(repl.organizationId).toBe(7);
  });
});
