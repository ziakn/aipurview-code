import { Drawer } from "@mui/material";

interface RunDetailDrawerProps {
  runId: string;
  onClose: () => void;
}

/**
 * Placeholder run detail drawer. Replaced by the full implementation in the
 * next task. Renders an empty drawer so MCPRuns compiles and typechecks.
 */
export default function RunDetailDrawer({ runId, onClose }: RunDetailDrawerProps) {
  return <Drawer anchor="right" open={Boolean(runId)} onClose={onClose} />;
}
