import { useState } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Button,
  Collapse,
  IconButton,
  Divider,
} from "@mui/material";
import { ChevronDown, ChevronUp, Plus, CheckSquare, Square } from "lucide-react";
import { ICoverageChartProps } from "../../../domain/interfaces/i.governanceOs";
import { border as borderPalette, background, text, status, brand } from "../../themes/palette";

interface ExtendedCoverageChartProps extends ICoverageChartProps {
  onCreateTaskForGap?: (frameworkName: string, controlId: string) => void;
  onCreateTasksForGaps?: (frameworkName: string, controlIds: string[]) => void;
  activeScenarioFrameworkId?: number | null;
}

const CoverageChart = ({
  coverage,
  onCreateTaskForGap,
  onCreateTasksForGaps,
  activeScenarioFrameworkId,
}: ExtendedCoverageChartProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedGapsByFramework, setSelectedGapsByFramework] = useState<Record<number, Set<string>>>({});

  const toggleExpand = (frameworkId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(frameworkId)) {
        next.delete(frameworkId);
      } else {
        next.add(frameworkId);
      }
      return next;
    });
  };

  const toggleGapSelection = (frameworkId: number, controlId: string) => {
    setSelectedGapsByFramework((prev) => {
      const current = new Set(prev[frameworkId] || []);
      if (current.has(controlId)) {
        current.delete(controlId);
      } else {
        current.add(controlId);
      }
      return { ...prev, [frameworkId]: current };
    });
  };

  const selectAllGaps = (frameworkId: number, controlIds: string[]) => {
    setSelectedGapsByFramework((prev) => ({
      ...prev,
      [frameworkId]: new Set(controlIds),
    }));
  };

  const clearAllGaps = (frameworkId: number) => {
    setSelectedGapsByFramework((prev) => ({
      ...prev,
      [frameworkId]: new Set(),
    }));
  };

  const handleBulkCreate = (fw: (typeof coverage)[0]) => {
    const selected = Array.from(selectedGapsByFramework[fw.framework_id] || []);
    if (selected.length > 0 && onCreateTasksForGaps) {
      onCreateTasksForGaps(fw.framework_name || `Framework ${fw.framework_id}`, selected);
      clearAllGaps(fw.framework_id);
    }
  };

  if (!coverage || coverage.length === 0) {
    return (
      <Typography sx={{ fontSize: 13, color: text.accent }}>
        No coverage data available. Assign frameworks to a project first.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {coverage.map((fw) => {
        const isExpanded = expandedIds.has(fw.framework_id);
        const isPrimary = activeScenarioFrameworkId === fw.framework_id;
        const gapIds = fw.gap_details.unmapped_controls;
        const synergyIds = fw.synergy_details.multi_framework_controls;
        const selectedGaps = selectedGapsByFramework[fw.framework_id] || new Set<string>();
        const hasGaps = gapIds.length > 0;
        const hasSynergies = synergyIds.length > 0;

        return (
          <Box
            key={fw.framework_id}
            sx={{
              "border": `1px solid ${isPrimary ? brand.primary : borderPalette.light}`,
              "borderRadius": 2,
              "p": 2,
              "background": isPrimary ? "rgba(19, 113, 91, 0.04)" : background.main,
              "transition": "all 0.2s ease",
              "&:hover": {
                borderColor: isPrimary ? brand.primary : borderPalette.dark,
                background: background.accent,
              },
            }}
          >
            {/* Header row */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ cursor: hasGaps || hasSynergies ? "pointer" : "default" }}
              onClick={() => {
                if (hasGaps || hasSynergies) toggleExpand(fw.framework_id);
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
                  {fw.framework_name || `Framework ${fw.framework_id}`}
                </Typography>
                {isPrimary && (
                  <Chip
                    label="Primary"
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 18,
                      backgroundColor: "rgba(19, 113, 91, 0.12)",
                      color: brand.primary,
                      fontWeight: 500,
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: brand.primary }}>
                  {fw.coverage_percentage}%
                </Typography>
                {(hasGaps || hasSynergies) && (
                  <IconButton size="small" sx={{ color: text.muted }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </IconButton>
                )}
              </Stack>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={fw.coverage_percentage}
              sx={{
                "height": 6,
                "borderRadius": 3,
                "mt": 1,
                "mb": 1,
                "backgroundColor": background.hover,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: isPrimary ? brand.primary : brand.primary,
                  borderRadius: 3,
                },
              }}
            />

            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 11, color: text.muted }}>
                {fw.mapped_controls}/{fw.total_controls} controls mapped
              </Typography>
              <Box>
                {hasGaps && (
                  <Chip
                    label={`${gapIds.length} gaps`}
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 20,
                      mr: 0.5,
                      backgroundColor: status.warning.bg,
                      color: status.warning.text,
                      border: `1px solid ${status.warning.border}`,
                    }}
                  />
                )}
                {hasSynergies && (
                  <Chip
                    label={`${synergyIds.length} synergies`}
                    size="small"
                    sx={{
                      fontSize: 10,
                      height: 20,
                      backgroundColor: status.success.bg,
                      color: status.success.text,
                      border: `1px solid ${status.success.border}`,
                    }}
                  />
                )}
              </Box>
            </Stack>

            {/* Expandable detail section */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 1.5, borderColor: borderPalette.light }} />

              {/* Gaps section */}
              {hasGaps && (
                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: status.warning.text }}>
                      Unmapped controls ({gapIds.length})
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={() => selectAllGaps(fw.framework_id, gapIds)}
                        sx={{ fontSize: 11, textTransform: "none", minWidth: 0, px: 1 }}
                      >
                        Select all
                      </Button>
                      <Button
                        size="small"
                        onClick={() => clearAllGaps(fw.framework_id)}
                        sx={{ fontSize: 11, textTransform: "none", minWidth: 0, px: 1 }}
                      >
                        Clear
                      </Button>
                    </Stack>
                  </Stack>

                  <Box
                    sx={{
                      border: `1px solid ${borderPalette.light}`,
                      borderRadius: 1.5,
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {gapIds.map((controlId, idx) => {
                      const isSelected = selectedGaps.has(controlId);
                      return (
                        <Box
                          key={controlId}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.5,
                            py: 1,
                            borderBottom:
                              idx < gapIds.length - 1
                                ? `1px solid ${borderPalette.light}`
                                : "none",
                            backgroundColor: isSelected
                              ? "rgba(19, 113, 91, 0.04)"
                              : background.main,
                          }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              component="span"
                              sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                              onClick={() => toggleGapSelection(fw.framework_id, controlId)}
                            >
                              {isSelected ? (
                                <CheckSquare size={16} color={brand.primary} />
                              ) : (
                                <Square size={16} color={text.muted} />
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: text.primary, fontFamily: "monospace" }}>
                              {controlId}
                            </Typography>
                          </Stack>
                          {onCreateTaskForGap && (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<Plus size={12} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateTaskForGap(
                                  fw.framework_name || `Framework ${fw.framework_id}`,
                                  controlId
                                );
                              }}
                              sx={{
                                fontSize: 11,
                                textTransform: "none",
                                color: brand.primary,
                                minWidth: 0,
                                px: 1,
                              }}
                            >
                              Task
                            </Button>
                          )}
                        </Box>
                      );
                    })}
                  </Box>

                  {selectedGaps.size > 0 && onCreateTasksForGaps && (
                    <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleBulkCreate(fw)}
                        sx={{ fontSize: 11, textTransform: "none" }}
                      >
                        Create tasks for {selectedGaps.size} gap(s)
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Synergies section */}
              {hasSynergies && (
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: status.success.text, mb: 1 }}>
                    Multi-framework controls ({synergyIds.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {synergyIds.map((controlId) => (
                      <Chip
                        key={controlId}
                        label={controlId}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 22,
                          fontFamily: "monospace",
                          backgroundColor: status.success.bg,
                          color: status.success.text,
                          border: `1px solid ${status.success.border}`,
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
};

export default CoverageChart;
