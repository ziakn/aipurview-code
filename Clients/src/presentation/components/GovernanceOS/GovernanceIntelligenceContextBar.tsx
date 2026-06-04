import React from "react";
import { Stack, Typography, Button, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  GitCompareArrows,
  BarChart3,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useGovernancePreferences } from "../../../application/hooks/useGovernanceOs";
import { palette } from "../../themes/palette";

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
    <Paper
      elevation={0}
      sx={{
        mb: theme.spacing(3),
        p: theme.spacing(2, 3),
        borderRadius: theme.spacing(2),
        border: `1px solid ${palette.brand.primaryLight}`,
        backgroundColor: `${palette.brand.primaryLight}80`,
        boxShadow: "none",
      }}
    >
      <Stack
        direction="row"
        gap={theme.spacing(3)}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Stack
          direction="row"
          gap={theme.spacing(2)}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          <GitCompareArrows
            size={18}
            color={palette.brand.primary}
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
          gap={theme.spacing(1)}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/governance/framework-mapper")}
            startIcon={<GitCompareArrows size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: 12,
              borderRadius: theme.spacing(1.5),
              borderColor: palette.brand.primary,
              color: palette.brand.primary,
              height: 28,
              px: theme.spacing(2),
              "&:hover": {
                backgroundColor: palette.brand.primaryLight,
                borderColor: palette.brand.primary,
              },
            }}
          >
            View Mappings
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate("/governance/insights")}
            startIcon={<BarChart3 size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: 12,
              borderRadius: theme.spacing(1.5),
              borderColor: palette.brand.primary,
              color: palette.brand.primary,
              height: 28,
              px: theme.spacing(2),
              "&:hover": {
                backgroundColor: palette.brand.primaryLight,
                borderColor: palette.brand.primary,
              },
            }}
          >
            Analyze Coverage
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate("/governance")}
            endIcon={<ArrowRight size={14} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: 12,
              color: palette.brand.primary,
              height: 28,
              px: theme.spacing(1),
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Hub
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default GovernanceIntelligenceContextBar;
