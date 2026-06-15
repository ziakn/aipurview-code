import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton, Stack } from "@mui/material";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { useAiApp, useUpdateAiAppStatus } from "../../../../application/hooks/useAiApps";
import { AiAppStatus } from "../../../../domain/enums/aiApp.enum";
import Alert from "../../../components/Alert";
import AIAppApprovalCenter from "./AIAppApprovalCenter";
import AIAppPolicyMapping from "./AIAppPolicyMapping";

export default function AIAppDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const appId = id ? parseInt(id, 10) : null;

  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const { data: app, isLoading, error } = useAiApp(appId);
  const updateStatusMutation = useUpdateAiAppStatus();

  const handleBack = useCallback(() => {
    navigate("/ai-apps");
  }, [navigate]);

  const handleStatusChange = useCallback(
    async (status: AiAppStatus) => {
      if (!appId) return;
      try {
        await updateStatusMutation.mutateAsync({ id: appId, status });
        setAlert({ variant: "success", body: "Status updated successfully" });
      } catch (err) {
        setAlert({ variant: "error", body: "Failed to update status" });
      }
    },
    [appId, updateStatusMutation],
  );

  if (isLoading) {
    return (
      <PageHeaderExtended title="AI app details" description="Approval center and governance">
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: "8px" }} />
      </PageHeaderExtended>
    );
  }

  if (error || !app) {
    return (
      <PageHeaderExtended title="AI app details" description="Approval center and governance">
        <div>AI App not found or failed to load.</div>
      </PageHeaderExtended>
    );
  }

  return (
    <PageHeaderExtended title="AI app details" description="Approval center and governance">
      <Stack gap="24px">
        <AIAppApprovalCenter
          app={app}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={updateStatusMutation.isPending}
        />

        <AIAppPolicyMapping
          appId={app.id!}
          appName={app.name}
          policies={app.policies || []}
        />

        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast
            onClick={() => setAlert(null)}
          />
        )}
      </Stack>
    </PageHeaderExtended>
  );
}
