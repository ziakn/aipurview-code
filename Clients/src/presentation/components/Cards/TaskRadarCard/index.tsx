import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { text, background, border as borderPalette } from "../../../themes/palette";

interface TaskRadarCardProps {
  overdue: number;
  due: number;
  upcoming: number;
}

export function TaskRadarCard({
  overdue,
  due,
  upcoming,
}: TaskRadarCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const max = Math.max(overdue, due, upcoming, 1);
  const barHeight = 80;

  const items = [
    { label: "Overdue", value: overdue, color: "#EF4444" },
    { label: "Due soon", value: due, color: "#F59E0B" },
    { label: "Upcoming", value: upcoming, color: "#10B981" },
  ];

  return (
    <Stack
      sx={{
        border: `1px solid ${borderPalette.dark}`,
        borderRadius: "4px",
        background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        width: "100%",
        padding: "16px",
        height: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          background: `linear-gradient(135deg, ${background.accent} 0%, #f1f5f9 100%)`,
          borderColor: `${text.muted}`,
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate("/tasks")}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb="16px"
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1F2937",
          }}
        >
          Task radar
        </Typography>
        <ChevronRight
          size={16}
          style={{
            opacity: isHovered ? 1 : 0.3,
            transition: "opacity 0.2s ease",
            color: `${text.icon}`,
          }}
        />
      </Stack>

      <Box sx={{ position: "relative", flex: 1 }}>
        {/* Dashed grid lines */}
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              top: i * (barHeight / 4),
              left: 0,
              right: 0,
              borderTop: `1px dashed ${borderPalette.light}`,
            }}
          />
        ))}
        <Stack
          direction="row"
          justifyContent="space-around"
          alignItems="flex-end"
          sx={{ height: barHeight + 40 }}
        >
          {items.map((item) => (
            <Stack key={item.label} alignItems="center" gap="4px">
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: text.primary }}>
                {item.value}
              </Typography>
              <Box
                sx={{
                  width: 40,
                  height: (item.value / max) * barHeight || 4,
                  backgroundColor: item.color,
                  borderRadius: "4px 4px 0 0",
                  minHeight: 4,
                }}
              />
              <Typography sx={{ fontSize: 11, color: text.icon, textAlign: "center" }}>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
