import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  Chip,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { Settings, Power, Bell, Target, Filter, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import Toggle from "../../../components/Inputs/Toggle";
import Checkbox from "../../../components/Inputs/Checkbox";
import {
  useGovernancePreferences,
  useUpdatePreferences,
} from "../../../../application/hooks/useGovernanceOs";
import { useIsAdmin } from "../../../../application/hooks/useIsAdmin";
import { border as borderPalette, background, text, brand, accent } from "../../../themes/palette";

const FRAMEWORK_NAMES: Record<number, string> = {
  1: "EU AI Act",
  2: "ISO 42001",
  3: "ISO 27001",
  4: "NIST AI RMF",
};

const GovernanceSettings: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: preferences, isLoading: prefsLoading } = useGovernancePreferences();
  const updatePrefsMutation = useUpdatePreferences();

  const [isEnabled, setIsEnabled] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (preferences) {
      setIsEnabled(preferences.is_enabled ?? false);
      setDontAskAgain(preferences.dont_ask_governance_os ?? false);
    }
  }, [preferences]);

  const handleSave = () => {
    updatePrefsMutation.mutate(
      {
        is_enabled: isEnabled,
        dont_ask_governance_os: dontAskAgain,
      },
      {
        onSuccess: () => {
          setAlert({ variant: "success", message: "Settings saved successfully." });
          setTimeout(() => setAlert(null), 4000);
        },
        onError: () => {
          setAlert({ variant: "error", message: "Failed to save settings. Please try again." });
          setTimeout(() => setAlert(null), 4000);
        },
      }
    );
  };

  const activeScenarioId = preferences?.selected_scenario_id;
  const customPriority = preferences?.custom_framework_priority as {
    primary?: number;
    secondary?: number[];
    supplementary?: number[];
  } | null;

  if (prefsLoading) {
    return (
      <GovernanceWorkspaceShell title="Settings" subtitle="Manage Governance Intelligence configuration">
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      </GovernanceWorkspaceShell>
    );
  }

  return (
    <GovernanceWorkspaceShell
      title="Settings"
      subtitle="Manage Governance Intelligence configuration, preferences, and defaults."
    >
      <Stack spacing={3}>
        {alert && (
          <Alert severity={alert.variant} sx={{ fontSize: 13 }}>
            {alert.message}
          </Alert>
        )}

        {/* Module Status */}
        <SettingsSection
          icon={<Power size={18} color={brand.primary} />}
          title="Module Status"
          description="Enable or disable the Governance Intelligence module for your organization."
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              border: `1px solid ${borderPalette.light}`,
              borderRadius: 2,
              background: background.main,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: text.primary }}>
                Governance Intelligence
              </Typography>
              <Typography sx={{ fontSize: 12, color: text.muted }}>
                {isEnabled ? "Module is enabled and visible." : "Module is disabled and hidden from sidebar."}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Toggle
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  disabled={!isAdmin}
                />
              }
              label=""
            />
          </Box>
          {!isAdmin && (
            <Typography sx={{ fontSize: 11, color: text.muted, mt: 0.5 }}>
              Only admins can change module status.
            </Typography>
          )}
        </SettingsSection>

        {/* Active Scenario */}
        <SettingsSection
          icon={<Target size={18} color={brand.primary} />}
          title="Active Scenario"
          description="The currently selected governance scenario drives framework prioritization across projects."
        >
          <Box
            sx={{
              p: 2,
              border: `1px solid ${borderPalette.light}`,
              borderRadius: 2,
              background: background.main,
            }}
          >
            {activeScenarioId ? (
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: text.primary }}>
                  Scenario ID: {activeScenarioId}
                </Typography>
                {customPriority && (
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {customPriority.primary && (
                      <Chip
                        label={`Primary: ${FRAMEWORK_NAMES[customPriority.primary] || customPriority.primary}`}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 20,
                          backgroundColor: accent.primary.bg,
                          color: accent.primary.text,
                          border: `1px solid ${accent.primary.border}`,
                        }}
                      />
                    )}
                    {customPriority.secondary?.map((id: number) => (
                      <Chip
                        key={id}
                        label={`Secondary: ${FRAMEWORK_NAMES[id] || id}`}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 20,
                          backgroundColor: accent.indigo.bg,
                          color: accent.indigo.text,
                          border: `1px solid ${accent.indigo.border}`,
                        }}
                      />
                    ))}
                  </Stack>
                )}
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate("/governance/scenarios")}
                    sx={{ textTransform: "none", fontSize: 12 }}
                  >
                    Change scenario
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography sx={{ fontSize: 13, color: text.accent }}>
                  No active scenario selected.
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate("/governance/scenarios")}
                  sx={{ textTransform: "none", fontSize: 12, boxShadow: "none" }}
                >
                  Choose scenario
                </Button>
              </Stack>
            )}
          </Box>
        </SettingsSection>

        {/* Smart Prompt Preferences */}
        <SettingsSection
          icon={<Bell size={18} color={brand.primary} />}
          title="Smart Prompt Preferences"
          description="Control whether the system prompts you to enable Governance Intelligence when conditions are met."
        >
          <Box
            sx={{
              p: 2,
              border: `1px solid ${borderPalette.light}`,
              borderRadius: 2,
              background: background.main,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                id="dont-ask-governance-os"
                isChecked={dontAskAgain}
                value="dont-ask"
                onChange={() => setDontAskAgain((prev) => !prev)}
              />
              <Typography sx={{ fontSize: 13, color: text.primary }}>
                Don&apos;t ask me again about enabling Governance Intelligence
              </Typography>
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setDontAskAgain(false)}
                disabled={!dontAskAgain}
                sx={{ textTransform: "none", fontSize: 12 }}
              >
                Reset prompt preference
              </Button>
            </Box>
          </Box>
        </SettingsSection>

        {/* Mapping Filters */}
        <SettingsSection
          icon={<Filter size={18} color={brand.primary} />}
          title="Mapping Filters"
          description="Default filters applied to the Framework Mapper view."
        >
          <Box
            sx={{
              p: 2,
              border: `1px solid ${borderPalette.light}`,
              borderRadius: 2,
              background: background.main,
            }}
          >
            {preferences?.active_mapping_filters ? (
              <Typography sx={{ fontSize: 13, color: text.accent }}>
                Custom filters: {JSON.stringify(preferences.active_mapping_filters)}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 13, color: text.muted }}>
                No default filters configured. Filters are set per-session in the Framework Mapper.
              </Typography>
            )}
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate("/governance/framework-mapper")}
                sx={{ textTransform: "none", fontSize: 12 }}
              >
                Open Framework Mapper
              </Button>
            </Box>
          </Box>
        </SettingsSection>

        {/* Save */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Save size={14} />}
            onClick={handleSave}
            disabled={updatePrefsMutation.isPending}
            sx={{ textTransform: "none", fontSize: 13, boxShadow: "none" }}
          >
            {updatePrefsMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </GovernanceWorkspaceShell>
  );
};

const SettingsSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <Box>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: "rgba(19, 113, 91, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: text.primary }}>{title}</Typography>
        <Typography sx={{ fontSize: 12, color: text.muted }}>{description}</Typography>
      </Box>
    </Stack>
    {children}
  </Box>
);

export default GovernanceSettings;
