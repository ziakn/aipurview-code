import { useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Stack,
  Box,
} from "@mui/material";
import { Bot, Trash2 } from "lucide-react";
import Chip from "../../components/Chip";
import { IAIApp } from "../../../domain/interfaces/i.aiApp";
import singleTheme from "../../themes/v1SingleTheme";
import { palette } from "../../themes/palette";
import StandardTableHead from "../../components/Table/StandardTableHead";
import StandardTablePagination from "../../components/Table/StandardTablePagination";
import { useStandardTable } from "../../../application/hooks/useStandardTable";
import type { StandardColumn } from "../../../domain/types/standardTable";
import { statusToChipProps, formatDiscoveredSource } from "./utils";

interface AIAppsTableProps {
  apps: IAIApp[];
  onAppClick: (app: IAIApp) => void;
  onDeleteApp: (appId: number) => void;
}

const TABLE_COLUMNS: StandardColumn[] = [
  { id: "name", label: "AI app", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "vendor", label: "Vendor", sortable: false },
  { id: "risk_score", label: "Risk score", sortable: true },
  { id: "source", label: "Source", sortable: true },
  { id: "actions", label: "Actions", sortable: false, align: "right" },
];

export default function AIAppsTable({ apps, onAppClick, onDeleteApp }: AIAppsTableProps) {
  const sortComparator = useCallback((a: IAIApp, b: IAIApp, key: string): number => {
    switch (key) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "status":
        return (a.status || "").localeCompare(b.status || "");
      case "risk_score":
        return (a.risk_score ?? 0) - (b.risk_score ?? 0);
      case "source":
        return (a.discovered_source || "").localeCompare(b.discovered_source || "");
      default:
        return 0;
    }
  }, []);

  const {
    sortConfig,
    handleSort,
    sortedRows,
    validPage,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    getRange,
    totalCount,
  } = useStandardTable<IAIApp>({
    rows: apps,
    storageKey: "aiApps",
    defaultSortColumn: "",
    defaultSortDirection: null,
    sortComparator,
  });

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        <StandardTableHead columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
        <TableBody>
          {sortedRows
            .slice(validPage * rowsPerPage, validPage * rowsPerPage + rowsPerPage)
            .map((app) => {
              const chipProps = statusToChipProps(app.status);
              return (
                <TableRow
                  key={app.id}
                  hover
                  sx={{ ...singleTheme.tableStyles.primary.body.row, cursor: "pointer" }}
                  onClick={() => onAppClick(app)}
                >
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Stack direction="row" alignItems="center" gap="8px">
                      <Bot size={16} strokeWidth={1.5} color={palette.text.secondary} />
                      {app.name}
                    </Stack>
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Chip {...chipProps} size="small" uppercase={false} />
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {app.vendor_id ? `ID ${app.vendor_id}` : "—"}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {app.risk_score ?? "—"}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {formatDiscoveredSource(app.discovered_source)}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell} align="right">
                    <Box onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => app.id && onDeleteApp(app.id)}
                        aria-label={`Delete ${app.name}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
        {totalCount > 0 && (
          <StandardTablePagination
            totalCount={totalCount}
            page={validPage}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            getRange={getRange}
            entityLabel="AI app"
            entityLabelPlural="AI apps"
            colSpan={TABLE_COLUMNS.length}
          />
        )}
      </Table>
    </TableContainer>
  );
}
