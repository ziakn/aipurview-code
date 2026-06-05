import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Divider,
  Alert,
  SelectChangeEvent,
} from "@mui/material";
import { Compass, Plus } from "lucide-react";
import Select from "../../components/Inputs/Select";
import ScenarioCard from "../../components/GovernanceOS/ScenarioCard";
import { EmptyState } from "../../components/EmptyState";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import {
  useScenarios,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
  useRecommendations,
  useGovernancePreferences,
  useUpdatePreferences,
  useActivateScenario,
  useSimulateScenario,
} from "../../../application/hooks/useGovernanceOs";
import { useProjects } from "../../../application/hooks/useProjects";
import useUsers from "../../../application/hooks/useUsers";
import {
  IRecommendationRequest,
  IGovernanceScenario,
} from "../../../domain/interfaces/i.governanceOs";
import { border as borderPalette, background } from "../../themes/palette";
import ScenarioFormModal from "./ScenarioBuilderModule/ScenarioFormModal";
import ActivationWizard from "../../components/GovernanceOS/ActivationWizard";
import WhatIfSimulator from "../../components/GovernanceOS/WhatIfSimulator";
import ScenarioComparison from "../../components/GovernanceOS/ScenarioComparison";
import ActiveScenarioPanel from "../../components/GovernanceOS/ActiveScenarioPanel";

const INDUSTRIES = [
  { _id: "technology", name: "Technology" },
  { _id: "healthcare", name: "Healthcare" },
  { _id: "finance", name: "Financial Services" },
  { _id: "public_sector", name: "Public Sector" },
  { _id: "manufacturing", name: "Manufacturing" },
  { _id: "education", name: "Education" },
  { _id: "energy", name: "Energy" },
  { _id: "retail", name: "Retail" },
];

const REGIONS = [
  { _id: "eu", name: "European Union" },
  { _id: "us", name: "United States" },
  { _id: "global", name: "Global" },
  { _id: "apac", name: "Asia-Pacific" },
  { _id: "uk", name: "United Kingdom" },
];

const RISK_LEVELS = [
  { _id: "high", name: "High Risk" },
  { _id: "limited", name: "Limited Risk" },
  { _id: "minimal", name: "Minimal Risk" },
];

const USE_CASE_TYPES = [
  { _id: "high_risk_ai", name: "High-Risk AI System" },
  { _id: "general_purpose_ai", name: "General-Purpose AI" },
  { _id: "limited_risk", name: "Limited Risk AI" },
];

