import { Box, ToggleButtonGroup, ToggleButton, Tooltip, Typography } from "@mui/material";
import { Globe, Lock, Eye } from "lucide-react";
import { brand, text as textColors, border as borderPalette, background } from "../../themes/palette";

export type VisibilityValue = "public" | "private";
export type VisibilityFilterValue = "all" | "public" | "private";

interface VisibilityToggleProps {
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
  size?: "small" | "medium";
}

interface VisibilityFilterProps {
  value: VisibilityFilterValue;
  onChange: (value: VisibilityFilterValue) => void;
  size?: "small" | "medium";
}

const toggleSx = (isSmall: boolean) => ({
  textTransform: "none" as const,
  fontSize: isSmall ? 11 : 12,
  fontWeight: 500,
  px: isSmall ? 1.25 : 1.75,
  py: isSmall ? 0.25 : 0.5,
  gap: 0.5,
  borderRadius: "6px !important",
  border: `1px solid ${borderPalette.light} !important`,
  color: textColors.secondary,
  "&.Mui-selected": {
    color: brand.primary,
    backgroundColor: brand.primaryLight,
    borderColor: `${brand.primary} !important`,
    "&:hover": { backgroundColor: brand.primaryLight },
  },
  "&:hover": { backgroundColor: background.hover },
});

/**
 * Toggle between Public and Private for AI action triggers.
 */
export function VisibilityToggle({ value, onChange, size = "small" }: VisibilityToggleProps) {
  const isSmall = size === "small";
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={{ "& .MuiToggleButtonGroup-grouped": { border: 0 } }}
    >
      <ToggleButton value="public" sx={toggleSx(isSmall)}>
        <Globe size={isSmall ? 12 : 14} />
        Public
      </ToggleButton>
      <ToggleButton value="private" sx={toggleSx(isSmall)}>
        <Lock size={isSmall ? 12 : 14} />
        Private
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

/**
 * Filter toggle for viewing results: All / Public / Private.
 */
export function VisibilityFilter({ value, onChange, size = "small" }: VisibilityFilterProps) {
  const isSmall = size === "small";
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={{ "& .MuiToggleButtonGroup-grouped": { border: 0 } }}
    >
      <ToggleButton value="all" sx={toggleSx(isSmall)}>
        <Eye size={isSmall ? 12 : 14} />
        All
      </ToggleButton>
      <ToggleButton value="public" sx={toggleSx(isSmall)}>
        <Globe size={isSmall ? 12 : 14} />
        Public
      </ToggleButton>
      <ToggleButton value="private" sx={toggleSx(isSmall)}>
        <Lock size={isSmall ? 12 : 14} />
        Private
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

export default VisibilityToggle;
