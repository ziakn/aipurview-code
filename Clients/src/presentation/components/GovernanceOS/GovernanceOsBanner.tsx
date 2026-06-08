import React from "react";
import { Stack, Typography, Box, Tooltip, useTheme } from "@mui/material";
import { GitCompareArrows, X as CloseIcon } from "lucide-react";
import { useAuth } from "../../../application/hooks/useAuth";
import {
  useGovernancePreferences,
  useUpdatePreferences,
} from "../../../application/hooks/useGovernanceOs";
import { CustomizableButton } from "../button/customizable-button";
import { palette } from "../../themes/palette";

interface GovernanceOsBannerProps {
  frameworkCount: number;
  onDismiss?: () => void;
}

const GovernanceOsBanner: React.FC<GovernanceOsBannerProps> = ({ frameworkCount, onDismiss }) => {
  const theme = useTheme();
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
    <Box
      sx={{
        mb: 3,
        p: "12px 16px",
        borderRadius: "4px",
        border: `1px solid ${palette.brand.primaryLight}`,
        backgroundColor: palette.brand.primaryLight,
      }}
    >
      <Stack
        direction="row"
        gap={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          gap={1.5}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          <GitCompareArrows size={20} color={palette.brand.primary} style={{ flexShrink: 0 }} />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.palette.text.secondary,
              lineHeight: 1.5,
            }}
          >
            You have {frameworkCount} frameworks assigned. Enable Governance OS to explore
            cross-framework mappings and unified coverage analysis.
          </Typography>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Tooltip title={!isAdmin ? "Contact your admin to enable Governance OS" : ""} arrow>
            <span>
              <CustomizableButton
                variant="contained"
                size="medium"
                color="primary"
                isDisabled={!isAdmin || updatePreferences.isPending}
                onClick={handleEnable}
                text={updatePreferences.isPending ? "Enabling..." : "Enable Governance OS"}
              />
            </span>
          </Tooltip>

          {onDismiss && (
            <CustomizableButton
              size="small"
              iconOnly
              ariaLabel="Dismiss banner"
              onClick={onDismiss}
              icon={<CloseIcon size={16} />}
              sx={{
                minWidth: 28,
                width: 28,
                height: 28,
                p: 0,
                color: palette.text.muted,
                "&:hover": {
                  color: palette.text.primary,
                  backgroundColor: "transparent",
                },
              }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default GovernanceOsBanner;
