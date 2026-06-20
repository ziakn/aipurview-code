/**
 * @fileoverview AI Trust Index — Tracked tab.
 *
 * Lists apps the organization tracks, flags ones removed from the index, and
 * supports inline untracking.
 *
 * @module pages/AITrustIndex/Tracked
 */

import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import Chip from "../../../components/Chip";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import { useTracked, useUntrackApp } from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { GRADE_COLOR, TrustIndexRow } from "../shared";

function GradeChip({ grade }: { grade?: string }) {
  if (!grade) return <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>—</Typography>;
  const color = GRADE_COLOR[grade.charAt(0).toUpperCase()] ?? palette.text.tertiary;
  return <Chip label={grade} backgroundColor={`${color}1A`} textColor={color} />;
}

export default function Tracked() {
  const navigate = useNavigate();
  const sidebar = useAITrustIndexSidebarContextSafe();
  const { data, isLoading, isError } = useTracked();
  const untrackApp = useUntrackApp();

  const rows: TrustIndexRow[] = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : [];
    // Backend rows expose app_slug; normalize to slug for navigation/keys.
    return list.map((r: any) => ({ ...r, slug: r.slug ?? r.app_slug }));
  }, [data]);

  const handleUntrack = useCallback(
    (slug: string) => {
      untrackApp.mutate(slug, { onSuccess: () => sidebar?.refreshTrackedCount() });
    },
    [untrackApp, sidebar],
  );

  const headerCellSx = singleTheme.tableStyles.primary.header.cell;
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <PageHeaderExtended
      title="Tracked apps"
      description="AI applications your organization is tracking. We'll notify recipients when a tracked app's assessment changes materially."
    >
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} sx={{ color: palette.brand.primary }} />
        </Box>
      )}

      {isError && (
        <EmptyState
          message="We couldn't load your tracked apps right now. Please try again later."
          showBorder
        />
      )}

      {isEmpty && !isError && (
        <EmptyState
          message="You're not tracking any apps yet. Track apps from the Browse tab to monitor changes."
          showBorder
        />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <TableContainer id="ai-trust-index-tracked-table">
          <Table sx={singleTheme.tableStyles.primary.frame}>
            <TableHead
              sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}
            >
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                <TableCell style={headerCellSx}>Name</TableCell>
                <TableCell style={headerCellSx}>Vendor</TableCell>
                <TableCell style={headerCellSx}>Category</TableCell>
                <TableCell style={headerCellSx}>Grade</TableCell>
                <TableCell style={headerCellSx}>Score</TableCell>
                <TableCell style={headerCellSx}>Status</TableCell>
                <TableCell style={headerCellSx} align="right">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.slug}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    "height": "36px",
                    "&:hover td": { backgroundColor: palette.background.surface },
                  }}
                  onClick={() => navigate(`/ai-trust-index/${row.slug}`)}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{row.name || row.slug}</TableCell>
                  <TableCell>{row.vendor || "—"}</TableCell>
                  <TableCell>{row.category || "—"}</TableCell>
                  <TableCell>
                    <GradeChip grade={row.data?.displayedGrade || row.letter_grade} />
                  </TableCell>
                  <TableCell>
                    {row.score_out_of_100 != null ? `${row.score_out_of_100}/100` : "—"}
                  </TableCell>
                  <TableCell>
                    {row.no_longer_in_index ? (
                      <Chip label="No longer in index" variant="warning" uppercase={false} />
                    ) : (
                      <Chip label="Tracked" variant="success" uppercase={false} />
                    )}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <CustomizableButton
                      text="Untrack"
                      variant="outlined"
                      onClick={() => handleUntrack(row.slug)}
                      isDisabled={untrackApp.isPending}
                      sx={{ height: 28, mt: 0 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageHeaderExtended>
  );
}
