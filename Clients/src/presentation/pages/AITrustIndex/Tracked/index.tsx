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
  CircularProgress,
} from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import Chip from "../../../components/Chip";
import { palette } from "../../../themes/palette";
import { useTracked, useUntrackApp } from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { GRADE_COLOR, TrustIndexRow } from "../shared";
import MCPTable from "../../AIGateway/MCPTable";
import type { MCPTableColumn } from "../../AIGateway/MCPTable";

const COLUMNS: MCPTableColumn[] = [
  { label: "Name" },
  { label: "Vendor" },
  { label: "Category" },
  { label: "Grade" },
  { label: "Score" },
  { label: "Status" },
  { label: "Action", align: "right" },
];

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
        <MCPTable<TrustIndexRow>
          id="ai-trust-index-tracked-table"
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.app_slug ?? row.slug}
          onRowClick={(row) => navigate(`/ai-trust-index/${row.slug}`)}
          rowSx={(row) => (row.no_longer_in_index ? { opacity: 0.6 } : {})}
          renderRow={(row) => [
            // Name
            <Typography component="span" sx={{ fontWeight: 500, fontSize: "inherit" }}>
              {row.name || row.slug}
            </Typography>,
            // Vendor
            row.vendor || "—",
            // Category
            row.category || "—",
            // Grade
            <GradeChip grade={row.data?.displayedGrade || row.letter_grade} />,
            // Score
            row.score_out_of_100 != null ? `${row.score_out_of_100}/100` : "—",
            // Status
            row.no_longer_in_index ? (
              <Chip label="No longer in index" variant="warning" uppercase={false} />
            ) : (
              <Chip label="Tracked" variant="success" uppercase={false} />
            ),
            // Untrack action — stopPropagation so clicking it doesn't trigger row nav
            <span onClick={(e) => e.stopPropagation()} key="untrack">
              <CustomizableButton
                text="Untrack"
                variant="outlined"
                onClick={() => handleUntrack(row.slug)}
                isDisabled={untrackApp.isPending}
                sx={{ height: 28, mt: 0 }}
              />
            </span>,
          ]}
        />
      )}
    </PageHeaderExtended>
  );
}
