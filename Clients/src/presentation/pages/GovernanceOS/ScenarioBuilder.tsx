import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
} from "@mui/material";
import { Compass } from "lucide-react";
import ScenarioCard from "../../components/GovernanceOS/ScenarioCard";
import { EmptyState } from "../../components/EmptyState";
import { useScenarios, useRecommendations } from "../../../application/hooks/useGovernanceOs";
import { IRecommendationRequest, IGovernanceScenario } from "../../../domain/interfaces/i.governanceOs";
import { border as borderPalette, background } from "../../themes/palette";

const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Financial Services" },
  { value: "public_sector", label: "Public Sector" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "energy", label: "Energy" },
  { value: "retail", label: "Retail" },
];

const REGIONS = [
  { value: "eu", label: "European Union" },
  { value: "us", label: "United States" },
  { value: "global", label: "Global" },
  { value: "apac", label: "Asia-Pacific" },
  { value: "uk", label: "United Kingdom" },
];

const RISK_LEVELS = [
  { value: "high", label: "High Risk" },
  { value: "limited", label: "Limited Risk" },
  { value: "minimal", label: "Minimal Risk" },
];

const USE_CASE_TYPES = [
  { value: "high_risk_ai", label: "High-Risk AI System" },
  { value: "general_purpose_ai", label: "General-Purpose AI" },
  { value: "limited_risk", label: "Limited Risk AI" },
];

const ScenarioBuilder = () => {
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios();
  const recommendMutation = useRecommendations();

  const [formData, setFormData] = useState<IRecommendationRequest>({
    industry: "",
    region: "",
    riskLevel: "",
    useCaseType: "",
    deploymentScale: "",
  });

  const handleRecommend = () => {
    recommendMutation.mutate(formData);
  };

  const handleSelectScenario = (scenario: IGovernanceScenario) => {
    console.info("Selected scenario:", scenario.name);
  };

  const canRecommend = formData.industry || formData.region || formData.riskLevel || formData.useCaseType;

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "#475467", mb: 3 }}>
        Get framework recommendations based on your organization context, or browse pre-built governance scenarios.
      </Typography>

      {/* Recommendation form */}
      <Box
        sx={{
          border: `1px solid ${borderPalette.dark}`,
          borderRadius: 2,
          p: 2.5,
          mb: 3,
          background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Get Recommendations
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Industry</InputLabel>
            <Select
              value={formData.industry}
              label="Industry"
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            >
              <MenuItem value="">Any</MenuItem>
              {INDUSTRIES.map((i) => (
                <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={formData.region}
              label="Region"
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <MenuItem value="">Any</MenuItem>
              {REGIONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select
              value={formData.riskLevel}
              label="Risk Level"
              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
            >
              <MenuItem value="">Any</MenuItem>
              {RISK_LEVELS.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Use Case Type</InputLabel>
            <Select
              value={formData.useCaseType}
              label="Use Case Type"
              onChange={(e) => setFormData({ ...formData, useCaseType: e.target.value })}
            >
              <MenuItem value="">Any</MenuItem>
              {USE_CASE_TYPES.map((u) => (
                <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleRecommend}
            disabled={recommendMutation.isPending || !canRecommend}
            sx={{ alignSelf: "flex-end", minWidth: 140 }}
          >
            {recommendMutation.isPending ? <CircularProgress size={20} /> : "Get Recommendations"}
          </Button>
        </Stack>
      </Box>

      {/* Recommendation results */}
      {recommendMutation.data && recommendMutation.data.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Recommended Scenarios
          </Typography>
          <Stack spacing={1.5}>
            {recommendMutation.data.map((result) => (
              <ScenarioCard
                key={result.scenario.id}
                scenario={result.scenario}
                score={result.score}
                matchedRules={result.matchedRules}
                onSelect={handleSelectScenario}
              />
            ))}
          </Stack>
        </Box>
      )}

      {recommendMutation.data && recommendMutation.data.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No strong matches found. Try adjusting your criteria or browse the scenarios below.
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      {/* All scenarios */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        All Governance Scenarios
      </Typography>

      {scenariosLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={32} />
        </Stack>
      ) : !scenarios || scenarios.length === 0 ? (
        <EmptyState
          message="No governance scenarios available."
          icon={Compass}
          showBorder
        />
      ) : (
        <Stack spacing={1.5}>
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={handleSelectScenario}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ScenarioBuilder;
