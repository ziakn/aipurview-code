/**
 * AI Gateway Risk Suggestions Utils
 *
 * Database queries for risk detection settings and suggestion records.
 * Uses raw SQL with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";

// ─── Types ───────────────────────────────────────────────────────────

export interface IRiskSetting {
  id?: number;
  organization_id: number;
  condition_id: string;
  is_enabled: boolean;
  threshold: Record<string, any>;
  severity_override: string | null;
  updated_at?: string;
}

export interface IRiskSuggestion {
  id?: number;
  organization_id: number;
  condition_id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  evidence: Record<string, any>;
  compliance_tags: string[];
  suggested_mitigation: string | null;
  status: "pending" | "accepted" | "dismissed";
  accepted_risk_id?: number | null;
  dismiss_reason?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
}

// ─── Settings CRUD ───────────────────────────────────────────────────

/**
 * Get all risk settings for an org. Returns rows for conditions that have
 * been explicitly configured — the caller merges with defaults.
 */
export const getRiskSettingsQuery = async (
  organizationId: number
): Promise<IRiskSetting[]> => {
  const result = (await sequelize.query(
    `SELECT * FROM ai_gateway_risk_settings
     WHERE organization_id = :organizationId
     ORDER BY condition_id`,
    { replacements: { organizationId } }
  )) as [IRiskSetting[], number];
  return result[0];
};

/**
 * Upsert a single condition setting (toggle, threshold, severity override).
 */
export const upsertRiskSettingQuery = async (
  organizationId: number,
  conditionId: string,
  data: { is_enabled?: boolean; threshold?: Record<string, any>; severity_override?: string | null }
): Promise<IRiskSetting> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_risk_settings (organization_id, condition_id, is_enabled, threshold, severity_override, updated_at)
     VALUES (:organizationId, :conditionId, :isEnabled, :threshold::jsonb, :severityOverride, NOW())
     ON CONFLICT (organization_id, condition_id)
     DO UPDATE SET
       is_enabled = COALESCE(:isEnabled, ai_gateway_risk_settings.is_enabled),
       threshold = COALESCE(:threshold::jsonb, ai_gateway_risk_settings.threshold),
       severity_override = COALESCE(:severityOverride, ai_gateway_risk_settings.severity_override),
       updated_at = NOW()
     RETURNING *`,
    {
      replacements: {
        organizationId,
        conditionId,
        isEnabled: data.is_enabled ?? true,
        threshold: JSON.stringify(data.threshold ?? {}),
        severityOverride: data.severity_override ?? null,
      },
    }
  )) as [IRiskSetting[], number];
  return result[0][0];
};

// ─── Suggestions CRUD ────────────────────────────────────────────────

/**
 * Create a new suggestion record.
 */
export const createSuggestionQuery = async (
  organizationId: number,
  data: Omit<IRiskSuggestion, "id" | "organization_id" | "status" | "created_at" | "reviewed_at" | "reviewed_by">
): Promise<IRiskSuggestion> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_risk_suggestions
       (organization_id, condition_id, title, description, severity, evidence, compliance_tags, suggested_mitigation)
     VALUES
       (:organizationId, :conditionId, :title, :description, :severity, :evidence::jsonb, :complianceTags, :suggestedMitigation)
     RETURNING *`,
    {
      replacements: {
        organizationId,
        conditionId: data.condition_id,
        title: data.title,
        description: data.description,
        severity: data.severity,
        evidence: JSON.stringify(data.evidence || {}),
        complianceTags: `{${(data.compliance_tags || []).map((t) => `"${t}"`).join(",")}}`,
        suggestedMitigation: data.suggested_mitigation || null,
      },
    }
  )) as [IRiskSuggestion[], number];
  return result[0][0];
};

/**
 * List suggestions, optionally filtered by status.
 */
export const getSuggestionsQuery = async (
  organizationId: number,
  status?: string
): Promise<IRiskSuggestion[]> => {
  let query = `SELECT s.*, u.name || ' ' || u.surname AS reviewed_by_name
     FROM ai_gateway_risk_suggestions s
     LEFT JOIN users u ON s.reviewed_by = u.id
     WHERE s.organization_id = :organizationId`;
  const replacements: Record<string, any> = { organizationId };

  if (status) {
    query += ` AND s.status = :status`;
    replacements.status = status;
  }

  query += ` ORDER BY s.created_at DESC`;

  const result = (await sequelize.query(query, { replacements })) as [
    (IRiskSuggestion & { reviewed_by_name?: string })[],
    number,
  ];
  return result[0];
};

/**
 * Update a suggestion's status (accept or dismiss).
 */
export const updateSuggestionStatusQuery = async (
  organizationId: number,
  id: number,
  data: {
    status: "accepted" | "dismissed";
    reviewed_by: number;
    dismiss_reason?: string;
    accepted_risk_id?: number;
  }
): Promise<IRiskSuggestion | null> => {
  const result = (await sequelize.query(
    `UPDATE ai_gateway_risk_suggestions
     SET status = :status,
         reviewed_by = :reviewedBy,
         reviewed_at = NOW(),
         dismiss_reason = :dismissReason,
         accepted_risk_id = :acceptedRiskId
     WHERE id = :id AND organization_id = :organizationId AND status = 'pending'
     RETURNING *`,
    {
      replacements: {
        id,
        organizationId,
        status: data.status,
        reviewedBy: data.reviewed_by,
        dismissReason: data.dismiss_reason || null,
        acceptedRiskId: data.accepted_risk_id || null,
      },
    }
  )) as [IRiskSuggestion[], number];
  return result[0][0] || null;
};

/**
 * Check if a pending suggestion already exists for a given condition.
 */
export const hasPendingSuggestionQuery = async (
  organizationId: number,
  conditionId: string
): Promise<boolean> => {
  const result = (await sequelize.query(
    `SELECT EXISTS(
       SELECT 1 FROM ai_gateway_risk_suggestions
       WHERE organization_id = :organizationId AND condition_id = :conditionId AND status = 'pending'
     ) AS exists`,
    { replacements: { organizationId, conditionId } }
  )) as [{ exists: boolean }[], number];
  return result[0][0].exists;
};

/**
 * Get all condition IDs that have pending suggestions for an org (batch dedup).
 */
export const getAllPendingConditionIds = async (
  organizationId: number
): Promise<Set<string>> => {
  const result = (await sequelize.query(
    `SELECT DISTINCT condition_id FROM ai_gateway_risk_suggestions
     WHERE organization_id = :organizationId AND status = 'pending'`,
    { replacements: { organizationId } }
  )) as [{ condition_id: string }[], number];
  return new Set(result[0].map((r) => r.condition_id));
};
