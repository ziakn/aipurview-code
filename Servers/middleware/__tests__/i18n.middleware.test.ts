import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";

// The i18n module reads process.env.I18N_BACKEND_ENABLED at import time. We use
// jest.isolateModules to re-import per test with the desired flag state.

function loadModule(flag: "true" | "false" | undefined) {
  // Set the env var BEFORE the require runs.
  if (flag === undefined) delete process.env.I18N_BACKEND_ENABLED;
  else process.env.I18N_BACKEND_ENABLED = flag;
  let mod!: typeof import("../i18n.middleware");
  jest.isolateModules(() => {
    mod = require("../i18n.middleware") as typeof import("../i18n.middleware");
  });
  return mod;
}

function createReq(acceptLanguage?: string | string[]): Partial<Request> {
  return {
    headers: acceptLanguage !== undefined ? { "accept-language": acceptLanguage } : {},
  } as Partial<Request>;
}

describe("i18nMiddleware", () => {
  const origEnv = process.env.I18N_BACKEND_ENABLED;
  afterEach(() => {
    if (origEnv === undefined) delete process.env.I18N_BACKEND_ENABLED;
    else process.env.I18N_BACKEND_ENABLED = origEnv;
  });

  describe("flag enabled", () => {
    let i18nMiddleware: typeof import("../i18n.middleware").i18nMiddleware;
    beforeEach(() => {
      ({ i18nMiddleware } = loadModule("true"));
    });

    it("resolves Accept-Language: de to lang=de", () => {
      const req = createReq("de") as Request;
      const next = jest.fn() as NextFunction;
      i18nMiddleware(req, {} as Response, next);
      expect(req.lang).toBe("de");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("resolves Accept-Language: fr to lang=fr", () => {
      const req = createReq("fr") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.lang).toBe("fr");
    });

    it("strips region tag (de-DE -> de)", () => {
      const req = createReq("de-DE,de;q=0.9,en;q=0.8") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.lang).toBe("de");
    });

    it("falls back to en for unsupported language (ja)", () => {
      const req = createReq("ja") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.lang).toBe("en");
    });

    it("falls back to en when Accept-Language is missing", () => {
      const req = createReq() as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.lang).toBe("en");
    });

    it("falls back to en when Accept-Language is an array (proxy edge case)", () => {
      const req = createReq(["de", "fr"]) as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      // Array headers are non-string in our handler — treated as missing.
      expect(req.lang).toBe("en");
    });

    it("attaches a callable req.t", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(typeof req.t).toBe("function");
    });

    it("translates a known key in DE", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      // "Vendor not found" is in the DE dictionary as "Anbieter nicht gefunden".
      expect(req.t!("Vendor not found")).toBe("Anbieter nicht gefunden");
    });

    it("translates a known key in FR", () => {
      const req = createReq("fr") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Vendor not found")).toBe("Fournisseur introuvable");
    });

    it("returns the key unchanged when translation is missing (graceful fallback)", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      const unknownKey = "__definitely_not_in_dict_" + Math.random();
      expect(req.t!(unknownKey)).toBe(unknownKey);
    });

    it("interpolates {placeholder} vars", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      // "Step {n} name is required" is in the DE dictionary.
      expect(req.t!("Step {n} name is required", { n: 3 })).toBe(
        "Schritt 3: Name ist erforderlich",
      );
    });

    it("leaves {placeholder} literal when no matching var is provided", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Step {n} name is required")).toBe("Schritt {n}: Name ist erforderlich");
    });

    it("handles strings without any vars", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Access denied")).toBe("Zugriff verweigert");
    });
  });

  describe("flag disabled", () => {
    let i18nMiddleware: typeof import("../i18n.middleware").i18nMiddleware;
    beforeEach(() => {
      ({ i18nMiddleware } = loadModule("false"));
    });

    it("returns the key unchanged regardless of Accept-Language", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Vendor not found")).toBe("Vendor not found");
    });

    it("still interpolates vars (no dictionary lookup)", () => {
      const req = createReq("fr") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Step {n} name is required", { n: 5 })).toBe("Step 5 name is required");
    });

    it("still resolves req.lang from header (informational)", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      // req.lang is set even when the flag is off, so downstream code can
      // distinguish requests by locale even if responses stay English.
      expect(req.lang).toBe("de");
    });
  });

  describe("flag unset (default off)", () => {
    let i18nMiddleware: typeof import("../i18n.middleware").i18nMiddleware;
    beforeEach(() => {
      ({ i18nMiddleware } = loadModule(undefined));
    });

    it("behaves as flag=false", () => {
      const req = createReq("de") as Request;
      i18nMiddleware(req, {} as Response, jest.fn() as NextFunction);
      expect(req.t!("Vendor not found")).toBe("Vendor not found");
    });
  });
});
