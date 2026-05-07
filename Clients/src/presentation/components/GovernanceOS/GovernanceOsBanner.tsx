import React from "react";
import { Stack, Typography, Button, Tooltip, Paper } from "@mui/material";
import { GitCompareArrows, X as CloseIcon } from "lucide-react";
import { useAuth } from "../../../application/hooks/useAuth";
import { useGovernancePreferences, useUpdatePreferences } from "../../../application/hooks/useGovernanceOs";
import { palette } from "../../themes/palette";

interface GovernanceOsBannerProps {
  frameworkCount: number;
  onDismiss?: () => void;
}

const GovernanceOsBanner: React.FC<GovernanceOsBannerProps> = ({
  frameworkCount,
  onDismiss,
}) => {
  const { userRoleName } = useAuth();
  const { data: preferences } = useGovernancePreferences();
  const updatePreferences = useUpdatePreferences();
  const isAdmin = userRoleName === "Admin";

  const isEnabled = preferences?.is_enabled ?? false;
  const isVisible = frameworkCount >= 2 && !isEnabled;

  if (!isVisible) return null;

  const handleEnable = () => {
    updatePreferences.mutate({ is_enabled: true });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${palette.brand.primaryLight}`,
        backgroundColor: palette.brand.primaryLight,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <GitCompareArrows size={20} color={palette.brand.primary} />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: palette.text.primary,
              fontSize: 13,
            }}
          >
            You have {frameworkCount} frameworks assigned. Enable Governance OS to explore
            cross-framework mappings and unified coverage analysis.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip
            title={
              !isAdmin ? "Contact your admin to enable Governance OS" : ""
            }
            arrow
          >
            <span>
              <Button
                variant="contained"
                size="small"
                disabled={!isAdmin || updatePreferences.isPending}
                onClick={handleEnable}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: 12,
                  borderRadius: 2,
                  boxShadow: "none",
                  backgroundColor: palette.brand.primary,
                  "&:hover": {
                    backgroundColor: palette.brand.primaryHover,
                    boxShadow: "none",
                  },
                }}
              >
                {updatePreferences.isPending ? "Enabling..." : "Enable Governance OS"}
              </Button>
            </span>
          </Tooltip>

          {onDismiss && (
            <Button
              size="small"
              onClick={onDismiss}
              sx={{
                minWidth: 28,
                width: 28,
                height: 28,
                p: 0,
                color: palette.text.muted,
                "&:hover": { color: palette.text.primary, backgroundColor: "transparent" },
              }}
            >
              <CloseIcon size={16} />
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default GovernanceOsBanner;
