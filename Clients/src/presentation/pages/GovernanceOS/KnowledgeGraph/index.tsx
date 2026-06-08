import React from "react";
import { Stack, Typography, Box, alpha } from "@mui/material";
import { Network, Clock } from "lucide-react";
import GovernanceWorkspaceShell from "../shared/GovernanceWorkspaceShell";
import { text, accent } from "../../../themes/palette";

const KnowledgeGraph: React.FC = () => {
  return (
    <GovernanceWorkspaceShell
      title="Knowledge Graph"
      subtitle="Visual exploration of governance relationships, controls, and compliance dependencies."
    >
      <Stack spacing={3} alignItems="center" sx={{ py: 8 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: alpha(accent.purple.text, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Network size={28} color={accent.purple.text} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: text.primary }}>
          Knowledge Graph
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Clock size={16} color={text.muted} />
          <Typography sx={{ fontSize: 14, color: text.muted }}>
            Coming soon — interactive visual graph of governance entities.
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 13, color: text.accent, maxWidth: 480, textAlign: "center" }}>
          The Knowledge Graph will render an interactive visualization of frameworks, controls,
          mappings, risks, and evidence — making complex governance relationships explorable at a
          glance.
        </Typography>
      </Stack>
    </GovernanceWorkspaceShell>
  );
};

export default KnowledgeGraph;
