import { useContext, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { BarChart3 } from "lucide-react";
import CoverageChart from "../../components/GovernanceOS/CoverageChart";
import { DashboardHeaderCard } from "../../components/Cards/DashboardHeaderCard";
import { EmptyState } from "../../components/EmptyState";
import { useCoverage, useRefreshCoverage } from "../../../application/hooks/useGovernanceOs";
import { VerifyWiseContext } from "../../../application/contexts/VerifyWise.context";

const UnifiedInsights = () => {
  const { projects } = useContext(VerifyWiseContext);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const { data: coverage, isLoading } = useCoverage(selectedProjectId);
  const refreshMutation = useRefreshCoverage();

  const totalMapped = (coverage || []).reduce((sum, c) => sum + c.mapped_controls, 0);
  const totalControls = (coverage || []).reduce((sum, c) => sum + c.total_controls, 0);
  const avgCoverage =
    coverage && coverage.length > 0
      ? Math.round(coverage.reduce((sum, c) => sum + c.coverage_percentage, 0) / coverage.length)
      : 0;

  return (
    <Box>
      <Typography variant="body2" sx={{ color: "#475467", mb: 2 }}>
        View cross-framework coverage analysis per project. Identify gaps and synergies across your active frameworks.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProjectId}
            label="Select Project"
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            <MenuItem value={0} disabled>Choose a project</MenuItem>
            {(projects || []).map((p: any) => (
              <MenuItem key={p.id} value={p.id}>
                {p.project_title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedProjectId > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => refreshMutation.mutate(selectedProjectId)}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? "Refreshing..." : "Refresh Coverage"}
          </Button>
        )}
      </Stack>

      {selectedProjectId === 0 ? (
        <EmptyState
          message="Select a project to view its cross-framework coverage analysis."
          icon={BarChart3}
          showBorder
        />
      ) : isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={32} />
        </Stack>
      ) : (
        <>
          {/* Summary cards */}
          <Stack direction="row" spacing={2} sx={{ mb: 3, width: "100%" }}>
            <DashboardHeaderCard
              title="Average Coverage"
              count={`${avgCoverage}%`}
              disableNavigation
            />
            <DashboardHeaderCard
              title="Mapped Controls"
              count={totalMapped}
              disableNavigation
            />
            <DashboardHeaderCard
              title="Total Controls"
              count={totalControls}
              disableNavigation
            />
            <DashboardHeaderCard
              title="Active Frameworks"
              count={coverage?.length || 0}
              disableNavigation
            />
          </Stack>

          {/* Coverage breakdown */}
          <CoverageChart coverage={coverage || []} />
        </>
      )}
    </Box>
  );
};

export default UnifiedInsights;
