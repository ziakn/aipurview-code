import { Box, Typography, LinearProgress } from "@mui/material";
import { status, accent, text as textColors, border, background } from "../../themes/palette";
import type { FrameworkReadinessScore } from "../../../domain/interfaces/i.readiness";

interface ReadinessTrendProps {
  data: FrameworkReadinessScore[];
  isLoading?: boolean;
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

function getScoreColor(score: number) {
  if (score >= 80) return status.success.text;
  if (score >= 60) return accent.primary.text;
  if (score >= 40) return status.warning.text;
  return status.error.text;
}

export default function ReadinessTrend({ data, isLoading }: ReadinessTrendProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          backgroundColor: background.accent,
          borderRadius: 2,
        }}
      >
        <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>
          No readiness history available. Run a calculation to start tracking trends.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: "transparent",
      }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: textColors.primary, mb: 2 }}>
        Readiness Trend
      </Typography>

      {/* Bar chart representation */}
      {data.map((item, idx) => {
        const score = item.avg_score ?? 0;
        const date = item.calculated_at
          ? new Date(item.calculated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—";

        return (
          <Box key={idx} sx={{ mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: textColors.secondary }}>
                {formatFrameworkName(item.framework_type)}
              </Typography>
              <Typography sx={{ fontSize: 11, color: textColors.accent }}>
                {date}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={score}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: background.hover,
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    backgroundColor: getScoreColor(score),
                  },
                }}
              />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: getScoreColor(score),
                  minWidth: 32,
                  textAlign: "right",
                }}
              >
                {score}
              </Typography>
            </Box>
            {/* Distribution summary */}
            <Box sx={{ display: "flex", gap: 1, mt: 0.3 }}>
              <Typography sx={{ fontSize: 9, color: status.success.text }}>
                {item.ready_count ?? 0} ready
              </Typography>
              <Typography sx={{ fontSize: 9, color: accent.primary.text }}>
                {item.needs_work_count ?? 0} needs work
              </Typography>
              <Typography sx={{ fontSize: 9, color: status.warning.text }}>
                {item.at_risk_count ?? 0} at risk
              </Typography>
              <Typography sx={{ fontSize: 9, color: status.error.text }}>
                {item.not_started_count ?? 0} not started
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
