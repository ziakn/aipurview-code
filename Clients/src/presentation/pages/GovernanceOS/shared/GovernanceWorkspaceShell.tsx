import React from "react";
import { Stack, Box, Typography, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
  return (
    <Stack className="vwhome" gap={0}>
      {/* Breadcrumb with module switcher */}
      <ModuleBreadcrumb />

      {/* Horizontal module navigation bar */}
      <ModuleHorizontalBar />

      {/* Page header */}
      <Box sx={{ mt: "8px" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <PageHeader
            title={title}
            description={subtitle}
          />
          {actionButton && <Box sx={{ flexShrink: 0 }}>{actionButton}</Box>}
        </Stack>
      </Box>

      <Divider sx={{ my: "16px" }} />

      {/* Module content */}
      <Stack gap="16px" sx={{ mt: "8px" }}>
        {children}
      </Stack>
    </Stack>
  );
};

export default GovernanceWorkspaceShell;
