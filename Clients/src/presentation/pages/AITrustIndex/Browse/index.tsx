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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Checkbox,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { SearchBox } from "../../../components/Search";
import { CustomSelect } from "../../../components/CustomSelect";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import Chip from "../../../components/Chip";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import { useApps, useTrackApp, useUntrackApp, useTrackAppsBulk } from "../../../../application/hooks/useAiTrustIndex";
import { useAITrustIndexSidebarContextSafe } from "../../../../application/contexts/AITrustIndexSidebar.context";
import { GRADE_COLOR, TrustIndexRow } from "../shared";

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
  const theme = useTheme();
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

  const headerCellSx = singleTheme.tableStyles.primary.header.cell;
  const isEmpty = !isLoading && rows.length === 0;

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
          <TableContainer id="ai-trust-index-browse-table">
            <Table sx={singleTheme.tableStyles.primary.frame}>
              <TableHead
                sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}
              >
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell padding="checkbox" style={headerCellSx}>
                    <Checkbox
                      size="small"
                      checked={allOnPageSelected}
                      indeterminate={!allOnPageSelected && someOnPageSelected}
                      onChange={toggleSelectAll}
                      inputProps={{ "aria-label": "Select all on page" }}
                    />
                  </TableCell>
                  <TableCell style={headerCellSx}>Name</TableCell>
                  <TableCell style={headerCellSx}>Vendor</TableCell>
                  <TableCell style={headerCellSx}>Category</TableCell>
                  <TableCell style={headerCellSx}>Grade</TableCell>
                  <TableCell style={headerCellSx}>Score</TableCell>
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
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={selected.includes(row.slug)}
                        onChange={() => toggleRow(row.slug)}
                        inputProps={{ "aria-label": `Select ${row.name}` }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell>{row.vendor || "—"}</TableCell>
                    <TableCell>{row.category || "—"}</TableCell>
                    <TableCell>
                      <GradeChip grade={row.data?.displayedGrade || row.letter_grade} />
                    </TableCell>
                    <TableCell>
                      {row.score_out_of_100 != null ? `${row.score_out_of_100}/100` : "—"}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <CustomizableButton
                        text={row.is_tracked ? "Untrack" : "Track"}
                        variant="outlined"
                        onClick={() => handleToggleTrack(row)}
                        isDisabled={trackApp.isPending || untrackApp.isPending}
                        sx={{ height: 28, mt: 0 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-end"
            px={theme.spacing(4)}
          >
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
              labelRowsPerPage="Rows per page"
              sx={{ mt: theme.spacing(6) }}
            />
          </Stack>
        </>
      )}
    </PageHeaderExtended>
  );
}
