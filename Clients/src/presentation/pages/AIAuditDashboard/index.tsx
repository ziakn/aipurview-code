import { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FileText,
  Download,
  Eye,
  Shield,
  Activity,
  Clock,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useAuditLog, useAuditAnalytics } from "../../../application/hooks/useAIAudit";
import { exportAuditLog, getActionAuditTrail } from "../../../application/repository/aiAudit.repository";
import { PageHeaderExtended } from "../../components/Layout/PageHeaderExtended";

const STATE_COLORS: Record<string, string> = {
  completed: "#4caf50",
  approved: "#4caf50",
  rejected: "#f44336",
  auto_approve: "#2196f3",
  auto_reject: "#ff9800",
  pending_approval: "#ffc107",
  failed: "#9c27b0",
  executing: "#00bcd4",
};

const CHART_COLORS = ["#4caf50", "#f44336", "#2196f3", "#ff9800", "#ffc107", "#9c27b0", "#00bcd4", "#795548"];

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

export default function AIAuditDashboard() {
  const theme = useTheme();
  const [period, setPeriod] = useState("30d");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTrail, setDetailTrail] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.value === period)!;
  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - selectedPeriod.days);
    return d.toISOString();
  }, [period]);

  const { data: analytics, isLoading: analyticsLoading } = useAuditAnalytics(dateFrom);
  const { data: logData, isLoading: logLoading } = useAuditLog({
    dateFrom,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  const summary = analytics?.summary || {};
  const byState = analytics?.byState || [];
  const byCategory = analytics?.byCategory || [];
  const dailyVolume = analytics?.dailyVolume || [];

  const handleViewDetail = async (actionId: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const trail = await getActionAuditTrail(actionId);
      setDetailTrail(Array.isArray(trail) ? trail : []);
    } catch {
      setDetailTrail([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportAuditLog("csv", dateFrom);
    } catch {
      // Silent fail
    }
  };

  if (analyticsLoading) {
    return (
      <PageHeaderExtended title="AI Audit Dashboard" description="Audit trail for AI-triggered operations">
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      </PageHeaderExtended>
    );
  }

  return (
    <PageHeaderExtended
      title="AI Audit Dashboard"
      description="Complete audit trail for every AI action. EU AI Act Article 12 compliance."
    >
      <Stack spacing={3}>
        {/* Period Selector + Export */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
              {PERIOD_OPTIONS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={handleExport} sx={{ bgcolor: theme.palette.primary.main, color: "#fff", borderRadius: 2, px: 2, "&:hover": { bgcolor: theme.palette.primary.dark } }}>
            <Download size={16} />
            <Typography variant="body2" sx={{ ml: 0.5 }}>Export CSV</Typography>
          </IconButton>
        </Stack>

        {/* Stat Cards */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {[
            { label: "Total Actions", value: summary.total_actions || 0, icon: <Activity size={20} />, color: theme.palette.primary.main },
            { label: "Auto-Approve Rate", value: `${summary.auto_approve_pct || 0}%`, icon: <Shield size={20} />, color: "#4caf50" },
            { label: "Avg Wait Time", value: `${Math.round(summary.avg_wait_seconds || 0)}s`, icon: <Clock size={20} />, color: "#ff9800" },
            { label: "Rejection Rate", value: `${summary.rejection_rate_pct || 0}%`, icon: <XCircle size={20} />, color: "#f44336" },
          ].map((stat) => (
            <Paper key={stat.label} sx={{ p: 2, flex: 1, minWidth: 180, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                <Stack>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="h6" fontWeight={700}>{stat.value}</Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {/* Charts Row */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {/* Donut: By State */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 300, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Actions by State</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byState} dataKey="count" nameKey="state" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {byState.map((_: any, i: number) => (
                    <Cell key={i} fill={STATE_COLORS[byState[i]?.state] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>

          {/* Bar: By Category */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 300, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Actions by Category</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Line: Daily Volume */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 300, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Daily Volume</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Stack>

        {/* Audit Log Table */}
        <Paper sx={{ borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} p={2}>
            <FileText size={18} />
            <Typography variant="subtitle1" fontWeight={600}>Audit Log</Typography>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Tool</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logLoading ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : (logData?.rows || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No audit entries found</TableCell></TableRow>
                ) : (
                  (logData?.rows || []).map((row: any, i: number) => (
                    <TableRow key={row.id || i} hover>
                      <TableCell sx={{ fontSize: 12 }}>
                        {new Date(row.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>
                        {row.tool_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.to_state}
                          size="small"
                          sx={{
                            bgcolor: STATE_COLORS[row.to_state] || "#grey",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {row.actor_name ? `${row.actor_name} ${row.actor_surname}` : row.actor_type}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.risk_level || "—"}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetail(row.action_approval_id)}>
                          <Eye size={14} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={logData?.total || 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Paper>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Action Audit Trail</DialogTitle>
          <DialogContent>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : detailTrail.length === 0 ? (
              <Alert severity="info">No audit trail entries found</Alert>
            ) : (
              <Stack spacing={1.5} sx={{ py: 1 }}>
                {detailTrail.map((entry: any, i: number) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATE_COLORS[entry.to_state] || "#grey", mt: 0.8, flexShrink: 0 }} />
                    <Stack spacing={0.25} flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={entry.to_state} size="small" sx={{ bgcolor: STATE_COLORS[entry.to_state] || "#grey", color: "#fff", fontSize: 11, height: 20 }} />
                        {entry.from_state && (
                          <Typography variant="caption" color="text.secondary">from {entry.from_state}</Typography>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.created_at).toLocaleString()} — {entry.actor_type}
                        {entry.rule_name && ` (rule: ${entry.rule_name})`}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </DialogContent>
        </Dialog>
      </Stack>
    </PageHeaderExtended>
  );
}
