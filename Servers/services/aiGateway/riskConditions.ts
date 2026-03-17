/**
 * AI Gateway Risk Conditions
 *
 * 8 pure-function condition evaluators that detect risk patterns
 * from AI Gateway monitoring data + an engine function that orchestrates them.
 */

import { sequelize } from "../../database/db";
import {
  getRiskSettingsQuery,
  getAllPendingConditionIds,
  IRiskSetting,
} from "../../utils/aiGatewayRisk.utils";

// ─── Types ───────────────────────────────────────────────────────────

export interface ConditionResult {
  detected: boolean;
  condition_id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  evidence: Record<string, any>;
  compliance_tags: string[];
  suggested_mitigation: string;
}

interface ConditionDef {
  id: string;
  label: string;
  default_threshold: Record<string, any>;
  default_severity: "critical" | "high" | "medium" | "low";
  evaluate: (orgId: number, threshold: Record<string, any>) => Promise<ConditionResult>;
}

// ─── Condition definitions ───────────────────────────────────────────

const CONDITIONS: ConditionDef[] = [
  // 1. PII exposure pattern
  {
    id: "pii_exposure",
    label: "PII exposure pattern",
    default_threshold: { count: 20, period_days: 7 },
    default_severity: "high",
    evaluate: async (orgId, threshold) => {
      const count = threshold.count ?? 20;
      const days = threshold.period_days ?? 7;
      const rows = (await sequelize.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(DISTINCT endpoint_id)::int AS endpoint_count
         FROM ai_gateway_guardrail_logs
         WHERE organization_id = :orgId
           AND guardrail_type = 'pii'
           AND created_at >= NOW() - INTERVAL '1 day' * :days`,
        { replacements: { orgId, days } }
      )) as [{ total: number; endpoint_count: number }[], number];
      const { total, endpoint_count } = rows[0][0];
      return {
        detected: total > count,
        condition_id: "pii_exposure",
        title: "PII exposure pattern",
        description: `${total} PII detections in the last ${days} days across ${endpoint_count} endpoint(s). Users are sending personal data to LLM providers.`,
        severity: "high",
        evidence: { total, endpoint_count, period_days: days, threshold_count: count },
        compliance_tags: ["EU AI Act Art. 10", "ISO 42001 A.7"],
        suggested_mitigation: "Enable PII masking on all production endpoints and review guardrail rules.",
      };
    },
  },

  // 2. Active endpoints without guardrails
  {
    id: "no_guardrails",
    label: "Active endpoints without guardrails",
    default_threshold: {},
    default_severity: "medium",
    evaluate: async (orgId) => {
      // Guardrails are org-scoped (apply to all endpoints). Check if any exist.
      const rows = (await sequelize.query(
        `SELECT
           (SELECT COUNT(*)::int FROM ai_gateway_endpoints WHERE organization_id = :orgId AND is_active = true) AS active_endpoints,
           (SELECT COUNT(*)::int FROM ai_gateway_guardrails WHERE organization_id = :orgId AND is_active = true) AS active_guardrails`,
        { replacements: { orgId } }
      )) as [{ active_endpoints: number; active_guardrails: number }[], number];
      const { active_endpoints, active_guardrails } = rows[0][0];
      return {
        detected: active_endpoints > 0 && active_guardrails === 0,
        condition_id: "no_guardrails",
        title: "Active endpoints without guardrails",
        description: `${active_endpoints} active endpoint(s) have no guardrail rules configured. All LLM traffic flows without safety checks.`,
        severity: "medium",
        evidence: { active_endpoints, active_guardrails },
        compliance_tags: ["EU AI Act Art. 9", "EU AI Act Art. 14", "ISO 42001 A.2"],
        suggested_mitigation: "Create at least one PII and one content-filter guardrail rule.",
      };
    },
  },

  // 3. Budget exhaustion approaching
  {
    id: "budget_exhaustion",
    label: "Budget exhaustion approaching",
    default_threshold: { pct: 90 },
    default_severity: "medium",
    evaluate: async (orgId, threshold) => {
      const pct = threshold.pct ?? 90;
      const rows = (await sequelize.query(
        `SELECT monthly_limit_usd, current_spend_usd,
                CASE WHEN monthly_limit_usd > 0
                     THEN ROUND((current_spend_usd / monthly_limit_usd * 100)::numeric, 1)
                     ELSE 0 END AS spend_pct
         FROM ai_gateway_budgets
         WHERE organization_id = :orgId`,
        { replacements: { orgId } }
      )) as [{ monthly_limit_usd: number; current_spend_usd: number; spend_pct: number }[], number];
      if (rows[0].length === 0) {
        return { detected: false, condition_id: "budget_exhaustion", title: "", description: "", severity: "medium", evidence: {}, compliance_tags: [], suggested_mitigation: "" };
      }
      const b = rows[0][0];
      return {
        detected: Number(b.spend_pct) >= pct,
        condition_id: "budget_exhaustion",
        title: "Budget exhaustion approaching",
        description: `AI Gateway spend is at ${b.spend_pct}% of the monthly budget ($${Number(b.current_spend_usd).toFixed(2)} / $${Number(b.monthly_limit_usd).toFixed(2)}).`,
        severity: "medium",
        evidence: { spend_pct: Number(b.spend_pct), current_spend: Number(b.current_spend_usd), limit: Number(b.monthly_limit_usd), threshold_pct: pct },
        compliance_tags: ["EU AI Act Art. 9", "ISO 42001 Clause 10"],
        suggested_mitigation: "Review endpoint usage, set a hard limit, or increase the budget.",
      };
    },
  },

  // 4. Provider concentration
  {
    id: "provider_concentration",
    label: "Single provider concentration",
    default_threshold: { pct: 85 },
    default_severity: "low",
    evaluate: async (orgId, threshold) => {
      const pct = threshold.pct ?? 85;
      const rows = (await sequelize.query(
        `SELECT e.provider,
                SUM(s.cost_usd)::numeric AS total_spend
         FROM ai_gateway_spend_logs s
         JOIN ai_gateway_endpoints e ON s.endpoint_id = e.id
         WHERE s.organization_id = :orgId
           AND s.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY e.provider
         ORDER BY total_spend DESC`,
        { replacements: { orgId } }
      )) as [{ provider: string; total_spend: number }[], number];
      if (rows[0].length < 2) {
        // Only one or zero providers — not meaningful to flag concentration
        return { detected: false, condition_id: "provider_concentration", title: "", description: "", severity: "low", evidence: {}, compliance_tags: [], suggested_mitigation: "" };
      }
      const totalSpend = rows[0].reduce((sum, r) => sum + Number(r.total_spend), 0);
      const topProvider = rows[0][0];
      const topPct = totalSpend > 0 ? Math.round((Number(topProvider.total_spend) / totalSpend) * 100) : 0;
      return {
        detected: topPct >= pct,
        condition_id: "provider_concentration",
        title: "Single provider concentration",
        description: `${topPct}% of the last 30 days' spend is concentrated on ${topProvider.provider}. A single-provider dependency increases vendor risk.`,
        severity: "low",
        evidence: { top_provider: topProvider.provider, top_pct: topPct, total_spend: totalSpend, threshold_pct: pct },
        compliance_tags: ["EU AI Act Art. 9", "ISO 42001 A.3"],
        suggested_mitigation: "Add fallback endpoints using alternative providers to reduce concentration risk.",
      };
    },
  },

  // 5. Error rate spike
  {
    id: "error_rate_spike",
    label: "Error rate spike",
    default_threshold: { multiplier: 2 },
    default_severity: "high",
    evaluate: async (orgId, threshold) => {
      const multiplier = threshold.multiplier ?? 2;
      const rows = (await sequelize.query(
        `WITH last_24h AS (
           SELECT COUNT(*)::numeric AS total,
                  COUNT(*) FILTER (WHERE status_code != 200)::numeric AS errors
           FROM ai_gateway_spend_logs
           WHERE organization_id = :orgId AND created_at >= NOW() - INTERVAL '24 hours'
         ),
         last_7d AS (
           SELECT COUNT(*)::numeric AS total,
                  COUNT(*) FILTER (WHERE status_code != 200)::numeric AS errors
           FROM ai_gateway_spend_logs
           WHERE organization_id = :orgId AND created_at >= NOW() - INTERVAL '7 days'
         )
         SELECT
           CASE WHEN l24.total > 0 THEN ROUND(l24.errors / l24.total * 100, 1) ELSE 0 END AS error_rate_24h,
           CASE WHEN l7d.total > 0 THEN ROUND(l7d.errors / l7d.total * 100, 1) ELSE 0 END AS error_rate_7d,
           l24.total AS requests_24h,
           l24.errors AS errors_24h
         FROM last_24h l24, last_7d l7d`,
        { replacements: { orgId } }
      )) as [{ error_rate_24h: number; error_rate_7d: number; requests_24h: number; errors_24h: number }[], number];
      const r = rows[0][0];
      const rate24h = Number(r.error_rate_24h);
      const rate7d = Number(r.error_rate_7d);
      const spiked = rate7d > 0 && rate24h >= rate7d * multiplier && Number(r.requests_24h) >= 10;
      return {
        detected: spiked,
        condition_id: "error_rate_spike",
        title: "Error rate spike",
        description: `Error rate in the last 24h is ${rate24h}% (${r.errors_24h} errors out of ${r.requests_24h} requests), which is ${rate7d > 0 ? (rate24h / rate7d).toFixed(1) : "∞"}x the 7-day average of ${rate7d}%.`,
        severity: "high",
        evidence: { error_rate_24h: rate24h, error_rate_7d: rate7d, requests_24h: Number(r.requests_24h), errors_24h: Number(r.errors_24h), multiplier },
        compliance_tags: ["EU AI Act Art. 15", "ISO 42001 Clause 10"],
        suggested_mitigation: "Investigate failing endpoints and check provider status pages. Consider enabling fallback chains.",
      };
    },
  },

  // 6. Cost anomaly
  {
    id: "cost_anomaly",
    label: "Cost anomaly detected",
    default_threshold: { multiplier: 3 },
    default_severity: "medium",
    evaluate: async (orgId, threshold) => {
      const multiplier = threshold.multiplier ?? 3;
      const rows = (await sequelize.query(
        `WITH daily AS (
           SELECT DATE(created_at) AS day,
                  SUM(cost_usd)::numeric AS daily_cost
           FROM ai_gateway_spend_logs
           WHERE organization_id = :orgId
             AND created_at >= NOW() - INTERVAL '8 days'
           GROUP BY DATE(created_at)
         ),
         today AS (
           SELECT COALESCE(daily_cost, 0) AS cost FROM daily WHERE day = CURRENT_DATE
         ),
         avg7 AS (
           SELECT COALESCE(AVG(daily_cost), 0) AS avg_cost FROM daily WHERE day < CURRENT_DATE
         )
         SELECT
           COALESCE((SELECT cost FROM today), 0) AS today_cost,
           COALESCE((SELECT avg_cost FROM avg7), 0) AS avg_7d_cost`,
        { replacements: { orgId } }
      )) as [{ today_cost: number; avg_7d_cost: number }[], number];
      const { today_cost, avg_7d_cost } = rows[0][0];
      const todayCost = Number(today_cost);
      const avgCost = Number(avg_7d_cost);
      const anomaly = avgCost > 0 && todayCost >= avgCost * multiplier && todayCost > 1;
      return {
        detected: anomaly,
        condition_id: "cost_anomaly",
        title: "Cost anomaly detected",
        description: `Today's spend ($${todayCost.toFixed(2)}) is ${avgCost > 0 ? (todayCost / avgCost).toFixed(1) : "∞"}x the 7-day daily average ($${avgCost.toFixed(2)}).`,
        severity: "medium",
        evidence: { today_cost: todayCost, avg_7d_cost: avgCost, multiplier },
        compliance_tags: ["EU AI Act Art. 9", "ISO 42001 Clause 10"],
        suggested_mitigation: "Check for unexpected high-token requests or new usage patterns. Review endpoint rate limits.",
      };
    },
  },

  // 7. Stale virtual key with active spend
  {
    id: "stale_virtual_key",
    label: "Stale virtual key with active spend",
    default_threshold: { age_days: 90, min_spend_usd: 10 },
    default_severity: "medium",
    evaluate: async (orgId, threshold) => {
      const ageDays = threshold.age_days ?? 90;
      const minSpend = threshold.min_spend_usd ?? 10;
      const rows = (await sequelize.query(
        `SELECT vk.id, vk.name, vk.key_prefix, vk.created_at,
                COALESCE(SUM(s.cost_usd), 0)::numeric AS spend_30d
         FROM ai_gateway_virtual_keys vk
         LEFT JOIN ai_gateway_spend_logs s
           ON s.organization_id = vk.organization_id
           AND s.metadata->>'virtual_key_id' = vk.id::text
           AND s.created_at >= NOW() - INTERVAL '30 days'
         WHERE vk.organization_id = :orgId
           AND vk.is_active = true
           AND vk.revoked_at IS NULL
           AND vk.created_at <= NOW() - INTERVAL '1 day' * :ageDays
         GROUP BY vk.id
         HAVING COALESCE(SUM(s.cost_usd), 0) >= :minSpend`,
        { replacements: { orgId, ageDays, minSpend } }
      )) as [{ id: number; name: string; key_prefix: string; created_at: string; spend_30d: number }[], number];
      const keys = rows[0];
      return {
        detected: keys.length > 0,
        condition_id: "stale_virtual_key",
        title: "Stale virtual key with active spend",
        description: `${keys.length} virtual key(s) are older than ${ageDays} days and still have active spend. Rotating keys regularly reduces exposure.`,
        severity: "medium",
        evidence: { stale_keys: keys.slice(0, 5).map((k) => ({ name: k.name, prefix: k.key_prefix, spend_30d: Number(k.spend_30d).toFixed(2) })), age_days: ageDays },
        compliance_tags: ["EU AI Act Art. 15", "ISO 42001 A.8"],
        suggested_mitigation: "Rotate stale virtual keys and revoke any that are no longer needed.",
      };
    },
  },

  // 8. Unused active endpoint
  {
    id: "unused_endpoint",
    label: "Unused active endpoint",
    default_threshold: { inactive_days: 30 },
    default_severity: "low",
    evaluate: async (orgId, threshold) => {
      const days = threshold.inactive_days ?? 30;
      const rows = (await sequelize.query(
        `SELECT e.id, e.display_name, e.slug, e.created_at
         FROM ai_gateway_endpoints e
         WHERE e.organization_id = :orgId AND e.is_active = true
           AND NOT EXISTS (
             SELECT 1 FROM ai_gateway_spend_logs s
             WHERE s.endpoint_id = e.id AND s.created_at >= NOW() - INTERVAL '1 day' * :days
           )`,
        { replacements: { orgId, days } }
      )) as [{ id: number; display_name: string; slug: string; created_at: string }[], number];
      const endpoints = rows[0];
      return {
        detected: endpoints.length > 0,
        condition_id: "unused_endpoint",
        title: "Unused active endpoint",
        description: `${endpoints.length} active endpoint(s) have had zero requests in the last ${days} days. Unused endpoints increase the attack surface.`,
        severity: "low",
        evidence: { endpoint_count: endpoints.length, endpoints: endpoints.slice(0, 5).map((e) => e.display_name), inactive_days: days },
        compliance_tags: ["EU AI Act Art. 15", "ISO 42001 A.8"],
        suggested_mitigation: "Deactivate or delete unused endpoints to reduce the attack surface.",
      };
    },
  },
];

