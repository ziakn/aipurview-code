import { useState } from "react";
import { Stack, Typography, CircularProgress, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { GitCompareArrows, Plus, List, Grid3X3, Download } from "lucide-react";
import FrameworkSelector from "../../components/GovernanceOS/FrameworkSelector";
import MappingCard from "../../components/GovernanceOS/MappingCard";
import { EmptyState } from "../../components/EmptyState";
import { StatusTileCards, StatusTileItem } from "../../components/Cards/StatusTileCards";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import {
  useMappings,
  useMappingsBetween,
  useCreateMapping,
  useUpdateMapping,
  useDeleteMapping,
} from "../../../application/hooks/useGovernanceOs";
import { IGovernanceControlMapping } from "../../../domain/interfaces/i.governanceOs";
import MappingFormModal from "./FrameworkMapperModule/MappingFormModal";
import MappingMatrixView from "./FrameworkMapperModule/MappingMatrixView";

const FrameworkMapper = () => {
  const [sourceId, setSourceId] = useState(1);
  const [targetId, setTargetId] = useState(2);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<IGovernanceControlMapping | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<IGovernanceControlMapping | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "matrix">("list");

  const { data: allMappings, isLoading: allMappingsLoading } = useMappings();
  const { data: pairwiseMappings, isLoading: pairwiseLoading } = useMappingsBetween(sourceId, targetId);
  const createMappingMutation = useCreateMapping();
  const updateMappingMutation = useUpdateMapping();
  const deleteMappingMutation = useDeleteMapping();

  const mappings = viewMode === "matrix" ? allMappings : pairwiseMappings;
  const isLoading = viewMode === "matrix" ? allMappingsLoading : pairwiseLoading;

  const handleCreateMapping = () => {
    setEditingMapping(null);
    setFormModalOpen(true);
  };

  const handleEditMapping = (mapping: IGovernanceControlMapping) => {
    setEditingMapping(mapping);
    setFormModalOpen(true);
  };

  const handleDeleteMapping = (mapping: IGovernanceControlMapping) => {
    setMappingToDelete(mapping);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (mappingToDelete) {
      deleteMappingMutation.mutate(mappingToDelete.id!);
      setDeleteConfirmOpen(false);
      setMappingToDelete(null);
    }
  };

  const handleFormSubmit = (data: Partial<IGovernanceControlMapping>) => {
    if (editingMapping) {
      updateMappingMutation.mutate(
        { id: editingMapping.id!, body: data },
        { onSuccess: () => setFormModalOpen(false) }
      );
    } else {
      createMappingMutation.mutate(data, { onSuccess: () => setFormModalOpen(false) });
    }
  };

  const filteredMappings = (mappings || []).filter((m) => {
    if (selectedDomain && m.domain_tag !== selectedDomain) return false;
    return true;
  });

  const domains = [...new Set((mappings || []).map((m) => m.domain_tag).filter(Boolean))];

  const domainTileItems: StatusTileItem[] = domains.map((domain) => {
    const count = (mappings || []).filter((m) => m.domain_tag === domain).length;
    return {
      key: domain as string,
      label: (domain as string).replace(/_/g, " "),
      count,
      color: "#13715B",
    };
  });

  return (
    <Stack spacing={3}>
      <Typography variant="body2" sx={{ color: "#475467" }}>
        Explore cross-framework control mappings. Select source and target frameworks to see how
        controls align.
      </Typography>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FrameworkSelector
          sourceId={sourceId}
          targetId={targetId}
          onSourceChange={setSourceId}
          onTargetChange={setTargetId}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size="small"
            sx={{ height: 34 }}
          >
            <ToggleButton value="list" sx={{ px: 1.5 }}>
              <List size={14} />
            </ToggleButton>
            <ToggleButton value="matrix" sx={{ px: 1.5 }}>
              <Grid3X3 size={14} />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={14} />}
            onClick={() => {
              const rows = [
                ["ID", "Source Framework", "Source Control", "Target Framework", "Target Control", "Strength", "Domain", "Confidence"].join(","),
                ...(pairwiseMappings || []).map((m) =>
                  [m.id, m.source_framework_id, m.source_control_identifier, m.target_framework_id, m.target_control_identifier, m.mapping_strength, m.domain_tag || "", m.confidence_score || ""].join(",")
                ),
              ];
              const blob = new Blob([rows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `mappings-${sourceId}-${targetId}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            sx={{ textTransform: "none", fontSize: 12, height: 34 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Plus size={14} />}
            onClick={handleCreateMapping}
            sx={{ textTransform: "none", fontSize: 12, height: 34 }}
          >
            New Mapping
          </Button>
        </Stack>
      </Stack>

      {domainTileItems.length > 0 && (
        <StatusTileCards
          items={domainTileItems}
          size="small"
          entityName="mapping"
          selectedKey={selectedDomain}
          onCardClick={(key) => setSelectedDomain(selectedDomain === key ? null : key)}
        />
      )}

      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={32} />
        </Stack>
      ) : filteredMappings.length === 0 ? (
        <EmptyState
          message="No mappings found for the selected frameworks and filters."
          icon={GitCompareArrows}
          showBorder
        />
      ) : (
        <Stack spacing={2}>
          <Typography variant="caption" sx={{ color: "#8594AC" }}>
            {filteredMappings.length} mapping(s) found
          </Typography>
          {filteredMappings.map((mapping) => (
            <MappingCard key={mapping.id} mapping={mapping} />
          ))}
        </Stack>
      )}
      <MappingFormModal
        open={formModalOpen}
        mapping={editingMapping}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={createMappingMutation.isPending || updateMappingMutation.isPending}
      />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onProceed={confirmDelete}
        title="Delete Mapping"
        body={`Are you sure you want to delete the mapping from "${mappingToDelete?.source_control_identifier}" to "${mappingToDelete?.target_control_identifier}"? This action cannot be undone.`}
        proceedText="Delete"
        cancelText="Cancel"
        proceedButtonVariant="contained"
        proceedButtonColor="error"
        isLoading={deleteMappingMutation.isPending}
      />
    </Stack>
  );
};

export default FrameworkMapper;
