import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, Slider, Grid } from "@mui/material";
import { Gauge } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { useUpdateAiApp } from "../../../../application/hooks/useAiApps";
import { palette } from "../../../themes/palette";
import Alert from "../../../components/Alert";
import Chip from "../../../components/Chip";

interface AIAppRiskAssessmentProps {
  appId: number;
  currentRiskScore?: number | null;
}

interface RiskCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
}

const RISK_CRITERIA: RiskCriterion[] = [
  {
    key: "data_sensitivity",
    label: "Data sensitivity",
    description: "Sensitivity of data the app can access or process",
    weight: 1,
  },
  {
    key: "user_exposure",
    label: "User exposure",
    description: "Number of employees, departments or external users with access",
    weight: 1,
  },
  {
    key: "business_criticality",
    label: "Business criticality",
    description: "Impact on operations if the app becomes unavailable or wrong",
    weight: 1,
  },
  {
    key: "vendor_maturity",
    label: "Vendor maturity",
    description: "Vendor security posture, review status and track record",
    weight: 1,
  },
  {
    key: "regulatory_scope",
    label: "Regulatory scope",
    description: "Applicable regulations such as GDPR, HIPAA or sector rules",
    weight: 1,
  },
  {
    key: "output_impact",
    label: "Output impact",
    description: "Consequences of incorrect or biased outputs on customers or IP",
    weight: 1,
  },
];

const MARKS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

function getRiskLevel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: "Low", color: palette.status.success.text };
  if (score <= 40) return { label: "Medium", color: palette.status.warning.text };
  if (score <= 60) return { label: "High", color: palette.accent.orange.text };
  return { label: "Critical", color: palette.status.error.text };
}

export default function AIAppRiskAssessment({
  appId,
  currentRiskScore,
}: AIAppRiskAssessmentProps) {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    RISK_CRITERIA.forEach((c) => {
      initial[c.key] = 3;
    });
    return initial;
  });
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    body: string;
  } | null>(null);

  const updateMutation = useUpdateAiApp();

  useEffect(() => {
    if (currentRiskScore === null || currentRiskScore === undefined) {
      const initial: Record<string, number> = {};
      RISK_CRITERIA.forEach((c) => {
        initial[c.key] = 3;
      });
      setScores(initial);
      return;
    }

    const clamped = Math.max(0, Math.min(100, currentRiskScore));
    const average = clamped / 20;
    const initial: Record<string, number> = {};
    RISK_CRITERIA.forEach((c) => {
      initial[c.key] = Math.max(1, Math.min(5, Math.round(average)));
    });
    setScores(initial);
  }, [currentRiskScore]);

  const calculatedScore = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    RISK_CRITERIA.forEach((criterion) => {
      weightedSum += scores[criterion.key] * criterion.weight;
      totalWeight += criterion.weight;
    });
    if (totalWeight === 0) return 0;
    const average = weightedSum / totalWeight;
    return Math.max(0, Math.min(100, Math.round(average * 20)));
  }, [scores]);

  const calculatedLevel = useMemo(
    () => getRiskLevel(calculatedScore),
    [calculatedScore],
  );

  const currentLevel = useMemo(
    () => (currentRiskScore != null ? getRiskLevel(currentRiskScore) : null),
    [currentRiskScore],
  );

  const handleChange = (key: string, value: number | number[]) => {
    const numeric = Array.isArray(value) ? value[0] : value;
    setScores((prev) => ({ ...prev, [key]: numeric }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: appId,
        data: { risk_score: calculatedScore },
      });
      setAlert({ variant: "success", body: `Risk score updated to ${calculatedScore}` });
    } catch (err) {
      setAlert({ variant: "error", body: "Failed to save risk assessment" });
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" gap="8px">
          <Gauge size={18} strokeWidth={1.5} color={palette.text.secondary} />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Risk assessment</Typography>
        </Stack>
        <CustomizableButton
          text="Save assessment"
          variant="contained"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        />
      </Stack>

      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: "8px",
          backgroundColor: palette.background.accent,
          border: `1px solid ${palette.border.light}`,
        }}
      >
        <Stack direction="row" alignItems="center" gap="16px" flexWrap="wrap">
          <Box>
            <Typography sx={{ fontSize: 12, color: palette.text.secondary, mb: 0.5 }}>
              Current risk score
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
              {currentRiskScore ?? "—"}
            </Typography>
            {currentLevel && (
              <Chip
                label={currentLevel.label}
                size="small"
                uppercase={false}
                textColor={currentLevel.color}
                backgroundColor="transparent"
              />
            )}
          </Box>
          <Box sx={{ width: 1, height: 1, backgroundColor: palette.border.light, display: { xs: "none", sm: "block" } }} />
          <Box>
            <Typography sx={{ fontSize: 12, color: palette.text.secondary, mb: 0.5 }}>
              Calculated risk score
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>{calculatedScore}</Typography>
            <Chip
              label={calculatedLevel.label}
              size="small"
              uppercase={false}
              textColor={calculatedLevel.color}
              backgroundColor="transparent"
            />
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={4}>
        {RISK_CRITERIA.map((criterion) => (
          <Grid size={{ xs: 12, md: 6 }} key={criterion.key}>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
                {criterion.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: palette.text.secondary,
                  mb: 1.5,
                }}
              >
                {criterion.description}
              </Typography>
              <Slider
                value={scores[criterion.key] ?? 3}
                onChange={(_event, value) => handleChange(criterion.key, value)}
                step={1}
                marks={MARKS}
                min={1}
                max={5}
                valueLabelDisplay="auto"
                sx={{
                  color: palette.accent.primary.text,
                  "& .MuiSlider-markLabel": {
                    fontSize: 12,
                    color: palette.text.secondary,
                  },
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {alert && (
        <Alert
          variant={alert.variant}
          body={alert.body}
          isToast
          onClick={() => setAlert(null)}
        />
      )}
    </Box>
  );
}