// ─── Public API ──────────────────────────────────────────────────────

/** Exported for the Settings UI to show labels + defaults. */
export const CONDITION_DEFINITIONS = CONDITIONS.map((c) => ({
  id: c.id,
  label: c.label,
  default_threshold: c.default_threshold,
  default_severity: c.default_severity,
}));

/**
 * Evaluate all enabled conditions for a given org.
 * Returns only newly detected suggestions (deduped against pending).
 */
export async function evaluateAllConditions(
  orgId: number
): Promise<ConditionResult[]> {
  const settings = await getRiskSettingsQuery(orgId);
  const settingsMap = new Map<string, IRiskSetting>();
  for (const s of settings) settingsMap.set(s.condition_id, s);

  // Filter to enabled conditions
  const enabledConditions = CONDITIONS.filter((c) => {
    const setting = settingsMap.get(c.id);
    return !setting || setting.is_enabled;
  });

  // Batch: get all pending condition IDs in one query
  const pendingIds = await getAllPendingConditionIds(orgId);

  // Run all enabled conditions in parallel
  const evaluations = await Promise.allSettled(
    enabledConditions.map(async (condition) => {
      const setting = settingsMap.get(condition.id);
      const threshold = { ...condition.default_threshold, ...(setting?.threshold || {}) };
      const result = await condition.evaluate(orgId, threshold);

      if (setting?.severity_override) {
        result.severity = setting.severity_override as ConditionResult["severity"];
      }
      return result;
    })
  );

  const results: ConditionResult[] = [];
  for (let i = 0; i < evaluations.length; i++) {
    const evaluation = evaluations[i];
    if (evaluation.status === "rejected") {
      console.error(`Risk condition ${enabledConditions[i].id} failed for org ${orgId}:`, evaluation.reason);
      continue;
    }
    const result = evaluation.value;
    if (result.detected && !pendingIds.has(result.condition_id)) {
      results.push(result);
    }
  }

  return results;
}
