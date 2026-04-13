import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

/**
 * Fetch all experiments and bias audits linked to a model inventory record.
 * Reads from llm_evals_* tables (same Postgres, verifywise schema).
 */
export async function getEvaluationsByModelInventoryId(
  modelInventoryId: number,
  organizationId: number
) {
  const experiments = await sequelize.query(
    `SELECT id, name, status, config, results, error_message,
            started_at, completed_at, created_at, created_by,
            'experiment' AS eval_type
     FROM llm_evals_experiments
     WHERE model_inventory_id = :modelInventoryId
       AND organization_id = :organizationId
     ORDER BY created_at DESC`,
    {
      replacements: { modelInventoryId, organizationId },
      type: QueryTypes.SELECT,
    }
  );

  const biasAudits = await sequelize.query(
    `SELECT id, preset_name AS name, status, config, results, error,
            completed_at, created_at, created_by,
            'bias_audit' AS eval_type
     FROM llm_evals_bias_audits
     WHERE model_inventory_id = :modelInventoryId
       AND organization_id = :organizationId
     ORDER BY created_at DESC`,
    {
      replacements: { modelInventoryId, organizationId },
      type: QueryTypes.SELECT,
    }
  );

  return { experiments, biasAudits };
}
