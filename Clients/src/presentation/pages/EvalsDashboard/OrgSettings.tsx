import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Stack, Typography, Button, CircularProgress, useTheme } from "@mui/material";
import { Home, FlaskConical, Settings } from "lucide-react";
import { PageHeaderExtended } from "../../components/Layout/PageHeaderExtended";
import Alert from "../../components/Alert";
import { getAllLlmApiKeys } from "../../../application/repository/deepEval.repository";
import { useIsAdmin } from "../../../application/hooks/useIsAdmin";
import { palette } from "../../themes/palette";

const LLM_PROVIDERS = [
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Gemini" },
  { _id: "xai", name: "xAI" },
  { _id: "mistral", name: "Mistral" },
  { _id: "huggingface", name: "Hugging Face" },
];

export default function OrgSettings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isAdmin = useIsAdmin();
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedKeys, setSavedKeys] = useState<{ provider: string; maskedKey: string }[]>([]);

  const breadcrumbs = [
    { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
    { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
    { label: "Organization settings", icon: <Settings size={14} strokeWidth={1.5} /> },
  ];

  useEffect(() => {
    if (!isAdmin) {
      navigate("/evals", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const keys = await getAllLlmApiKeys();
        if (!cancelled) {
          setSavedKeys(
            keys.map((key) => ({
              provider: key.provider,
              maskedKey: key.maskedKey,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setAlert({ variant: "error", body: "Failed to load API keys from AI Gateway" });
          setTimeout(() => setAlert(null), 5000);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getProviderName = (providerId: string): string => {
    return LLM_PROVIDERS.find((p) => p._id === providerId)?.name || providerId;
  };

  return (
    <PageHeaderExtended
      title="Organization settings"
      description="LLM provider API keys for evaluations are stored in AI Gateway. Manage them there; this page shows which eval-supported providers are configured."
      helpArticlePath="llm-evals/configuration"
      breadcrumbItems={breadcrumbs}
      alert={alert ? <Alert variant={alert.variant} body={alert.body} /> : undefined}
    >
      <Stack spacing={3} sx={{ maxWidth: 700 }}>
        <Button
          variant="contained"
          component={RouterLink}
          to="/ai-gateway/settings/api-keys"
          sx={{
            textTransform: "none",
            alignSelf: "flex-start",
            backgroundColor: palette.brand.primary,
            "&:hover": { backgroundColor: palette.brand.primaryHover },
          }}
        >
          Open AI Gateway API keys
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : savedKeys.length === 0 ? (
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
            No eval-compatible provider keys found. Add keys in AI Gateway to run cloud evaluations.
          </Typography>
        ) : (
          <Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 2,
              }}
            >
              Configured for evaluations (read-only)
            </Typography>
            <Stack spacing={1}>
              {savedKeys.map((key) => (
                <Box
                  key={key.provider}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "4px",
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>
                      {getProviderName(key.provider)}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {key.maskedKey}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </PageHeaderExtended>
  );
}
