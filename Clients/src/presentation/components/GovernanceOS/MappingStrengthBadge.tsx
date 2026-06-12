import { Box } from "@mui/material";
import { MappingStrength } from "../../../domain/interfaces/i.governanceOs";
import { status } from "../../themes/palette";
import GovernanceTooltip from "./GovernanceTooltip";

const strengthConfig: Record<
  MappingStrength,
  { bg: string; text: string; border: string; label: string; tooltip: string }
> = {
  direct: {
    ...status.success,
    label: "Direct",
    tooltip: "Direct mapping: implementing the source control fully satisfies the target control.",
  },
  partial: {
    ...status.warning,
    label: "Partial",
    tooltip: "Partial mapping: the controls overlap but each has unique requirements to address.",
  },
  related: {
    ...status.info,
    label: "Related",
    tooltip: "Related mapping: the controls cover similar topics but are not interchangeable.",
  },
};

interface MappingStrengthBadgeProps {
  strength: MappingStrength;
  size?: "small" | "medium";
}

const MappingStrengthBadge = ({ strength, size = "small" }: MappingStrengthBadgeProps) => {
  const config = strengthConfig[strength] || strengthConfig.related;
  const height = size === "small" ? 22 : 24;
  const fontSize = size === "small" ? 11 : 12;
  const badge = (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height,
        px: "8px",
        borderRadius: "4px",
        fontSize,
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </Box>
  );

  return (
    <GovernanceTooltip header={config.label} description={config.tooltip}>
      <span>{badge}</span>
    </GovernanceTooltip>
  );
};

export default MappingStrengthBadge;
