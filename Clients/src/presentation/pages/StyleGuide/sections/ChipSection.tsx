import React, { useState } from "react";
import { Box, Stack, Typography, useTheme, Divider, Snackbar } from "@mui/material";
import { Copy } from "lucide-react";
import Chip from "../../../components/Chip";
import { ChipVariant } from "../../../types/interfaces/i.chip";
import CodeBlock from "../components/CodeBlock";

const chipSnippets = {
  basic: `import Chip from "../components/Chip";

<Chip label="High" variant="high" />`,
  autoVariant: `// Variant is auto-derived from the label when omitted
<Chip label="Approved" />
<Chip label="In progress" />`,
  size: `<Chip label="Small" variant="info" size="small" />
<Chip label="Medium" variant="info" size="medium" />`,
  uppercase: `<Chip label="In progress" variant="warning" uppercase={false} />`,
  custom: `<Chip label="Custom" backgroundColor="#E8F5E9" textColor="#2E7D32" />`,
};

// Variant groups, mirroring VARIANT_COLORS in Chip.tsx
const variantGroups: { group: string; variants: ChipVariant[] }[] = [
  { group: "Risk levels", variants: ["critical", "high", "medium", "low", "very-low"] },
  { group: "Status", variants: ["success", "warning", "error", "info", "default"] },
  {
    group: "Severity",
    variants: ["catastrophic", "major", "moderate", "minor", "negligible"],
  },
  { group: "Boolean", variants: ["yes", "no"] },
];

