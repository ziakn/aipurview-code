// Clients/src/application/hooks/useAiTrustIndex.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApps,
  getApp,
  getTracked,
  trackApp,
  trackAppsBulk,
  untrackApp,
  getSettings,
  updateSettings,
} from "../repository/aiTrustIndex.repository";

const KEY = "ai-trust-index";

export function useApps(filters: Record<string, unknown>) {
  return useQuery({ queryKey: [KEY, "apps", filters], queryFn: () => getApps(filters as any) });
}
export function useApp(slug: string) {
  return useQuery({ queryKey: [KEY, "app", slug], queryFn: () => getApp(slug), enabled: !!slug });
}
export function useTracked() {
  return useQuery({ queryKey: [KEY, "tracked"], queryFn: () => getTracked() });
}
export function useTrackApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => trackApp(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "apps"] });
      qc.invalidateQueries({ queryKey: [KEY, "tracked"] });
      // The detail page reads is_tracked from [KEY, "app", slug]; invalidate the
      // "app" prefix so its Track/Untrack button reflects the new state.
      qc.invalidateQueries({ queryKey: [KEY, "app"] });
    },
  });
}
export function useTrackAppsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => trackAppsBulk(slugs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "apps"] });
      qc.invalidateQueries({ queryKey: [KEY, "tracked"] });
      qc.invalidateQueries({ queryKey: [KEY, "app"] });
    },
  });
}
export function useUntrackApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => untrackApp(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, "apps"] });
      qc.invalidateQueries({ queryKey: [KEY, "tracked"] });
      qc.invalidateQueries({ queryKey: [KEY, "app"] });
    },
  });
}
export function useSettings() {
  // Settings change rarely and the page auto-saves; a 60s staleTime avoids the
  // global 2s default refetching on every interaction (which made the page churn).
  return useQuery({
    queryKey: [KEY, "settings"],
    queryFn: () => getSettings(),
    staleTime: 60 * 1000,
  });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { recipientUserIds: number[]; recipientEmails: string[] }) =>
      updateSettings(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, "settings"] }),
  });
}
