import { useState } from "react";
import { Box, Typography, Button, CircularProgress, Tab, Tabs, Chip } from "@mui/material";
import { text as textColors, background, border, status } from "../../themes/palette";
import AIContentBadge from "../../components/AIContentBadge";
import AIContentReviewPanel from "../../components/AIContentReviewPanel";
import AIContentStats from "../../components/AIContentStats";
import {
  useUnreviewedContent,
  useAIContentStats,
  useReviewContent,
} from "../../../application/hooks/useAIContent";
import type { ReviewAction } from "../../../domain/interfaces/i.aiContent";

export default function AIContentReview() {
  const [tab, setTab] = useState(0);
  const { data: statsData, isLoading: statsLoading } = useAIContentStats();
  const { data: unreviewedData, isLoading: unreviewedLoading } = useUnreviewedContent(50);
  const reviewMutation = useReviewContent();

  const handleReview = (id: number, action: ReviewAction, notes?: string) => {
    reviewMutation.mutate({ id, action, notes });
  };

  const items = unreviewedData?.items ?? [];
  const total = unreviewedData?.total ?? 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: textColors.primary }}>
            AI Content Review
          </Typography>
          <Typography sx={{ fontSize: 13, color: textColors.secondary, mt: 0.5 }}>
            Review and approve AI-generated content for EU AI Act Article 52 transparency compliance.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <AIContentBadge badgeType="generated" variant="tooltip" size="medium" />
          <AIContentBadge badgeType="assisted" variant="tooltip" size="medium" />
          <AIContentBadge badgeType="reviewed" variant="tooltip" size="medium" />
          <AIContentBadge badgeType="suggested" variant="tooltip" size="medium" />
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 3, maxWidth: 600 }}>
        <AIContentStats data={statsData} isLoading={statsLoading} />
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              Pending Review
              {total > 0 && (
                <Chip
                  label={total}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: status.warning.bg,
                    color: status.warning.text,
                  }}
                />
              )}
            </Box>
          }
          sx={{ textTransform: "none" }}
        />
        <Tab label="All AI Content" sx={{ textTransform: "none" }} />
      </Tabs>

      {/* Content */}
      {tab === 0 && (
        <Box>
          {unreviewedLoading ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : items.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((item: any) => (
                <AIContentReviewPanel
                  key={item.id}
                  item={item}
                  onReview={handleReview}
                  isReviewing={reviewMutation.isPending}
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                backgroundColor: background.accent,
                borderRadius: 2,
                border: `1px solid ${border.light}`,
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: status.success.text, mb: 0.5 }}>
                All caught up!
              </Typography>
              <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>
                No AI-generated content pending review.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {tab === 1 && (
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
            Full AI content history will be available in a future release.
            Use the stats widget above for current overview.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
