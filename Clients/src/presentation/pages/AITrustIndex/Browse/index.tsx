/**
 * @fileoverview AI Trust Index — Browse tab.
 *
 * Server-paginated catalogue of assessed AI apps with search, category/grade
 * filters, sort, bulk-select tracking, and per-row track/untrack.
 *
 * @module pages/AITrustIndex/Browse
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Typography,
  TablePagination,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { SearchBox } from "../../../components/Search";
import { CustomSelect } from "../../../components/CustomSelect";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import Chip from "../../../components/Chip";
import { palette } from "../../../themes/palette";
import { useApps, useTrackApp, useUntrackApp, useTrackAppsBulk } from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { GRADE_COLOR, TrustIndexRow } from "../shared";
import MCPTable from "../../AIGateway/MCPTable";
import type { MCPTableColumn } from "../../AIGateway/MCPTable";

const PAGE_SIZE = 25;
const SORT_OPTIONS = [
  { value: "score", label: "Highest score" },
  { value: "name", label: "Name" },
];

function GradeChip({ grade }: { grade?: string }) {
  if (!grade) return <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>—</Typography>;
  const color = GRADE_COLOR[grade.charAt(0).toUpperCase()] ?? palette.text.tertiary;
  return <Chip label={grade} backgroundColor={`${color}1A`} textColor={color} />;
}

export default function Browse() {
  const navigate = useNavigate();
  const sidebar = useAITrustIndexSidebarContextSafe();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  // Debounce the search input (~300ms) before it hits the query.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isLoading, isError } = useApps({
    search,
    category,
    grade,
    sort,
    page: page + 1,
    pageSize: PAGE_SIZE,
  });

  const trackApp = useTrackApp();
  const untrackApp = useUntrackApp();
  const trackBulk = useTrackAppsBulk();

  const payload = data?.data;
  const rows: TrustIndexRow[] = useMemo(() => payload?.apps ?? [], [payload]);
  const total: number = payload?.total ?? 0;
  const categories: string[] = useMemo(() => payload?.categories ?? [], [payload]);

  const categoryOptions = useMemo(
    () => [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))],
    [categories],
  );
  const gradeOptions = useMemo(
    () => [
      { value: "", label: "All grades" },
      ...["A", "B", "C", "D", "F"].map((g) => ({ value: g, label: g })),
    ],
    [],
  );

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.includes(r.slug));
  const someOnPageSelected = rows.some((r) => selected.includes(r.slug));

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (allOnPageSelected) {
        return prev.filter((s) => !rows.some((r) => r.slug === s));
      }
      const next = new Set(prev);
      rows.forEach((r) => next.add(r.slug));
      return Array.from(next);
    });
  }, [allOnPageSelected, rows]);

  const toggleRow = useCallback((slug: string) => {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const handleTrackSelected = useCallback(() => {
    if (selected.length === 0) return;
    trackBulk.mutate(selected, {
      onSuccess: () => {
        setSelected([]);
        sidebar?.refreshTrackedCount();
      },
    });
  }, [selected, trackBulk, sidebar]);

  const handleToggleTrack = useCallback(
    (row: TrustIndexRow) => {
      const onDone = () => sidebar?.refreshTrackedCount();
      if (row.is_tracked) {
        untrackApp.mutate(row.slug, { onSuccess: onDone });
      } else {
        trackApp.mutate(row.slug, { onSuccess: onDone });
      }
    },
    [trackApp, untrackApp, sidebar],
  );

  const isEmpty = !isLoading && rows.length === 0;

  const columns: MCPTableColumn[] = [
    { label: "", width: 48 },
    { label: "Name" },
    { label: "Vendor" },
    { label: "Category" },
    { label: "Grade" },
    { label: "Score" },
    { label: "Action", align: "right" },
  ];

  return (
    <PageHeaderExtended
      title="AI Trust Index"
      description="Browse independently assessed AI applications and track the ones that matter to your organization."
    >
      {/* Filters */}
      <Stack
        direction="row"
        alignItems="center"
        gap="8px"
        flexWrap="wrap"
        sx={{ mb: "16px" }}
      >
        <SearchBox
          placeholder="Search apps or vendors"
          value={searchInput}
          onChange={(value) => setSearchInput(value)}
          fullWidth={false}
          sx={{ width: 260 }}
        />
        <CustomSelect
          currentValue={category}
          onValueChange={async (v) => {
            setCategory(String(v));
            setPage(0);
            return true;
          }}
          options={categoryOptions}
        />
        <CustomSelect
          currentValue={grade}
          onValueChange={async (v) => {
            setGrade(String(v));
            setPage(0);
            return true;
          }}
          options={gradeOptions}
        />
        <CustomSelect
          currentValue={sort}
          onValueChange={async (v) => {
            setSort(String(v));
            setPage(0);
            return true;
          }}
          options={SORT_OPTIONS}
        />
        <Box sx={{ flex: 1 }} />
        {/* Select-all checkbox placed in filter bar so it is adjacent to the table */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Checkbox
            size="small"
            checked={allOnPageSelected}
            indeterminate={!allOnPageSelected && someOnPageSelected}
            onChange={toggleSelectAll}
            inputProps={{ "aria-label": "Select all on page" }}
          />
        </Box>
        <CustomizableButton
          text={`Track selected (${selected.length})`}
          onClick={handleTrackSelected}
          isDisabled={selected.length === 0 || trackBulk.isPending}
          sx={{ height: 34 }}
        />
      </Stack>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} sx={{ color: palette.brand.primary }} />
        </Box>
      )}

      {isError && (
        <EmptyState
          message="We couldn't load the AI Trust Index right now. Please try again later."
          showBorder
        />
      )}

      {isEmpty && !isError && (
        <EmptyState message="No apps match your filters." showBorder />
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <MCPTable<TrustIndexRow>
            id="ai-trust-index-browse-table"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.slug}
            onRowClick={(row) => navigate(`/ai-trust-index/${row.slug}`)}
            renderRow={(row) => [
              // Checkbox cell — stopPropagation so clicking it doesn't trigger row nav
              <span onClick={(e) => e.stopPropagation()} key="cb">
                <Checkbox
                  size="small"
                  checked={selected.includes(row.slug)}
                  onChange={() => toggleRow(row.slug)}
                  inputProps={{ "aria-label": `Select ${row.name}` }}
                />
              </span>,
              // Name
              <Typography component="span" sx={{ fontWeight: 500, fontSize: "inherit" }}>
                {row.name}
              </Typography>,
              // Vendor
              row.vendor || "—",
              // Category
              row.category || "—",
              // Grade
              <GradeChip grade={row.data?.displayedGrade || row.letter_grade} />,
              // Score
              row.score_out_of_100 != null ? `${row.score_out_of_100}/100` : "—",
              // Track/Untrack toggle — stopPropagation so clicking it doesn't trigger row nav
              <span onClick={(e) => e.stopPropagation()} key="track">
                <CustomizableButton
                  text={row.is_tracked ? "Untrack" : "Track"}
                  variant="outlined"
                  onClick={() => handleToggleTrack(row)}
                  isDisabled={trackApp.isPending || untrackApp.isPending}
                  sx={{ height: 28, mt: 0 }}
                />
              </span>,
            ]}
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            px="32px"
          >
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              labelRowsPerPage="Rows per page"
              sx={{ mt: "48px" }}
            />
          </Stack>
        </>
      )}
    </PageHeaderExtended>
  );
}
