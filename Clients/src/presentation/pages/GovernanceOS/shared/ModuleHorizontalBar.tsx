import React, { useMemo } from "react";
import { Box, Button, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  GitCompareArrows,
  Compass,
  BarChart3,
  FileCheck,
  Network,
  Radio,
} from "lucide-react";
import { brand } from "../../../themes/palette";

export interface ModuleItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const MODULES: ModuleItem[] = [
  {
    id: "hub",
    label: "Hub",
    path: "/governance",
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
  },
  {
    id: "framework-mapper",
    label: "Framework Mapper",
    path: "/governance/framework-mapper",
    icon: <GitCompareArrows size={16} strokeWidth={1.5} />,
  },
  {
    id: "scenario-builder",
    label: "Scenario Builder",
    path: "/governance/scenarios",
    icon: <Compass size={16} strokeWidth={1.5} />,
  },
  {
    id: "unified-insights",
    label: "Unified Insights",
    path: "/governance/insights",
    icon: <BarChart3 size={16} strokeWidth={1.5} />,
  },
  {
    id: "evidence-hub",
    label: "Evidence Hub",
    path: "/governance/evidence",
    icon: <FileCheck size={16} strokeWidth={1.5} />,
  },
  {
    id: "knowledge-graph",
    label: "Knowledge Graph",
    path: "/governance/knowledge-graph",
    icon: <Network size={16} strokeWidth={1.5} />,
  },
  {
    id: "regulatory-radar",
    label: "Regulatory Radar",
    path: "/governance/regulatory-radar",
    icon: <Radio size={16} strokeWidth={1.5} />,
  },
];

const ModuleHorizontalBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const activeModuleId = useMemo(() => {
    const match = MODULES.find((m) => location.pathname === m.path);
    return match?.id || "hub";
  }, [location.pathname]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        borderBottom: `1px solid ${theme.palette.divider}`,
        mb: 2,
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {MODULES.map((module) => {
        const isActive = module.id === activeModuleId;
        return (
          <Button
            key={module.id}
            onClick={() => navigate(module.path)}
            startIcon={module.icon}
            sx={{
              textTransform: "none",
              fontWeight: isActive ? 600 : 400,
              fontSize: "13px",
              color: isActive ? brand.primary : theme.palette.text.secondary,
              backgroundColor: isActive
                ? `${brand.primary}08`
                : "transparent",
              borderRadius: "6px 6px 0 0",
              borderBottom: isActive
                ? `2px solid ${brand.primary}`
                : "2px solid transparent",
              py: "8px",
              px: "14px",
              minWidth: "auto",
              whiteSpace: "nowrap",
              transition: "all 150ms ease",
              "&:hover": {
                backgroundColor: isActive
                  ? `${brand.primary}12`
                  : theme.palette.action.hover,
              },
            }}
          >
            {module.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default ModuleHorizontalBar;
