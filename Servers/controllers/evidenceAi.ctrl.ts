import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  upsertAnalysisQuery,
  getAnalysisByFileIdQuery,
  getQualityScoresQuery,
  getEvidenceGapsQuery,
  getSuggestionsQuery,
  applySuggestionsQuery,
} from "../utils/evidenceAi.utils";
import { parseDocument, isSupportedMimeType } from "../advisor/parsers";
import { trackAIContent } from "../middleware/aiContentTracker.middleware";

const fileName = "evidenceAi.ctrl.ts";

/**
 * POST /api/evidence-ai/analyze/:fileId
 * Trigger AI analysis for a file.
 */
export async function analyzeFile(req: Request, res: Response) {
  const functionName = "analyzeFile";
  const fileId = parseInt(
    Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId
  );

  if (isNaN(fileId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
  }

  logStructured("processing", `analyzing file ${fileId}`, functionName, fileName);

  try {
    const organizationId = req.organizationId!;
    const userId = req.userId ? Number(req.userId) : null;

    // Get the file record to find the actual file content
    const [fileRows] = await sequelize.query(
      `SELECT id, filename, type FROM files
       WHERE id = :fileId AND organization_id = :organizationId`,
      { replacements: { fileId, organizationId } }
    );

    const file = (fileRows as any[])[0];
    if (!file) {
      return res.status(404).json(STATUS_CODE[404]("File not found"));
    }

    // Get file content from the database (files table stores content as BYTEA)
    const [contentRows] = await sequelize.query(
      `SELECT content FROM files WHERE id = :fileId AND organization_id = :organizationId`,
      { replacements: { fileId, organizationId } }
    );

    const contentRow = (contentRows as any[])[0];
    let documentText = "";

    if (contentRow?.content) {
      const buffer = Buffer.isBuffer(contentRow.content)
        ? contentRow.content
        : Buffer.from(contentRow.content);

      if (isSupportedMimeType(file.type)) {
        const parsed = await parseDocument(buffer, file.type);
        documentText = parsed.text;
      } else {
        // For text-based files, convert buffer to string
        documentText = buffer.toString("utf-8");
      }
    }

    if (!documentText || documentText.trim().length === 0) {
      return res
        .status(422)
        .json(STATUS_CODE[422]("File has no extractable text content"));
    }

    // Extract compliance areas via keyword matching
    const complianceKeywords = [
      "risk", "audit", "compliance", "control", "policy", "regulation",
      "GDPR", "ISO", "NIST", "EU AI Act", "security", "privacy",
      "assessment", "monitoring", "incident", "training", "transparency",
      "accountability", "fairness", "robustness", "data protection",
    ];
    const foundAreas = complianceKeywords.filter((kw) =>
      documentText.toLowerCase().includes(kw.toLowerCase())
    );

    // Extract key findings (sentences with compliance verbs)
    const sentences = documentText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    const findingPatterns =
      /\b(must|shall|should|require|recommend|ensure|implement|maintain|document|verify)\b/i;
    const keyFindings = sentences
      .filter((s) => findingPatterns.test(s))
      .slice(0, 10)
      .map((s) => s.trim());

    // Create summary
    const summary =
      documentText.length > 500
        ? documentText.substring(0, 500).trim() + "..."
        : documentText.trim();

    // Score quality
    const relevance = Math.min(100, foundAreas.length * 15 + 10);
    const completeness = Math.min(
      100,
      keyFindings.length * 10 + (summary.length > 200 ? 20 : 0)
    );
    const recency = 70;
    const reliability = Math.min(
      100,
      (keyFindings.length > 3 ? 40 : 20) + (foundAreas.length > 2 ? 30 : 10) + 20
    );
    const specificity = Math.min(
      100,
      keyFindings.filter((f) => f.length > 50).length * 15 + 10
    );
    const overall = Math.round(
      relevance * 0.25 +
        completeness * 0.25 +
        recency * 0.2 +
        reliability * 0.15 +
        specificity * 0.15
    );

    const qualityScore = { relevance, completeness, recency, reliability, specificity };

    // Match against controls for suggestions
    const [euControls] = await sequelize.query(
      `SELECT id, control_title, control_description
       FROM control_category_eu_ai_act_struct
       WHERE control_title IS NOT NULL
       LIMIT 50`
    );

    const suggestions = (euControls as any[])
      .map((ctrl: any) => {
        const ctrlText = `${ctrl.control_title || ""} ${ctrl.control_description || ""}`.toLowerCase();
        const matched = foundAreas.filter((a) => ctrlText.includes(a.toLowerCase()));
        return {
          control_id: ctrl.id,
          control_title: ctrl.control_title,
          framework_type: "eu_ai_act",
          match_score: matched.length > 0 ? Math.min(100, matched.length * 30 + 20) : 0,
          matched_areas: matched,
        };
      })
      .filter((s: any) => s.match_score > 0)
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 10);

    // Persist
    const analysis = await upsertAnalysisQuery(fileId, organizationId, {
      summary,
      key_findings: keyFindings,
      compliance_areas: foundAreas,
      quality_score: qualityScore,
      overall_quality_score: overall,
      suggested_control_links: suggestions,
      analysis_model: "heuristic-v1",
      analyzed_by: userId,
    });

    // Track AI content metadata for transparency badge
    trackAIContent(organizationId, "evidence", fileId, {
      badgeType: "generated",
      modelUsed: "heuristic-v1",
      modelProvider: "verifywise",
      toolName: "evidence-analysis",
      confidenceScore: overall,
      promptSummary: `Analyzed file ${file.filename}: ${foundAreas.length} compliance areas, ${keyFindings.length} findings`,
    }, userId).catch(() => {});

    logStructured("successful", `file ${fileId} analyzed`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](analysis));
  } catch (error) {
    logStructured("error", "failed to analyze file", functionName, fileName);
    logger.error("Error in analyzeFile:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/evidence-ai/analysis/:fileId
 * Get analysis results for a file.
 */
export async function getAnalysis(req: Request, res: Response) {
  const functionName = "getAnalysis";
  const fileId = parseInt(
    Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId
  );

  if (isNaN(fileId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
  }

  try {
    const analysis = await getAnalysisByFileIdQuery(fileId, req.organizationId!);

    if (!analysis) {
      return res.status(204).json(STATUS_CODE[204](null));
    }

    logStructured("successful", `analysis found for file ${fileId}`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](analysis));
  } catch (error) {
    logStructured("error", "failed to get analysis", functionName, fileName);
    logger.error("Error in getAnalysis:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/evidence-ai/quality-scores
 * Get quality scores for all analyzed files.
 */
export async function getQualityScores(req: Request, res: Response) {
  const functionName = "getQualityScores";

  try {
    const scores = await getQualityScoresQuery(req.organizationId!);

    logStructured("successful", "quality scores fetched", functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](scores));
  } catch (error) {
    logStructured("error", "failed to get quality scores", functionName, fileName);
    logger.error("Error in getQualityScores:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/evidence-ai/gaps
 * Get evidence gap analysis.
 */
export async function getGaps(req: Request, res: Response) {
  const functionName = "getGaps";

  try {
    const frameworkType = req.query.framework_type
      ? String(Array.isArray(req.query.framework_type) ? req.query.framework_type[0] : req.query.framework_type)
      : undefined;
    const qualityThreshold = req.query.quality_threshold
      ? Number(Array.isArray(req.query.quality_threshold) ? req.query.quality_threshold[0] : req.query.quality_threshold)
      : 50;

    const gaps = await getEvidenceGapsQuery(
      req.organizationId!,
      frameworkType,
      qualityThreshold
    );

    const noEvidence = gaps.filter((g: any) => g.gap_type === "no_evidence");
    const lowQuality = gaps.filter((g: any) => g.gap_type === "low_quality");

    logStructured("successful", "evidence gaps fetched", functionName, fileName);
    return res.status(200).json(
      STATUS_CODE[200]({
        total_controls: gaps.length,
        controls_without_evidence: noEvidence.length,
        controls_with_low_quality: lowQuality.length,
        controls_adequate: gaps.length - noEvidence.length - lowQuality.length,
        quality_threshold: qualityThreshold,
        gaps: gaps.filter((g: any) => g.gap_type !== "adequate"),
      })
    );
  } catch (error) {
    logStructured("error", "failed to get evidence gaps", functionName, fileName);
    logger.error("Error in getGaps:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/evidence-ai/suggestions/:fileId
 * Get suggested control links for a file.
 */
export async function getSuggestions(req: Request, res: Response) {
  const functionName = "getSuggestions";
  const fileId = parseInt(
    Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId
  );

  if (isNaN(fileId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
  }

  try {
    const suggestions = await getSuggestionsQuery(fileId, req.organizationId!);

    if (!suggestions) {
      return res.status(204).json(STATUS_CODE[204](null));
    }

    logStructured("successful", `suggestions found for file ${fileId}`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](suggestions));
  } catch (error) {
    logStructured("error", "failed to get suggestions", functionName, fileName);
    logger.error("Error in getSuggestions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * POST /api/evidence-ai/suggestions/:fileId/apply
 * Apply suggested control links.
 */
export async function applySuggestions(req: Request, res: Response) {
  const functionName = "applySuggestions";
  const fileId = parseInt(
    Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId
  );

  if (isNaN(fileId)) {
    return res.status(400).json(STATUS_CODE[400]("Invalid file ID"));
  }

  try {
    const { suggestions } = req.body;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return res
        .status(400)
        .json(STATUS_CODE[400]("Suggestions array is required"));
    }

    const userId = req.userId ? Number(req.userId) : undefined;
    const result = await applySuggestionsQuery(
      fileId,
      req.organizationId!,
      suggestions,
      userId
    );

    logStructured(
      "successful",
      `applied ${result.applied_count} suggestions for file ${fileId}`,
      functionName,
      fileName
    );
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured("error", "failed to apply suggestions", functionName, fileName);
    logger.error("Error in applySuggestions:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
