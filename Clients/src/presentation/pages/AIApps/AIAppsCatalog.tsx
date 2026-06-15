import { Box, Stack, Typography } from "@mui/material";
import { Building2, Users, ShieldAlert, Bot } from "lucide-react";
import Chip from "../../components/Chip";
import { IAIApp } from "../../../domain/interfaces/i.aiApp";
import { AiAppStatus } from "../../../domain/enums/aiApp.enum";
import { palette } from "../../themes/palette";
import { catalogGridStyle, catalogCardStyle, cardHeaderStyle, cardTitleStyle } from "./style";

interface AIAppsCatalogProps {
  apps: IAIApp[];
  onAppClick: (app: IAIApp) => void;
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

function riskToLabel(riskScore: number | null | undefined): string {
  if (riskScore === null || riskScore === undefined) return "Not scored";
  if (riskScore >= 75) return "High";
  if (riskScore >= 50) return "Medium";
  if (riskScore >= 25) return "Low";
  return "Very low";
}

export default function AIAppsCatalog({ apps, onAppClick }: AIAppsCatalogProps) {
  return (
    <Box sx={catalogGridStyle}>
      {apps.map((app) => {
        const chipProps = statusToChipProps(app.status);
        return (
          <Box
            key={app.id}
            sx={catalogCardStyle}
            onClick={() => onAppClick(app)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onAppClick(app);
              }
            }}
            aria-label={`Open ${app.name}`}
          >
            <Box sx={cardHeaderStyle}>
              <Box sx={cardTitleStyle}>
                <Bot size={20} strokeWidth={1.5} color={palette.text.secondary} />
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{app.name}</Typography>
              </Box>
              <Chip {...chipProps} size="small" uppercase={false} />
            </Box>

            <Stack gap="8px">
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Building2 size={14} strokeWidth={1.5} color={palette.text.secondary} />
                <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
                  {app.vendor_id ? `Vendor ID: ${app.vendor_id}` : "No vendor linked"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={14} strokeWidth={1.5} color={palette.text.secondary} />
                <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
                  Risk: {riskToLabel(app.risk_score)}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={14} strokeWidth={1.5} color={palette.text.secondary} />
                <Typography sx={{ fontSize: 13, color: palette.text.secondary }}>
                  Source: {app.discovered_source.replace(/_/g, " ")}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
