/**
 * @fileoverview AI Trust Index — Browse app card.
 *
 * A single app tile for the Browse card grid: favicon, name, dealbreaker flag,
 * grade chip, summary, category chip, score, plus the app-only controls a
 * select checkbox and a track/untrack button. Clicking the card body navigates
 * to the detail page; the checkbox and track button stop propagation so they
 * don't trigger navigation.
 *
 * @module pages/AITrustIndex/Browse/AppCard
 */

import { Box, Stack, Typography } from "@mui/material";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import Checkbox from "../../../components/Inputs/Checkbox";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Chip from "../../../components/Chip";
import { palette } from "../../../themes/palette";
import { gradeVariant, categoryVariant, faviconUrl, TrustIndexRow } from "../shared";

interface AppCardProps {
  row: TrustIndexRow;
  selected: boolean;
  trackPending: boolean;
  onOpen: (slug: string) => void;
  onToggleSelect: (slug: string) => void;
  onToggleTrack: (row: TrustIndexRow) => void;
}

export default function AppCard({
  row,
  selected,
  trackPending,
  onOpen,
  onToggleSelect,
  onToggleTrack,
}: AppCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const detail = row.data;
  const grade = detail?.displayedGrade || row.letter_grade;
  const hasFlag = (detail?.dealbreakerFlags?.length ?? 0) > 0;
  const initial = (row.name || "?").charAt(0).toUpperCase();
  const domain = detail?.domain;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row.slug)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(row.slug);
        }
      }}
      sx={{
        "display": "flex",
        "flexDirection": "column",
        "border": `1px solid ${palette.border.dark}`,
        "borderRadius": "4px",
        "backgroundColor": palette.background.main,
        "p": "16px",
        "cursor": "pointer",
        "transition": "box-shadow 150ms ease, border-color 150ms ease",
        "&:hover": {
          boxShadow: "0 4px 20px rgba(16,24,40,0.08)",
          borderColor: palette.text.muted,
        },
      }}
    >
      {/* Header: select + favicon + name/vendor + grade */}
      <Stack direction="row" alignItems="flex-start" gap="8px">
        <Box
          component="span"
          onClick={(e) => e.stopPropagation()}
          sx={{ display: "flex", alignItems: "center", pt: "2px" }}
        >
          <Checkbox
            id={`ai-trust-index-card-select-${row.slug}`}
            size="small"
            value={row.slug}
            isChecked={selected}
            onChange={() => onToggleSelect(row.slug)}
            ariaLabel={`Select ${row.name}`}
            sx={{ p: 0 }}
          />
        </Box>

        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            border: `1px solid ${palette.border.dark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: palette.background.accent,
            overflow: "hidden",
          }}
        >
          {domain && !imgFailed ? (
            <img
              src={faviconUrl(domain)}
              alt={row.name}
              width={20}
              height={20}
              onError={() => setImgFailed(true)}
              style={{ display: "block" }}
            />
          ) : (
            <Typography sx={{ fontSize: "15px", fontWeight: 600, color: palette.text.tertiary }}>
              {initial}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap="4px">
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: palette.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.name}
            </Typography>
            {hasFlag && (
              <AlertTriangle
                size={14}
                strokeWidth={1.5}
                color="#B23B3B"
                aria-label="Dealbreaker flag"
                style={{ flexShrink: 0 }}
              />
            )}
          </Stack>
          <Typography
            sx={{
              fontSize: "12px",
              color: palette.text.tertiary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.vendor && row.vendor !== row.name ? row.vendor : row.category || "—"}
          </Typography>
        </Box>

        {grade && <Chip label={grade} variant={gradeVariant(grade)} />}
      </Stack>

      {/* Summary — clamped to 4 lines */}
      {detail?.summary && (
        <Typography
          sx={{
            mt: "12px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: palette.text.tertiary,
            flex: 1,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 4,
          }}
        >
          {detail.summary}
        </Typography>
      )}

      {/* Footer: category chip + score + track button */}
      <Stack direction="row" alignItems="center" gap="8px" sx={{ mt: "12px", flexWrap: "wrap" }}>
        {row.category && (
          <Chip label={row.category} variant={categoryVariant(row.category)} uppercase={false} />
        )}
        {row.score_out_of_100 != null && (
          <Typography sx={{ fontSize: "12px", fontWeight: 600, color: palette.text.tertiary }}>
            {row.score_out_of_100}/100
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Box component="span" onClick={(e) => e.stopPropagation()}>
          <CustomizableButton
            text={row.is_tracked ? "Untrack" : "Track"}
            variant="outlined"
            size="small"
            onClick={() => onToggleTrack(row)}
            isDisabled={trackPending}
          />
        </Box>
      </Stack>
    </Box>
  );
}
