import { Box, Drawer, Typography, Stack, IconButton } from "@mui/material";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import Chip from "../../components/Chip";
import { apiServices } from "../../../infrastructure/api/networkServices";
import palette from "../../themes/palette";
import { MCP_STATUS_COLORS, MCP_STATUS_FALLBACK } from "./shared";
import { displayFormattedDate } from "../../tools/isoDateToString";

interface InvocationDrawerProps {
  logId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function MCPInvocationDrawer({ logId, open, onClose }: InvocationDrawerProps) {
  const [row, setRow] = useState<any | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!open || !logId) return;
    setRow(null);
    setShowRaw(false);
    apiServices
      .get<Record<string, any>>(`/ai-gateway/mcp/audit/logs/${logId}`)
      .then((res) => setRow(res?.data?.data || null))
      .catch(() => setRow(null));
  }, [open, logId]);

  const colors = row
    ? MCP_STATUS_COLORS[row.result_status] || MCP_STATUS_FALLBACK
    : MCP_STATUS_FALLBACK;
  const labelSx = {
    fontSize: 11,
    fontWeight: 600,
    color: palette.text.tertiary,
    letterSpacing: "0.5px",
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: 520, p: 3 } }}
    >
      {!row ? (
        <Typography sx={{ fontSize: 13, color: palette.text.tertiary }}>Loading…</Typography>
      ) : (
        <Stack gap="16px">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
                {row.tool_name}
              </Typography>
              <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                {displayFormattedDate(row.created_at)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} aria-label="Close">
              <X size={16} />
            </IconButton>
          </Stack>

          <Chip label={row.result_status} backgroundColor={colors.bg} textColor={colors.text} />

          <Box>
            <Typography sx={labelSx}>TOOL USE ID</Typography>
            <Typography sx={{ fontSize: 12, fontFamily: "monospace" }}>
              {row.tool_use_id || "—"}
            </Typography>
          </Box>

          <Box>
            <Typography sx={labelSx}>ARGUMENTS</Typography>
            <Box
              component="pre"
              sx={{
                fontSize: 12,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                bgcolor: "#F9FAFB",
                p: "8px",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: 200,
              }}
            >
              {JSON.stringify(row.arguments ?? {}, null, 2)}
            </Box>
          </Box>

          <Box>
            <Typography sx={labelSx}>RESULT</Typography>
            {row.result_response ? (
              <Box
                component="pre"
                sx={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  bgcolor: "#F9FAFB",
                  p: "8px",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: 280,
                }}
              >
                {JSON.stringify(row.result_response, null, 2)}
                {row.result_truncated ? "\n… (truncated)" : ""}
              </Box>
            ) : (
              <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                No result captured (older adapter, or the tool did not report back).
              </Typography>
            )}
          </Box>

          <Box>
            <Typography sx={labelSx}>EVENTS</Typography>
            <Stack gap="4px" sx={{ mt: "4px" }}>
              {(row.events || []).map((e: any, i: number) => (
                <Stack key={i} direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12 }}>
                    {e.type}
                    {e.detail ? ` · ${e.detail}` : ""}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
                    {displayFormattedDate(e.at)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography
              sx={{ fontSize: 12, color: palette.brand.primary, cursor: "pointer" }}
              onClick={() => setShowRaw((v) => !v)}
            >
              {showRaw ? "Hide raw JSON" : "Show raw JSON"}
            </Typography>
            {showRaw && (
              <Box
                component="pre"
                sx={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  bgcolor: "#1E1E1E",
                  color: "#D4D4D4",
                  p: "8px",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: 320,
                }}
              >
                {JSON.stringify(row, null, 2)}
              </Box>
            )}
          </Box>
        </Stack>
      )}
    </Drawer>
  );
}
