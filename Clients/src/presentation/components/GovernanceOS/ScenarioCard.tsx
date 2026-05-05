import { Box, Typography, Stack, Chip, Button } from "@mui/material";
import { IScenarioCardProps } from "../../../domain/interfaces/i.governanceOs";
import { border as borderPalette, background, text, accent, brand } from "../../themes/palette";

const FRAMEWORK_NAMES: Record<number, string> = {
  1: "EU AI Act",
  2: "ISO 42001",
  3: "ISO 27001",
  4: "NIST AI RMF",
};

const ScenarioCard = ({ scenario, score, matchedRules, onSelect }: IScenarioCardProps) => {
  const priorityOrder = scenario.priority_order as {
    primary?: number;
    secondary?: number[];
    supplementary?: number[];
  } | null;

  return (
    <Box
      sx={{
        border: `1px solid ${borderPalette.light}`,
        borderRadius: 2,
        p: 2,
        background: background.main,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: borderPalette.dark,
          background: background.accent,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: text.primary }}>
            {scenario.name}
          </Typography>
          {score !== undefined && (
            <Typography sx={{ fontSize: 12, color: brand.primary, fontWeight: 500 }}>
              Match score: {score}%
            </Typography>
          )}
        </Box>
        {onSelect && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onSelect(scenario)}
            sx={{
              fontSize: 12,
              textTransform: "none",
              borderColor: borderPalette.dark,
              color: text.secondary,
              "&:hover": {
                borderColor: brand.primary,
                color: brand.primary,
              },
            }}
          >
            Select
          </Button>
        )}
      </Stack>

      {scenario.description && (
        <Typography sx={{ fontSize: 13, color: text.accent, mt: 0.75 }}>
          {scenario.description}
        </Typography>
      )}

      {priorityOrder && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          {priorityOrder.primary && (
            <Chip
              label={`Primary: ${FRAMEWORK_NAMES[priorityOrder.primary] || priorityOrder.primary}`}
              size="small"
              sx={{
                fontSize: 11,
                height: 22,
                backgroundColor: accent.primary.bg,
                color: accent.primary.text,
                border: `1px solid ${accent.primary.border}`,
              }}
            />
          )}
          {priorityOrder.secondary?.map((id) => (
            <Chip
              key={id}
              label={`Secondary: ${FRAMEWORK_NAMES[id] || id}`}
              size="small"
              sx={{
                fontSize: 11,
                height: 22,
                backgroundColor: accent.indigo.bg,
                color: accent.indigo.text,
                border: `1px solid ${accent.indigo.border}`,
              }}
            />
          ))}
          {priorityOrder.supplementary?.map((id) => (
            <Chip
              key={id}
              label={`Supplementary: ${FRAMEWORK_NAMES[id] || id}`}
              size="small"
              sx={{
                fontSize: 11,
                height: 22,
                backgroundColor: background.hover,
                color: text.tertiary,
                border: `1px solid ${borderPalette.light}`,
              }}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        {scenario.industry && (
          <Chip
            label={scenario.industry}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              backgroundColor: background.hover,
              color: text.tertiary,
              border: `1px solid ${borderPalette.light}`,
              textTransform: "capitalize",
            }}
          />
        )}
        {scenario.region && (
          <Chip
            label={scenario.region.toUpperCase()}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              backgroundColor: background.hover,
              color: text.tertiary,
              border: `1px solid ${borderPalette.light}`,
            }}
          />
        )}
        {scenario.use_case_type && (
          <Chip
            label={scenario.use_case_type.replace(/_/g, " ")}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              backgroundColor: background.hover,
              color: text.tertiary,
              border: `1px solid ${borderPalette.light}`,
              textTransform: "capitalize",
            }}
          />
        )}
      </Stack>

      {matchedRules && matchedRules.length > 0 && (
        <Typography sx={{ fontSize: 11, color: text.muted, mt: 1 }}>
          Matched: {matchedRules.join(", ")}
        </Typography>
      )}

      {scenario.rationale && (
        <Typography sx={{ fontSize: 12, color: text.accent, mt: 0.75 }}>
          {scenario.rationale}
        </Typography>
      )}
    </Box>
  );
};

export default ScenarioCard;
