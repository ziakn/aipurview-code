import React from "react";
import { Stack, Box, Typography, Card, CardContent, Grid } from "@mui/material";
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
} from "lucide-react";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import { DashboardHeaderCard } from "../../../components/Cards/DashboardHeaderCard";
import { brand } from "../../../themes/palette";
import {
  useMappings,
  useScenarios,
  useGovernancePreferences,
} from "../../../../application/hooks/useGovernanceOs";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  stat?: string;
  color: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  path,
  stat,
  color,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(path)}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 200ms ease",
        "&:hover": {
          borderColor: color,
          boxShadow: `0 4px 12px ${color}20`,
          transform: "translateY(-2px)",
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
          <ArrowRight size={16} color="#9CA3AF" />
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
      </CardContent>
    </Card>
  );
};

const GovernanceHub: React.FC = () => {
  const { data: mappings } = useMappings();
  const { data: scenarios } = useScenarios();
  const { data: preferences } = useGovernancePreferences();

  const isEnabled = preferences?.is_enabled ?? false;
  const totalMappings = mappings?.length || 0;
  const totalScenarios = scenarios?.length || 0;

  const modules: ModuleCardProps[] = [
    {
      title: "Framework Mapper",
      description: "Explore and manage cross-framework control mappings",
      icon: <GitCompareArrows size={20} />,
      path: "/governance/framework-mapper",
      stat: `${totalMappings} mappings`,
      color: "#13715B",
    },
    {
      title: "Scenario Builder",
      description: "Get recommendations and manage governance scenarios",
      icon: <Compass size={20} />,
      path: "/governance/scenarios",
      stat: `${totalScenarios} scenarios`,
      color: "#3949AB",
    },
    {
      title: "Unified Insights",
      description: "Analyze coverage, gaps, and synergies across projects",
      icon: <BarChart3 size={20} />,
      path: "/governance/insights",
      stat: "Coverage analysis",
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
      {/* Stats row */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          "& > *": {
            flex: "1 1 0",
            minWidth: "150px",
          },
        }}
      >
        <DashboardHeaderCard
          title="Total Mappings"
          count={totalMappings}
          icon={<GitCompareArrows size={18} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="Scenarios"
          count={totalScenarios}
          icon={<Compass size={18} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="Active Scenario"
          count={preferences?.selected_scenario_id ? "Yes" : "None"}
          icon={<LayoutDashboard size={18} />}
          disableNavigation
        />
        <DashboardHeaderCard
          title="Status"
          count={isEnabled ? "Enabled" : "Disabled"}
          icon={<BarChart3 size={18} />}
          disableNavigation
        />
      </Box>

      {/* Module cards grid */}
      <Box sx={{ mt: 2 }}>
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
    </GovernanceWorkspaceShell>
  );
};

export default GovernanceHub;
