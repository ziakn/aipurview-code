import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
} from "@mui/material";
import { FileText, Download, AlertTriangle, Trash2, RotateCcw } from "lucide-react";
import singleTheme from "../../themes/v1SingleTheme";
import { CustomizableButton } from "../../components/button/customizable-button";
import Alert from "../../components/Alert";
import ReportConfigModal from "./ReportConfigModal";
import { generatePDFReport, generateCSVReport } from "./utils/reportGenerator";
import type { ReportConfig, ReportExperimentData, ReportArenaData } from "./types";
import {
  getAllExperiments,
  getExperiment,
  getLogs,
  listArenaComparisons,
  getArenaComparisonResults,
} from "../../../application/repository/deepEval.repository";

interface ReportPageProps {
  projectId: string;
  projectName: string;
  orgId: string;
  orgName?: string;
}

interface ReportHistoryEntry {
  id: string;
  title: string;
  format: string;
  experimentIds: string[];
  experimentCount: number;
  generatedAt: string;
}

const REPORT_HISTORY_KEY = "evals_report_history";

export default function ReportPage({
  projectId,
  projectName,
  orgId,
  orgName = "",
}: ReportPageProps) {
  const theme = useTheme();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [experiments, setExperiments] = useState<
    Array<{ id: string; name: string; model: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    variant: "success" | "error" | "warning";
    body: string;
  } | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(REPORT_HISTORY_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as any[];
      return parsed.map(e => ({
        ...e,
        experimentIds: e.experimentIds || [],
        experimentCount: e.experimentCount ?? e.experiments ?? 0,
      }));
    } catch {
      return [];
    }
  });

  const loadExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllExperiments({ project_id: projectId });
      const expList = (data.experiments || []).map((exp: any) => ({
        id: exp.id || exp._id,
        name: exp.name || exp.config?.name || exp.id,
        model: exp.config?.model?.model_name || exp.config?.model?.name || "Unknown",
        status: exp.status || "unknown",
      }));
      setExperiments(expList);
    } catch (err) {
      console.error("Failed to load experiments for report:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const handleGenerate = async (config: ReportConfig) => {
    setIsGenerating(true);
    try {
      const experimentDataList: ReportExperimentData[] = [];

      for (const expId of config.experimentIds) {
        const expResponse = await getExperiment(expId);
        const exp = expResponse.experiment || expResponse;
        const expConfig = exp.config || {};

        const logsResponse = await getLogs({ experiment_id: expId, limit: 1000 });
        const logs: any[] = logsResponse.logs || [];

        // Build metric summaries from logs (same approach as ExperimentDetailContent)
        const metricsAgg: Record<string, { sum: number; count: number; min: number; max: number; passed: number }> = {};
        const thresholds = expConfig.metric_thresholds || expConfig.metricThresholds || {};

        for (const log of logs) {
          const scores = log.metadata?.metric_scores;
          if (!scores) continue;
          for (const [rawKey, value] of Object.entries(scores) as [string, any][]) {
            const key = rawKey.replace(/^G-Eval\s*\((.+)\)$/i, "$1");
            const score = typeof value === "number" ? value : value?.score;
            if (typeof score !== "number") continue;

            if (!metricsAgg[key]) {
              metricsAgg[key] = { sum: 0, count: 0, min: 1, max: 0, passed: 0 };
            }
            metricsAgg[key].sum += score;
            metricsAgg[key].count += 1;
            metricsAgg[key].min = Math.min(metricsAgg[key].min, score);
            metricsAgg[key].max = Math.max(metricsAgg[key].max, score);

            const threshold = thresholds[rawKey] ?? thresholds[key] ?? 0.5;
            const isInverted = ["bias", "toxicity", "hallucination"].some(m => key.toLowerCase().includes(m));
            if (isInverted ? score <= threshold : score >= threshold) {
              metricsAgg[key].passed += 1;
            }
          }
        }

        const metricSummaries: Record<string, any> = {};
        for (const [key, agg] of Object.entries(metricsAgg)) {
          metricSummaries[key] = {
            averageScore: agg.count > 0 ? agg.sum / agg.count : 0,
            passRate: agg.count > 0 ? agg.passed / agg.count : 0,
            minScore: agg.min,
            maxScore: agg.max,
            totalEvaluated: agg.count,
          };
        }

        const metricThresholds: Record<string, number> = {};
        for (const [key, val] of Object.entries(thresholds)) {
          const cleanKey = key.replace(/^G-Eval\s*\((.+)\)$/i, "$1");
          metricThresholds[cleanKey] = Number(val) || 0.5;
        }

        // Build sample-level details from logs
        const detailedResults = config.includeDetailedSamples
          ? logs.map((log: any, i: number) => {
              const scores = log.metadata?.metric_scores || {};
              const metricScores: Record<string, any> = {};
              for (const [rawKey, value] of Object.entries(scores) as [string, any][]) {
                const key = rawKey.replace(/^G-Eval\s*\((.+)\)$/i, "$1");
                const score = typeof value === "number" ? value : value?.score ?? 0;
                const threshold = thresholds[rawKey] ?? thresholds[key] ?? 0.5;
                const isInverted = ["bias", "toxicity", "hallucination"].some(m => key.toLowerCase().includes(m));
                metricScores[key] = {
                  score,
                  passed: isInverted ? score <= threshold : score >= threshold,
                  threshold,
                  reason: typeof value === "object" ? value?.reason : undefined,
                };
              }
              return {
                sampleId: log.id || String(i + 1),
                protectedAttributes: { category: "", difficulty: "" },
                input: log.input_text || "",
                actualOutput: log.output_text || "",
                expectedOutput: "",
                responseLength: (log.output_text || "").length,
                wordCount: (log.output_text || "").split(/\s+/).filter(Boolean).length,
                metricScores,
                timestamp: log.timestamp || "",
              };
            })
          : undefined;

        const datasetConfig = expConfig.dataset || {};
        const datasetLabel = datasetConfig.name || (datasetConfig.useBuiltin ? `Built-in (${datasetConfig.categories?.join(", ") || "all"})` : "Custom");

        experimentDataList.push({
          id: exp.id || exp._id || expId,
          name: exp.name || expConfig.name || expId,
          status: exp.status || "completed",
          model: expConfig.model?.name || expConfig.model?.model_name || "Unknown",
          dataset: datasetLabel,
          judge: expConfig.judgeLlm?.model || "",
          scorer: expConfig.scorerName || "",
          useCase: expConfig.useCase || expConfig.use_case || "",
          totalSamples: logs.length,
          createdAt: exp.created_at || "",
          completedAt: exp.completed_at || "",
          duration: exp.results?.duration,
          metricSummaries,
          metricThresholds,
          detailedResults,
        });
      }

      let arenaData: ReportArenaData[] = [];
      if (config.includeArena) {
        try {
          const arenaList = await listArenaComparisons(orgId ? { org_id: orgId } : undefined);
          const comparisons = arenaList.comparisons || [];
          for (const comp of comparisons.slice(0, 5) as any[]) {
            try {
              const result = await getArenaComparisonResults(comp.id) as any;
              arenaData.push({
                id: comp.id,
                name: comp.name || comp.id,
                winner: result.winner || result.summary?.winner || "N/A",
                contestants: (result.contestants || []).map((c: any) => ({
                  model: c.model || c.name || "Unknown",
                  wins: c.wins || 0,
                  losses: c.losses || 0,
                  ties: c.ties || 0,
                  avgScore: c.avgScore || c.avg_score || 0,
                })),
                criteria: result.criteria || result.metrics || [],
                rounds: result.rounds || result.total_rounds || 0,
                createdAt: comp.createdAt || "",
              });
            } catch {
              // skip individual arena failures
            }
          }
        } catch {
          // arena data is optional
        }
      }

      if (config.format === "pdf") {
        await generatePDFReport(config, experimentDataList, arenaData, projectName, orgName || orgId);
      } else {
        generateCSVReport(experimentDataList, projectName);
      }

      const entry: ReportHistoryEntry = {
        id: crypto.randomUUID(),
        title: config.title,
        format: config.format.toUpperCase(),
        experimentIds: config.experimentIds,
        experimentCount: config.experimentIds.length,
        generatedAt: new Date().toISOString(),
      };
      const updatedHistory = [entry, ...reportHistory].slice(0, 20);
      setReportHistory(updatedHistory);
      localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(updatedHistory));

      setAlert({ variant: "success", body: `Report generated successfully (${config.format.toUpperCase()})` });
      setTimeout(() => setAlert(null), 4000);
      setConfigModalOpen(false);
    } catch (err) {
      console.error("Report generation failed:", err);
      setAlert({
        variant: "error",
        body: `Failed to generate report: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
      setTimeout(() => setAlert(null), 10000);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedCount = experiments.filter(e => e.status === "completed").length;

  const handleDeleteReport = (entryId: string) => {
    const updated = reportHistory.filter(e => e.id !== entryId);
    setReportHistory(updated);
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(updated));
  };

  const handleRegenerate = async (entry: ReportHistoryEntry) => {
    if (!entry.experimentIds || entry.experimentIds.length === 0) {
      setAlert({ variant: "warning", body: "This report entry has no experiment data to re-download. Generate a new report instead." });
      setTimeout(() => setAlert(null), 5000);
      return;
    }
    setRegeneratingId(entry.id);
    try {
      const format = entry.format.toLowerCase() as "pdf" | "csv";
      const defaultSections = (await import("./types")).DEFAULT_REPORT_SECTIONS;
      await handleGenerate({
        title: entry.title,
        format,
        experimentIds: entry.experimentIds,
        sections: defaultSections.map(s => ({ ...s })),
        includeDetailedSamples: false,
        includeArena: false,
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <Stack spacing={1}>
        <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
          Evaluation Reports
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, fontSize: 14 }}>
          Generate comprehensive evaluation reports from your experiment results.
          Reports follow the EvalCards and Eval Factsheets standards for structured AI evaluation documentation.
        </Typography>
      </Stack>

      {/* Action Card */}
      <Box
        sx={{
          background: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: "24px",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} strokeWidth={1.5} color="#13715B" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                Generate new report
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                {completedCount} completed experiment{completedCount !== 1 ? "s" : ""} available
              </Typography>
            </Box>
          </Stack>
          <CustomizableButton
            variant="contained"
            color="primary"
            onClick={() => setConfigModalOpen(true)}
            isDisabled={completedCount === 0}
            icon={<Download size={14} />}
            text="Generate Report"
            sx={{
              px: 3.5,
              py: 1.2,
            }}
          />
        </Stack>

        {completedCount === 0 && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "6px",
              backgroundColor: "#FFFBEB",
              border: "1px solid #FDE68A",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AlertTriangle size={16} color="#D97706" />
            <Typography sx={{ fontSize: 12, color: "#92400E" }}>
              No completed experiments yet. Run at least one experiment to generate a report.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Report History Table */}
      {reportHistory.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", mb: 1.5 }}>
            Report history
          </Typography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={singleTheme.tableStyles.primary.frame}>
              <TableHead sx={{ backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors }}>
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "40%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>Title</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "12%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>Format</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "15%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>Experiments</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "20%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>Generated</Typography>
                  </TableCell>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.header.cell, width: "13%", minWidth: 90 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportHistory.map(entry => (
                  <TableRow key={entry.id} sx={singleTheme.tableStyles.primary.body.row}>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.primary, fontWeight: 500 }}>
                        {entry.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip
                        label={entry.format}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 22,
                          fontWeight: 500,
                          backgroundColor: entry.format === "PDF" ? "#ECFDF5" : "#F0FDF4",
                          color: "#13715B",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                        {entry.experimentCount} experiment{entry.experimentCount !== 1 ? "s" : ""}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                        {new Date(entry.generatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handleRegenerate(entry)}
                          disabled={regeneratingId === entry.id}
                          title="Re-download report"
                          sx={{ padding: 0.5 }}
                        >
                          {regeneratingId === entry.id ? (
                            <CircularProgress size={14} />
                          ) : (
                            <RotateCcw size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteReport(entry.id)}
                          title="Delete from history"
                          sx={{ padding: 0.5 }}
                        >
                          <Trash2 size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Standards Info */}
      <Box
        sx={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "4px",
          p: "20px",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374054", mb: 1 }}>
          Report standards
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
          Generated reports are structured following industry standards for AI evaluation documentation:
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {[
            {
              title: "EvalCards",
              url: "https://arxiv.org/abs/2406.13606",
              desc: "A framework by researchers at Google DeepMind for documenting LLM evaluations in a structured, reproducible format. EvalCards capture evaluation context, methodology, metrics, and known limitations — making it easy to compare and audit results across teams.",
            },
            {
              title: "Eval Factsheets",
              url: "https://arxiv.org/abs/2311.09069",
              desc: "Proposed by IBM Research, Eval Factsheets provide standardized fields for recording what was evaluated, how it was scored, and where the evaluation falls short. They promote transparency and help stakeholders quickly understand what an evaluation does and doesn't cover.",
            },
            {
              title: "COMPL-AI",
              url: "https://arxiv.org/abs/2410.07959",
              desc: "A technical framework that maps EU AI Act requirements to measurable benchmarks. COMPL-AI focuses on safety-relevant metrics like bias, toxicity, and fairness — helping organizations demonstrate regulatory compliance through structured evaluation evidence.",
            },
          ].map(({ title, url, desc }) => (
            <Box key={title}>
              <Typography
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#13715B",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {title} ↗
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6, mt: 0.25 }}>
                {desc}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Config Modal */}
      <ReportConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onGenerate={handleGenerate}
        experiments={experiments}
        projectName={projectName}
        isGenerating={isGenerating}
      />
    </Box>
  );
}
