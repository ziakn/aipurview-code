import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  calculateReadinessScore,
  normalizeEvidenceCount,
  normalizeRecency,
  aggregateFrameworkScores,
  classifyReadinessLevel,
} from "../advisor/scoring/readinessCalculator";
import {
  upsertControlScoreQuery,
  upsertFrameworkScoreQuery,
  getFrameworkScoresQuery,
  getFrameworkScoreByTypeQuery,
  getControlScoresQuery,
  getWeakestControlsQuery,
  getReadinessHistoryQuery,
  getFrameworkControlsQuery,
} from "../utils/readiness.utils";

const fileName = "readiness.ctrl.ts";

/**
 * Calculate readiness for a single control — fetch evidence, tasks, risks,
 * compute the weighted score, and persist.
 */
async function calculateControlReadiness(
  controlId: number,
  frameworkType: string,
  organizationId: number,
  projectId: number | null
) {
  // 1) Evidence metrics
  const [evidenceRows] = await sequelize.query(
    `SELECT
       COUNT(DISTINCT fel.file_id) AS evidence_count,
       COALESCE(AVG(eaa.overall_quality_score), 0) AS avg_quality,
       EXTRACT(DAY FROM NOW() - MAX(eaa.analyzed_at))::INT AS days_since_latest
     FROM file_entity_links fel
     LEFT JOIN evidence_ai_analysis eaa
       ON eaa.file_id = fel.file_id AND eaa.organization_id = :organizationId
     WHERE fel.entity_id = :controlId
       AND fel.framework_type = :frameworkType
       AND fel.organization_id = :organizationId`,
    { replacements: { controlId, frameworkType, organizationId } }
  );
  const ev = (evidenceRows as any[])[0] || {};
  const evidenceCount = parseInt(ev.evidence_count, 10) || 0;
  const avgQuality = parseFloat(ev.avg_quality) || 0;
  const daysSinceLatest =
    ev.days_since_latest !== null ? parseInt(ev.days_since_latest, 10) : null;

  // 2) Task completion — tasks table has no control_id column,
  //    so use org-wide task completion as proxy metric.
  const [taskRows] = await sequelize.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE status = 'done') AS completed
     FROM tasks
     WHERE organization_id = :organizationId`,
    { replacements: { organizationId } }
  );
  const tk = (taskRows as any[])[0] || {};
  const totalTasks = parseInt(tk.total, 10) || 0;
  const completedTasks = parseInt(tk.completed, 10) || 0;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3) Risk mitigation
  const [riskRows] = await sequelize.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE final_risk_level IS NOT NULL AND LOWER(final_risk_level) != 'high') AS mitigated
     FROM risks
     WHERE organization_id = :organizationId`,
    { replacements: { organizationId } }
  );
  const rk = (riskRows as any[])[0] || {};
  const totalRisks = parseInt(rk.total, 10) || 0;
  const mitigatedRisks = parseInt(rk.mitigated, 10) || 0;
  const riskRate = totalRisks > 0 ? Math.round((mitigatedRisks / totalRisks) * 100) : 100;

  // 4) Calculate weighted score
  const result = calculateReadinessScore({
    evidence_quality: avgQuality,
    evidence_count: normalizeEvidenceCount(evidenceCount),
    evidence_recency: normalizeRecency(daysSinceLatest),
    task_completion: taskRate,
    risk_mitigation: riskRate,
  });

  // 5) Generate recommendations
  const recommendations: string[] = [];
  if (result.evidence_count_score < 30) recommendations.push("Upload evidence documents for this control");
  if (result.evidence_quality_score < 50) recommendations.push("Improve quality of linked evidence");
  if (result.evidence_recency_score < 40) recommendations.push("Update outdated evidence with recent documents");
  if (result.task_completion_score < 50) recommendations.push("Complete pending tasks for this control");
  if (result.risk_mitigation_score < 50) recommendations.push("Address unmitigated risks");

  // 6) Persist
  return upsertControlScoreQuery(controlId, frameworkType, organizationId, {
    project_id: projectId,
    ...result,
    recommendations: recommendations.length > 0 ? recommendations : null,
  });
}

/**
 * POST /api/readiness/calculate
 * Trigger readiness calculation for all frameworks.
 */
