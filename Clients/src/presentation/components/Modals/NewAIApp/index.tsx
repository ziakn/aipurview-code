import { useEffect, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import StandardModal from "../StandardModal";
import Field from "../../Inputs/Field";
import Select from "../../Inputs/Select";
import AutoCompleteField from "../../Inputs/Autocomplete";
import { useCreateAiApp } from "../../../../application/hooks/useAiApps";
import { useVendors } from "../../../../application/hooks/useVendors";
import useUsers from "../../../../application/hooks/useUsers";
import { useFormValidation } from "../../../../application/hooks/useFormValidation";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import { AiAppStatus, AiAppDiscoveredSource } from "../../../../domain/enums/aiApp.enum";
import { User } from "../../../../domain/types/User";
import { VendorModel } from "../../../../domain/models/Common/vendor/vendor.model";
import { STATUS_OPTIONS } from "../../../pages/AIApps/utils";
import Alert from "../../Alert";

interface ApiErrorResponse {
  response?: { data?: { message?: string } };
}

interface NewAIAppProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  description: string;
  vendor_id: number | null;
  owner_id: number | null;
  status: AiAppStatus;
  discovered_source: AiAppDiscoveredSource;
  required_training: string;
}

const initialState: FormState = {
  name: "",
  description: "",
  vendor_id: null,
  owner_id: null,
  status: AiAppStatus.DRAFT,
  discovered_source: AiAppDiscoveredSource.MANUAL,
  required_training: "",
};

const SOURCE_OPTIONS = [
  { _id: AiAppDiscoveredSource.MANUAL, name: "Manual" },
  { _id: AiAppDiscoveredSource.SHADOW_AI, name: "Shadow AI" },
  { _id: AiAppDiscoveredSource.EMPLOYEE_REPORT, name: "Employee report" },
  { _id: AiAppDiscoveredSource.SSO, name: "SSO" },
  { _id: AiAppDiscoveredSource.PROXY, name: "Proxy" },
  { _id: AiAppDiscoveredSource.FIREWALL, name: "Firewall" },
];

interface OptionItem {
  _id: number;
  name: string;
}

export default function NewAIApp({ isOpen, onClose, onSuccess }: NewAIAppProps) {
  const [values, setValues] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const createAiAppMutation = useCreateAiApp();
  const { data: vendorsData } = useVendors();
  const { users } = useUsers();

  const validators = useMemo(
    () => ({
      name: (v: unknown) => {
        const r = checkStringValidation("AI App name", v as string, 1, 128);
        return r.accepted ? "" : r.message;
      },
    }),
    [],
  );

  const { errors, validateAll, clearFieldError, resetErrors } =
    useFormValidation<FormState>(validators);

  useEffect(() => {
    if (isOpen) {
      setValues(initialState);
      resetErrors();
      setAlert(null);
    }
  }, [isOpen, resetErrors]);

  const vendorOptions: OptionItem[] = useMemo(
    () =>
      (vendorsData || []).map((vendor: VendorModel) => ({
        _id: vendor.id!,
        name: vendor.vendor_name || `Vendor ${vendor.id}`,
      })),
    [vendorsData],
  );

  const userOptions: OptionItem[] = useMemo(
    () =>
      (users || []).map((user: User) => ({
        _id: user.id,
        name: `${user.name} ${user.surname}`,
      })),
    [users],
  );

  const selectedVendor = useMemo(
    () => vendorOptions.find((v) => v._id === values.vendor_id) || null,
    [vendorOptions, values.vendor_id],
  );

  const selectedOwner = useMemo(
    () => userOptions.find((u) => u._id === values.owner_id) || null,
    [userOptions, values.owner_id],
  );

  const handleChange = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleSubmit = async () => {
    const isValid = validateAll(values);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await createAiAppMutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        vendor_id: values.vendor_id,
        owner_id: values.owner_id,
        status: values.status,
        discovered_source: values.discovered_source,
        required_training: values.required_training || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as ApiErrorResponse)?.response?.data?.message || "Failed to create AI app";
      setAlert({
        variant: "error",
        body: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="New AI app"
      description="Add an AI application to your governance inventory."
      onSubmit={handleSubmit}
      submitButtonText="Create"
      isSubmitting={isSubmitting}
      maxWidth="720px"
    >
      <Stack sx={{ gap: "48px" }}>
        <Field
          label="Name"
          placeholder="e.g. ChatGPT Enterprise"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          isRequired
        />

        <Field
          label="Description"
          placeholder="What is this app used for?"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          multiline
          minRows={3}
        />

        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <AutoCompleteField<OptionItem>
            label="Vendor"
            placeholder="Select vendor"
            value={selectedVendor}
            onChange={(_event, newValue) => {
              handleChange("vendor_id", newValue?._id || null);
            }}
            options={vendorOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <AutoCompleteField<OptionItem>
            label="Owner"
            placeholder="Select owner"
            value={selectedOwner}
            onChange={(_event, newValue) => {
              handleChange("owner_id", newValue?._id || null);
            }}
            options={userOptions}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ flex: 1, minWidth: 220 }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Select
            id="ai-app-status"
            label="Status"
            value={values.status}
            onChange={(e) => handleChange("status", e.target.value as AiAppStatus)}
            items={[...STATUS_OPTIONS]}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <Select
            id="ai-app-source"
            label="Discovered source"
            value={values.discovered_source}
            onChange={(e) =>
              handleChange("discovered_source", e.target.value as AiAppDiscoveredSource)
            }
            items={SOURCE_OPTIONS}
            sx={{ flex: 1, minWidth: 220 }}
          />
        </Box>

        <Field
          label="Required training"
          placeholder="e.g. AI Literacy 101"
          value={values.required_training}
          onChange={(e) => handleChange("required_training", e.target.value)}
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
    </StandardModal>
  );
}
