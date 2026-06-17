import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { Cpu } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import AutoCompleteField from "../../../components/Inputs/Autocomplete";
import { useLinkModelsToAiApp } from "../../../../application/hooks/useAiApps";
import { useModelInventories } from "../../../../application/hooks/useModelInventories";
import { IAIAppModel } from "../../../../domain/interfaces/i.aiApp";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import Alert from "../../../components/Alert";
import Chip from "../../../components/Chip";
import StandardTableHead from "../../../components/Table/StandardTableHead";
import StandardTablePagination from "../../../components/Table/StandardTablePagination";
import { useStandardTable } from "../../../../application/hooks/useStandardTable";
import type { StandardColumn } from "../../../../domain/types/standardTable";

interface AIAppModelDependenciesProps {
  appId: number;
  models: IAIAppModel[];
}

const TABLE_COLUMNS: StandardColumn[] = [
  { id: "provider", label: "Provider", sortable: true },
  { id: "model", label: "Model", sortable: true },
  { id: "version", label: "Version", sortable: false },
  { id: "status", label: "Status", sortable: true },
];

export default function AIAppModelDependencies({ appId, models }: AIAppModelDependenciesProps) {
  const [localModelIds, setLocalModelIds] = useState<number[]>([]);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
  } | null>(null);

  // Auto-dismiss toasts after 3s.
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [alert]);

  const { data: modelInventories } = useModelInventories();
  const linkModelsMutation = useLinkModelsToAiApp();

  interface ModelOption {
    id: number;
    label: string;
  }

  const modelOptions = useMemo<ModelOption[]>(
    () =>
      (modelInventories ?? []).map((m) => ({
        id: m.id!,
        label: `${m.provider || "Unknown"} - ${m.model || "Unknown"}${
          m.version ? ` v${m.version}` : ""
        }`,
      })),
    [modelInventories],
  );

  useEffect(() => {
    setLocalModelIds(models.map((m) => m.id));
  }, [models]);

  const selectedOptions = useMemo<ModelOption[]>(
    () => modelOptions.filter((o) => localModelIds.includes(o.id)),
    [modelOptions, localModelIds],
  );

  const handleChange = (_event: unknown, value: ModelOption[]) => {
    setLocalModelIds(value.map((v) => v.id));
  };

  const handleSave = async () => {
    try {
      await linkModelsMutation.mutateAsync({
        id: appId,
        modelInventoryIds: localModelIds,
      });
      setAlert({ variant: "success", body: "Model dependencies updated successfully" });
    } catch (err) {
      setAlert({ variant: "error", body: "Failed to update model dependencies" });
    }
  };

  const sortComparator = useCallback((a: IAIAppModel, b: IAIAppModel, key: string): number => {
    switch (key) {
      case "provider":
        return (a.provider || "").localeCompare(b.provider || "");
      case "model":
        return (a.model || "").localeCompare(b.model || "");
      case "status":
        return (a.status || "").localeCompare(b.status || "");
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
  } = useStandardTable<IAIAppModel>({
    rows: models,
    storageKey: "aiAppModelDependencies",
    defaultSortColumn: "",
    defaultSortDirection: null,
    sortComparator,
  });

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        sx={{ mb: "16px" }}
      >
        <Stack direction="row" alignItems="center" gap="8px">
          <Cpu size={16} strokeWidth={1.5} color={palette.text.secondary} />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Model dependencies</Typography>
        </Stack>
        <CustomizableButton
          text="Save dependencies"
          variant="contained"
          onClick={handleSave}
          disabled={linkModelsMutation.isPending}
        />
      </Stack>

      <Box sx={{ mb: "24px" }}>
        <AutoCompleteField<ModelOption, true>
          multiple
          label="Linked models"
          placeholder={selectedOptions.length === 0 ? "Select model inventory entries" : ""}
          options={modelOptions}
          value={selectedOptions}
          onChange={handleChange}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, val) => option.id === val.id}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <StandardTableHead columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
          <TableBody>
            {totalCount > 0 ? (
              sortedRows
                .slice(validPage * rowsPerPage, validPage * rowsPerPage + rowsPerPage)
                .map((model) => (
                  <TableRow key={model.id} sx={singleTheme.tableStyles.primary.body.row}>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.provider}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.model}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {model.version || "—"}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip label={model.status || "Unknown"} size="small" uppercase={false} />
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length}
                  sx={singleTheme.tableStyles.primary.body.cell}
                >
                  No models linked to this AI app.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {totalCount > 0 && (
            <StandardTablePagination
              totalCount={totalCount}
              page={validPage}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              getRange={getRange}
              entityLabel="model"
              colSpan={TABLE_COLUMNS.length}
            />
          )}
        </Table>
      </TableContainer>

      {alert && (
        <Alert variant={alert.variant} body={alert.body} isToast onClick={() => setAlert(null)} />
      )}
    </Box>
  );
}
