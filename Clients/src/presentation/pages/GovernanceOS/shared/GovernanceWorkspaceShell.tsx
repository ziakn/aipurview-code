import React from "react";
import { Stack, Box, Divider, useTheme } from "@mui/material";
import ModuleHorizontalBar from "./ModuleHorizontalBar";
import ModuleBreadcrumb from "./ModuleBreadcrumb";
import { PageHeader } from "../../../components/Layout/PageHeader";

interface GovernanceWorkspaceShellProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
}

const GovernanceWorkspaceShell: React.FC<GovernanceWorkspaceShellProps> = ({
  title,
  subtitle,
  actionButton,
  children,
}) => {
  const theme = useTheme();

  return (
    <Stack className="vwhome" gap={0}>
      {/* Breadcrumb with module switcher */}
      <ModuleBreadcrumb />

      {/* Horizontal module navigation bar */}
      <ModuleHorizontalBar />

      {/* Page header */}
      <Box sx={{ mt: theme.spacing(4) }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <PageHeader
            title={title}
            description={subtitle}
          />
          {actionButton && <Box sx={{ flexShrink: 0 }}>{actionButton}</Box>}
        </Stack>
      </Box>

      <Divider sx={{ my: theme.spacing(8) }} />

      {/* Module content */}
      <Stack gap={theme.spacing(8)} sx={{ mt: theme.spacing(4) }}>
        {children}
      </Stack>
    </Stack>
  );
};

export default GovernanceWorkspaceShell;
