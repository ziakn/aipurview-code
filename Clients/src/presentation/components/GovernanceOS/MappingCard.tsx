import { Box, Typography, Stack, Chip } from "@mui/material";
import { ArrowRight } from "lucide-react";
import MappingStrengthBadge from "./MappingStrengthBadge";
import { IMappingCardProps } from "../../../domain/interfaces/i.governanceOs";
import { border as borderPalette, background, text } from "../../themes/palette";

const FRAMEWORK_NAMES: Record<number, string> = {
  1: "EU AI Act",
  2: "ISO 42001",
  3: "ISO 27001",
  4: "NIST AI RMF",
};

const MappingCard = ({ mapping, frameworkNames }: IMappingCardProps) => {
  const names = frameworkNames || FRAMEWORK_NAMES;

  return (
    <Box
      sx={{
        border: `1px solid ${borderPalette.light}`,
        borderRadius: 2,
        p: 1.5,
        background: background.main,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: borderPalette.dark,
          background: background.accent,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Box sx={{ minWidth: 130 }}>
          <Typography sx={{ fontSize: 11, color: text.muted }}>
            {names[mapping.source_framework_id] || `Framework ${mapping.source_framework_id}`}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
            {mapping.source_control_identifier}
          </Typography>
        </Box>

        <ArrowRight size={14} color={text.muted} />

        <Box sx={{ minWidth: 130 }}>
          <Typography sx={{ fontSize: 11, color: text.muted }}>
            {names[mapping.target_framework_id] || `Framework ${mapping.target_framework_id}`}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
            {mapping.target_control_identifier}
          </Typography>
        </Box>

        <MappingStrengthBadge strength={mapping.mapping_strength} />

        {mapping.domain_tag && (
          <Chip
            label={mapping.domain_tag.replace(/_/g, " ")}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              textTransform: "capitalize",
              backgroundColor: "#E6F0EC",
              color: "#13715B",
            }}
          />
        )}

        {mapping.confidence_score !== undefined && (
          <Typography sx={{ fontSize: 11, color: text.muted }}>
            {Math.round(mapping.confidence_score * 100)}%
          </Typography>
        )}
      </Stack>

      {mapping.rationale && (
        <Typography sx={{ fontSize: 12, color: text.accent, mt: 0.75 }}>
          {mapping.rationale}
        </Typography>
      )}
    </Box>
  );
};

export default MappingCard;
