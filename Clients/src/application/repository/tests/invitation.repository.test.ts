import { apiServices } from "../../../infrastructure/api/networkServices";
import {
  getInvitations,
  resendInvitation,
  revokeInvitation,
} from "../invitation.repository";

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

describe("Test Invitation Repository", () => {
  describe("getInvitations", () => {
    it("should call get /invitations and return response.data", async () => {
      const mockData = {
        invitations: [
          {
            id: 1,
            email: "user@example.com",
            name: "John",
            surname: "Doe",
            role_id: 2,
            status: "pending",
            invited_by: 1,
            created_at: "2026-02-26T00:00:00.000Z",
            expires_at: "2026-03-01T00:00:00.000Z",
            updated_at: "2026-02-26T00:00:00.000Z",
            role_name: "Reviewer",
          },
        ],
      };

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: mockData,
      });

      const response = await getInvitations();

      expect(apiServices.get).toHaveBeenCalledWith("/invitations");
      expect(response).toEqual(mockData);
    });

    it("should return empty invitations list", async () => {
      const mockData = { invitations: [] };

      vi.mocked(apiServices.get).mockResolvedValue({
        status: 200,
        statusText: "OK",
        data: mockData,
      });

      const response = await getInvitations();

      expect(response).toEqual({ invitations: [] });
    });
  });

  describe("revokeInvitation", () => {
    it("should call delete with invitation id and return full response", async () => {
      const id = 10;
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { success: true },
      };

      vi.mocked(apiServices.delete).mockResolvedValue(mockResponse);

      const response = await revokeInvitation(id);

      expect(apiServices.delete).toHaveBeenCalledWith("/invitations/10");
      expect(response).toEqual(mockResponse);
    });
  });

  describe("resendInvitation", () => {
    it("should call post with invitation id resend endpoint and return full response", async () => {
      const id = 22;
      const mockResponse = {
        status: 200,
        statusText: "OK",
        data: { resent: true },
      };

      vi.mocked(apiServices.post).mockResolvedValue(mockResponse);

      const response = await resendInvitation(id);

      expect(apiServices.post).toHaveBeenCalledWith("/invitations/22/resend");
      expect(response).toEqual(mockResponse);
    });
  });
});
