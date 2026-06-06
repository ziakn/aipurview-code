import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useMappings,
  useMappingsBetween,
  useScenarios,
  useScenario,
  useCreateScenario,
  useUpdateScenario,
  useDeleteScenario,
  useCoverage,
  useRefreshCoverage,
  useUnifiedView,
  useGovernanceOsEligibility,
  useGovernancePreferences,
  useUpdatePreferences,
} from "../useGovernanceOs";

vi.mock("../../repository/governanceOs.repository", () => ({
  getAllMappings: vi.fn(),
  getMappingsBetween: vi.fn(),
  getAllScenarios: vi.fn(),
  getScenarioById: vi.fn(),
  createScenario: vi.fn(),
  updateScenario: vi.fn(),
  deleteScenario: vi.fn(),
  getCoverage: vi.fn(),
  refreshCoverage: vi.fn(),
  getUnifiedView: vi.fn(),
  getEligibility: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  getRecommendations: vi.fn(),
}));

import { getAllMappings, getEligibility } from "../../repository/governanceOs.repository";

const mockGetAllMappings = vi.mocked(getAllMappings);
const mockGetEligibility = vi.mocked(getEligibility);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useMappings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mappings data", async () => {
    mockGetAllMappings.mockResolvedValue({ data: [{ id: 1, source: "A", target: "B" }] });
    const { result } = renderHook(() => useMappings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, source: "A", target: "B" }]);
  });

  it("returns empty array when no data", async () => {
    mockGetAllMappings.mockResolvedValue({ data: undefined });
    const { result } = renderHook(() => useMappings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("passes filters to repository", async () => {
    mockGetAllMappings.mockResolvedValue({ data: [] });
    const filters = { frameworkId: 1, strength: "strong" };
    renderHook(() => useMappings(filters), { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockGetAllMappings).toHaveBeenCalledWith(
        expect.objectContaining({ frameworkId: 1, strength: "strong" }),
      ),
    );
  });
});

describe("useGovernanceOsEligibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns eligibility", async () => {
    mockGetEligibility.mockResolvedValue({ data: { eligible: true, frameworkCount: 3 } });
    const { result } = renderHook(() => useGovernanceOsEligibility(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ eligible: true, frameworkCount: 3 });
  });

  it("returns default when no data", async () => {
    mockGetEligibility.mockResolvedValue({ data: undefined });
    const { result } = renderHook(() => useGovernanceOsEligibility(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ eligible: false, frameworkCount: 0 });
  });
});