export async function calculateAll(req: Request, res: Response) {
  const functionName = "calculateAll";
  logStructured("processing", "calculating readiness for all frameworks", functionName, fileName);

  try {
    const organizationId = req.organizationId!;
    const projectId = req.body.project_id ? Number(req.body.project_id) : null;
    const frameworkTypes = ["eu_ai_act", "iso_42001"];
    const results: any[] = [];

    for (const fw of frameworkTypes) {
      const controls = await getFrameworkControlsQuery(fw);
      const controlScores: Array<{ control_id: number; overall_score: number; readiness_level: any }> = [];

      for (const ctrl of controls) {
        const score = await calculateControlReadiness(
          ctrl.control_id, fw, organizationId, projectId
        );
        controlScores.push({
          control_id: ctrl.control_id,
          overall_score: score.overall_score,
          readiness_level: score.readiness_level,
        });
      }

      const agg = aggregateFrameworkScores(controlScores, fw);
      const fwScore = await upsertFrameworkScoreQuery(fw, organizationId, {
        project_id: projectId,
        ...agg,
      });
      results.push(fwScore);
    }

    logStructured("successful", "readiness calculated for all frameworks", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](results));
  } catch (error) {
    logStructured("error", "failed to calculate readiness", functionName, fileName);
    logger.error("Error in calculateAll:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * POST /api/readiness/calculate/:frameworkType
 * Trigger readiness calculation for a specific framework.
 */
export async function calculateForFramework(req: Request, res: Response) {
  const functionName = "calculateForFramework";
  const frameworkType = req.params.frameworkType;

  logStructured("processing", `calculating readiness for ${frameworkType}`, functionName, fileName);

  try {
    const organizationId = req.organizationId!;
    const projectId = req.body.project_id ? Number(req.body.project_id) : null;

    const controls = await getFrameworkControlsQuery(frameworkType);
    if (controls.length === 0) {
      return res.status(404).json(STATUS_CODE[404]("No controls found for framework"));
    }

    const controlScores: Array<{ control_id: number; overall_score: number; readiness_level: any }> = [];

    for (const ctrl of controls) {
      const score = await calculateControlReadiness(
        ctrl.control_id, frameworkType, organizationId, projectId
      );
      controlScores.push({
        control_id: ctrl.control_id,
        overall_score: score.overall_score,
        readiness_level: score.readiness_level,
      });
    }

    const agg = aggregateFrameworkScores(controlScores, frameworkType);
    const fwScore = await upsertFrameworkScoreQuery(frameworkType, organizationId, {
      project_id: projectId,
      ...agg,
    });

    logStructured("successful", `readiness calculated for ${frameworkType}`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](fwScore));
  } catch (error) {
    logStructured("error", `failed to calculate readiness for ${frameworkType}`, functionName, fileName);
    logger.error("Error in calculateForFramework:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/scores
 * Get all framework readiness scores.
 */
export async function getScores(req: Request, res: Response) {
  const functionName = "getScores";

  try {
    const scores = await getFrameworkScoresQuery(req.organizationId!);
    logStructured("successful", "framework scores fetched", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](scores));
  } catch (error) {
    logStructured("error", "failed to get scores", functionName, fileName);
    logger.error("Error in getScores:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/scores/:frameworkType
 * Get scores for a specific framework.
 */
export async function getScoresByFramework(req: Request, res: Response) {
  const functionName = "getScoresByFramework";
  const frameworkType = req.params.frameworkType;

  try {
    const score = await getFrameworkScoreByTypeQuery(frameworkType, req.organizationId!);
    if (!score) {
      return res.status(204).json(STATUS_CODE[204](null));
    }

    logStructured("successful", `scores fetched for ${frameworkType}`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](score));
  } catch (error) {
    logStructured("error", `failed to get scores for ${frameworkType}`, functionName, fileName);
    logger.error("Error in getScoresByFramework:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/controls/:frameworkType
 * Get per-control readiness scores.
 */
export async function getControlScores(req: Request, res: Response) {
  const functionName = "getControlScores";
  const frameworkType = req.params.frameworkType;

  try {
    const scores = await getControlScoresQuery(frameworkType, req.organizationId!);
    logStructured("successful", `control scores fetched for ${frameworkType}`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](scores));
  } catch (error) {
    logStructured("error", `failed to get control scores for ${frameworkType}`, functionName, fileName);
    logger.error("Error in getControlScores:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/weakest
 * Get the weakest controls across all frameworks.
 */
export async function getWeakest(req: Request, res: Response) {
  const functionName = "getWeakest";

  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const weakest = await getWeakestControlsQuery(req.organizationId!, limit);

    logStructured("successful", "weakest controls fetched", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](weakest));
  } catch (error) {
    logStructured("error", "failed to get weakest controls", functionName, fileName);
    logger.error("Error in getWeakest:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/recommendations
 * Top improvement recommendations across all frameworks.
 */
export async function getRecommendations(req: Request, res: Response) {
  const functionName = "getRecommendations";

  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const weakest = await getWeakestControlsQuery(req.organizationId!, limit);

    const recommendations = weakest.map((ctrl: any) => {
      const recs: string[] = [];
      if ((ctrl.evidence_count_score || 0) < 30) recs.push("Upload evidence documents");
      if ((ctrl.evidence_quality_score || 0) < 50) recs.push("Improve evidence quality");
      if ((ctrl.evidence_recency_score || 0) < 40) recs.push("Update outdated evidence");
      if ((ctrl.task_completion_score || 0) < 50) recs.push("Complete pending tasks");
      if ((ctrl.risk_mitigation_score || 0) < 50) recs.push("Address unmitigated risks");
      if (recs.length === 0) recs.push("Maintain current posture");

      const parsedRecs = ctrl.recommendations
        ? (typeof ctrl.recommendations === "string" ? JSON.parse(ctrl.recommendations) : ctrl.recommendations)
        : recs;

      return {
        control_id: ctrl.control_id,
        framework_type: ctrl.framework_type,
        overall_score: ctrl.overall_score,
        readiness_level: ctrl.readiness_level,
        priority: ctrl.overall_score < 30 ? "critical" : ctrl.overall_score < 60 ? "high" : "medium",
        recommendations: parsedRecs,
      };
    });

    logStructured("successful", "recommendations generated", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](recommendations));
  } catch (error) {
    logStructured("error", "failed to get recommendations", functionName, fileName);
    logger.error("Error in getRecommendations:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/readiness/history
 * Historical readiness scores for trend visualization.
 */
export async function getHistory(req: Request, res: Response) {
  const functionName = "getHistory";

  try {
    const frameworkType = req.query.framework_type
      ? String(req.query.framework_type)
      : undefined;

    const history = await getReadinessHistoryQuery(req.organizationId!, frameworkType);

    logStructured("successful", "readiness history fetched", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](history));
  } catch (error) {
    logStructured("error", "failed to get history", functionName, fileName);
    logger.error("Error in getHistory:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
