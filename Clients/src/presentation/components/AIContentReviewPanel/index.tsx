import { useState } from "react";
import { Box, Typography, Button, TextField, Stack, Chip } from "@mui/material";
import { text as textColors, border, background } from "../../themes/palette";
import AIContentBadge from "../AIContentBadge";
import type { AIContentMetadata, ReviewAction } from "../../../domain/interfaces/i.aiContent";

interface AIContentReviewPanelProps {
  item: AIContentMetadata;
  onReview: (id: number, action: ReviewAction, notes?: string) => void;
  isReviewing?: boolean;
}

const REVIEW_ACTIONS: { value: ReviewAction; label: string; color: string; description: string }[] = [
  { value: "approved", label: "Approve", color: "#059669", description: "Content is accurate and acceptable" },
  { value: "modified", label: "Modified", color: "#D97706", description: "Content was modified before acceptance" },
  { value: "rejected", label: "Reject", color: "#DC2626", description: "Content is not acceptable" },
];

export default function AIContentReviewPanel({
  item,
  onReview,
  isReviewing,
}: AIContentReviewPanelProps) {
  const [notes, setNotes] = useState("");

  const createdDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${border.light}`,
        backgroundColor: background.main,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: textColors.primary }}>
              {item.entity_type}#{item.entity_id}
            </Typography>
            {item.field_name && (
              <Chip
                label={item.field_name}
                size="small"
                sx={{ height: 18, fontSize: 9, backgroundColor: background.hover, color: textColors.secondary }}
              />
            )}
          </Box>
          <Typography sx={{ fontSize: 11, color: textColors.accent }}>
            Created: {createdDate}
          </Typography>
        </Box>
        <AIContentBadge
          badgeType={item.badge_type}
          modelUsed={item.model_used}
          confidenceScore={item.confidence_score}
          humanReviewed={item.human_reviewed}
          reviewAction={item.review_action}
          variant="inline"
        />
      </Box>

      {/* Metadata */}
      <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        {item.model_used && (
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
            <strong>Model:</strong> {item.model_used}
          </Typography>
        )}
        {item.model_provider && (
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
            <strong>Provider:</strong> {item.model_provider}
          </Typography>
        )}
        {item.tool_name && (
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
            <strong>Tool:</strong> {item.tool_name}
          </Typography>
        )}
        {item.confidence_score !== null && (
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
            <strong>Confidence:</strong> {item.confidence_score}%
          </Typography>
        )}
      </Box>

      {item.prompt_summary && (
        <Box sx={{ mb: 1.5, p: 1, backgroundColor: background.hover, borderRadius: 1 }}>
          <Typography sx={{ fontSize: 10, color: textColors.accent, mb: 0.3 }}>Prompt Summary</Typography>
          <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
            {item.prompt_summary}
          </Typography>
        </Box>
      )}

      {/* Already reviewed */}
      {item.human_reviewed && item.review_action && (
        <Box sx={{ p: 1, backgroundColor: "#ECFDF5", borderRadius: 1, mb: 1.5 }}>
          <Typography sx={{ fontSize: 11, color: "#059669", fontWeight: 500 }}>
            Reviewed: {item.review_action.charAt(0).toUpperCase() + item.review_action.slice(1)}
            {item.reviewed_at && ` on ${new Date(item.reviewed_at).toLocaleDateString()}`}
          </Typography>
        </Box>
      )}

      {/* Review actions (only if not yet reviewed) */}
      {!item.human_reviewed && (
        <>
          <TextField
            placeholder="Review notes (optional)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 1.5, "& .MuiInputBase-input": { fontSize: 12 } }}
          />
          <Stack direction="row" spacing={1}>
            {REVIEW_ACTIONS.map((action) => (
              <Button
                key={action.value}
                variant="outlined"
                size="small"
                disabled={isReviewing}
                onClick={() => onReview(item.id, action.value, notes || undefined)}
                sx={{
                  textTransform: "none",
                  fontSize: 11,
                  borderColor: action.color,
                  color: action.color,
                  "&:hover": {
                    backgroundColor: `${action.color}10`,
                    borderColor: action.color,
                  },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}
