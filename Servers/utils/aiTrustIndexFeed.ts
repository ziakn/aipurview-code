// Servers/utils/aiTrustIndexFeed.ts
import axios from "axios";
import { ITrustIndexAppData } from "../domain.layer/interfaces/i.aiTrustIndex";

export const FEED_URL = "https://verifywise.ai/ai-trust-index.json";
const ABSOLUTE_FLOOR = 10;

const REQUIRED_KEYS: (keyof ITrustIndexAppData)[] = [
  "slug",
  "name",
  "category",
  "scoreOutOf100",
  "letterGrade",
  "displayedGrade",
  "dealbreakerFlags",
  "processesBiometrics",
];

function hasRequired(a: any): a is ITrustIndexAppData {
  return (
    a && typeof a === "object" && REQUIRED_KEYS.every((k) => a[k] !== undefined && a[k] !== null)
  );
}

export type ValidateResult =
  | { ok: true; apps: ITrustIndexAppData[] }
  | { ok: false; reason: string };

export function validateFeed(raw: unknown, lastGoodCount: number | null): ValidateResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "feed is not an object" };
  const f = raw as Record<string, unknown>;
  if (f.feedVersion !== 1)
    return { ok: false, reason: `unsupported feedVersion ${String(f.feedVersion)}` };
  if (!Array.isArray(f.apps)) return { ok: false, reason: "apps is not an array" };
  if (typeof f.count !== "number" || f.count !== f.apps.length)
    return { ok: false, reason: `count (${String(f.count)}) != apps.length (${f.apps.length})` };
  if (f.apps.length < ABSOLUTE_FLOOR)
    return { ok: false, reason: `below absolute floor (${f.apps.length})` };
  if (lastGoodCount != null && f.apps.length < lastGoodCount * 0.5)
    return {
      ok: false,
      reason: `below 50% of last good count (${f.apps.length} < ${lastGoodCount})`,
    };
  const apps = (f.apps as unknown[]).filter(hasRequired) as ITrustIndexAppData[];
  return { ok: true, apps };
}

export async function fetchFeed(deps?: {
  get?: (url: string) => Promise<{ status: number; data: unknown }>;
}): Promise<unknown> {
  const get = deps?.get ?? ((url: string) => axios.get(url, { timeout: 20000 }));
  const res = await get(FEED_URL);
  if (res.status !== 200) throw new Error(`feed HTTP ${res.status}`);
  return res.data;
}
