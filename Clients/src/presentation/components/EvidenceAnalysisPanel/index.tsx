import { Box, Typography, Divider, LinearProgress, Button, Stack } from "@mui/material";
import Chip from "../Chip";
import { status, accent, text as textColors, border, background } from "../../themes/palette";
import EvidenceQualityBadge from "../EvidenceQualityBadge";

interface QualityScore {
  relevance: number;
  completeness: number;
  recency: number;
  reliability: number;
  specificity: number;
}

interface SuggestedLink {
  control_id: number;
  control_title: string;
  framework_type: string;
  match_score: number;
  matched_areas: string[];
}

interface AnalysisData {
  file_id: number;
  summary: string;
  key_findings: string[];
  compliance_areas: string[];
  quality_score: QualityScore;
  overall_quality_score: number;
  suggested_control_links: SuggestedLink[];
  analysis_model: string;
  analysis_version: number;
  analyzed_at: string;
}

interface EvidenceAnalysisPanelProps {
  analysis: AnalysisData | null;
  isLoading?: boolean;
  onTriggerAnalysis?: () => void;
  onApplySuggestions?: (suggestions: Array<{ control_id: number; framework_type: string }>) => void;
  isAnalyzing?: boolean;
}

function QualityDimension({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? status.success.text : score >= 40 ? status.warning.text : status.error.text;

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, color: textColors.secondary }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color }}>{score}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: background.hover,
          "& .MuiLinearProgress-bar": {
            borderRadius: 2,
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
}

export default function EvidenceAnalysisPanel({
  analysis,
  isLoading,
  onTriggerAnalysis,
  onApplySuggestions,
  isAnalyzing,
}: EvidenceAnalysisPanelProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
        <Typography sx={{ mt: 1, fontSize: 13, color: textColors.tertiary }}>
          Loading analysis...
        </Typography>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          backgroundColor: background.accent,
          borderRadius: 2,
          border: `1px solid ${border.light}`,
        }}
      >
        <Typography sx={{ fontSize: 14, color: textColors.secondary, mb: 2 }}>
          No AI analysis available for this file yet.
        </Typography>
        {onTriggerAnalysis && (
          <Button
            variant="outlined"
            size="small"
            onClick={onTriggerAnalysis}
            disabled={isAnalyzing}
            sx={{
              textTransform: "none",
              fontSize: 13,
              borderColor: accent.primary.border,
              color: accent.primary.text,
              "&:hover": { backgroundColor: accent.primary.bg },
            }}
          >
            {isAnalyzing ? "Analyzing..." : "Run AI analysis"}
          </Button>
        )}
      </Box>
    );
  }

  const qualityScore = typeof analysis.quality_score === "string"
    ? JSON.parse(analysis.quality_score)
    : analysis.quality_score;

  const suggestedLinks = typeof analysis.suggested_control_links === "string"
    ? JSON.parse(analysis.suggested_control_links)
    : analysis.suggested_control_links || [];

  const complianceAreas = typeof analysis.compliance_areas === "string"
    ? JSON.parse(analysis.compliance_areas)
    : analysis.compliance_areas || [];

  const keyFindings = typeof analysis.key_findings === "string"
    ? JSON.parse(analysis.key_findings)
    : analysis.key_findings || [];

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: textColors.primary }}>
          AI Analysis
        </Typography>
        <EvidenceQualityBadge score={analysis.overall_quality_score} size="medium" />
      </Box>

      {/* Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 0.5 }}>
          Summary
        </Typography>
        <Typography sx={{ fontSize: 13, color: textColors.tertiary, lineHeight: 1.5 }}>
          {analysis.summary}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Quality Breakdown */}
      {qualityScore && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
            Quality Breakdown
          </Typography>
          <QualityDimension label="Relevance" score={qualityScore.relevance} />
          <QualityDimension label="Completeness" score={qualityScore.completeness} />
          <QualityDimension label="Recency" score={qualityScore.recency} />
          <QualityDimension label="Reliability" score={qualityScore.reliability} />
          <QualityDimension label="Specificity" score={qualityScore.specificity} />
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Compliance Areas */}
      {complianceAreas.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
            Compliance areas
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {complianceAreas.map((area: string, i: number) => (
              <Chip
                key={i}
                label={area}
                size="small"
                backgroundColor={accent.blue.bg}
                textColor={accent.blue.text}
                uppercase={false}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
            Key findings ({keyFindings.length})
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {keyFindings.slice(0, 5).map((finding: string, i: number) => (
              <Box
                component="li"
                key={i}
                sx={{ fontSize: 12, color: textColors.tertiary, mb: 0.5, lineHeight: 1.4 }}
              >
                {finding.length > 120 ? finding.substring(0, 120) + "..." : finding}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Suggested Control Links */}
      {suggestedLinks.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
            Suggested Control Links ({suggestedLinks.length})
          </Typography>
          {suggestedLinks.slice(0, 5).map((link: SuggestedLink, i: number) => (
            <Box
              key={i}
              sx={{
                p: 1,
                mb: 0.5,
                backgroundColor: background.accent,
                borderRadius: 1,
                border: `1px solid ${border.light}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: 12, color: textColors.secondary, fontWeight: 500 }}>
                  {link.control_title}
                </Typography>
                <Chip
                  label={`${link.match_score}%`}
                  size="small"
                  variant={link.match_score >= 70 ? "success" : "warning"}
                  uppercase={false}
                />
              </Box>
              <Typography sx={{ fontSize: 11, color: textColors.accent }}>
                {link.framework_type.replace(/_/g, " ").toUpperCase()}
              </Typography>
            </Box>
          ))}
          {onApplySuggestions && (
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                onApplySuggestions(
                  suggestedLinks.map((s: SuggestedLink) => ({
                    control_id: s.control_id,
                    framework_type: s.framework_type,
                  }))
                )
              }
              sx={{
                mt: 1,
                textTransform: "none",
                fontSize: 12,
                borderColor: accent.primary.border,
                color: accent.primary.text,
                "&:hover": { backgroundColor: accent.primary.bg },
              }}
            >
              Apply All Suggestions
            </Button>
          )}
        </Box>
      )}

      {/* Analysis Meta */}
      <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${border.light}` }}>
        <Typography sx={{ fontSize: 10, color: textColors.accent }}>
          Analyzed by {analysis.analysis_model} (v{analysis.analysis_version}) at{" "}
          {new Date(analysis.analyzed_at).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}
