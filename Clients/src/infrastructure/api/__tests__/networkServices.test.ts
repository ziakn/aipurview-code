import { describe, it, expect } from "vitest";
import { server } from "../../../test/mocks/server";
import { http, HttpResponse } from "msw";

import { apiServices } from "../networkServices";

describe("apiServices", () => {
  describe("get", () => {
    it("calls CustomAxios.get with endpoint and params", async () => {
      server.use(http.get("/api/users", () => HttpResponse.json({ items: [] })));
      const result = await apiServices.get("/users", { page: 1 });
      expect(result.data).toEqual({ items: [] });
      expect(result.status).toBe(200);
    });

    it("extracts signal from params", async () => {
      const controller = new AbortController();
      server.use(http.get("/api/files", () => HttpResponse.json({ data: "test" })));
      const result = await apiServices.get("/files", {
        signal: controller.signal,
        id: 1,
      });
      expect(result.status).toBe(200);
    });

    it("throws CustomException on error", async () => {
      server.use(
        http.get("/api/fail", () =>
          HttpResponse.json({ message: "Internal server error" }, { status: 500 }),
        ),
      );
      await expect(apiServices.get("/fail")).rejects.toThrow("Internal server error");
    });
  });

  describe("post", () => {
    it("calls CustomAxios.post with data", async () => {
      server.use(
        http.post("/api/users", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: body.id ?? 1 }, { status: 201 });
        }),
      );
      const result = await apiServices.post("/users", { name: "Alice" });
      expect(result.data).toEqual({ id: 1 });
      expect(result.status).toBe(201);
    });
  });

  describe("put", () => {
    it("calls CustomAxios.put with data", async () => {
      server.use(http.put("/api/users/:id", () => HttpResponse.json({ updated: true })));
      const result = await apiServices.put("/users/1", { name: "Bob" });
      expect(result.data).toEqual({ updated: true });
    });
  });

  describe("patch", () => {
    it("calls CustomAxios.patch with data", async () => {
      server.use(http.patch("/api/users/:id", () => HttpResponse.json({ patched: true })));
      const result = await apiServices.patch("/users/1", { name: "Charlie" });
      expect(result.data).toEqual({ patched: true });
    });
  });

  describe("delete", () => {
    it("calls CustomAxios.delete and returns data.data", async () => {
      server.use(
        http.delete("/api/users/:id", () =>
          HttpResponse.json({ data: { deleted: true }, message: "Deleted" }),
        ),
      );
      const result = await apiServices.delete("/users/1");
      expect(result.data).toEqual({ deleted: true });
      expect(result.statusText).toBe("Deleted");
    });
  });

  describe("error handling", () => {
    it("extracts data.data string for validation errors", async () => {
      server.use(
        http.post("/api/users", () =>
          HttpResponse.json({ data: "Email is required" }, { status: 400 }),
        ),
      );
      await expect(apiServices.post("/users", {})).rejects.toThrow("Email is required");
    });

    it("extracts data.error for alternative error format", async () => {
      server.use(
        http.get("/api/test", () =>
          HttpResponse.json({ error: "Validation failed" }, { status: 422 }),
        ),
      );
      await expect(apiServices.get("/test")).rejects.toThrow("Validation failed");
    });

    it("falls back to error.message for non-Axios errors", async () => {
      server.use(http.get("/api/test", () => HttpResponse.error()));
      await expect(apiServices.get("/test")).rejects.toThrow();
    });
  });
});
