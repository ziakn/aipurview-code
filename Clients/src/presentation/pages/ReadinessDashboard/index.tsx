import { useState } from "react";
import { Box, Typography, Button, CircularProgress, Stack, Tab, Tabs } from "@mui/material";
import { text as textColors, background, border } from "../../themes/palette";
import ReadinessScoreCard from "../../components/ReadinessScoreCard";
import ReadinessHeatmap from "../../components/ReadinessHeatmap";
import ReadinessTrend from "../../components/ReadinessTrend";
import WeakControlsList from "../../components/WeakControlsList";
import {
  useReadinessScores,
  useControlScores,
  useWeakestControls,
  useRecommendations,
  useReadinessHistory,
  useTriggerCalculateAll,
} from "../../../application/hooks/useReadiness";

const FRAMEWORK_TABS = [
  { value: "eu_ai_act", label: "EU AI Act" },
  { value: "iso_42001", label: "ISO 42001" },
];

export default function ReadinessDashboard() {
  const [selectedFramework, setSelectedFramework] = useState("eu_ai_act");

  const { data: scores, isLoading: scoresLoading } = useReadinessScores();
  const { data: controlScores, isLoading: controlsLoading } = useControlScores(selectedFramework);
  const { data: weakest, isLoading: weakestLoading } = useWeakestControls(10);
  const { data: recommendations, isLoading: recsLoading } = useRecommendations(10);
  const { data: history, isLoading: historyLoading } = useReadinessHistory();
  const triggerCalculate = useTriggerCalculateAll();

  const handleCalculate = () => {
    triggerCalculate.mutate(undefined);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: textColors.primary }}>
            Audit Readiness Dashboard
          </Typography>
          <Typography sx={{ fontSize: 13, color: textColors.secondary, mt: 0.5 }}>
            Per-control readiness scores, framework aggregations, and improvement recommendations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleCalculate}
          disabled={triggerCalculate.isPending}
          sx={{ textTransform: "none", minWidth: 140 }}
        >
          {triggerCalculate.isPending ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : null}
          {triggerCalculate.isPending ? "Calculating..." : "Calculate Readiness"}
        </Button>
      </Box>

      {/* Framework score cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 2, mb: 3 }}>
        {scoresLoading ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : scores && scores.length > 0 ? (
          scores.map((fw: any) => (
            <ReadinessScoreCard
              key={fw.framework_type}
              frameworkType={fw.framework_type}
              overallScore={fw.avg_score}
              totalControls={fw.total_controls}
              readyCount={fw.ready_count}
              needsWorkCount={fw.needs_work_count}
              atRiskCount={fw.at_risk_count}
              notStartedCount={fw.not_started_count}
            />
          ))
        ) : (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              gridColumn: "1/-1",
              backgroundColor: background.accent,
              borderRadius: 2,
              border: `1px solid ${border.light}`,
            }}
          >
            <Typography sx={{ fontSize: 13, color: textColors.tertiary }}>
              No readiness scores yet. Click "Calculate Readiness" to start.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Framework tabs for heatmap */}
      <Tabs
        value={selectedFramework}
        onChange={(_, v) => setSelectedFramework(v)}
        sx={{ mb: 2 }}
      >
        {FRAMEWORK_TABS.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} sx={{ textTransform: "none" }} />
        ))}
      </Tabs>

      {/* Two-column layout: Heatmap + Trend */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <ReadinessHeatmap
          controls={controlScores ?? []}
          frameworkType={selectedFramework}
          isLoading={controlsLoading}
        />
        <ReadinessTrend data={history ?? []} isLoading={historyLoading} />
      </Box>

      {/* Two-column layout: Weakest Controls + Recommendations */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <WeakControlsList
          controls={weakest ?? []}
          isLoading={weakestLoading}
        />
        <WeakControlsList
          controls={recommendations ?? []}
          isLoading={recsLoading}
          maxItems={10}
        />
      </Box>
    </Box>
  );
}
