import { QueryTypes } from "sequelize";
import { sequelize } from "../database/db";

export function normalizeSlug(slug: string): string {
  return String(slug).trim().toLowerCase();
}

const SORT_COLUMNS: Record<string, string> = {
  score: "score_out_of_100 DESC NULLS LAST",
  name: "name ASC",
};

export async function getAppsQuery(
  organizationId: number,
  opts: { search?: string; category?: string; grade?: string; page: number; pageSize: number; sort: string }
): Promise<{ apps: any[]; total: number; page: number; pageSize: number; categories: string[] }> {
  const { search, category, grade } = opts;
  const page = Math.max(1, opts.page);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize));
  const offset = (page - 1) * pageSize;
  const orderBy = SORT_COLUMNS[opts.sort] ?? SORT_COLUMNS.score;

  const conditions: string[] = ["a.is_active = TRUE"];
  const replacements: Record<string, unknown> = { organizationId, limit: pageSize, offset };
  if (search) { conditions.push("(a.name ILIKE :search OR a.vendor ILIKE :search)"); replacements.search = `%${search}%`; }
  if (category) { conditions.push("a.category = :category"); replacements.category = category; }
  if (grade) { conditions.push("a.letter_grade = :grade"); replacements.grade = grade; }
  const where = "WHERE " + conditions.join(" AND ");

  const countSql = `SELECT COUNT(*) AS total FROM ai_trust_index_apps a ${where};`;
  const dataSql = `
    SELECT a.*, (t.app_slug IS NOT NULL) AS is_tracked
    FROM ai_trust_index_apps a
    LEFT JOIN ai_trust_index_tracked_apps t
      ON t.app_slug = a.slug AND t.organization_id = :organizationId
    ${where}
    ORDER BY ${orderBy}, a.id ASC
    LIMIT :limit OFFSET :offset;`;
  const catSql = `SELECT DISTINCT category FROM ai_trust_index_apps WHERE is_active = TRUE AND category IS NOT NULL ORDER BY category;`;

  const [countRows, dataRows, catRows] = await Promise.all([
    sequelize.query(countSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(dataSql, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(catSql, { type: QueryTypes.SELECT }),
  ]);
  return {
    apps: dataRows as any[],
    total: parseInt((countRows[0] as { total: string }).total, 10),
    page, pageSize,
    categories: (catRows as { category: string }[]).map((r) => r.category),
  };
}

export async function getAppBySlugQuery(organizationId: number, slugRaw: string) {
  const slug = normalizeSlug(slugRaw);
  const rows = (await sequelize.query(
    `SELECT a.*, (t.app_slug IS NOT NULL) AS is_tracked
     FROM ai_trust_index_apps a
     LEFT JOIN ai_trust_index_tracked_apps t
       ON t.app_slug = a.slug AND t.organization_id = :organizationId
     WHERE a.slug = :slug;`,
    { replacements: { organizationId, slug }, type: QueryTypes.SELECT }
  )) as any[];
  if (!rows.length) return null;
  const row = rows[0];
  return { ...row, no_longer_in_index: row.is_active === false };
}

export async function getTrackedQuery(organizationId: number) {
  return (await sequelize.query(
    `SELECT t.app_slug, a.id, a.name, a.vendor, a.category, a.letter_grade,
            a.score_out_of_100, a.data, a.is_active,
            (a.id IS NULL OR a.is_active = FALSE) AS no_longer_in_index
     FROM ai_trust_index_tracked_apps t
     LEFT JOIN ai_trust_index_apps a ON a.slug = t.app_slug
     WHERE t.organization_id = :organizationId
     ORDER BY a.score_out_of_100 DESC NULLS LAST, t.app_slug ASC;`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  )) as any[];
}

export async function trackAppQuery(organizationId: number, slugRaw: string, userId: number) {
  const slug = normalizeSlug(slugRaw);
  const active = (await sequelize.query(
    `SELECT 1 FROM ai_trust_index_apps WHERE slug = :slug AND is_active = TRUE;`,
    { replacements: { slug }, type: QueryTypes.SELECT }
  )) as unknown[];
  if (!active.length) return { tracked: false };
  await sequelize.query(
    `INSERT INTO ai_trust_index_tracked_apps (organization_id, app_slug, tracked_by, created_at)
     VALUES (:organizationId, :slug, :userId, NOW())
     ON CONFLICT (organization_id, app_slug) DO NOTHING;`,
    { replacements: { organizationId, slug, userId } }
  );
  return { tracked: true };
}

export async function trackAppsBulkQuery(organizationId: number, slugsRaw: string[], userId: number) {
  const slugs = Array.from(new Set(slugsRaw.map(normalizeSlug))).slice(0, 200);
  const tracked: string[] = [];
  const skipped: string[] = [];
  await sequelize.transaction(async (transaction) => {
    for (const slug of slugs) {
      const active = (await sequelize.query(
        `SELECT 1 FROM ai_trust_index_apps WHERE slug = :slug AND is_active = TRUE;`,
        { replacements: { slug }, type: QueryTypes.SELECT, transaction }
      )) as unknown[];
      if (!active.length) { skipped.push(slug); continue; }
      // RETURNING makes "inserted vs. already-tracked" deterministic: a conflict
      // (DO NOTHING) returns zero rows; a real insert returns one row.
      const inserted = (await sequelize.query(
        `INSERT INTO ai_trust_index_tracked_apps (organization_id, app_slug, tracked_by, created_at)
         VALUES (:organizationId, :slug, :userId, NOW())
         ON CONFLICT (organization_id, app_slug) DO NOTHING
         RETURNING id;`,
        { replacements: { organizationId, slug, userId }, type: QueryTypes.SELECT, transaction }
      )) as unknown[];
      if (inserted.length) tracked.push(slug);
      else skipped.push(slug);
    }
  });
  return { tracked, skipped };
}

export async function untrackAppQuery(organizationId: number, slugRaw: string) {
  const slug = normalizeSlug(slugRaw);
  await sequelize.query(
    `DELETE FROM ai_trust_index_tracked_apps WHERE organization_id = :organizationId AND app_slug = :slug;`,
    { replacements: { organizationId, slug } }
  );
}

export async function getSettingsQuery(organizationId: number) {
  const rows = (await sequelize.query(
    `SELECT recipient_user_ids, recipient_emails FROM ai_trust_index_settings WHERE organization_id = :organizationId;`,
    { replacements: { organizationId }, type: QueryTypes.SELECT }
  )) as any[];
  if (!rows.length) return { recipientUserIds: [], recipientEmails: [] };
  return { recipientUserIds: rows[0].recipient_user_ids ?? [], recipientEmails: rows[0].recipient_emails ?? [] };
}

export async function upsertSettingsQuery(
  organizationId: number, userId: number, recipientUserIds: number[], recipientEmails: string[]
) {
  await sequelize.query(
    `INSERT INTO ai_trust_index_settings (organization_id, recipient_user_ids, recipient_emails, updated_by, updated_at)
     VALUES (:organizationId, :userIds::jsonb, :emails::jsonb, :userId, NOW())
     ON CONFLICT (organization_id) DO UPDATE
       SET recipient_user_ids = :userIds::jsonb, recipient_emails = :emails::jsonb,
           updated_by = :userId, updated_at = NOW();`,
    { replacements: {
        organizationId, userId,
        userIds: JSON.stringify(recipientUserIds),
        emails: JSON.stringify(recipientEmails),
      } }
  );
}
