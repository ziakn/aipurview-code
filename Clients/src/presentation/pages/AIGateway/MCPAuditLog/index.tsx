import { Box, Typography } from "@mui/material";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";

export default function MCPAuditLogPage() {
  return (
    <Box>
      <PageHeaderExtended title="MCP Audit Log" />
      <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
        Review tool invocation history and audit trail.
      </Typography>
    </Box>
  );
}
