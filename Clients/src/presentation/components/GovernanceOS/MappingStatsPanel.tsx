import React from "react";
import { Box, Typography, Stack, Chip, CircularProgress } from "@mui/material";
import { Network } from "lucide-react";
import { useUnifiedView } from "../../../application/hooks/useGovernanceOs";
import { border as borderPalette, background, text, brand } from "../../themes/palette";

interface MappingStatsPanelProps {
  projectId: number;
}

const STRENGTH_LABELS: Record<string, string> = {
  direct: "Direct",
  partial: "Partial",
  related: "Related",
};

const STRENGTH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  direct: { bg: "rgba(19, 113, 91, 0.12)", text: brand.primary, border: "rgba(19, 113, 91, 0.3)" },
  partial: { bg: "rgba(99, 102, 241, 0.12)", text: "#4338ca", border: "rgba(99, 102, 241, 0.3)" },
  related: { bg: background.hover, text: text.secondary, border: borderPalette.light },
};

const MappingStatsPanel: React.FC<MappingStatsPanelProps> = ({ projectId }) => {
  const { data: unifiedView, isLoading } = useUnifiedView(projectId);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const stats = unifiedView?.mappingStats;

  if (!stats || stats.total === 0) {
    return (
      <Box
        sx={{
          border: `1px dashed ${borderPalette.light}`,
          borderRadius: 2,
          p: 2,
          background: background.main,
        }}
      >
        <Typography sx={{ fontSize: 13, color: text.muted }}>
          No mapping statistics available. Add framework mappings to see breakdowns.
        </Typography>
      </Box>
    );
  }

  const domainEntries = Object.entries(stats.byDomain || {}).sort((a, b) => b[1] - a[1]);
  const strengthEntries = Object.entries(stats.byStrength || {}).sort((a, b) => b[1] - a[1]);

  return (
    <Box
      sx={{
        border: `1px solid ${borderPalette.dark}`,
        borderRadius: 2,
        p: 3,
        background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Network size={20} color={brand.primary} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Mapping Statistics
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {/* Total mappings */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 2,
          }}
        >
          <Box
            sx={{
              p: 2,
              background: background.hover,
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 600, color: brand.primary }}>
              {stats.total}
            </Typography>
            <Typography sx={{ fontSize: 11, color: text.muted }}>Total mappings</Typography>
          </Box>
        </Box>

        {/* By domain */}
        {domainEntries.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: text.primary, mb: 1 }}>
              By domain
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {domainEntries.map(([domain, count]) => (
                <Chip
                  key={domain}
                  label={`${domain}: ${count}`}
                  size="small"
                  sx={{
                    fontSize: 12,
                    height: 24,
                    backgroundColor: background.hover,
                    color: text.secondary,
                    border: `1px solid ${borderPalette.light}`,
                    textTransform: "capitalize",
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* By strength */}
        {strengthEntries.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: text.primary, mb: 1 }}>
              By mapping strength
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {strengthEntries.map(([strength, count]) => {
                const colors = STRENGTH_COLORS[strength] || STRENGTH_COLORS.related;
                return (
                  <Chip
                    key={strength}
                    label={`${STRENGTH_LABELS[strength] || strength}: ${count}`}
                    size="small"
                    sx={{
                      fontSize: 12,
                      height: 24,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      textTransform: "capitalize",
                      fontWeight: 500,
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default MappingStatsPanel;
