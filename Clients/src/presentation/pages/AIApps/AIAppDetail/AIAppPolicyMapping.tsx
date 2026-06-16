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
import { Sparkles, ShieldCheck } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Toggle from "../../../components/Inputs/Toggle";
import {
  useSetPoliciesForAiApp,
  usePolicySuggestions,
} from "../../../../application/hooks/useAiApps";
import { usePolicies } from "../../../../application/hooks/usePolicies";
import { IAIAppPolicy } from "../../../../domain/interfaces/i.aiApp";
import { AiAppPolicyStatus } from "../../../../domain/enums/aiApp.enum";
import { PolicyManagerModel } from "../../../../domain/models/Common/policy/policyManager.model";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import Alert from "../../../components/Alert";
import StandardTableHead from "../../../components/Table/StandardTableHead";
import StandardTablePagination from "../../../components/Table/StandardTablePagination";
import { useStandardTable } from "../../../../application/hooks/useStandardTable";
import type { StandardColumn } from "../../../../domain/types/standardTable";

interface AIAppPolicyMappingProps {
  appId: number;
  appName: string;
  policies: IAIAppPolicy[];
}

interface LocalPolicy {
  policy_id: number;
  title: string;
  status: AiAppPolicyStatus;
}

const TABLE_COLUMNS: StandardColumn[] = [
  { id: "title", label: "Policy", sortable: true },
  { id: "applicable", label: "Applicable", sortable: false },
];

export default function AIAppPolicyMapping({ appId, appName, policies }: AIAppPolicyMappingProps) {
  const [localPolicies, setLocalPolicies] = useState<LocalPolicy[]>([]);
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

  const { data: allPolicies } = usePolicies();
  const { data: suggestions } = usePolicySuggestions(appName);
  const setPoliciesMutation = useSetPoliciesForAiApp();

  const allPolicyOptions = useMemo(
    () =>
      (allPolicies ?? []).map((policy: PolicyManagerModel) => ({
        id: policy.id,
        title: policy.title,
      })),
    [allPolicies],
  );

  useEffect(() => {
    const mapped: LocalPolicy[] = allPolicyOptions.map((policy) => {
      const existing = policies.find((p) => p.id === policy.id);
      return {
        policy_id: policy.id,
        title: policy.title,
        status: existing?.status || AiAppPolicyStatus.NOT_APPLICABLE,
      };
    });
    setLocalPolicies(mapped);
  }, [allPolicyOptions, policies]);

  const handleToggle = (policyId: number) => {
    setLocalPolicies((prev) =>
      prev.map((p) =>
        p.policy_id === policyId
          ? {
              ...p,
              status:
                p.status === AiAppPolicyStatus.APPLICABLE
                  ? AiAppPolicyStatus.NOT_APPLICABLE
                  : AiAppPolicyStatus.APPLICABLE,
            }
          : p,
      ),
    );
  };

  const handleSave = async () => {
    try {
      await setPoliciesMutation.mutateAsync({
        id: appId,
        policies: localPolicies.map((p) => ({
          policy_id: p.policy_id,
          status: p.status,
        })),
      });
      setAlert({ variant: "success", body: "Policy mapping saved successfully" });
    } catch (err) {
      setAlert({ variant: "error", body: "Failed to save policy mapping" });
    }
  };

  const suggestedTitles = useMemo(
    () => suggestions?.filter((s) => s.suggested && s.id !== null).map((s) => s.title) || [],
    [suggestions],
  );

  const sortComparator = useCallback((a: LocalPolicy, b: LocalPolicy, key: string): number => {
    if (key === "title") return (a.title || "").localeCompare(b.title || "");
    return 0;
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
  } = useStandardTable<LocalPolicy>({
    rows: localPolicies,
    storageKey: "aiAppPolicyMapping",
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
          <ShieldCheck size={16} strokeWidth={1.5} color={palette.text.secondary} />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Policy mapping</Typography>
        </Stack>
        <CustomizableButton
          text="Save mapping"
          variant="contained"
          onClick={handleSave}
          disabled={setPoliciesMutation.isPending}
        />
      </Stack>

      {suggestedTitles.length > 0 && (
        <Box
          sx={{
            mb: "16px",
            p: "16px",
            borderRadius: "4px",
            backgroundColor: palette.background.accent,
            border: `1px solid ${palette.border.light}`,
          }}
        >
          <Stack direction="row" alignItems="center" gap="8px" sx={{ mb: "8px" }}>
            <Sparkles size={14} strokeWidth={1.5} color={palette.text.secondary} />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Suggested policies</Typography>
          </Stack>
          <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
            {suggestedTitles.join(", ")}
          </Typography>
        </Box>
      )}

      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <StandardTableHead columns={TABLE_COLUMNS} sortConfig={sortConfig} onSort={handleSort} />
          <TableBody>
            {totalCount > 0 ? (
              sortedRows
                .slice(validPage * rowsPerPage, validPage * rowsPerPage + rowsPerPage)
                .map((policy) => {
                  const isApplicable = policy.status === AiAppPolicyStatus.APPLICABLE;
                  return (
                    <TableRow key={policy.policy_id} sx={singleTheme.tableStyles.primary.body.row}>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        {policy.title}
                      </TableCell>
                      <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                        <Toggle
                          checked={isApplicable}
                          onChange={() => handleToggle(policy.policy_id)}
                          inputProps={{ "aria-label": `Toggle ${policy.title}` }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={TABLE_COLUMNS.length}
                  sx={singleTheme.tableStyles.primary.body.cell}
                >
                  No policies available.
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
              entityLabel="policy"
              entityLabelPlural="policies"
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
