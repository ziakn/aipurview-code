import { useEffect, useState, useCallback } from "react";
import { Stack, Typography } from "@mui/material";
import { Activity } from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import MCPTable, { MCPTableColumn } from "../MCPTable";
import { EmptyState } from "../../../components/EmptyState";
import RunDetailDrawer from "./RunDetailDrawer";
import palette from "../../../themes/palette";

interface RunRow {
  agent_run_id: string;
  agent_key_name: string | null;
  model_count: number;
  tool_count: number;
  denied_count: number;
  total_tokens: number;
  total_cost: number;
  started_at: string;
  last_at: string;
}

const RUNS_LIMIT = 50;

const COLUMNS: MCPTableColumn[] = [
  { label: "Run" },
  { label: "Agent" },
  { label: "Started" },
  { label: "Model calls", align: "right" },
  { label: "Tool calls", align: "right" },
  { label: "Denied", align: "right" },
];

export default function MCPRuns() {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiServices.get<Record<string, any>>(
        `/ai-gateway/mcp/runs?limit=${RUNS_LIMIT}&offset=0`,
      );
      setRows(res?.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && rows.length === 0) {
    return (
      <EmptyState icon={Activity} message="No agent runs yet" showBorder>
        <Typography variant="body2">
          Runs appear when an agent sends the same run id (header <code>x-vw-agent-run-id</code> on
          model calls, or the session id on tool calls).
        </Typography>
      </EmptyState>
    );
  }

  return (
    <Stack sx={{ gap: "16px" }}>
      <Typography variant="h6">Runs</Typography>
      <MCPTable<RunRow>
        id="mcp-runs-table"
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.agent_run_id}
        onRowClick={(r) => setSelected(r.agent_run_id)}
        renderRow={(r) => [
          r.agent_run_id.slice(0, 12) + "…",
          r.agent_key_name ?? "—",
          new Date(r.started_at).toLocaleString(),
          r.model_count,
          r.tool_count,
          r.denied_count || "—",
        ]}
      />
      {rows.length >= RUNS_LIMIT && (
        <Typography variant="caption" sx={{ color: palette.text.tertiary }}>
          Showing the most recent 50 runs.
        </Typography>
      )}
      {selected && <RunDetailDrawer runId={selected} onClose={() => setSelected(null)} />}
    </Stack>
  );
}
