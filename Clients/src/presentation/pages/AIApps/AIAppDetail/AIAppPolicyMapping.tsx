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
  Switch,
} from "@mui/material";
import { Sparkles, ShieldCheck } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import {
  useSetPoliciesForAiApp,
  usePolicySuggestions,
} from "../../../../application/hooks/useAiApps";
import { usePolicies } from "../../../../application/hooks/usePolicies";
import { IAIAppPolicy } from "../../../../domain/interfaces/i.aiApp";
import { AiAppPolicyStatus } from "../../../../domain/enums/aiApp.enum";
import singleTheme from "../../../themes/v1SingleTheme";
import { palette } from "../../../themes/palette";
import Alert from "../../../components/Alert";

interface AIAppPolicyMappingProps {
  appId: number;
  appName: string;
  policies: IAIAppPolicy[];
}

export default function AIAppPolicyMapping({ appId, appName, policies }: AIAppPolicyMappingProps) {
  const [localPolicies, setLocalPolicies] = useState<
    Array<{ policy_id: number; title: string; status: AiAppPolicyStatus }>
  >([]);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
  } | null>(null);

  const { data: allPolicies } = usePolicies();
  const { data: suggestions } = usePolicySuggestions(appName);
  const setPoliciesMutation = useSetPoliciesForAiApp();

  const allPolicyOptions = useMemo(
    () =>
      (allPolicies?.data || []).map((policy: any) => ({
        id: policy.id,
        title: policy.title,
      })),
    [allPolicies],
  );

  useEffect(() => {
    const mapped = allPolicyOptions.map((policy) => {
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
    () =>
      suggestions
        ?.filter((s) => s.suggested && s.id !== null)
        .map((s) => s.title) || [],
    [suggestions],
  );

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
          <ShieldCheck size={18} strokeWidth={1.5} color={palette.text.secondary} />
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
            mb: 2,
            p: 2,
            borderRadius: "8px",
            backgroundColor: palette.background.accent,
            border: `1px solid ${palette.border.light}`,
          }}
        >
          <Stack direction="row" alignItems="center" gap="8px" sx={{ mb: 1 }}>
            <Sparkles size={14} strokeWidth={1.5} color={palette.text.secondary} />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Suggested policies</Typography>
          </Stack>
          <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
            {suggestedTitles.join(", ")}
          </Typography>
        </Box>
      )}

      <TableContainer sx={singleTheme.tableStyles.primary.frame}>
        <Table>
          <TableHead>
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Policy</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Applicable</TableCell>
              <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Suggested</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localPolicies.map((policy) => {
              const isApplicable = policy.status === AiAppPolicyStatus.APPLICABLE;
              const isSuggested = suggestedTitles.includes(policy.title);
              return (
                <TableRow key={policy.policy_id} sx={singleTheme.tableStyles.primary.body.row}>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {policy.title}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Switch
                      checked={isApplicable}
                      onChange={() => handleToggle(policy.policy_id)}
                      inputProps={{ "aria-label": `Toggle ${policy.title}` }}
                    />
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {isSuggested ? "Yes" : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {localPolicies.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={singleTheme.tableStyles.primary.body.cell}>
                  No policies available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}
    </Box>
  );
}
