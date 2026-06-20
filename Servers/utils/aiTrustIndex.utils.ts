import { QueryTypes } from "sequelize";
import { sequelize } from "../database/db";
import { computeHashes } from "./aiTrustIndexHash";
import { ITrustIndexAppData } from "../domain.layer/interfaces/i.aiTrustIndex";
import logger from "./logger/fileLogger";

export function normalizeSlug(slug: string): string {
  return String(slug).trim().toLowerCase();
}

// Whitelisted sortable columns. Each maps to a fixed SQL expression — user
// input only ever selects a key here, it is never interpolated into the query.
// NULL scores/values always sort last regardless of direction.
const SORT_COLUMNS: Record<string, { expr: string; defaultDir: "ASC" | "DESC" }> = {
  score: { expr: "score_out_of_100", defaultDir: "DESC" },
  name: { expr: "name", defaultDir: "ASC" },
  vendor: { expr: "vendor", defaultDir: "ASC" },
  category: { expr: "category", defaultDir: "ASC" },
};

export async function getAppsQuery(
  organizationId: number,
  opts: {
    search?: string;
    category?: string;
    grade?: string;
    page: number;
    pageSize: number;
    sort: string;
    dir?: string;
  },
): Promise<{ apps: any[]; total: number; page: number; pageSize: number; categories: string[] }> {
  const { search, category, grade } = opts;
  const page = Math.max(1, opts.page);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize));
  const offset = (page - 1) * pageSize;
  const sortCol = SORT_COLUMNS[opts.sort] ?? SORT_COLUMNS.score;
  // Direction is whitelisted to ASC/DESC; anything else falls back to the
  // column's default direction. Never interpolate the raw value.
  const dir = opts.dir === "asc" ? "ASC" : opts.dir === "desc" ? "DESC" : sortCol.defaultDir;
  const orderBy = `${sortCol.expr} ${dir} NULLS LAST`;

  const conditions: string[] = ["a.is_active = TRUE"];
  const replacements: Record<string, unknown> = { organizationId, limit: pageSize, offset };
  if (search) {
    // Escape LIKE metacharacters (\ % _) in user input so they're matched
    // literally rather than acting as wildcards, then wrap with our own %.
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    conditions.push("(a.name ILIKE :search ESCAPE '\\' OR a.vendor ILIKE :search ESCAPE '\\')");
    replacements.search = `%${escaped}%`;
  }
  if (category) {
    conditions.push("a.category = :category");
    replacements.category = category;
  }
  if (grade) {
    conditions.push("a.letter_grade = :grade");
    replacements.grade = grade;
  }
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
    page,
    pageSize,
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
    { replacements: { organizationId, slug }, type: QueryTypes.SELECT },
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
    { replacements: { organizationId }, type: QueryTypes.SELECT },
  )) as any[];
}

export async function trackAppQuery(organizationId: number, slugRaw: string, userId: number) {
  const slug = normalizeSlug(slugRaw);
  const active = (await sequelize.query(
    `SELECT 1 FROM ai_trust_index_apps WHERE slug = :slug AND is_active = TRUE;`,
    { replacements: { slug }, type: QueryTypes.SELECT },
  )) as unknown[];
  if (!active.length) return { tracked: false };
  await sequelize.query(
    `INSERT INTO ai_trust_index_tracked_apps (organization_id, app_slug, tracked_by, created_at)
     VALUES (:organizationId, :slug, :userId, NOW())
     ON CONFLICT (organization_id, app_slug) DO NOTHING;`,
    { replacements: { organizationId, slug, userId } },
  );
  return { tracked: true };
}

