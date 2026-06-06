import React, { useContext, useMemo } from "react";
import {
  Stack,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitCompareArrows,
  Compass,
  BarChart3,
  FileCheck,
  Network,
  Radio,
  ArrowRight,
  Zap,
  Target,
  Plus,
  AlertTriangle,
} from "lucide-react";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import { DashboardHeaderCard } from "../../../components/Cards/DashboardHeaderCard";
import {
  brand,
  border as borderPalette,
  background,
  text,
  status,
  accent,
} from "../../../themes/palette";
import {
  useMappings,
  useScenarios,
  useGovernancePreferences,
  useCoverage,
} from "../../../../application/hooks/useGovernanceOs";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stat?: string;
  subStat?: string;
  color: string;
  disabled?: boolean;
}

const FRAMEWORK_NAMES: Record<number, string> = {
  1: "EU AI Act",
  2: "ISO 42001",
  3: "ISO 27001",
  4: "NIST AI RMF",
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  path,
  stat,
  subStat,
  color,
  disabled,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => !disabled && navigate(path)}
      sx={{
        cursor: disabled ? "default" : "pointer",
        borderRadius: 2,
        border: "1px solid",
        borderColor: disabled ? borderPalette.light : "divider",
        opacity: disabled ? 0.6 : 1,
        transition: "all 200ms ease",
        "&:hover": {
          borderColor: disabled ? borderPalette.light : color,
          boxShadow: disabled ? "none" : `0 4px 12px ${color}20`,
          transform: disabled ? "none" : "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            {icon}
          </Box>
          {!disabled && <ArrowRight size={16} color="#9CA3AF" />}
        </Stack>
        <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
          {description}
        </Typography>
        {stat && (
          <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600, color }}>
            {stat}
          </Typography>
        )}
        {subStat && (
          <Typography variant="caption" sx={{ color: text.muted, display: "block" }}>
            {subStat}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const GovernanceHub: React.FC = () => {
  const navigate = useNavigate();
  const { projects, currentProjectId } = useContext(VerifyWiseContext);
  const { data: mappings } = useMappings();
  const { data: scenarios } = useScenarios();
  const { data: preferences } = useGovernancePreferences();

  const isEnabled = preferences?.is_enabled ?? false;
  const totalMappings = mappings?.length || 0;
  const totalScenarios = scenarios?.length || 0;

  const activeScenario = useMemo(() => {
    if (!preferences?.selected_scenario_id || !scenarios) return null;
    return scenarios.find((s) => s.id === preferences.selected_scenario_id) || null;
  }, [preferences, scenarios]);

  const activeScenarioPriority = activeScenario?.priority_order as {
    primary?: number;
    secondary?: number[];
    supplementary?: number[];
  } | null;

  const activeFrameworkIds = useMemo(() => {
    const ids = new Set<number>();
    if (activeScenarioPriority?.primary) ids.add(activeScenarioPriority.primary);
    activeScenarioPriority?.secondary?.forEach((id) => ids.add(id));
    activeScenarioPriority?.supplementary?.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [activeScenarioPriority]);

  // Pick a project to show coverage from: current project, or first project with frameworks
  const projectForCoverage = useMemo(() => {
    if (currentProjectId) {
      const parsed = Number(currentProjectId);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const projectWithFrameworks = (projects || []).find(
      (p: any) => p.framework && p.framework.length > 0
    );
    return projectWithFrameworks?.id || 0;
  }, [currentProjectId, projects]);

  const { data: coverage } = useCoverage(projectForCoverage);

  const coverageStats = useMemo(() => {
    if (!coverage || coverage.length === 0) return null;
    const avg = Math.round(
      coverage.reduce((sum, c) => sum + c.coverage_percentage, 0) / coverage.length
    );
    const totalGaps = coverage.reduce(
      (sum, c) => sum + c.gap_details.unmapped_controls.length,
      0
    );
    const topGapFrameworks = [...coverage]
      .sort(
        (a, b) =>
          b.gap_details.unmapped_controls.length - a.gap_details.unmapped_controls.length
      )
      .slice(0, 3);
    return { avg, totalGaps, frameworkCount: coverage.length, topGapFrameworks };
  }, [coverage]);

  const topDomain = useMemo(() => {
    if (!mappings || mappings.length === 0) return null;
    const counts: Record<string, number> = {};
    mappings.forEach((m: any) => {
      const tag = m.domain_tag || "Uncategorized";
      counts[tag] = (counts[tag] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null;
  }, [mappings]);

  const coverageColor =
    coverageStats && coverageStats.avg >= 70
      ? status.success.text
      : coverageStats && coverageStats.avg >= 40
        ? status.warning.text
        : status.error.text;

  const coverageBg =
    coverageStats && coverageStats.avg >= 70
      ? status.success.bg
      : coverageStats && coverageStats.avg >= 40
        ? status.warning.bg
        : status.error.bg;

  const modules: ModuleCardProps[] = [
    {
      title: "Framework Mapper",
      description: "Explore and manage cross-framework control mappings",
      icon: <GitCompareArrows size={20} />,
      path: "/governance/framework-mapper",
      stat: `${totalMappings} mappings`,
      subStat: topDomain ? `Top domain: ${topDomain[0]} (${topDomain[1]})` : undefined,
      color: "#13715B",
    },
    {
      title: "Scenario Builder",
      description: "Get recommendations and manage governance scenarios",
      icon: <Compass size={20} />,
      path: "/governance/scenarios",
      stat: activeScenario ? `Active: ${activeScenario.name}` : `${totalScenarios} scenarios`,
      color: "#3949AB",
    },
    {
      title: "Unified Insights",
      description: "Analyze coverage, gaps, and synergies across projects",
      icon: <BarChart3 size={20} />,
      path: "/governance/insights",
      stat:
        coverageStats != null
          ? `${coverageStats.avg}% avg coverage`
          : "Coverage analysis",
      subStat:
        coverageStats != null ? `${coverageStats.totalGaps} gaps across frameworks` : undefined,
      color: "#1565C0",
    },
    {
      title: "Evidence Hub",
      description: "Centralize evidence with automated collection",
      icon: <FileCheck size={20} />,
      path: "/governance/evidence",
      stat: "Coming soon",
      color: "#00695C",
    },
    {
      title: "Knowledge Graph",
      description: "Visual exploration of governance relationships",
      icon: <Network size={20} />,
      path: "/governance/knowledge-graph",
      stat: "Coming soon",
      color: "#5E35B1",
    },
    {
      title: "Regulatory Radar",
      description: "Monitor regulation changes and auto-updates",
      icon: <Radio size={20} />,
      path: "/governance/regulatory-radar",
      stat: "Coming soon",
      color: "#E65100",
    },
  ];

  return (
    <GovernanceWorkspaceShell
      title="Governance Intelligence"
      subtitle="Your central command center for cross-framework governance, compliance mapping, and coverage analysis."
    >
      <Stack spacing={3}>
        {/* Active scenario preview */}
        {activeScenario ? (
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
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "rgba(19, 113, 91, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Target size={20} color={brand.primary} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: text.muted, mb: 0.5 }}>
                    Active governance scenario
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: text.primary }}>
                    {activeScenario.name}
                  </Typography>
                  {activeScenario.description && (
                    <Typography sx={{ fontSize: 13, color: text.accent, mt: 0.5 }}>
                      {activeScenario.description}
                    </Typography>
                  )}
                  <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                    {activeFrameworkIds.map((id) => {
                      const priority =
                        id === activeScenarioPriority?.primary
                          ? "primary"
                          : activeScenarioPriority?.secondary?.includes(id)
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
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/governance/scenarios")}
                  sx={{ textTransform: "none", fontSize: 12 }}
                >
                  View Scenario
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Zap size={14} />}
                  onClick={() => navigate("/governance/insights")}
                  sx={{ textTransform: "none", fontSize: 12, boxShadow: "none" }}
                >
                  Run Coverage
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
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
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
                  No active scenario selected
                </Typography>
                <Typography sx={{ fontSize: 12, color: text.muted }}>
                  Select a governance scenario to prioritize frameworks and guide compliance planning.
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate("/governance/scenarios")}
                sx={{ textTransform: "none", fontSize: 12, boxShadow: "none" }}
              >
                Choose scenario
              </Button>
            </Stack>
          </Box>
        )}

        {/* Live coverage stats */}
        {coverageStats ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: coverageBg,
                border: `1px solid ${coverageBg}`,
              }}
            >
              <Typography sx={{ fontSize: 11, color: text.muted, mb: 0.5 }}>
                Avg Coverage
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 600, color: coverageColor }}>
                {coverageStats.avg}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={coverageStats.avg}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  mt: 1,
                  backgroundColor: background.hover,
                  "& .MuiLinearProgress-bar": { backgroundColor: coverageColor, borderRadius: 2 },
                }}
              />
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, background: background.hover }}>
              <Typography sx={{ fontSize: 11, color: text.muted, mb: 0.5 }}>Total Gaps</Typography>
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: coverageStats.totalGaps > 0 ? status.warning.text : status.success.text,
                }}
              >
                {coverageStats.totalGaps}
              </Typography>
              <Typography sx={{ fontSize: 11, color: text.muted }}>
                unmapped controls
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, background: background.hover }}>
              <Typography sx={{ fontSize: 11, color: text.muted, mb: 0.5 }}>
                Active Frameworks
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 600, color: brand.primary }}>
                {coverageStats.frameworkCount}
              </Typography>
              <Typography sx={{ fontSize: 11, color: text.muted }}>
                in project {projectForCoverage}
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, background: background.hover }}>
              <Typography sx={{ fontSize: 11, color: text.muted, mb: 0.5 }}>
                Total Mappings
              </Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 600, color: brand.primary }}>
                {totalMappings}
              </Typography>
              <Typography sx={{ fontSize: 11, color: text.muted }}>
                cross-framework links
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <DashboardHeaderCard title="Avg Coverage" count="—" disableNavigation />
            <DashboardHeaderCard title="Total Gaps" count="—" disableNavigation />
            <DashboardHeaderCard title="Active Frameworks" count="—" disableNavigation />
            <DashboardHeaderCard
              title="Total Mappings"
              count={totalMappings}
              disableNavigation
            />
          </Box>
        )}

        {/* Quick actions */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Compass size={14} />}
            onClick={() => navigate("/governance/scenarios")}
            sx={{ textTransform: "none", fontSize: 13 }}
          >
            Get Recommendations
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<BarChart3 size={14} />}
            onClick={() => navigate("/governance/insights")}
            sx={{ textTransform: "none", fontSize: 13 }}
          >
            Run Coverage Analysis
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<GitCompareArrows size={14} />}
            onClick={() => navigate("/governance/framework-mapper")}
            sx={{ textTransform: "none", fontSize: 13 }}
          >
            View Mappings
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={14} />}
            onClick={() => navigate("/governance/scenarios")}
            sx={{ textTransform: "none", fontSize: 13 }}
          >
            New Scenario
          </Button>
        </Stack>

        {/* Module cards grid */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Modules
          </Typography>
          <Grid container spacing={2}>
            {modules.map((module) => (
              <Grid item xs={12} sm={6} md={4} key={module.title}>
                <ModuleCard {...module} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Gap hotspot preview */}
        {coverageStats && coverageStats.topGapFrameworks.length > 0 && (
          <Box
            sx={{
              border: `1px solid ${borderPalette.dark}`,
              borderRadius: 2,
              p: 3,
              background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <AlertTriangle size={18} color={status.warning.text} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Gap Hotspots
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 13, color: text.accent, mb: 2 }}>
              Frameworks with the most unmapped controls. Address these first for the biggest coverage
              improvement.
            </Typography>
            <Stack spacing={1.5}>
              {coverageStats.topGapFrameworks.map((fw) => (
                <Box
                  key={fw.framework_id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: 1.5,
                    border: `1px solid ${borderPalette.light}`,
                    background: background.main,
                    "&:hover": { background: background.accent },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: text.primary }}>
                      {fw.framework_name || `Framework ${fw.framework_id}`}
                    </Typography>
                    <Chip
                      label={`${fw.gap_details.unmapped_controls.length} gaps`}
                      size="small"
                      sx={{
                        fontSize: 11,
                        height: 20,
                        backgroundColor: status.warning.bg,
                        color: status.warning.text,
                        border: `1px solid ${status.warning.border}`,
                      }}
                    />
                    <Typography sx={{ fontSize: 12, color: text.muted }}>
                      {fw.coverage_percentage}% coverage
                    </Typography>
                  </Stack>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => navigate("/governance/insights")}
                    sx={{ fontSize: 12, textTransform: "none", color: brand.primary }}
                  >
                    View
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </GovernanceWorkspaceShell>
  );
};

export default GovernanceHub;
