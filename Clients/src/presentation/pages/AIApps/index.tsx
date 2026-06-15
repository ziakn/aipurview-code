import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stack, Box, Skeleton } from "@mui/material";
import { Plus } from "lucide-react";
import TabContext from "@mui/lab/TabContext";

import { PageHeaderExtended } from "../../components/Layout/PageHeaderExtended";
import { CustomizableButton } from "../../components/button/customizable-button";
import TabBar from "../../components/TabBar";
import { SearchBox } from "../../components/Search";
import Select from "../../components/Inputs/Select";
import { EmptyState } from "../../components/EmptyState";
import { useAiApps, useDeleteAiApp } from "../../../application/hooks/useAiApps";
import { AiAppStatus } from "../../../domain/enums/aiApp.enum";
import { IAIApp } from "../../../domain/interfaces/i.aiApp";
import { useAuth } from "../../../application/hooks/useAuth";
import Alert from "../../components/Alert";
import NewAIApp from "../../components/Modals/NewAIApp";
import AIAppsCatalog from "./AIAppsCatalog";
import AIAppsTable from "./AIAppsTable";
import AIAppDetail from "./AIAppDetail";
import { mainStackStyle, toolbarStyle, filterRowStyle } from "./style";

type TabValue = "catalog" | "list";

const STATUS_OPTIONS = [
  { _id: "all", name: "All statuses" },
  { _id: AiAppStatus.DRAFT, name: "Draft" },
  { _id: AiAppStatus.UNDER_REVIEW, name: "Under review" },
  { _id: AiAppStatus.APPROVED, name: "Approved" },
  { _id: AiAppStatus.RESTRICTED, name: "Restricted" },
  { _id: AiAppStatus.BANNED, name: "Banned" },
];

const TABS = [
  { value: "catalog", label: "Catalog", icon: "LayoutGrid" as const },
  { value: "list", label: "List", icon: "List" as const },
];

export default function AIApps() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { userRoleName } = useAuth();
  const isCreatingDisabled = !userRoleName || !["Admin", "Editor"].includes(userRoleName);

  const [activeTab, setActiveTab] = useState<TabValue>("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AiAppStatus | "all">("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const { data, isLoading, error } = useAiApps({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const deleteAiAppMutation = useDeleteAiApp();

  const filteredApps = useMemo(() => {
    const apps = data?.ai_apps || [];
    if (!searchTerm.trim()) return apps;
    const term = searchTerm.toLowerCase();
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(term) ||
        (app.description && app.description.toLowerCase().includes(term)),
    );
  }, [data, searchTerm]);

  const handleAppClick = useCallback(
    (app: IAIApp) => {
      navigate(`/ai-apps/${app.id}`);
    },
    [navigate],
  );

  const handleDeleteApp = useCallback(
    async (appId: number) => {
      try {
        await deleteAiAppMutation.mutateAsync(appId);
        setAlert({ variant: "success", body: "AI App deleted successfully" });
      } catch (err) {
        setAlert({ variant: "error", body: "Failed to delete AI App" });
      }
    },
    [deleteAiAppMutation],
  );

  const handleNewAppSuccess = useCallback(() => {
    setIsNewModalOpen(false);
    setAlert({ variant: "success", body: "AI App created successfully" });
  }, []);

  const handleCloseAlert = () => setAlert(null);

  if (id) {
    return <AIAppDetail />;
  }

  return (
    <PageHeaderExtended
      title="AI apps"
      description="Browse, approve and govern the AI applications your employees use."
      helpArticlePath="ai-apps"
    >
      <Stack sx={mainStackStyle}>
        <Box sx={toolbarStyle}>
          <Box sx={filterRowStyle}>
            <SearchBox
              placeholder="Search AI apps"
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              sx={{ width: 260 }}
            />
            <Select
              id="ai-apps-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AiAppStatus | "all")}
              items={STATUS_OPTIONS}
              sx={{ width: 160 }}
            />
          </Box>
          <CustomizableButton
            text="New AI app"
            variant="contained"
            startIcon={<Plus size={16} strokeWidth={1.5} />}
            onClick={() => setIsNewModalOpen(true)}
            disabled={isCreatingDisabled}
          />
        </Box>

        <TabContext value={activeTab}>
          <TabBar
            tabs={TABS}
            activeTab={activeTab}
            onChange={(_event, value) => setActiveTab(value as TabValue)}
          />
        </TabContext>

        {isLoading ? (
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "8px" }} />
        ) : error ? (
          <EmptyState
            message="Failed to load AI apps. Please try again."
            showBorder
          />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            message="No AI apps found. Create your first AI app to get started."
            showBorder
          />
        ) : activeTab === "catalog" ? (
          <AIAppsCatalog apps={filteredApps} onAppClick={handleAppClick} />
        ) : (
          <AIAppsTable
            apps={filteredApps}
            onAppClick={handleAppClick}
            onDeleteApp={handleDeleteApp}
          />
        )}

        <NewAIApp
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={handleNewAppSuccess}
        />

        {alert && (
          <Alert
            variant={alert.variant}
            title={alert.title}
            body={alert.body}
            isToast
            onClick={handleCloseAlert}
          />
        )}
      </Stack>
    </PageHeaderExtended>
  );
}


