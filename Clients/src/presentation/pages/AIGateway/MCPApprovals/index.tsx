import { Box, Typography } from "@mui/material";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";

export default function MCPApprovalsPage() {
  return (
    <Box>
      <PageHeaderExtended title="MCP Approvals" />
      <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
        Review and approve or reject pending tool invocation requests.
      </Typography>
    </Box>
  );
}
