import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiServices } from "../../../infrastructure/api/networkServices";
import {
  CreateMyOrganization,
  GetMyOrganization,
  UpdateMyOrganization,
  checkOrganizationExists,
  updateOnboardingStatus,
} from "../organization.repository";

vi.mock("../../../infrastructure/api/networkServices", () => ({
  apiServices: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

// Fixtures
const mockOrganizationData = {
  id: 1,
  name: "Test Organization",
  email: "org@example.com",
  phone: "+1234567890",
  address: "123 Test St",
};

const mockAbortSignal = new AbortController().signal;

describe("organization.repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("GetMyOrganization", () => {
    beforeEach(() => {
      vi.mocked(apiServices.get).mockClear();
    });

    it("should retrieve organization details with default parameters", async () => {
      const mockResponse = { ...mockOrganizationData };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await GetMyOrganization({
        routeUrl: "/organizations/1",
      });

      expect(apiServices.get).toHaveBeenCalledWith("/organizations/1", {
        signal: undefined,
        responseType: "json",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should retrieve organization with custom responseType", async () => {
      const mockResponse = new Blob([JSON.stringify(mockOrganizationData)]);
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await GetMyOrganization({
        routeUrl: "/organizations/1",
        responseType: "blob",
      });

      expect(apiServices.get).toHaveBeenCalledWith("/organizations/1", {
        signal: undefined,
        responseType: "blob",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should retrieve organization with AbortSignal", async () => {
      const mockResponse = { ...mockOrganizationData };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await GetMyOrganization({
        routeUrl: "/organizations/1",
        signal: mockAbortSignal,
      });

      expect(apiServices.get).toHaveBeenCalledWith("/organizations/1", {
        signal: mockAbortSignal,
        responseType: "json",
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle GET request error", async () => {
      const mockError = new Error("Network error");
      vi.mocked(apiServices.get).mockRejectedValue(mockError);

      await expect(
        GetMyOrganization({ routeUrl: "/organizations/1" }),
      ).rejects.toThrow("Network error");
      expect(apiServices.get).toHaveBeenCalledOnce();
    });

    it("should handle 404 error when organization not found", async () => {
      const mockError = {
        response: { status: 404, statusText: "Not Found" },
      };
      vi.mocked(apiServices.get).mockRejectedValue(mockError);

      await expect(
        GetMyOrganization({ routeUrl: "/organizations/999" }),
      ).rejects.toEqual(mockError);
    });

    it("should handle 500 server error", async () => {
      const mockError = {
        response: { status: 500, statusText: "Internal Server Error" },
      };
      vi.mocked(apiServices.get).mockRejectedValue(mockError);

      await expect(
        GetMyOrganization({ routeUrl: "/organizations/1" }),
      ).rejects.toEqual(mockError);
    });
  });

  describe("CreateMyOrganization", () => {
    beforeEach(() => {
      vi.mocked(apiServices.post).mockClear();
    });

    it("should create organization with default routeUrl", async () => {
      const mockResponse = { id: 1, ...mockOrganizationData };
      vi.mocked(apiServices.post).mockResolvedValue(mockResponse);

      const result = await CreateMyOrganization({
        body: mockOrganizationData,
      });

      expect(apiServices.post).toHaveBeenCalledWith(
        "/organizations",
        mockOrganizationData,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should create organization with custom routeUrl", async () => {
      const customUrl = "/api/v2/organizations";
      const mockResponse = { id: 2, ...mockOrganizationData };
      vi.mocked(apiServices.post).mockResolvedValue(mockResponse);

      const result = await CreateMyOrganization({
        routeUrl: customUrl,
        body: mockOrganizationData,
      });

      expect(apiServices.post).toHaveBeenCalledWith(
        customUrl,
        mockOrganizationData,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle POST request error on creation", async () => {
      const mockError = new Error("Failed to create organization");
      vi.mocked(apiServices.post).mockRejectedValue(mockError);

      await expect(
        CreateMyOrganization({ body: mockOrganizationData }),
      ).rejects.toThrow("Failed to create organization");
    });

    it("should handle 400 validation error on invalid data", async () => {
      const mockError = {
        response: { status: 400, statusText: "Bad Request" },
      };
      vi.mocked(apiServices.post).mockRejectedValue(mockError);

      await expect(
        CreateMyOrganization({ body: { name: "" } }),
      ).rejects.toEqual(mockError);
    });

    it("should handle 409 conflict error when organization already exists", async () => {
      const mockError = {
        response: { status: 409, statusText: "Conflict" },
      };
      vi.mocked(apiServices.post).mockRejectedValue(mockError);

      await expect(
        CreateMyOrganization({ body: mockOrganizationData }),
      ).rejects.toEqual(mockError);
    });
  });

  describe("UpdateMyOrganization", () => {
    beforeEach(() => {
      vi.mocked(apiServices.patch).mockClear();
    });

    it("should update organization with default routeUrl", async () => {
      const updatedData = { name: "Updated Organization" };
      const mockResponse = { data: { id: 1, ...updatedData } };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await UpdateMyOrganization({
        body: updatedData,
      });

      expect(apiServices.patch).toHaveBeenCalledWith(
        "/organizations",
        updatedData,
        {
          headers: {},
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should update organization with custom routeUrl", async () => {
      const customUrl = "/organizations/1";
      const updatedData = { phone: "+9876543210" };
      const mockResponse = { data: { id: 1, ...updatedData } };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await UpdateMyOrganization({
        routeUrl: customUrl,
        body: updatedData,
      });

      expect(apiServices.patch).toHaveBeenCalledWith(customUrl, updatedData, {
        headers: {},
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should update organization with custom headers", async () => {
      const customHeaders = { "X-Custom-Header": "custom-value" };
      const updatedData = { name: "Updated Organization" };
      const mockResponse = { data: { id: 1, ...updatedData } };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await UpdateMyOrganization({
        body: updatedData,
        headers: customHeaders,
      });

      expect(apiServices.patch).toHaveBeenCalledWith(
        "/organizations",
        updatedData,
        {
          headers: customHeaders,
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should return response.data not full response", async () => {
      const mockResponse = {
        data: { id: 1, name: "Updated" },
        status: 200,
        headers: {},
      };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await UpdateMyOrganization({
        body: { name: "Updated" },
      });

      expect(result).toEqual(mockResponse.data);
      expect(result).not.toEqual(mockResponse);
    });

    it("should handle PATCH request error on update", async () => {
      const mockError = new Error("Update failed");
      vi.mocked(apiServices.patch).mockRejectedValue(mockError);

      await expect(
        UpdateMyOrganization({ body: { name: "Test" } }),
      ).rejects.toThrow("Update failed");
    });

    it("should handle 403 forbidden error when insufficient permissions", async () => {
      const mockError = {
        response: { status: 403, statusText: "Forbidden" },
      };
      vi.mocked(apiServices.patch).mockRejectedValue(mockError);

      await expect(
        UpdateMyOrganization({ body: { name: "Test" } }),
      ).rejects.toEqual(mockError);
    });
  });

  describe("checkOrganizationExists", () => {
    beforeEach(() => {
      vi.mocked(apiServices.get).mockClear();
    });

    it("should return true when organization exists", async () => {
      const mockResponse = { data: { data: { exists: true } } };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(apiServices.get).toHaveBeenCalledWith("/organizations/exists");
      expect(result).toBe(true);
    });

    it("should return false when organization does not exist", async () => {
      const mockResponse = { data: { data: { exists: false } } };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(apiServices.get).toHaveBeenCalledWith("/organizations/exists");
      expect(result).toBe(false);
    });

    it("should return false when data property is missing", async () => {
      const mockResponse = { data: {} };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(result).toBe(false);
    });

    it("should return false when nested data is missing", async () => {
      const mockResponse = { data: { data: {} } };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(result).toBe(false);
    });

    it("should return false when exists property is undefined", async () => {
      const mockResponse = { data: { data: { exists: undefined } } };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(result).toBe(false);
    });

    it("should return false when exists property is null", async () => {
      const mockResponse = { data: { data: { exists: null } } };
      vi.mocked(apiServices.get).mockResolvedValue(mockResponse);

      const result = await checkOrganizationExists();

      expect(result).toBe(false);
    });

    it("should handle GET request error", async () => {
      const mockError = new Error("Network error");
      vi.mocked(apiServices.get).mockRejectedValue(mockError);

      await expect(checkOrganizationExists()).rejects.toThrow("Network error");
    });

    it("should handle 500 server error", async () => {
      const mockError = {
        response: { status: 500, statusText: "Internal Server Error" },
      };
      vi.mocked(apiServices.get).mockRejectedValue(mockError);

      await expect(checkOrganizationExists()).rejects.toEqual(mockError);
    });
  });

  describe("updateOnboardingStatus", () => {
    beforeEach(() => {
      vi.mocked(apiServices.patch).mockClear();
    });

    it("should update onboarding status to completed", async () => {
      const organizationId = 1;
      const mockResponse = { data: { onboarding_status: "completed" } };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await updateOnboardingStatus(organizationId);

      expect(apiServices.patch).toHaveBeenCalledWith(
        `/organizations/${organizationId}/onboarding-status`,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should return response.data not full response", async () => {
      const mockResponse = {
        data: { onboarding_status: "completed" },
        status: 200,
        headers: {},
      };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await updateOnboardingStatus(1);

      expect(result).toEqual(mockResponse.data);
      expect(result).not.toEqual(mockResponse);
    });

    it("should update onboarding status for different organization IDs", async () => {
      const organizationId = 42;
      const mockResponse = { data: { id: 42, onboarding_status: "completed" } };
      vi.mocked(apiServices.patch).mockResolvedValue(mockResponse);

      const result = await updateOnboardingStatus(organizationId);

      expect(apiServices.patch).toHaveBeenCalledWith(
        `/organizations/${organizationId}/onboarding-status`,
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle PATCH request error on status update", async () => {
      const mockError = new Error("Failed to update onboarding status");
      vi.mocked(apiServices.patch).mockRejectedValue(mockError);

      await expect(updateOnboardingStatus(1)).rejects.toThrow(
        "Failed to update onboarding status",
      );
    });

    it("should handle 404 error when organization not found", async () => {
      const mockError = {
        response: { status: 404, statusText: "Not Found" },
      };
      vi.mocked(apiServices.patch).mockRejectedValue(mockError);

      await expect(updateOnboardingStatus(999)).rejects.toEqual(mockError);
    });

    it("should handle 403 forbidden error when insufficient permissions", async () => {
      const mockError = {
        response: { status: 403, statusText: "Forbidden" },
      };
      vi.mocked(apiServices.patch).mockRejectedValue(mockError);

      await expect(updateOnboardingStatus(1)).rejects.toEqual(mockError);
    });
  });
});
