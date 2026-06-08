import { renderHook, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBulkUpdateProjectRisks } from "../useBulkUpdateProjectRisks";

const mockBulkUpdateProjectRisks = vi.fn();

vi.mock("../../repository/projectRisk.repository", () => ({
  bulkUpdateProjectRisks: (...args: unknown[]) => mockBulkUpdateProjectRisks(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useBulkUpdateProjectRisks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call bulkUpdateProjectRisks on mutate", async () => {
    mockBulkUpdateProjectRisks.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useBulkUpdateProjectRisks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ riskIds: [1, 2], updates: {} });
    });

    expect(mockBulkUpdateProjectRisks).toHaveBeenCalledWith({ riskIds: [1, 2], updates: {} });
  });

  it("should call onSuccess callback when mutation succeeds", async () => {
    const onSuccess = vi.fn();
    mockBulkUpdateProjectRisks.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useBulkUpdateProjectRisks({ onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ riskIds: [1], updates: {} });
    });

    expect(onSuccess).toHaveBeenCalledWith({ riskIds: [1], updates: {} });
  });

  it("should call onError callback when mutation fails", async () => {
    const onError = vi.fn();
    const testError = new Error("Network error");
    mockBulkUpdateProjectRisks.mockRejectedValue(testError);

    const { result } = renderHook(() => useBulkUpdateProjectRisks({ onError }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ riskIds: [1], updates: {} });
      } catch {
        // expected
      }
    });

    expect(onError).toHaveBeenCalledWith(testError, { riskIds: [1], updates: {} });
  });
});
