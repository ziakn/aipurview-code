import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Box,
} from "@mui/material";
import { Bot, Trash2 } from "lucide-react";
import Chip from "../../components/Chip";
import { IAIApp } from "../../../domain/interfaces/i.aiApp";
import { AiAppStatus } from "../../../domain/enums/aiApp.enum";
import singleTheme from "../../themes/v1SingleTheme";
import { palette } from "../../themes/palette";

interface AIAppsTableProps {
  apps: IAIApp[];
  onAppClick: (app: IAIApp) => void;
  onDeleteApp: (appId: number) => void;
}

function statusToChipProps(status: AiAppStatus) {
  switch (status) {
    case AiAppStatus.APPROVED:
      return { label: "Approved", backgroundColor: palette.status.success.bg, textColor: palette.status.success.text };
    case AiAppStatus.UNDER_REVIEW:
      return { label: "Under review", backgroundColor: palette.status.warning.bg, textColor: palette.status.warning.text };
    case AiAppStatus.RESTRICTED:
      return { label: "Restricted", backgroundColor: palette.accent.orange.bg, textColor: palette.accent.orange.text };
    case AiAppStatus.BANNED:
      return { label: "Banned", backgroundColor: palette.status.error.bg, textColor: palette.status.error.text };
    default:
      return { label: "Draft", backgroundColor: palette.status.default.bg, textColor: palette.status.default.text };
  }
}

export default function AIAppsTable({ apps, onAppClick, onDeleteApp }: AIAppsTableProps) {
  return (
    <TableContainer sx={singleTheme.tableStyles.primary.frame}>
      <Table>
        <TableHead>
          <TableRow sx={singleTheme.tableStyles.primary.header.row}>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell}>AI App</TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Status</TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Vendor</TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Risk score</TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Source</TableCell>
            <TableCell sx={singleTheme.tableStyles.primary.header.cell} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apps.map((app) => {
            const chipProps = statusToChipProps(app.status);
            return (
              <TableRow
                key={app.id}
                hover
                sx={{ ...singleTheme.tableStyles.primary.body.row, cursor: "pointer" }}
                onClick={() => onAppClick(app)}
              >
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Bot size={16} strokeWidth={1.5} color={palette.text.secondary} />
                    {app.name}
                  </Stack>
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  <Chip {...chipProps} size="small" uppercase={false} />
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {app.vendor_id ? `ID ${app.vendor_id}` : "—"}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {app.risk_score ?? "—"}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                  {app.discovered_source.replace(/_/g, " ")}
                </TableCell>
                <TableCell sx={singleTheme.tableStyles.primary.body.cell} align="right">
                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => app.id && onDeleteApp(app.id)}
                      aria-label={`Delete ${app.name}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
