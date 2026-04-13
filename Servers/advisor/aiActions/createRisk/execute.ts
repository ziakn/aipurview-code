/**
 * Post-approval executor for `agent_create_risk`.
 *
 * Called by the generic `executeAiAction` dispatcher in
 * `aiActions/executor.ts` once an approval for this tool reaches the
 * approved state. Runs inside the same transaction as the approval state
 * change, so any failure rolls the entire approval back.
 *
 * The risk creation itself is delegated to `createRiskService` so the
 * UI-driven controller path and the AI-driven executor path stay behind
 * the same validated insert + change-history pipeline.
 *
 * Field mapping notes:
 *   - `approver` (LLM input) → `risk_approval` (DB column). The LLM
 *     resolves a person via `list_users` first, then passes the numeric id.
 *   - `risk_owner` (LLM input, optional) → falls back to `ctx.requesterId`
 *     so the chatting user owns the risk by default if they didn't
 *     explicitly assign someone else.
 *   - `deadline` and `date_of_assessment` arrive as ISO date strings and
 *     are converted to `Date` here so they hit Sequelize as a real date.
 *   - `framework_ids` is forwarded as `frameworks` (the service expects
 *     that key on the join-payload).
 *
 * Slice-1 gap: post-commit side effects (logEvent, portfolio snapshot,
 * risk-owner notification) are NOT run here. The HTTP controller path
 * still runs them for UI-created risks; the AI path will get them in a
 * later slice when we extend the post-approval pipeline.
 */

import { createRiskService } from "../../../services/risk.service";
import { calculateRiskLevel } from "../../../utils/validations/riskValidation.utils";
import type {
  AiActionExecuteContext,
  AiActionExecuteResult,
} from "../types";
import type { AgentCreateRiskInput } from "./schema";

/**
 * The UI's AddNewRiskForm leaves severity/likelihood as defaulted Tab 1
 * fields (id 1 = Negligible/Rare) when the user doesn't touch them, then
 * always sends them along with a computed `risk_level_autocalculated`.
 * The AI tool keeps severity/likelihood optional so the LLM doesn't have
 * to invent a number when the user gave no hint — but to match the table
 * rendering you get from a UI-created risk we mirror the same defaults
 * here, then compute the level via the shared validation util.
 */
const DEFAULT_SEVERITY = "Negligible" as const;
const DEFAULT_LIKELIHOOD = "Rare" as const;

export async function executeCreateRisk(
  ctx: AiActionExecuteContext<AgentCreateRiskInput>,
): Promise<AiActionExecuteResult> {
  const input = ctx.inputParams;

  const severity = input.severity ?? DEFAULT_SEVERITY;
  const likelihood = input.likelihood ?? DEFAULT_LIKELIHOOD;
  // Same formula the frontend `RiskCalculator` uses, just runs on the
  // server. Without this, the "Risk Level" column on the risks table is
  // always blank for AI-created risks.
  const riskLevelAutocalculated = calculateRiskLevel(severity, likelihood);

  const newRisk = await createRiskService(
    {
      // Tab 1
      risk_name: input.risk_name,
      risk_description: input.risk_description,
      ai_lifecycle_phase: input.ai_lifecycle_phase,
      risk_category: input.risk_category,
      impact: input.impact,
      severity,
      likelihood,
      risk_level_autocalculated: riskLevelAutocalculated as
        | "No risk"
        | "Very low risk"
        | "Low risk"
        | "Medium risk"
        | "High risk"
        | "Very high risk",
      review_notes: input.review_notes,
      risk_owner: input.risk_owner ?? ctx.requesterId,
      projects: input.project_ids ?? [],
      frameworks: input.framework_ids ?? [],

      // Tab 2 — Mitigation
      mitigation_status: input.mitigation_status,
      mitigation_plan: input.mitigation_plan,
      current_risk_level: input.current_risk_level,
      implementation_strategy: input.implementation_strategy,
      deadline: new Date(input.deadline),
      risk_approval: input.approver,
      approval_status: input.approval_status,
      date_of_assessment: new Date(input.date_of_assessment),
    },
    {
      userId: ctx.requesterId,
      organizationId: ctx.organizationId,
    },
    ctx.transaction,
  );

  if (newRisk.id == null) {
    throw new Error(
      "createRiskService returned a risk without an id — refusing to record an empty execution result.",
    );
  }

  return { entityId: newRisk.id };
}
