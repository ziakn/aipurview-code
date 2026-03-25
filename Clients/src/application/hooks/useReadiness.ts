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
  scores: (projectId?: number) => [...readinessQueryKeys.all, "scores", projectId] as const,
  scoresByFramework: (fw: string, projectId?: number) =>
    [...readinessQueryKeys.all, "scores", fw, projectId] as const,
  controls: (fw: string, projectId?: number) =>
    [...readinessQueryKeys.all, "controls", fw, projectId] as const,
  weakest: (limit?: number, projectId?: number) =>
    [...readinessQueryKeys.all, "weakest", limit, projectId] as const,
  recommendations: (limit?: number, projectId?: number) =>
    [...readinessQueryKeys.all, "recommendations", limit, projectId] as const,
  history: (fw?: string, projectId?: number) =>
    [...readinessQueryKeys.all, "history", fw, projectId] as const,
};

/** Fetch all framework readiness scores */
export const useReadinessScores = (projectId?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.scores(projectId),
    queryFn: async () => {
      const res = await getReadinessScores(projectId);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch readiness scores for a specific framework */
export const useReadinessScoresByFramework = (
  frameworkType: string,
  options?: { enabled?: boolean; projectId?: number }
) => {
  return useQuery({
    queryKey: readinessQueryKeys.scoresByFramework(frameworkType, options?.projectId),
    queryFn: async () => {
      const res = await getReadinessScoresByFramework(frameworkType, options?.projectId);
      return res?.data ?? null;
    },
    enabled: (options?.enabled ?? true) && !!frameworkType,
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch per-control readiness scores */
export const useControlScores = (
  frameworkType: string,
  options?: { enabled?: boolean; projectId?: number }
) => {
  return useQuery({
    queryKey: readinessQueryKeys.controls(frameworkType, options?.projectId),
    queryFn: async () => {
      const res = await getControlScores(frameworkType, options?.projectId);
      return res?.data ?? [];
    },
    enabled: (options?.enabled ?? true) && !!frameworkType,
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch weakest controls */
export const useWeakestControls = (limit?: number, projectId?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.weakest(limit, projectId),
    queryFn: async () => {
      const res = await getWeakestControls(limit, projectId);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch top recommendations */
export const useRecommendations = (limit?: number, projectId?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.recommendations(limit, projectId),
    queryFn: async () => {
      const res = await getRecommendations(limit, projectId);
      return res?.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/** Fetch readiness history for trend chart */
export const useReadinessHistory = (frameworkType?: string, projectId?: number) => {
  return useQuery({
    queryKey: readinessQueryKeys.history(frameworkType, projectId),
    queryFn: async () => {
      const res = await getReadinessHistory(frameworkType, projectId);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readinessQueryKeys.all });
    },
  });
};
