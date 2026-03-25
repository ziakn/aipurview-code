import { Box, Tooltip, Typography, Chip } from "@mui/material";
import { text as textColors } from "../../themes/palette";
import type { BadgeType, ReviewAction } from "../../../domain/interfaces/i.aiContent";

interface AIContentBadgeProps {
  badgeType: BadgeType;
  modelUsed?: string | null;
  confidenceScore?: number | null;
  reviewAction?: ReviewAction | null;
  humanReviewed?: boolean;
  variant?: "inline" | "tooltip" | "card";
  size?: "small" | "medium";
}

const BADGE_CONFIG: Record<BadgeType, { label: string; color: string; bg: string; border: string }> = {
  generated: {
    label: "AI-Generated",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  assisted: {
    label: "AI-Assisted",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  reviewed: {
    label: "AI-Reviewed",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  suggested: {
    label: "AI-Suggested",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
};

const REVIEW_LABELS: Record<ReviewAction, string> = {
  approved: "Approved",
  modified: "Modified",
  rejected: "Rejected",
};

function getConfidenceLabel(score: number): string {
  if (score >= 90) return "Very High";
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export default function AIContentBadge({
  badgeType,
  modelUsed,
  confidenceScore,
  reviewAction,
  humanReviewed,
  variant = "inline",
  size = "small",
}: AIContentBadgeProps) {
  const config = BADGE_CONFIG[badgeType];
  const isSmall = size === "small";

  const tooltipContent = [
    config.label,
    modelUsed ? `Model: ${modelUsed}` : null,
    confidenceScore !== null && confidenceScore !== undefined
      ? `Confidence: ${confidenceScore}% (${getConfidenceLabel(confidenceScore)})`
      : null,
    humanReviewed && reviewAction
      ? `Review: ${REVIEW_LABELS[reviewAction]}`
      : humanReviewed === false
      ? "Not yet reviewed"
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (variant === "inline") {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            backgroundColor: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
            borderRadius: isSmall ? "4px" : "6px",
            padding: isSmall ? "1px 6px" : "3px 10px",
            cursor: "default",
          }}
        >
          <Typography
            sx={{
              fontSize: isSmall ? 9 : 11,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "0.02em",
            }}
          >
            {config.label}
          </Typography>
          {humanReviewed && (
            <Box
              sx={{
                width: isSmall ? 5 : 7,
                height: isSmall ? 5 : 7,
                borderRadius: "50%",
                backgroundColor: reviewAction === "approved" ? "#059669" : reviewAction === "rejected" ? "#DC2626" : "#D97706",
              }}
            />
          )}
        </Box>
      </Tooltip>
    );
  }

  if (variant === "card") {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: config.color }}>
            {config.label}
          </Typography>
          {humanReviewed && reviewAction && (
            <Chip
              label={REVIEW_LABELS[reviewAction]}
              size="small"
              sx={{
                height: 18,
                fontSize: 9,
                fontWeight: 600,
                backgroundColor: reviewAction === "approved" ? "#ECFDF5" : reviewAction === "rejected" ? "#FEF2F2" : "#FFFBEB",
                color: reviewAction === "approved" ? "#059669" : reviewAction === "rejected" ? "#DC2626" : "#D97706",
              }}
            />
          )}
        </Box>
        {modelUsed && (
          <Typography sx={{ fontSize: 10, color: textColors.secondary }}>
            Model: {modelUsed}
          </Typography>
        )}
        {confidenceScore !== null && confidenceScore !== undefined && (
          <Typography sx={{ fontSize: 10, color: textColors.secondary }}>
            Confidence: {confidenceScore}%
          </Typography>
        )}
        {!humanReviewed && (
          <Typography sx={{ fontSize: 10, color: "#D97706", fontWeight: 500, mt: 0.3 }}>
            Pending review
          </Typography>
        )}
      </Box>
    );
  }

  // tooltip variant — just a chip
  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        label={config.label}
        size="small"
        sx={{
          height: isSmall ? 18 : 22,
          fontSize: isSmall ? 9 : 11,
          fontWeight: 600,
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
        }}
      />
    </Tooltip>
  );
}
