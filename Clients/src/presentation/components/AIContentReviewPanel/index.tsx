import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
} from "@mui/material";
import { Bot, Clock, Cpu, Wrench, Target, CheckCircle } from "lucide-react";
import {
  text as textColors,
  border as borderPalette,
  background,
  brand,
  status,
  accent,
} from "../../themes/palette";
import AIContentBadge from "../AIContentBadge";
import type { AIContentMetadata, ReviewAction } from "../../../domain/interfaces/i.aiContent";

interface AIContentReviewPanelProps {
  item: AIContentMetadata;
  onReview: (id: number, action: ReviewAction, notes?: string) => void;
  isReviewing?: boolean;
}

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
        borderRadius: "4px",
        border: `1px solid ${borderPalette.dark}`,
        background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          borderBottom: `1px solid ${borderPalette.light}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: textColors.primary,
              fontFamily: "'Red Hat Display', 'Geist', sans-serif",
            }}
          >
            {item.entity_type.replace(/_/g, " ")}
            <Box component="span" sx={{ color: textColors.accent, fontWeight: 400, ml: 0.5 }}>
              #{item.entity_id}
            </Box>
          </Typography>
          {item.field_name && (
            <Chip
              label={item.field_name}
              size="small"
              sx={{
                height: 18,
                fontSize: 9,
                fontWeight: 500,
                backgroundColor: background.hover,
                color: textColors.secondary,
                border: `1px solid ${borderPalette.light}`,
              }}
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Clock size={12} style={{ color: textColors.accent }} />
            <Typography sx={{ fontSize: 11, color: textColors.accent }}>
              {createdDate}
            </Typography>
          </Stack>
          <AIContentBadge
            badgeType={item.badge_type}
            modelUsed={item.model_used}
            confidenceScore={item.confidence_score}
            humanReviewed={item.human_reviewed}
            reviewAction={item.review_action}
            variant="inline"
            size="small"
          />
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ px: 3, py: 2.5 }}>
        {/* Metadata chips row */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", gap: "10px" }}>
          {item.model_used && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                backgroundColor: background.accent,
                border: `1px solid ${borderPalette.light}`,
                borderRadius: "6px",
                px: 1.5,
                py: 0.75,
              }}
            >
              <Cpu size={12} style={{ color: textColors.icon }} />
              <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
                {item.model_used}
              </Typography>
            </Stack>
          )}
          {item.model_provider && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                backgroundColor: background.accent,
                border: `1px solid ${borderPalette.light}`,
                borderRadius: "6px",
                px: 1.5,
                py: 0.75,
              }}
            >
              <Bot size={12} style={{ color: textColors.icon }} />
              <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
                {item.model_provider}
              </Typography>
            </Stack>
          )}
          {item.tool_name && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                backgroundColor: background.accent,
                border: `1px solid ${borderPalette.light}`,
                borderRadius: "6px",
                px: 1.5,
                py: 0.75,
              }}
            >
              <Wrench size={12} style={{ color: textColors.icon }} />
              <Typography sx={{ fontSize: 11, color: textColors.secondary }}>
                {item.tool_name}
              </Typography>
            </Stack>
          )}
          {item.confidence_score !== null && item.confidence_score !== undefined && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                backgroundColor: accent.primary.bg,
                border: `1px solid ${accent.primary.border}`,
                borderRadius: "6px",
                px: 1.5,
                py: 0.75,
              }}
            >
              <Target size={12} style={{ color: accent.primary.text }} />
              <Typography sx={{ fontSize: 11, color: accent.primary.text, fontWeight: 600 }}>
                {item.confidence_score}%
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Prompt summary */}
        {item.prompt_summary && (
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              backgroundColor: background.accent,
              borderRadius: "6px",
              borderLeft: `3px solid ${brand.primary}`,
            }}
          >
            <Typography sx={{ fontSize: 12, color: textColors.secondary, lineHeight: 1.6 }}>
              {item.prompt_summary}
            </Typography>
          </Box>
        )}

        {/* Already reviewed state */}
        {item.human_reviewed && item.review_action && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              p: 1,
              backgroundColor: status.success.bg,
              borderRadius: "4px",
              border: `1px solid ${status.success.border}`,
            }}
          >
            <CheckCircle size={12} style={{ color: status.success.text }} />
            <Typography sx={{ fontSize: 11, color: status.success.text, fontWeight: 500 }}>
              {item.review_action.charAt(0).toUpperCase() + item.review_action.slice(1)}
              {item.reviewed_at && ` on ${new Date(item.reviewed_at).toLocaleDateString()}`}
            </Typography>
          </Stack>
        )}

        {/* Review actions */}
        {!item.human_reviewed && (
          <Box>
            <TextField
              placeholder="Review notes (optional)"
              size="small"
              fullWidth
              multiline
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{
                mb: 2,
                "& .MuiInputBase-input": { fontSize: 13, py: 1.25 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                  "& fieldset": { borderColor: borderPalette.light },
                  "&:hover fieldset": { borderColor: borderPalette.dark },
                  "&.Mui-focused fieldset": { borderColor: brand.primary },
                },
              }}
            />
            <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
              <Button
                variant="contained"
                size="small"
                disabled={isReviewing}
                onClick={() => onReview(item.id, "approved", notes || undefined)}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: status.success.text,
                  boxShadow: "none",
                  px: 3,
                  py: 1,
                  "&:hover": { backgroundColor: "#0e7d52", boxShadow: "none" },
                }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={isReviewing}
                onClick={() => onReview(item.id, "modified", notes || undefined)}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "6px",
                  borderColor: status.warning.text,
                  color: status.warning.text,
                  px: 3,
                  py: 1,
                  "&:hover": { backgroundColor: status.warning.bg, borderColor: status.warning.text },
                }}
              >
                Modified
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={isReviewing}
                onClick={() => onReview(item.id, "rejected", notes || undefined)}
                sx={{
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: "6px",
                  borderColor: status.error.text,
                  color: status.error.text,
                  px: 3,
                  py: 1,
                  "&:hover": { backgroundColor: status.error.bg, borderColor: status.error.text },
                }}
              >
                Reject
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
