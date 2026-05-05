import { FormControl, InputLabel, Select, MenuItem, Stack } from "@mui/material";
import { ArrowRight } from "lucide-react";
import { text } from "../../themes/palette";

const FRAMEWORKS = [
  { id: 1, name: "EU AI Act" },
  { id: 2, name: "ISO 42001" },
  { id: 3, name: "ISO 27001" },
  { id: 4, name: "NIST AI RMF" },
];

interface FrameworkSelectorProps {
  sourceId: number;
  targetId: number;
  onSourceChange: (id: number) => void;
  onTargetChange: (id: number) => void;
}

const FrameworkSelector = ({
  sourceId,
  targetId,
  onSourceChange,
  onTargetChange,
}: FrameworkSelectorProps) => {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Source Framework</InputLabel>
        <Select
          value={sourceId}
          label="Source Framework"
          onChange={(e) => onSourceChange(Number(e.target.value))}
        >
          {FRAMEWORKS.map((fw) => (
            <MenuItem key={fw.id} value={fw.id} disabled={fw.id === targetId}>
              {fw.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ArrowRight size={16} color={text.muted} />

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Target Framework</InputLabel>
        <Select
          value={targetId}
          label="Target Framework"
          onChange={(e) => onTargetChange(Number(e.target.value))}
        >
          {FRAMEWORKS.map((fw) => (
            <MenuItem key={fw.id} value={fw.id} disabled={fw.id === sourceId}>
              {fw.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default FrameworkSelector;
