import { Box, Typography, Stack, Chip } from "@mui/material";
import { status, accent, text as textColors, border, background } from "../../themes/palette";

interface WeakControl {
  control_id: number;
  framework_type: string;
  overall_score: number;
  readiness_level: string;
  priority?: string;
  recommendations?: string[];
}

interface WeakControlsListProps {
  controls: WeakControl[];
  isLoading?: boolean;
  maxItems?: number;
}

function getPriorityColor(priority: string | undefined) {
  switch (priority) {
    case "critical": return status.error;
    case "high": return status.warning;
    case "medium": return accent.primary;
    default: return { bg: background.hover, text: textColors.tertiary, border: border.light };
  }
}

function getPriorityFromScore(score: number): string {
  if (score < 30) return "critical";
  if (score < 60) return "high";
  return "medium";
}

function formatFrameworkName(type: string): string {
  const names: Record<string, string> = {
    eu_ai_act: "EU AI Act",
    iso_42001: "ISO 42001",
  };
  return names[type] || type.replace(/_/g, " ").toUpperCase();
}

export default function WeakControlsList({
  controls,
  isLoading,
  maxItems = 10,
}: WeakControlsListProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>Loading...</Typography>
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
          No weak controls found. Your compliance posture looks strong!
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
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: textColors.primary, mb: 2 }}>
        Weakest Controls
      </Typography>

      <Stack spacing={1}>
        {controls.slice(0, maxItems).map((ctrl, i) => {
          const priority = ctrl.priority || getPriorityFromScore(ctrl.overall_score);
          const priColor = getPriorityColor(priority);

          const recs: string[] = ctrl.recommendations
            ? typeof ctrl.recommendations === "string"
              ? JSON.parse(ctrl.recommendations as unknown as string)
              : ctrl.recommendations
            : [];

          return (
            <Box
              key={`${ctrl.control_id}-${i}`}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${priColor.border}`,
                backgroundColor: priColor.bg,
              }}
            >
              {/* Control header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.primary }}>
                    Control #{ctrl.control_id}
                  </Typography>
                  <Chip
                    label={formatFrameworkName(ctrl.framework_type)}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 500,
                      backgroundColor: background.hover,
                      color: textColors.secondary,
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Chip
                    label={priority.toUpperCase()}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 9,
                      fontWeight: 700,
                      backgroundColor: priColor.text,
                      color: "#fff",
                    }}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: priColor.text }}>
                    {ctrl.overall_score}
                  </Typography>
                </Box>
              </Box>

              {/* Recommendations */}
              {recs.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                  {recs.slice(0, 3).map((rec, j) => (
                    <Typography
                      key={j}
                      sx={{
                        fontSize: 11,
                        color: textColors.secondary,
                        pl: 1.5,
                        position: "relative",
                        "&::before": {
                          content: '"\\2022"',
                          position: "absolute",
                          left: 0,
                          color: textColors.accent,
                        },
                      }}
                    >
                      {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
