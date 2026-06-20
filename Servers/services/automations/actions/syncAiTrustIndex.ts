import { promises as fs } from "fs";
import path from "path";
import { fetchFeed, validateFeed } from "../../../utils/aiTrustIndexFeed";
import {
  getMetaQuery,
  upsertFeedTx,
  getAffectedOrgsBySlugs,
  resolveRecipients,
  currentIsoWeek,
} from "../../../utils/aiTrustIndex.utils";
import { sendAutomationEmail } from "../../emailService";
import { compileMjmlToHtml } from "../../../tools/mjmlCompiler";
import logger from "../../../utils/logger/fileLogger";

const APP_URL =
  (process.env.FRONTEND_URL ?? "http://localhost:5173") + "/ai-trust-index/tracked";

// Build MJML fragments (valid <mj-text> components) injected into the template's {{...}} slots.
function sectionMjml(title: string, slugs: string[]): string {
  if (!slugs.length) return "";
  const header = `<mj-text font-size="14px" font-weight="600" color="#344054">${title}</mj-text>`;
  const items = slugs
    .map((s) => `<mj-text font-size="13px" color="#475467">• ${s}</mj-text>`)
    .join("");
  return header + items;
}

async function renderDigest(orgChanged: string[], orgRemoved: string[]): Promise<string> {
  const tmplPath = path.join(
    __dirname,
    "../../../templates/ai-trust-index-digest.mjml"
  );
  const template = await fs.readFile(tmplPath, "utf8");
  return compileMjmlToHtml(template, {
    changedSection: sectionMjml("Changed", orgChanged),
    removedSection: sectionMjml("No longer assessed", orgRemoved),
    appUrl: APP_URL,
  });
}

export async function syncAiTrustIndex(
  deps?: { feed?: unknown }
): Promise<{
  fetched: number;
  materialChanged: number;
  newlyRemoved: number;
  orgsEmailed: number;
  skipped?: string;
}> {
  const meta = await getMetaQuery();
  const thisWeek = currentIsoWeek(new Date());
  if (meta.last_run_week === thisWeek) {
    return {
      fetched: 0,
      materialChanged: 0,
      newlyRemoved: 0,
      orgsEmailed: 0,
      skipped: `already ran ${thisWeek}`,
    };
  }

  let raw: unknown;
  try {
    raw = deps?.feed ?? (await fetchFeed());
  } catch (e) {
    logger.error(`[ai-trust-index] feed fetch failed: ${(e as Error).message}`);
    return {
      fetched: 0,
      materialChanged: 0,
      newlyRemoved: 0,
      orgsEmailed: 0,
      skipped: "fetch failed",
    };
  }

  const validated = validateFeed(raw, meta.last_good_count ?? null);
  if (!validated.ok) {
    logger.error(`[ai-trust-index] feed rejected: ${validated.reason}`);
    return {
      fetched: 0,
      materialChanged: 0,
      newlyRemoved: 0,
      orgsEmailed: 0,
      skipped: validated.reason,
    };
  }

  const { materialChanged, newlyRemoved, wasFirstSeed } = await upsertFeedTx(
    validated.apps
  );

  if (wasFirstSeed) {
    logger.info(
      `[ai-trust-index] first seed complete (${validated.apps.length} apps); emails suppressed`
    );
    return {
      fetched: validated.apps.length,
      materialChanged: 0,
      newlyRemoved: 0,
      orgsEmailed: 0,
    };
  }

  const changedSlugs = Array.from(new Set([...materialChanged, ...newlyRemoved]));
  let orgsEmailed = 0;
  if (changedSlugs.length) {
    const affected = await getAffectedOrgsBySlugs(changedSlugs);
    const byOrg = new Map<number, { changed: string[]; removed: string[] }>();
    for (const row of affected) {
      const bucket = byOrg.get(row.organization_id) ?? { changed: [], removed: [] };
      if (newlyRemoved.includes(row.app_slug)) bucket.removed.push(row.app_slug);
      else bucket.changed.push(row.app_slug);
      byOrg.set(row.organization_id, bucket);
    }
    for (const [orgId, { changed, removed }] of byOrg) {
      const recipients = await resolveRecipients(orgId);
      if (!recipients.length) continue;
      const html = await renderDigest(changed, removed);
      await sendAutomationEmail(recipients, "AI Trust Index — weekly update", html, undefined);
      orgsEmailed++;
    }
  }

  logger.info(
    `[ai-trust-index] sync done: fetched=${validated.apps.length} changed=${materialChanged.length} removed=${newlyRemoved.length} orgsEmailed=${orgsEmailed}`
  );
  return {
    fetched: validated.apps.length,
    materialChanged: materialChanged.length,
    newlyRemoved: newlyRemoved.length,
    orgsEmailed,
  };
}
