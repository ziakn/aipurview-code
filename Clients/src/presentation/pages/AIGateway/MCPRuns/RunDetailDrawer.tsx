import { useEffect, useState } from "react";
import { Drawer, Box, Stack, Typography, Chip, Divider } from "@mui/material";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface RunEntry {
  kind: "model" | "tool";
  created_at: string;
  model: string;
  provider: string | null;
  total_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  request_messages: any;
  response_text: string | null;
}

interface RunDetailDrawerProps {
  runId: string;
  onClose: () => void;
}

export default function RunDetailDrawer({ runId, onClose }: RunDetailDrawerProps) {
  const [entries, setEntries] = useState<RunEntry[]>([]);

  useEffect(() => {
    (async () => {
      const res = await apiServices.get<Record<string, any>>(
        `/ai-gateway/mcp/runs/${encodeURIComponent(runId)}`,
      );
      setEntries(res?.data?.data?.entries ?? []);
    })();
  }, [runId]);

  return (
    <Drawer anchor="right" open onClose={onClose} PaperProps={{ sx: { width: 560, p: "16px" } }}>
      <Typography variant="h6" sx={{ mb: "8px" }}>
        Run {runId.slice(0, 12)}…
      </Typography>
      <Stack spacing={1.5}>
        {entries.map((e, i) => (
          <Box key={i} sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", p: "12px" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: "6px" }}>
              <Chip
                size="small"
                label={e.kind === "model" ? "Model call" : "Tool call"}
                sx={{ bgcolor: e.kind === "model" ? "#13715B" : "#1c6e7d", color: "#fff" }}
              />
              <Typography variant="caption">
                {new Date(e.created_at).toLocaleTimeString()}
              </Typography>
              <Typography variant="caption" sx={{ ml: "auto" }}>
                {e.model}
              </Typography>
            </Stack>
            {e.kind === "model" ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  Prompt
                </Typography>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 12, m: 0 }}>
                  {e.request_messages
                    ? JSON.stringify(e.request_messages, null, 2)
                    : "(body logging disabled)"}
                </Box>
                <Divider sx={{ my: "6px" }} />
                <Typography variant="caption" color="text.secondary">
                  Response
                </Typography>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 12, m: 0 }}>
                  {e.response_text ?? "(body logging disabled)"}
                </Box>
              </>
            ) : (
              <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 12, m: 0 }}>
                {e.request_messages ? JSON.stringify(e.request_messages, null, 2) : "—"}
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Drawer>
  );
}
