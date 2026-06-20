/**
 * @fileoverview AI Trust Index — Settings tab.
 *
 * Admin-only configuration of who receives change-notification digests:
 * an organization-user multi-select plus free-text email entry. Changes
 * auto-save (debounced) via the settings mutation.
 *
 * @module pages/AITrustIndex/Settings
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import ChipInput from "../../../components/Inputs/ChipInput";
import AutoCompleteField from "../../../components/Inputs/Autocomplete";
import { EmptyState } from "../../../components/EmptyState";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { palette } from "../../../themes/palette";
import { useSettings, useUpdateSettings } from "../../../../application/hooks/useAiTrustIndex";
import useUsers from "../../../../application/hooks/useUsers";
import { useAuth } from "../../../../application/hooks/useAuth";

interface UserOption {
  id: number;
  label: string;
}

export default function Settings() {
  const { userRoleName, isSuperAdmin } = useAuth();
  const isAdmin = isSuperAdmin || userRoleName === "Admin" || userRoleName === "SuperAdmin";

  const { data: settingsData, isLoading: settingsLoading } = useSettings();
  const { users } = useUsers();
  const updateSettings = useUpdateSettings();

  const [recipientUserIds, setRecipientUserIds] = useState<number[]>([]);
  const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
  // Skip the very first auto-save so loading the saved value doesn't trigger a write.
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate local state from the saved settings once they arrive.
  useEffect(() => {
    if (settingsData?.data) {
      setRecipientUserIds(settingsData.data.recipientUserIds ?? []);
      setRecipientEmails(settingsData.data.recipientEmails ?? []);
    }
  }, [settingsData]);

  // Debounced auto-save on any change (after initial hydration).
  useEffect(() => {
    if (!isAdmin) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSettings.mutate({ recipientUserIds, recipientEmails });
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // updateSettings is stable from React Query; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientUserIds, recipientEmails, isAdmin]);

  const userOptions: UserOption[] = useMemo(
    () =>
      (users ?? []).map((u) => ({
        id: u.id,
        label: [u.name, u.surname].filter(Boolean).join(" ") || u.email || `User ${u.id}`,
      })),
    [users],
  );

  const selectedUsers = useMemo(
    () => userOptions.filter((o) => recipientUserIds.includes(o.id)),
    [userOptions, recipientUserIds],
  );

  if (!isAdmin) {
    return (
      <PageHeaderExtended
        title="Settings"
        description="AI Trust Index notification settings."
        breadcrumbItems={[{ label: "Settings" }]}
      >
        <EmptyState
          message="Only administrators can change AI Trust Index notification settings."
          showBorder
        />
      </PageHeaderExtended>
    );
  }

  return (
    <PageHeaderExtended
      title="Settings"
      description="Choose who receives a notification when a tracked app's assessment changes materially. If no recipients are set, organization admins are notified by default."
      breadcrumbItems={[{ label: "Settings" }]}
    >
      {settingsLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} sx={{ color: palette.brand.primary }} />
        </Box>
      ) : (
        <Stack gap="24px" sx={{ maxWidth: 560 }}>
          <AutoCompleteField
            multiple
            label="Recipients"
            id="ai-trust-index-recipient-users"
            options={userOptions}
            value={selectedUsers}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            onChange={(_e, value) => setRecipientUserIds(value.map((v) => v.id))}
            placeholder="Select team members"
          />

          <ChipInput
            id="ai-trust-index-recipient-emails"
            label="Additional emails"
            value={recipientEmails}
            onChange={setRecipientEmails}
            placeholder="Type an email and press Enter"
          />

          <Typography sx={{ fontSize: "12px", color: palette.text.tertiary }}>
            {updateSettings.isPending ? "Saving…" : "Changes are saved automatically."}
          </Typography>
        </Stack>
      )}
    </PageHeaderExtended>
  );
}
