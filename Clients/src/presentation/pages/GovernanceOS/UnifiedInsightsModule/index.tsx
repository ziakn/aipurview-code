import React from "react";
import { Box } from "@mui/material";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import UnifiedInsights from "../UnifiedInsights";

const UnifiedInsightsModule: React.FC = () => {
  return (
    <GovernanceWorkspaceShell
      title="Unified Insights"
      subtitle="View cross-framework coverage analysis per project. Identify gaps and synergies across your active frameworks."
    >
      <UnifiedInsights />
    </GovernanceWorkspaceShell>
  );
};

export default UnifiedInsightsModule;
