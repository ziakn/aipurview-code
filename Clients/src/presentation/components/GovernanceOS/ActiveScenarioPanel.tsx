import React, { useMemo } from "react";
import { Box, Typography, Stack, Chip, Button, LinearProgress } from "@mui/material";
import { Target, Zap, ArrowRight, XCircle } from "lucide-react";
import { IGovernanceScenario } from "../../../domain/interfaces/i.governanceOs";
import {
  useActivationHistory,
  useDeactivateScenario,
  useScenarioProgress,
} from "../../../application/hooks/useGovernanceOs";
import { border as borderPalette, background, text, accent, brand, status } from "../../themes/palette";

interface ActiveScenarioPanelProps {
  activeScenario: IGovernanceScenario | null | undefined;
  onActivate: (scenario: IGovernanceScenario) => void;
}

const FRAMEWORK_NAMES: Record<number, string> = {
  1: "EU AI Act",
  2: "ISO 42001",
  3: "ISO 27001",
  4: "NIST AI RMF",
};

const ActiveScenarioPanel: React.FC<ActiveScenarioPanelProps> = ({
  activeScenario,
  onActivate,
}) => {
  const { data: activations } = useActivationHistory();
  const deactivateMutation = useDeactivateScenario();

  const latestActivation = useMemo(() => {
    if (!activations || !activeScenario) return null;
    return (
      activations.find(
        (a: any) => a.scenario_id === activeScenario.id && a.status === "active"
      ) || null
    );
  }, [activations, activeScenario]);

  const { data: progress } = useScenarioProgress(latestActivation?.id || 0);

  if (!activeScenario) {
    return (
      <Box
        sx={{
          border: `1px dashed ${borderPalette.light}`,
          borderRadius: 2,
          p: 3,
          background: background.main,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Target size={20} color={text.muted} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
              No active scenario
            </Typography>
            <Typography sx={{ fontSize: 12, color: text.muted }}>
              Select a scenario below to set your organization&apos;s active governance strategy.
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  const priorityOrder = activeScenario.priority_order as {
    primary?: number;
    secondary?: number[];
    supplementary?: number[];
  } | null;

  const frameworkIds = [
    priorityOrder?.primary,
    ...(priorityOrder?.secondary || []),
    ...(priorityOrder?.supplementary || []),
  ].filter(Boolean) as number[];

  const activationDate = latestActivation?.activated_at
    ? new Date(latestActivation.activated_at).toLocaleDateString()
    : null;

  return (
    <Box
      sx={{
        border: `1px solid ${brand.primary}`,
        borderRadius: 2,
        p: 3,
        background: `linear-gradient(135deg, ${background.main} 0%, rgba(19, 113, 91, 0.06) 100%)`,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(19, 113, 91, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Target size={18} color={brand.primary} />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: text.primary }}>
                Active scenario
              </Typography>
              <Chip
                label={latestActivation ? "Activated" : "Selected"}
                size="small"
                sx={{
                  fontSize: 11,
                  height: 20,
                  backgroundColor: "rgba(19, 113, 91, 0.12)",
                  color: brand.primary,
                  fontWeight: 500,
                }}
              />
            </Stack>
            <Typography sx={{ fontSize: 13, color: text.primary, fontWeight: 500 }}>
              {activeScenario.name}
            </Typography>
            {activeScenario.description && (
              <Typography sx={{ fontSize: 12, color: text.accent, mt: 0.5 }}>
                {activeScenario.description}
              </Typography>
            )}
            {activationDate && (
              <Typography sx={{ fontSize: 11, color: text.muted, mt: 0.5 }}>
                Activated on {activationDate}
                {latestActivation?.tasks_created
                  ? ` · ${latestActivation.tasks_created} task(s) created`
                  : ""}
              </Typography>
            )}
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
              {frameworkIds.map((id) => {
                const priority =
                  id === priorityOrder?.primary
                    ? "primary"
                    : priorityOrder?.secondary?.includes(id)
                      ? "secondary"
                      : "supplementary";
                return (
                  <Chip
                    key={id}
                    label={FRAMEWORK_NAMES[id] || `Framework ${id}`}
                    size="small"
                    sx={{
                      fontSize: 11,
                      height: 20,
                      backgroundColor:
                        priority === "primary"
                          ? accent.primary.bg
                          : priority === "secondary"
                            ? accent.indigo.bg
                            : background.hover,
                      color:
                        priority === "primary"
                          ? accent.primary.text
                          : priority === "secondary"
                            ? accent.indigo.text
                            : text.tertiary,
                      border:
                        priority === "primary"
                          ? `1px solid ${accent.primary.border}`
                          : priority === "secondary"
                            ? `1px solid ${accent.indigo.border}`
                            : `1px solid ${borderPalette.light}`,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {latestActivation && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<XCircle size={14} />}
              onClick={() => deactivateMutation.mutate(latestActivation.id)}
              disabled={deactivateMutation.isPending}
              sx={{ textTransform: "none", fontSize: 12 }}
            >
              Deactivate
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Zap size={14} />}
            endIcon={<ArrowRight size={14} />}
            onClick={() => onActivate(activeScenario)}
            sx={{ textTransform: "none", fontSize: 13, boxShadow: "none" }}
          >
            {latestActivation ? "Re-activate" : "Activate now"}
          </Button>
        </Stack>
      </Stack>

      {/* Framework progress */}
      {progress && progress.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${borderPalette.light}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: text.primary, mb: 1.5 }}>
            Task progress by framework
          </Typography>
          <Stack spacing={1.5}>
            {progress.map((fw: any) => {
              const percent =
                fw.totalTasks > 0 ? Math.round((fw.completedTasks / fw.totalTasks) * 100) : 0;
              return (
                <Box key={fw.frameworkId}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography sx={{ fontSize: 12, color: text.primary }}>
                      {fw.frameworkName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: text.muted }}>
                      {fw.completedTasks}/{fw.totalTasks} done
                      {fw.inProgressTasks > 0 ? ` · ${fw.inProgressTasks} in progress` : ""}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: background.hover,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          percent >= 70
                            ? status.success.text
                            : percent >= 40
                              ? status.warning.text
                              : status.error.text,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ActiveScenarioPanel;
