import { Stack } from "@mui/material";
import { Globe, Lock, Eye } from "lucide-react";
import Chip from "../Chip";
import { brand, background } from "../../themes/palette";

export type VisibilityValue = "public" | "private";
export type VisibilityFilterValue = "all" | "public" | "private";

interface VisibilityChipsProps {
  value: VisibilityFilterValue;
  onChange: (value: VisibilityFilterValue) => void;
}

const OPTIONS: { value: VisibilityFilterValue; label: string; Icon: typeof Eye }[] = [
  { value: "all", label: "All", Icon: Eye },
  { value: "public", label: "Public", Icon: Globe },
  { value: "private", label: "Private", Icon: Lock },
];

/**
 * Single visibility selector using Chip components.
 * Replaces both VisibilityToggle and VisibilityFilter.
 */
export function VisibilityChips({ value, onChange }: VisibilityChipsProps) {
  return (
    <Stack direction="row" spacing={1}>
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <span
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{ cursor: "pointer" }}
          >
            <Chip
              label={opt.label}
              size="small"
              uppercase={false}
              icon={<opt.Icon size={12} />}
              backgroundColor={isSelected ? brand.primaryLight : background.hover}
              textColor={isSelected ? brand.primary : undefined}
            />
          </span>
        );
      })}
    </Stack>
  );
}

// Keep backward-compatible exports
export { VisibilityChips as VisibilityFilter };
export { VisibilityChips as VisibilityToggle };
export default VisibilityChips;
