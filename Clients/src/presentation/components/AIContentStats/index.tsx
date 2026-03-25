import { Box, Typography, LinearProgress, Stack } from "@mui/material";
import { text as textColors, border, background, status, accent } from "../../themes/palette";

interface AIContentStatsData {
  total: number;
  reviewed: number;
  unreviewed: number;
  review_rate: number;
  by_badge_type: {
    generated: number;
    assisted: number;
    reviewed: number;
    suggested: number;
  };
  by_review_action: {
    approved: number;
    modified: number;
    rejected: number;
  };
  avg_confidence: number | null;
}

interface AIContentStatsProps {
  data: AIContentStatsData | null;
  isLoading?: boolean;
}

const BADGE_COLORS: Record<string, { label: string; color: string }> = {
  generated: { label: "AI-Generated", color: "#7C3AED" },
  assisted: { label: "AI-Assisted", color: "#2563EB" },
  reviewed: { label: "AI-Reviewed", color: "#059669" },
  suggested: { label: "AI-Suggested", color: "#D97706" },
};

export default function AIContentStats({ data, isLoading }: AIContentStatsProps) {
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!data || data.total === 0) {
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
          No AI-generated content tracked yet.
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
        AI Content Transparency
      </Typography>

      {/* Summary stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: textColors.primary }}>
            {data.total}
          </Typography>
          <Typography sx={{ fontSize: 10, color: textColors.secondary }}>Total Items</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: status.success.text }}>
            {data.review_rate}%
          </Typography>
          <Typography sx={{ fontSize: 10, color: textColors.secondary }}>Reviewed</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 80, textAlign: "center" }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: status.warning.text }}>
            {data.unreviewed}
          </Typography>
          <Typography sx={{ fontSize: 10, color: textColors.secondary }}>Pending</Typography>
        </Box>
        {data.avg_confidence !== null && (
          <Box sx={{ flex: 1, minWidth: 80, textAlign: "center" }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: accent.primary.text }}>
              {data.avg_confidence}%
            </Typography>
            <Typography sx={{ fontSize: 10, color: textColors.secondary }}>Avg Confidence</Typography>
          </Box>
        )}
      </Box>

      {/* Review progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>Review Progress</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: textColors.primary }}>
            {data.reviewed}/{data.total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={data.review_rate}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: background.hover,
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              backgroundColor: data.review_rate >= 80 ? status.success.text : data.review_rate >= 50 ? status.warning.text : status.error.text,
            },
          }}
        />
      </Box>

      {/* Badge type breakdown */}
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
        By Type
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {Object.entries(data.by_badge_type).map(([key, count]) => {
          const config = BADGE_COLORS[key];
          if (!config || count === 0) return null;
          const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
          return (
            <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: config.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 11, color: textColors.secondary, flex: 1 }}>
                {config.label}
              </Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: config.color }}>
                {count} ({pct}%)
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {/* Review actions breakdown */}
      {(data.by_review_action.approved > 0 || data.by_review_action.modified > 0 || data.by_review_action.rejected > 0) && (
        <>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: textColors.secondary, mb: 1 }}>
            Review Outcomes
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {data.by_review_action.approved > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, backgroundColor: "#ECFDF5", borderRadius: "4px", padding: "2px 8px" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>{data.by_review_action.approved}</Typography>
                <Typography sx={{ fontSize: 10, color: "#059669" }}>Approved</Typography>
              </Box>
            )}
            {data.by_review_action.modified > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, backgroundColor: "#FFFBEB", borderRadius: "4px", padding: "2px 8px" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#D97706" }}>{data.by_review_action.modified}</Typography>
                <Typography sx={{ fontSize: 10, color: "#D97706" }}>Modified</Typography>
              </Box>
            )}
            {data.by_review_action.rejected > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, backgroundColor: "#FEF2F2", borderRadius: "4px", padding: "2px 8px" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>{data.by_review_action.rejected}</Typography>
                <Typography sx={{ fontSize: 10, color: "#DC2626" }}>Rejected</Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
