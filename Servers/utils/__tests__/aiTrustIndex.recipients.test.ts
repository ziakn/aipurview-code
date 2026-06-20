jest.mock("../../database/db", () => ({
  sequelize: { query: jest.fn() },
}));
import { resolveRecipients, currentIsoWeek } from "../aiTrustIndex.utils";
import { sequelize } from "../../database/db";

const q = sequelize.query as jest.Mock;

describe("currentIsoWeek", () => {
  it("formats ISO week", () => {
    expect(currentIsoWeek(new Date(Date.UTC(2026, 5, 15)))).toMatch(/^2026-W\d{2}$/);
  });
});

describe("resolveRecipients", () => {
  beforeEach(() => q.mockReset());
  it("unions configured users and free-text emails", async () => {
    q.mockResolvedValueOnce([{ recipient_user_ids: [1], recipient_emails: ["dpo@acme.com"] }]) // settings
     .mockResolvedValueOnce([{ email: "user1@acme.com" }]); // user emails for org
    const r = await resolveRecipients(7);
    expect(r.sort()).toEqual(["dpo@acme.com", "user1@acme.com"]);
  });
  it("falls back to org Admins when no recipients are configured", async () => {
    q.mockResolvedValueOnce([{ recipient_user_ids: [], recipient_emails: [] }]) // settings
     .mockResolvedValueOnce([{ email: "admin@acme.com" }]); // admin fallback (user-email query skipped)
    const r = await resolveRecipients(7);
    expect(r).toEqual(["admin@acme.com"]);
    const adminSql = q.mock.calls[1][0];
    expect(adminSql).toMatch(/role/i);
    expect(adminSql).toMatch(/organization_id\s*=\s*:organizationId/);
  });
});
