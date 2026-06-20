/**
 * @fileoverview AI Trust Index — Tracked tab.
 *
 * Lists apps the organization tracks, flags ones removed from the index, and
 * supports inline untracking. Sorting and pagination are fully client-side
 * since the tracked list is loaded in full.
 *
 * @module pages/AITrustIndex/Tracked
 */

import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, TablePagination, CircularProgress } from "@mui/material";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import Chip from "../../../components/Chip";
import TablePaginationActions from "../../../components/TablePagination";
import { palette } from "../../../themes/palette";
import { useTracked, useUntrackApp } from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { gradeVariant, categoryVariant, TrustIndexRow } from "../shared";
import MCPTable from "../../AIGateway/MCPTable";
import type { MCPTableColumn } from "../../AIGateway/MCPTable";

const COLUMNS: MCPTableColumn[] = [
  { label: "Name", sortKey: "name" },
  { label: "Vendor", sortKey: "vendor" },
  { label: "Category", sortKey: "category" },
  { label: "Grade", sortKey: "grade" },
  { label: "Score", sortKey: "score" },
  { label: "Status", sortKey: "status" },
  { label: "Action", align: "right" },
];

const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 25];

function GradeChip({ grade }: { grade?: string }) {
  if (!grade)
    return <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>—</Typography>;
  return <Chip label={grade} variant={gradeVariant(grade)} />;
}

/** Pull the comparable value for a given sort column out of a row. */
function sortValue(row: TrustIndexRow, key: string): string | number {
  switch (key) {
    case "name":
      return (row.name || row.slug || "").toLowerCase();
    case "vendor":
      return (row.vendor || "").toLowerCase();
    case "category":
      return (row.category || "").toLowerCase();
    case "grade":
      return (row.data?.displayedGrade || row.letter_grade || "").toUpperCase();
    case "score":
      return row.score_out_of_100 ?? -1;
    case "status":
      // Tracked sorts before "No longer in index".
      return row.no_longer_in_index ? 1 : 0;
    default:
      return "";
  }
}

export default function Tracked() {
  const navigate = useNavigate();
  const sidebar = useAITrustIndexSidebarContextSafe();
  const { data, isLoading, isError } = useTracked();
  const untrackApp = useUntrackApp();

  const [sortBy, setSortBy] = useState("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const rows: TrustIndexRow[] = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : [];
    // Backend rows expose app_slug; normalize to slug for navigation/keys.
    return list.map((r: any) => ({ ...r, slug: r.slug ?? r.app_slug }));
  }, [data]);

  // Client-side sort over the fully-loaded rows.
  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortValue(a, sortBy);
      const bv = sortValue(b, sortBy);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortBy, sortDir]);

  const pagedRows = useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const handleSort = useCallback((key: string) => {
    setSortBy((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortDir("asc");
      }
      return key;
    });
    setPage(0);
  }, []);

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
        <>
          <MCPTable<TrustIndexRow>
            id="ai-trust-index-tracked-table"
            columns={COLUMNS}
            rows={pagedRows}
            rowKey={(row) => row.app_slug ?? row.slug}
            onRowClick={(row) => navigate(`/ai-trust-index/${row.slug}`)}
            rowSx={(row) => (row.no_longer_in_index ? { opacity: 0.6 } : {})}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            renderRow={(row) => [
              // Name
              <Typography component="span" sx={{ fontWeight: 500, fontSize: "inherit" }}>
                {row.name || row.slug}
              </Typography>,
              // Vendor
              row.vendor || "—",
              // Category — a real VerifyWise chip, distinct variant per category
              row.category ? (
                <Chip
                  label={row.category}
                  variant={categoryVariant(row.category)}
                  uppercase={false}
                />
              ) : (
                "—"
              ),
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
                  size="small"
                  onClick={() => handleUntrack(row.slug)}
                  isDisabled={untrackApp.isPending}
                />
              </span>,
            ]}
          />
          <Stack direction="row" alignItems="center" justifyContent="flex-end" px="32px">
            <TablePagination
              component="div"
              count={sortedRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              ActionsComponent={TablePaginationActions as any}
              labelRowsPerPage="Rows per page"
              sx={{ mt: "48px" }}
            />
          </Stack>
        </>
      )}
    </PageHeaderExtended>
  );
}
