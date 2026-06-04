import React from "react";
import { Box } from "@mui/material";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import FrameworkMapper from "../FrameworkMapper";

const FrameworkMapperModule: React.FC = () => {
  return (
    <GovernanceWorkspaceShell
      title="Framework Mapper"
      subtitle="Explore cross-framework control mappings. Select source and target frameworks to see how controls align."
    >
      <FrameworkMapper />
    </GovernanceWorkspaceShell>
  );
};

export default FrameworkMapperModule;
