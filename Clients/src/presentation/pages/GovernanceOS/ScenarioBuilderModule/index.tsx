import React from "react";
import { Box } from "@mui/material";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import ScenarioBuilder from "../ScenarioBuilder";

const ScenarioBuilderModule: React.FC = () => {
  return (
    <GovernanceWorkspaceShell
      title="Scenario Builder"
      subtitle="Get framework recommendations based on your organization context, or browse and manage governance scenarios."
    >
      <ScenarioBuilder />
    </GovernanceWorkspaceShell>
  );
};

export default ScenarioBuilderModule;