export async function trackAppsBulkQuery(
  organizationId: number,
  slugsRaw: string[],
  userId: number,
) {
  const slugs = Array.from(new Set(slugsRaw.map(normalizeSlug))).slice(0, 200);
  const tracked: string[] = [];
  const skipped: string[] = [];
  await sequelize.transaction(async (transaction) => {
    for (const slug of slugs) {
      const active = (await sequelize.query(
        `SELECT 1 FROM ai_trust_index_apps WHERE slug = :slug AND is_active = TRUE;`,
        { replacements: { slug }, type: QueryTypes.SELECT, transaction },
      )) as unknown[];
      if (!active.length) {
        skipped.push(slug);
        continue;
      }
      // RETURNING makes "inserted vs. already-tracked" deterministic: a conflict
      // (DO NOTHING) returns zero rows; a real insert returns one row.
      const inserted = (await sequelize.query(
        `INSERT INTO ai_trust_index_tracked_apps (organization_id, app_slug, tracked_by, created_at)
         VALUES (:organizationId, :slug, :userId, NOW())
         ON CONFLICT (organization_id, app_slug) DO NOTHING
         RETURNING id;`,
        { replacements: { organizationId, slug, userId }, type: QueryTypes.SELECT, transaction },
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
    { replacements: { organizationId, slug } },
  );
}

export async function getSettingsQuery(organizationId: number) {
  const rows = (await sequelize.query(
    `SELECT recipient_user_ids, recipient_emails FROM ai_trust_index_settings WHERE organization_id = :organizationId;`,
    { replacements: { organizationId }, type: QueryTypes.SELECT },
  )) as any[];
  // The weekly-sync cadence is org-independent (the meta row is global), but the
  // Settings page surfaces it per org so an admin can see the index is checked
  // automatically and when it last ran.
  const metaRows = (await sequelize.query(
    `SELECT seeded_at, last_run_week FROM ai_trust_index_meta WHERE id = 1;`,
    { type: QueryTypes.SELECT },
  )) as any[];
  const meta = metaRows[0] ?? {};
  const base = rows.length
    ? {
        recipientUserIds: rows[0].recipient_user_ids ?? [],
        recipientEmails: rows[0].recipient_emails ?? [],
      }
    : { recipientUserIds: [], recipientEmails: [] };
  return {
    ...base,
    lastRunWeek: meta.last_run_week ?? null,
    seededAt: meta.seeded_at ?? null,
  };
}

export async function upsertSettingsQuery(
  organizationId: number,
  userId: number,
  recipientUserIds: number[],
  recipientEmails: string[],
) {
  await sequelize.query(
    `INSERT INTO ai_trust_index_settings (organization_id, recipient_user_ids, recipient_emails, updated_by, updated_at)
     VALUES (:organizationId, :userIds::jsonb, :emails::jsonb, :userId, NOW())
     ON CONFLICT (organization_id) DO UPDATE
       SET recipient_user_ids = :userIds::jsonb, recipient_emails = :emails::jsonb,
           updated_by = :userId, updated_at = NOW();`,
    {
      replacements: {
        organizationId,
        userId,
        userIds: JSON.stringify(recipientUserIds),
        emails: JSON.stringify(recipientEmails),
      },
    },
  );
}

export function currentIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function getMetaQuery() {
  const rows = (await sequelize.query(
    `SELECT seeded_at, last_good_count, last_run_week FROM ai_trust_index_meta WHERE id = 1;`,
    { type: QueryTypes.SELECT },
  )) as any[];
  return rows[0] ?? { seeded_at: null, last_good_count: null, last_run_week: null };
}

export async function upsertFeedTx(
  apps: ITrustIndexAppData[],
  // Every slug present in the raw feed, including apps dropped for a missing
  // required field. The soft-delete excludes these so a transiently-malformed-
  // but-present app is left untouched (not marked removed). When omitted, the
  // present set defaults to the upserted apps — i.e. today's behavior.
  presentSlugs?: string[],
  // Total number of apps in the raw feed (before any were dropped for a missing
  // required field). Stored as last_good_count so the metric reflects the feed
  // size, not just the subset that survived validation. Defaults to the upserted
  // count when omitted — i.e. today's behavior.
  rawCount?: number,
): Promise<{
  materialChanged: string[];
  newlyRemoved: string[];
  wasFirstSeed: boolean;
}> {
  if (!apps.length) {
    return { materialChanged: [], newlyRemoved: [], wasFirstSeed: false };
  }

  const materialChanged: string[] = [];
  const newlyRemoved: string[] = [];
  let wasFirstSeed = false;

  await sequelize.transaction(async (transaction) => {
    const metaRows = (await sequelize.query(
      `SELECT seeded_at FROM ai_trust_index_meta WHERE id = 1 FOR UPDATE;`,
      { type: QueryTypes.SELECT, transaction },
    )) as any[];
    wasFirstSeed = !metaRows[0]?.seeded_at;

    const upsertedSlugs: string[] = [];
    for (const app of apps) {
      const slug = normalizeSlug(app.slug);
      upsertedSlugs.push(slug);
      const { materialHash, fullHash } = computeHashes(app);
      const existing = (await sequelize.query(
        `SELECT material_hash, full_hash FROM ai_trust_index_apps WHERE slug = :slug;`,
        { replacements: { slug }, type: QueryTypes.SELECT, transaction },
      )) as any[];

      if (existing.length) {
        if (existing[0].material_hash !== materialHash) materialChanged.push(slug);
        const fullChanged = existing[0].full_hash !== fullHash;
        await sequelize.query(
          `UPDATE ai_trust_index_apps SET
             name = :name, vendor = :vendor, category = :category,
             letter_grade = :grade, score_out_of_100 = :score,
             data = :data::jsonb, material_hash = :mh, full_hash = :fh,
             is_active = TRUE, removed_at = NULL, last_fetched_at = NOW()
             ${fullChanged ? ", last_changed_at = NOW()" : ""}
           WHERE slug = :slug;`,
          {
            replacements: {
              slug,
              name: app.name,
              vendor: app.vendor ?? null,
              category: app.category ?? null,
              grade: app.letterGrade ?? null,
              score: app.scoreOutOf100 ?? null,
              data: JSON.stringify(app),
              mh: materialHash,
              fh: fullHash,
            },
            transaction,
          },
        );
      } else {
        await sequelize.query(
          `INSERT INTO ai_trust_index_apps
             (slug, name, vendor, category, letter_grade, score_out_of_100, data,
              material_hash, full_hash, is_active, last_changed_at, last_fetched_at)
           VALUES (:slug, :name, :vendor, :category, :grade, :score, :data::jsonb,
              :mh, :fh, TRUE, NOW(), NOW());`,
          {
            replacements: {
              slug,
              name: app.name,
              vendor: app.vendor ?? null,
              category: app.category ?? null,
              grade: app.letterGrade ?? null,
              score: app.scoreOutOf100 ?? null,
              data: JSON.stringify(app),
              mh: materialHash,
              fh: fullHash,
            },
            transaction,
          },
        );
      }
    }

    // Soft-delete is keyed on slugs PRESENT IN THE RAW FEED (upserted ∪
    // dropped-but-present), not just the upserted ones. An app that appeared in
    // the feed but was dropped for a missing field is left alone — it retains
    // its prior state until it's either valid again or genuinely absent.
    const seenSlugs = Array.from(
      new Set([...upsertedSlugs, ...(presentSlugs ?? []).map(normalizeSlug)]),
    );
    const removedRows = (await sequelize.query(
      `UPDATE ai_trust_index_apps
         SET is_active = FALSE, removed_at = NOW()
       WHERE is_active = TRUE AND slug <> ALL(ARRAY[:seen]::varchar[])
       RETURNING slug;`,
      { replacements: { seen: seenSlugs }, type: QueryTypes.SELECT, transaction },
    )) as any[];
    for (const r of removedRows) newlyRemoved.push(r.slug);

    await sequelize.query(
      `UPDATE ai_trust_index_meta
         SET last_good_count = :count, last_run_week = :week
             ${wasFirstSeed ? ", seeded_at = NOW()" : ""}
       WHERE id = 1;`,
      {
        replacements: { count: rawCount ?? apps.length, week: currentIsoWeek(new Date()) },
        transaction,
      },
    );
  });

  return { materialChanged, newlyRemoved, wasFirstSeed };
}

export async function getAffectedOrgsBySlugs(slugs: string[]) {
  if (!slugs.length)
    return [] as {
      organization_id: number;
      app_slug: string;
      name: string | null;
      letter_grade: string | null;
    }[];
  // Join the apps table so the digest can show the human name + current grade
  // instead of the raw slug. LEFT JOIN keeps a tracked-but-since-removed app in
  // the result (the apps row is soft-deleted, not deleted, so its name resolves).
  return (await sequelize.query(
    `SELECT DISTINCT t.organization_id, t.app_slug, a.name, a.letter_grade
     FROM ai_trust_index_tracked_apps t
     LEFT JOIN ai_trust_index_apps a ON a.slug = t.app_slug
     WHERE t.app_slug = ANY(ARRAY[:slugs]::varchar[]);`,
    { replacements: { slugs }, type: QueryTypes.SELECT },
  )) as {
    organization_id: number;
    app_slug: string;
    name: string | null;
    letter_grade: string | null;
  }[];
}

export async function resolveRecipients(organizationId: number): Promise<string[]> {
  const settings = (await sequelize.query(
    `SELECT recipient_user_ids, recipient_emails FROM ai_trust_index_settings WHERE organization_id = :organizationId;`,
    { replacements: { organizationId }, type: QueryTypes.SELECT },
  )) as any[];
  const userIds: number[] = settings[0]?.recipient_user_ids ?? [];
  const freeText: string[] = settings[0]?.recipient_emails ?? [];

  let userEmails: string[] = [];
  if (userIds.length) {
    const rows = (await sequelize.query(
      `SELECT email FROM users WHERE organization_id = :organizationId AND id = ANY(ARRAY[:ids]::int[]);`,
      { replacements: { organizationId, ids: userIds }, type: QueryTypes.SELECT },
    )) as { email: string }[];
    userEmails = rows.map((r) => r.email);
  }

  let recipients = Array.from(
    new Set([...userEmails, ...freeText].map((e) => e.trim().toLowerCase()).filter(Boolean)),
  );
  if (recipients.length === 0) {
    // Fallback when an org has no configured recipients. Org Admins are
    // org-scoped; SuperAdmins are platform-global stewards (their
    // organization_id is NULL), so they must be matched by role alone — the
    // org predicate would otherwise exclude them and leave the org with no
    // recipient at all.
    const admins = (await sequelize.query(
      `SELECT u.email FROM users u JOIN roles r ON u.role_id = r.id
       WHERE (u.organization_id = :organizationId AND r.name = 'Admin')
          OR r.name = 'SuperAdmin';`,
      { replacements: { organizationId }, type: QueryTypes.SELECT },
    )) as { email: string }[];
    recipients = Array.from(
      new Set(admins.map((a) => a.email.trim().toLowerCase()).filter(Boolean)),
    );
    if (recipients.length === 0) {
      logger.warn(
        `[ai-trust-index] org ${organizationId} has a tracked-app change but no resolvable recipients (no configured recipients, no Admin, no SuperAdmin); digest skipped`,
      );
    }
  }
  return recipients;
}
