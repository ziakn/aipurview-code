import { apiServices } from "../../../infrastructure/api/networkServices";
import {
  GetSubClausesById,
  ISO27001GetSubClauseByClauseId,
  ISO27001GetSubClauseById,
  UpdateSubClauseById,
} from "../subClause_iso.repository";

vi.mock("../../../infrastructure/api/networkServices", () => {
  return {
    apiServices: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Test Sub Clause ISO Repository", () => {
  describe("GetSubClausesById", () => {
    it("should make a get request with default responseType and return response.data", async () => {
      const routeUrl = "/iso27001/subClauses/byClauseId/1";
      const signal: AbortSignal = new AbortController().signal;
      const mockData = { subClauses: [{ id: 1, title: "1.1" }] };

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: mockData,
      });

      const response = await GetSubClausesById({ routeUrl, signal });

      expect(apiServices.get).toHaveBeenCalledWith(routeUrl, {
        signal,
        responseType: "json",
      });
      expect(response).toEqual(mockData);
    });

    it("should make a get request with custom responseType", async () => {
      const routeUrl = "/iso27001/subClauses/export/1";
      const signal: AbortSignal = new AbortController().signal;

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: "blob-content",
      });

      const response = await GetSubClausesById({
        routeUrl,
        signal,
        responseType: "blob",
      });

      expect(apiServices.get).toHaveBeenCalledWith(routeUrl, {
        signal,
        responseType: "blob",
      });
      expect(response).toEqual("blob-content");
    });
  });

  describe("UpdateSubClauseById", () => {
    it("should make a patch request with multipart/form-data header and return response", async () => {
      const routeUrl = "/iso27001/subClauses/1";
      const body = new FormData();
      body.append("title", "Updated");
      const headers = { Authorization: "Bearer token" };
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const response = await UpdateSubClauseById({ routeUrl, body, headers });

      expect(apiServices.patch).toHaveBeenCalledWith(routeUrl, body, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer token",
        },
      });
      expect(response).toEqual(mockResponse);
    });

    it("should log and rethrow when patch request fails", async () => {
      const routeUrl = "/iso27001/subClauses/1";
      const body = new FormData();
      const error = new Error("Patch failed");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.mocked(apiServices.patch).mockRejectedValue(error);

      await expect(UpdateSubClauseById({ routeUrl, body })).rejects.toThrow(
        error,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error updating subclause by ID:",
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ISO27001GetSubClauseByClauseId", () => {
    it("should make a get request with default responseType and return response.data", async () => {
      const routeUrl = "/iso27001/subClauses/byClauseId/3";
      const signal: AbortSignal = new AbortController().signal;
      const mockData = { items: [{ id: 10 }] };

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: mockData,
      });

      const response = await ISO27001GetSubClauseByClauseId({
        routeUrl,
        signal,
      });

      expect(apiServices.get).toHaveBeenCalledWith(routeUrl, {
        signal,
        responseType: "json",
      });
      expect(response).toEqual(mockData);
    });

    it("should make a get request with custom responseType", async () => {
      const routeUrl = "/iso27001/subClauses/byClauseId/3/export";
      const signal: AbortSignal = new AbortController().signal;

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: "blob-data",
      });

      const response = await ISO27001GetSubClauseByClauseId({
        routeUrl,
        signal,
        responseType: "blob",
      });

      expect(apiServices.get).toHaveBeenCalledWith(routeUrl, {
        signal,
        responseType: "blob",
      });
      expect(response).toEqual("blob-data");
    });
  });

  describe("ISO27001GetSubClauseById", () => {
    it("should make a get request and return response.data", async () => {
      const routeUrl = "/iso27001/subClauses/5";
      const signal: AbortSignal = new AbortController().signal;
      const mockData = { id: 5, title: "5.1" };

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: mockData,
      });

      const response = await ISO27001GetSubClauseById({ routeUrl, signal });

      expect(apiServices.get).toHaveBeenCalledWith(routeUrl, {
        signal,
        responseType: "json",
      });
      expect(response).toEqual(mockData);
    });

    it("should log and rethrow when get request fails", async () => {
      const routeUrl = "/iso27001/subClauses/5";
      const signal: AbortSignal = new AbortController().signal;
      const error = new Error("Get failed");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.mocked(apiServices.get).mockRejectedValue(error);

      await expect(
        ISO27001GetSubClauseById({ routeUrl, signal }),
      ).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting subclause by ID:",
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
