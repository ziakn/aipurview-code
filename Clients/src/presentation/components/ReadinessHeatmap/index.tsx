import { Box, Typography, Tooltip, Stack } from "@mui/material";
import { status, accent, text as textColors, border, background } from "../../themes/palette";
import type { ReadinessLevel, ControlReadinessScore } from "../../../domain/interfaces/i.readiness";

interface ReadinessHeatmapProps {
  controls: ControlReadinessScore[];
  frameworkType: string;
  isLoading?: boolean;
}

function getLevelColor(level: ReadinessLevel) {
  switch (level) {
    case "ready": return status.success;
    case "needs_work": return accent.primary;
    case "at_risk": return status.warning;
    case "not_started": return status.error;
  }
}

function getLevelLabel(level: ReadinessLevel) {
  switch (level) {
    case "ready": return "Ready";
    case "needs_work": return "Needs Work";
    case "at_risk": return "At Risk";
    case "not_started": return "Not Started";
  }
}

function formatFrameworkName(type: string): string {
  const names: Record<string, string> = {
    eu_ai_act: "EU AI Act",
    iso_42001: "ISO 42001",
    iso_27001: "ISO 27001",
    nist_ai_rmf: "NIST AI RMF",
  };
  return names[type] || type.replace(/_/g, " ").toUpperCase();
}

export default function ReadinessHeatmap({
  controls,
  frameworkType,
  isLoading,
}: ReadinessHeatmapProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>Loading heatmap...</Typography>
      </Box>
    );
  }

  if (!controls || controls.length === 0) {
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
        <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>
          No readiness data. Run a calculation first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${border.light}`,
        backgroundColor: background.main,
      }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: textColors.primary, mb: 1.5 }}>
        {formatFrameworkName(frameworkType)} — Control Readiness
      </Typography>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        {(["ready", "needs_work", "at_risk", "not_started"] as ReadinessLevel[]).map((level) => {
          const colors = getLevelColor(level);
          return (
            <Box key={level} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "2px",
                  backgroundColor: colors.text,
                }}
              />
              <Typography sx={{ fontSize: 10, color: textColors.secondary }}>
                {getLevelLabel(level)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Heatmap grid */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {controls.map((ctrl) => {
          const colors = getLevelColor(ctrl.readiness_level);
          return (
            <Tooltip
              key={ctrl.control_id}
              title={`Control ${ctrl.control_id}: ${ctrl.overall_score}/100 (${getLevelLabel(ctrl.readiness_level)})`}
              arrow
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "4px",
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "default",
                  "&:hover": {
                    transform: "scale(1.15)",
                    zIndex: 1,
                  },
                  transition: "transform 0.15s ease",
                }}
              >
                <Typography
                  sx={{ fontSize: 9, fontWeight: 600, color: colors.text, lineHeight: 1 }}
                >
                  {ctrl.overall_score}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <Typography sx={{ mt: 1.5, fontSize: 10, color: textColors.accent }}>
        {controls.length} controls evaluated
      </Typography>
    </Box>
  );
}
