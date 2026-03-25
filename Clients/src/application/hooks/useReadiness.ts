import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  triggerCalculateAll,
  triggerCalculateFramework,
  getReadinessScores,
  getReadinessScoresByFramework,
  getControlScores,
  getWeakestControls,
  getRecommendations,
  getReadinessHistory,
} from "../repository/readiness.repository";

export const readinessQueryKeys = {
  all: ["readiness"] as const,
  scores: () => [...readinessQueryKeys.all, "scores"] as const,
  scoresByFramework: (fw: string) => [...readinessQueryKeys.all, "scores", fw] as const,
  controls: (fw: string) => [...readinessQueryKeys.all, "controls", fw] as const,
  weakest: (limit?: number) => [...readinessQueryKeys.all, "weakest", limit] as const,
  recommendations: (limit?: number) => [...readinessQueryKeys.all, "recommendations", limit] as const,
  history: (fw?: string) => [...readinessQueryKeys.all, "history", fw] as const,
};

/** Fetch all framework readiness scores */
export const useReadinessScores = () => {
  return useQuery({
    queryKey: readinessQueryKeys.scores(),
    queryFn: async () => {
      const res = await getReadinessScores();
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch readiness scores for a specific framework */
export const useReadinessScoresByFramework = (frameworkType: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: readinessQueryKeys.scoresByFramework(frameworkType),
    queryFn: async () => {
      const res = await getReadinessScoresByFramework(frameworkType);
      return res?.data ?? null;
    },
    enabled: (options?.enabled ?? true) && !!frameworkType,
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch per-control readiness scores */
export const useControlScores = (frameworkType: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: readinessQueryKeys.controls(frameworkType),
    queryFn: async () => {
      const res = await getControlScores(frameworkType);
      return res?.data ?? [];
    },
    enabled: (options?.enabled ?? true) && !!frameworkType,
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch weakest controls across all frameworks */
export const useWeakestControls = (limit?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.weakest(limit),
    queryFn: async () => {
      const res = await getWeakestControls(limit);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch top recommendations */
export const useRecommendations = (limit?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.recommendations(limit),
    queryFn: async () => {
      const res = await getRecommendations(limit);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch readiness history for trend chart */
export const useReadinessHistory = (frameworkType?: string) => {
  return useQuery({
    queryKey: readinessQueryKeys.history(frameworkType),
    queryFn: async () => {
      const res = await getReadinessHistory(frameworkType);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Trigger readiness calculation for all frameworks */
export const useTriggerCalculateAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId?: number) => {
      const res = await triggerCalculateAll(projectId);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.all });
    },
  });
};

/** Trigger readiness calculation for a specific framework */
export const useTriggerCalculateFramework = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ frameworkType, projectId }: { frameworkType: string; projectId?: number }) => {
      const res = await triggerCalculateFramework(frameworkType, projectId);
      return res?.data;
    },
    onSuccess: (_data, { frameworkType }) => {
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.scoresByFramework(frameworkType) });
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.controls(frameworkType) });
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.scores() });
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.weakest() });
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.recommendations() });
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.history() });
    },
  });
};
