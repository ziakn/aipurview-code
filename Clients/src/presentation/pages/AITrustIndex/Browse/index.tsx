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
import { Box, Stack, TablePagination, CircularProgress } from "@mui/material";
import Checkbox from "../../../components/Inputs/Checkbox";
import { SearchBox } from "../../../components/Search";
import { CustomSelect } from "../../../components/CustomSelect";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import TablePaginationActions from "../../../components/TablePagination";
import { palette } from "../../../themes/palette";
import {
  useApps,
  useTrackApp,
  useUntrackApp,
  useTrackAppsBulk,
} from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { TrustIndexRow } from "../shared";
import AppCard from "./AppCard";

// 24 = 8 rows × 3 columns, so the grid's last row stays even.
const PAGE_SIZE = 24;

export default function Browse() {
  const navigate = useNavigate();
  const sidebar = useAITrustIndexSidebarContextSafe();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [grade, setGrade] = useState("");
  // Sort is dropdown-driven for the card grid. Each option maps to a backend
  // sort column + direction the getAppsQuery whitelist can honour.
  const [sortValue, setSortValue] = useState("score-desc");
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

  const [sortBy, sortDir] = useMemo(() => {
    const [by, dir] = sortValue.split("-");
    return [by, dir as "asc" | "desc"] as const;
  }, [sortValue]);

  const { data, isLoading, isError } = useApps({
    search,
    category,
    grade,
    sort: sortBy,
    dir: sortDir,
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
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({ value: c, label: c })),
    ],
    [categories],
  );
  const gradeOptions = useMemo(
    () => [
      { value: "", label: "All grades" },
      ...["A", "B", "C", "D", "F"].map((g) => ({ value: g, label: g })),
    ],
    [],
  );
  const sortOptions = useMemo(
    () => [
      { value: "score-desc", label: "Best score first" },
      { value: "score-asc", label: "Worst score first" },
      { value: "name-asc", label: "Name A–Z" },
      { value: "name-desc", label: "Name Z–A" },
      { value: "vendor-asc", label: "Vendor A–Z" },
      { value: "category-asc", label: "Category A–Z" },
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

  return (
    <PageHeaderExtended
      title="AI Trust Index"
      description="Browse independently assessed AI applications and track the ones that matter to your organization."
    >
      {/* Filters */}
      <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap" sx={{ mb: "16px" }}>
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
          currentValue={sortValue}
          onValueChange={async (v) => {
            setSortValue(String(v));
            setPage(0);
            return true;
          }}
          options={sortOptions}
        />
        <Box sx={{ flex: 1 }} />
        {/* Select-all checkbox placed in filter bar so it is adjacent to the table */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Checkbox
            id="ai-trust-index-select-all"
            size="small"
            value="select-all"
            isChecked={allOnPageSelected}
            isIndeterminate={!allOnPageSelected && someOnPageSelected}
            onChange={toggleSelectAll}
            ariaLabel="Select all on page"
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

      {isEmpty && !isError && <EmptyState message="No apps match your filters." showBorder />}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: "16px",
              alignItems: "stretch",
            }}
          >
            {rows.map((row) => (
              <AppCard
                key={row.slug}
                row={row}
                selected={selected.includes(row.slug)}
                trackPending={trackApp.isPending || untrackApp.isPending}
                onOpen={(slug) => navigate(`/ai-trust-index/${slug}`)}
                onToggleSelect={toggleRow}
                onToggleTrack={handleToggleTrack}
              />
            ))}
          </Box>
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              ActionsComponent={TablePaginationActions as any}
              labelRowsPerPage="Rows per page"
              sx={{ mt: "24px" }}
            />
          </Stack>
        </>
      )}
    </PageHeaderExtended>
  );
}
