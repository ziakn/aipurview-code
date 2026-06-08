import React from "react";
import { Stack, Typography, Box, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  GitCompareArrows,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useGovernancePreferences } from "../../../application/hooks/useGovernanceOs";
import { CustomizableButton } from "../button/customizable-button";

interface GovernanceIntelligenceContextBarProps {
  frameworkCount: number;
}

const GovernanceIntelligenceContextBar: React.FC<GovernanceIntelligenceContextBarProps> = ({
  frameworkCount,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: preferences } = useGovernancePreferences();
  const isEnabled = preferences?.is_enabled ?? false;

  if (!isEnabled || frameworkCount < 2) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: "12px 16px",
        borderRadius: "4px",
        border: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.background.accent,
      }}
    >
      <Stack
        direction="row"
        gap={2}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Stack
          direction="row"
          gap={1.5}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          <GitCompareArrows
            size={18}
            color={theme.palette.primary.main}
            style={{ flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            Governance Intelligence: {frameworkCount} frameworks mapped
          </Typography>
        </Stack>

        <Stack
          direction="row"
          gap={1}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          <CustomizableButton
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => navigate("/governance/framework-mapper")}
            startIcon={<GitCompareArrows size={14} />}
            text="View Mappings"
          />
          <CustomizableButton
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => navigate("/governance/insights")}
            startIcon={<BarChart3 size={14} />}
            text="Analyze Coverage"
          />
          <CustomizableButton
            variant="text"
            size="small"
            color="primary"
            onClick={() => navigate("/governance")}
            endIcon={<ArrowRight size={14} />}
            text="Hub"
          />
        </Stack>
      </Stack>
    </Box>
  );
};

export default GovernanceIntelligenceContextBar;
