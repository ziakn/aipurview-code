import { Box } from "@mui/material";
import { MappingStrength } from "../../../domain/interfaces/i.governanceOs";
import { status } from "../../themes/palette";
import GovernanceTooltip from "./GovernanceTooltip";

const strengthConfig: Record<
  MappingStrength,
  { bg: string; text: string; border: string; label: string; headerKey: string; descKey: string }
> = {
  direct: {
    ...status.success,
    label: "Direct",
    headerKey: "Governance.Tooltip.MappingStrength.Direct",
    descKey: "Governance.Tooltip.MappingStrength.Direct.Desc",
  },
  partial: {
    ...status.warning,
    label: "Partial",
    headerKey: "Governance.Tooltip.MappingStrength.Partial",
    descKey: "Governance.Tooltip.MappingStrength.Partial.Desc",
  },
  related: {
    ...status.info,
    label: "Related",
    headerKey: "Governance.Tooltip.MappingStrength.Related",
    descKey: "Governance.Tooltip.MappingStrength.Related.Desc",
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
    <GovernanceTooltip header={config.headerKey} description={config.descKey}>
      <span>{badge}</span>
    </GovernanceTooltip>
  );
};

export default MappingStrengthBadge;