const ChipSection: React.FC = () => {
  const theme = useTheme();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Box sx={{ p: "32px 40px" }}>
      <Snackbar
        open={!!copiedText}
        autoHideDuration={2000}
        onClose={() => setCopiedText(null)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Page Header */}
      <Box sx={{ mb: "32px" }}>
        <Typography
          sx={{
            fontSize: 24,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "8px",
          }}
        >
          Chips
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.tertiary,
            maxWidth: 600,
          }}
        >
          The unified Chip component renders consistent light pastel badges for risk levels,
          statuses, severities and boolean values. The variant is auto-derived from the label when
          not provided explicitly.
        </Typography>
      </Box>

      {/* All Variants Preview */}
      <SpecSection title="Variants">
        <Typography sx={{ fontSize: 13, color: theme.palette.text.tertiary, mb: "24px" }}>
          Predefined variants grouped by semantic category. Severity reuses the risk palette.
        </Typography>

        <Stack spacing="24px">
          {variantGroups.map(({ group, variants }) => (
            <Box key={group}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  mb: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {group}
              </Typography>
              <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {variants.map((variant) => (
                  <Chip key={variant} label={variant.replace("-", " ")} variant={variant} />
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </SpecSection>

      <Divider sx={{ my: "32px" }} />

      {/* Usage */}
      <SpecSection title="Usage">
        <Box sx={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          <Box sx={{ flex: "1 1 500px", minWidth: 320 }}>
            <Stack spacing="24px">
              <ExampleWithCode
                label="Explicit variant"
                code={chipSnippets.basic}
                onCopy={handleCopy}
              >
                <Chip label="High" variant="high" />
              </ExampleWithCode>

              <ExampleWithCode
                label="Auto-derived variant (from label)"
                code={chipSnippets.autoVariant}
                onCopy={handleCopy}
              >
                <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Chip label="Approved" />
                  <Chip label="In progress" />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode label="Sizes" code={chipSnippets.size} onCopy={handleCopy}>
                <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Chip label="Small" variant="info" size="small" />
                  <Chip label="Medium" variant="info" size="medium" />
                </Box>
              </ExampleWithCode>

              <ExampleWithCode
                label="Lowercase (uppercase=false)"
                code={chipSnippets.uppercase}
                onCopy={handleCopy}
              >
                <Chip label="In progress" variant="warning" uppercase={false} />
              </ExampleWithCode>

              <ExampleWithCode label="Custom colors" code={chipSnippets.custom} onCopy={handleCopy}>
                <Chip label="Custom" backgroundColor="#E8F5E9" textColor="#2E7D32" />
              </ExampleWithCode>
            </Stack>
          </Box>

          <Box sx={{ flex: "1 1 300px", minWidth: 280 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.palette.text.secondary,
                mb: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Props
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "label", value: "string (required)" },
                { property: "variant", value: "risk | status | severity | boolean" },
                { property: "size", value: '"small" (24px) | "medium" (34px)' },
                { property: "uppercase", value: "boolean (default true)" },
                { property: "backgroundColor", value: "string (override)" },
                { property: "textColor", value: "string (override)" },
                { property: "icon", value: "ReactNode (optional)" },
              ]}
            />

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.palette.text.secondary,
                mt: "24px",
                mb: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Specifications
            </Typography>
            <SpecTable
              onCopy={handleCopy}
              specs={[
                { property: "Padding", value: "4px 8px" },
                { property: "Border radius", value: "4px" },
                { property: "Font size", value: "11px" },
                { property: "Text transform", value: "uppercase (default)" },
                { property: "Default fallback", value: "default (gray)" },
              ]}
            />
          </Box>
        </Box>
      </SpecSection>

      {/* Developer Checklist */}
      <Box
        sx={{
          mt: "40px",
          p: "24px",
          backgroundColor: theme.palette.background.accent,
          borderRadius: "4px",
          border: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: "16px",
          }}
        >
          Developer checklist
        </Typography>
        <Stack spacing="8px">
          {[
            "Import Chip from components/Chip",
            "Prefer label-only usage — the variant is auto-derived from common labels",
            "Pass an explicit variant when the label is ambiguous or custom",
            "Unknown labels fall back to the default (gray) variant",
            "Use backgroundColor + textColor together for one-off custom colors",
            "Do not re-implement inline badge styling — use this component instead",
          ].map((item, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: theme.palette.primary.main,
                  mt: "6px",
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

// Helper Components

const SpecSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: "16px" }}>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: "16px",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

const SpecTable: React.FC<{
  specs: { property: string; value: string }[];
  onCopy: (text: string) => void;
}> = ({ specs, onCopy }) => {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.alt,
        borderRadius: "4px",
        border: `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      {specs.map((spec, index) => (
        <Box
          key={index}
          onClick={() => onCopy(spec.value)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          sx={{
            "display": "flex",
            "justifyContent": "space-between",
            "alignItems": "center",
            "p": "10px 14px",
            "borderBottom":
              index < specs.length - 1 ? `1px solid ${theme.palette.border.light}` : "none",
            "cursor": "pointer",
            "transition": "background-color 150ms ease",
            "&:hover": {
              backgroundColor: theme.palette.background.fill,
            },
          }}
        >
          <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
            {spec.property}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 500,
                color: theme.palette.text.primary,
                fontFamily: "monospace",
              }}
            >
              {spec.value}
            </Typography>
            {hoveredIndex === index && <Copy size={12} color={theme.palette.primary.main} />}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const ExampleWithCode: React.FC<{
  label: string;
  code: string;
  onCopy: (text: string) => void;
  children: React.ReactNode;
}> = ({ label, code, onCopy, children }) => {
  const theme = useTheme();
  const [showCode, setShowCode] = useState(true);

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: "8px 12px",
          backgroundColor: theme.palette.background.alt,
          borderBottom: `1px solid ${theme.palette.border.light}`,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.text.secondary }}>
          {label}
        </Typography>
        <Box
          onClick={() => setShowCode(!showCode)}
          sx={{
            "fontSize": 11,
            "color": showCode ? theme.palette.primary.main : theme.palette.text.tertiary,
            "cursor": "pointer",
            "&:hover": { color: theme.palette.primary.main },
          }}
        >
          {showCode ? "Hide code" : "Show code"}
        </Box>
      </Box>

      <Box sx={{ p: "16px", backgroundColor: theme.palette.background.main }}>{children}</Box>

      {showCode && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.border.light}` }}>
          <CodeBlock code={code} language="tsx" onCopy={onCopy} />
        </Box>
      )}
    </Box>
  );
};

export default ChipSection;
