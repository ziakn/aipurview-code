import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Cpu } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import AutoCompleteField from "../../../components/Inputs/Autocomplete";
import { useLinkModelsToAiApp } from "../../../../application/hooks/useAiApps";
import { useGetAllEntities } from "../../../../application/hooks/useBaseQueries";
import { IAIAppModel } from "../../../../domain/interfaces/i.aiApp";
import { IModelInventory } from "../../../../domain/interfaces/i.modelInventory";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import Alert from "../../../components/Alert";
import Chip from "../../../components/Chip";

interface AIAppModelDependenciesProps {
  appId: number;
  models: IAIAppModel[];
}

interface ModelOption {
  id: number;
  provider: string;
  model: string;
  version?: string;
}

export default function AIAppModelDependencies({ appId, models }: AIAppModelDependenciesProps) {
  const [localModelIds, setLocalModelIds] = useState<number[]>([]);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
  } | null>(null);

  const { data: modelInventoryResponse } = useGetAllEntities("/modelInventory");
  const linkModelsMutation = useLinkModelsToAiApp();

  const modelOptions: ModelOption[] = useMemo(() => {
    const data = (modelInventoryResponse?.data ||
      modelInventoryResponse ||
      []) as IModelInventory[];
    return data.map((m) => ({
      id: m.id!,
      provider: m.provider || "Unknown",
      model: m.model || "Unknown",
      version: m.version,
    }));
  }, [modelInventoryResponse]);

  useEffect(() => {
    setLocalModelIds(models.map((m) => m.id));
  }, [models]);

  const selectedOptions = useMemo(
    () => modelOptions.filter((option) => localModelIds.includes(option.id)),
    [modelOptions, localModelIds],
  );

  const handleChange = (_event: unknown, newValue: ModelOption[]) => {
    setLocalModelIds(newValue.map((option) => option.id));
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

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" gap="8px">
          <Cpu size={18} strokeWidth={1.5} color={palette.text.secondary} />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Model dependencies</Typography>
        </Stack>
        <CustomizableButton
          text="Save dependencies"
          variant="contained"
          onClick={handleSave}
          disabled={linkModelsMutation.isPending}
        />
      </Stack>

      <Box sx={{ mb: 3 }}>
        <AutoCompleteField<ModelOption, true>
          label="Linked models"
          placeholder="Search and select model inventory entries"
          multiple
          options={modelOptions}
          value={selectedOptions}
          onChange={handleChange}
          getOptionLabel={(option) =>
            `${option.provider} - ${option.model}${option.version ? ` v${option.version}` : ""}`
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ maxWidth: 640 }}
        />
      </Box>

      <TableContainer sx={singleTheme.tableStyles.primary.frame}>
        <Table>
          <TableHead>
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Provider</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Model</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Version</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Status</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Risk score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} sx={singleTheme.tableStyles.primary.body.row}>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {model.provider}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{model.model}</TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {model.version || "—"}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <Chip label={model.status || "Unknown"} size="small" uppercase={false} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {model.risk_score ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {models.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={singleTheme.tableStyles.primary.body.cell}>
                  No models linked to this AI app.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {alert && (
        <Alert variant={alert.variant} body={alert.body} isToast onClick={() => setAlert(null)} />
      )}
    </Box>
  );
}