const ScenarioBuilder = () => {
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios();
  const { data: preferences } = useGovernancePreferences();
  const updatePreferencesMutation = useUpdatePreferences();
  const recommendMutation = useRecommendations();
  const createScenarioMutation = useCreateScenario();
  const updateScenarioMutation = useUpdateScenario();
  const deleteScenarioMutation = useDeleteScenario();
  const activateScenarioMutation = useActivateScenario();
  const simulateScenarioMutation = useSimulateScenario();
  const { approvedProjects, isLoading: projectsLoading } = useProjects();
  const { users, loading: usersLoading } = useUsers();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<IGovernanceScenario | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<IGovernanceScenario | null>(null);

  const [formData, setFormData] = useState<IRecommendationRequest>({
    industry: "",
    region: "",
    riskLevel: "",
    useCaseType: "",
    deploymentScale: "",
  });

  const [activationWizardOpen, setActivationWizardOpen] = useState(false);
  const [activatingScenario, setActivatingScenario] = useState<IGovernanceScenario | null>(null);
  const [compareSelectedIds, setCompareSelectedIds] = useState<number[]>([]);

  const selectedScenarioId = preferences?.selected_scenario_id ?? null;

  const handleRecommend = () => {
    recommendMutation.mutate(formData);
  };

  const handleSelectScenario = (scenario: IGovernanceScenario) => {
    updatePreferencesMutation.mutate({ selected_scenario_id: scenario.id });
  };

  const handleCreateScenario = () => {
    setEditingScenario(null);
    setFormModalOpen(true);
  };

  const handleEditScenario = (scenario: IGovernanceScenario) => {
    setEditingScenario(scenario);
    setFormModalOpen(true);
  };

  const handleDeleteScenario = (scenario: IGovernanceScenario) => {
    setScenarioToDelete(scenario);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (scenarioToDelete) {
      deleteScenarioMutation.mutate(scenarioToDelete.id);
      setDeleteConfirmOpen(false);
      setScenarioToDelete(null);
    }
  };

  const handleFormSubmit = (data: Partial<IGovernanceScenario>) => {
    if (editingScenario) {
      updateScenarioMutation.mutate(
        { id: editingScenario.id, body: data },
        { onSuccess: () => setFormModalOpen(false) }
      );
    } else {
      createScenarioMutation.mutate(data, { onSuccess: () => setFormModalOpen(false) });
    }
  };

  const handleActivateClick = (scenario: IGovernanceScenario) => {
    setActivatingScenario(scenario);
    setActivationWizardOpen(true);
  };

  const handleActivate = ({
    projectIds,
    ownerAssignments,
  }: {
    projectIds: number[];
    ownerAssignments: Record<number, number>;
  }) => {
    if (!activatingScenario) return;
    activateScenarioMutation.mutate(
      {
        id: activatingScenario.id,
        body: { projectIds, ownerAssignments },
      },
      {
        onSuccess: () => {
          setActivationWizardOpen(false);
          setActivatingScenario(null);
        },
      }
    );
  };

  const canRecommend =
    formData.industry || formData.region || formData.riskLevel || formData.useCaseType;

  return (
    <Stack spacing={3}>
      <Typography variant="body2" sx={{ color: "#475467" }}>
        Get framework recommendations based on your organization context, or browse pre-built
        governance scenarios.
      </Typography>

      <ActiveScenarioPanel
        activeScenario={scenarios?.find((s) => s.id === selectedScenarioId)}
        onActivate={handleActivateClick}
      />

      {/* Recommendation form -->
      <Box
        sx={{
          border: `1px solid ${borderPalette.dark}`,
          borderRadius: 2,
          p: 3,
          background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 600 }}>
          Get Recommendations
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="flex-end">
          <Select
            id="industry-select"
            label="Industry"
            placeholder="Any"
            value={formData.industry || ""}
            items={INDUSTRIES}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setFormData({ ...formData, industry: e.target.value as string })
            }
            sx={{ minWidth: 170 }}
          />

          <Select
            id="region-select"
            label="Region"
            placeholder="Any"
            value={formData.region || ""}
            items={REGIONS}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setFormData({ ...formData, region: e.target.value as string })
            }
            sx={{ minWidth: 170 }}
          />

          <Select
            id="risk-level-select"
            label="Risk Level"
            placeholder="Any"
            value={formData.riskLevel || ""}
            items={RISK_LEVELS}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setFormData({ ...formData, riskLevel: e.target.value as string })
            }
            sx={{ minWidth: 170 }}
          />

          <Select
            id="use-case-type-select"
            label="Use Case Type"
            placeholder="Any"
            value={formData.useCaseType || ""}
            items={USE_CASE_TYPES}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setFormData({ ...formData, useCaseType: e.target.value as string })
            }
            sx={{ minWidth: 170 }}
          />

          <Button
            variant="contained"
            onClick={handleRecommend}
            disabled={recommendMutation.isPending || !canRecommend}
            sx={{ alignSelf: "flex-end", minWidth: 140, height: 34 }}
          >
            {recommendMutation.isPending ? <CircularProgress size={20} /> : "Get Recommendations"}
          </Button>
        </Stack>
      </Box>

      {/* Recommendation results */}
      {recommendMutation.data && recommendMutation.data.length > 0 && (
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Recommended Scenarios
          </Typography>
          <Stack spacing={2}>
            {recommendMutation.data.map((result) => (
              <ScenarioCard
                key={result.scenario.id}
                scenario={result.scenario}
                score={result.score}
                matchedRules={result.matchedRules}
                isSelected={selectedScenarioId === result.scenario.id}
                onSelect={handleSelectScenario}
                onActivate={handleActivateClick}
              />
            ))}
          </Stack>
        </Stack>
      )}

      {recommendMutation.data && recommendMutation.data.length === 0 && (
        <Alert severity="info">
          No strong matches found. Try adjusting your criteria or browse the scenarios below.
        </Alert>
      )}

      <WhatIfSimulator
        scenarios={scenarios || []}
        result={simulateScenarioMutation.data || null}
        isSimulating={simulateScenarioMutation.isPending}
        error={simulateScenarioMutation.error}
        onSimulate={(body) => simulateScenarioMutation.mutate(body)}
      />

      <ScenarioComparison
        scenarios={scenarios || []}
        selectedIds={compareSelectedIds}
        onChangeSelectedIds={setCompareSelectedIds}
      />

      <Divider />

      {/* All scenarios */}
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            All Governance Scenarios
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={14} />}
            onClick={handleCreateScenario}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            New Scenario
          </Button>
        </Stack>

        {scenariosLoading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={32} />
          </Stack>
        ) : !scenarios || scenarios.length === 0 ? (
          <EmptyState message="No governance scenarios available." icon={Compass} showBorder />
        ) : (
          <Stack spacing={2}>
            {scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenarioId === scenario.id}
                onSelect={handleSelectScenario}
                onEdit={handleEditScenario}
                onDelete={handleDeleteScenario}
                onActivate={handleActivateClick}
              />
            ))}
          </Stack>
        )}
      </Stack>
      <ScenarioFormModal
        open={formModalOpen}
        scenario={editingScenario}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={createScenarioMutation.isPending || updateScenarioMutation.isPending}
      />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onProceed={confirmDelete}
        title="Delete Scenario"
        body={`Are you sure you want to delete "${scenarioToDelete?.name}"? This action cannot be undone.`}
        proceedText="Delete"
        cancelText="Cancel"
        proceedButtonVariant="contained"
        proceedButtonColor="error"
        isLoading={deleteScenarioMutation.isPending}
      />

      <ActivationWizard
        open={activationWizardOpen}
        scenario={activatingScenario}
        projects={approvedProjects || []}
        users={users || []}
        isLoading={activateScenarioMutation.isPending || projectsLoading || usersLoading}
        onClose={() => {
          setActivationWizardOpen(false);
          setActivatingScenario(null);
        }}
        onActivate={handleActivate}
      />
    </Stack>
  );
};

export default ScenarioBuilder;
