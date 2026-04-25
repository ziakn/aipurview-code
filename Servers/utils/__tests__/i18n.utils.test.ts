import { describe, it, expect, jest, afterEach } from "@jest/globals";

// The i18n module reads process.env.I18N_BACKEND_ENABLED at import time.
// We use jest.isolateModules to re-import per flag state.

function loadModule(flag: string | undefined) {
  if (flag === undefined) delete process.env.I18N_BACKEND_ENABLED;
  else process.env.I18N_BACKEND_ENABLED = flag;
  let mod!: typeof import("../i18n.utils");
  jest.isolateModules(() => {
    mod = require("../i18n.utils") as typeof import("../i18n.utils");
  });
  return mod;
}

describe("i18n.utils", () => {
  const origEnv = process.env.I18N_BACKEND_ENABLED;
  afterEach(() => {
    if (origEnv === undefined) delete process.env.I18N_BACKEND_ENABLED;
    else process.env.I18N_BACKEND_ENABLED = origEnv;
  });

  describe("isSupportedLang", () => {
    it("recognises supported langs", () => {
      const { isSupportedLang } = loadModule("true");
      expect(isSupportedLang("en")).toBe(true);
      expect(isSupportedLang("de")).toBe(true);
      expect(isSupportedLang("fr")).toBe(true);
    });

    it("rejects unsupported langs", () => {
      const { isSupportedLang } = loadModule("true");
      expect(isSupportedLang("ja")).toBe(false);
      expect(isSupportedLang("es")).toBe(false);
    });

    it("rejects non-string input", () => {
      const { isSupportedLang } = loadModule("true");
      expect(isSupportedLang(undefined)).toBe(false);
      expect(isSupportedLang(null)).toBe(false);
      expect(isSupportedLang(42)).toBe(false);
      expect(isSupportedLang({})).toBe(false);
    });
  });

  describe("getTranslator", () => {
    it("returns the same reference for the same lang (pre-built closures)", () => {
      const { getTranslator } = loadModule("true");
      expect(getTranslator("de")).toBe(getTranslator("de"));
      expect(getTranslator("fr")).toBe(getTranslator("fr"));
    });

    it("returns the identity translator when flag is off", () => {
      const { getTranslator } = loadModule("false");
      const t = getTranslator("de");
      expect(t("Vendor not found")).toBe("Vendor not found");
    });

    it("returns a translator that looks up the dictionary when flag is on", () => {
      const { getTranslator } = loadModule("true");
      const t = getTranslator("de");
      expect(t("Vendor not found")).toBe("Anbieter nicht gefunden");
    });

    it("interpolates vars when called", () => {
      const { getTranslator } = loadModule("true");
      const t = getTranslator("de");
      expect(t("Step {n} name is required", { n: 7 })).toBe(
        "Schritt 7: Name ist erforderlich",
      );
    });
  });

  describe("translate (request-less callers)", () => {
    it("translates with a known lang when flag is on", () => {
      const { translate } = loadModule("true");
      expect(translate("de", "Vendor not found")).toBe("Anbieter nicht gefunden");
      expect(translate("fr", "Vendor not found")).toBe("Fournisseur introuvable");
    });

    it("falls back to en for unsupported lang", () => {
      const { translate } = loadModule("true");
      expect(translate("ja", "Vendor not found")).toBe("Vendor not found");
    });

    it("falls back to en for undefined lang", () => {
      const { translate } = loadModule("true");
      expect(translate(undefined, "Vendor not found")).toBe("Vendor not found");
    });

    it("returns the key unchanged when flag is off, regardless of lang", () => {
      const { translate } = loadModule("false");
      expect(translate("de", "Vendor not found")).toBe("Vendor not found");
      expect(translate("fr", "Vendor not found")).toBe("Vendor not found");
    });

    it("still interpolates vars when flag is off", () => {
      const { translate } = loadModule("false");
      expect(translate("de", "Step {n} name is required", { n: 4 })).toBe(
        "Step 4 name is required",
      );
    });

    it("preserves {placeholder} when no matching var", () => {
      const { translate } = loadModule("true");
      expect(translate("de", "Step {n} name is required")).toBe(
        "Schritt {n}: Name ist erforderlich",
      );
    });

    it("returns the key unchanged when key is not in dictionary", () => {
      const { translate } = loadModule("true");
      const unknownKey = "__not_a_real_key_" + Math.random();
      expect(translate("de", unknownKey)).toBe(unknownKey);
    });
  });

  describe("translateError (catch-block helper)", () => {
    it("prefers i18nKey + i18nVars over message", () => {
      const { translateError, getTranslator } = loadModule("true");
      const req: any = { t: getTranslator("de") };
      const err = {
        message: "Action with ID 47 not found",
        i18nKey: "Action with ID {id} not found",
        i18nVars: { id: 47 },
      };
      expect(translateError(req, err)).toBe("Aktion mit ID 47 nicht gefunden");
    });

    it("falls back to error.message when i18nKey is absent", () => {
      const { translateError, getTranslator } = loadModule("true");
      const req: any = { t: getTranslator("de") };
      const err = new Error("Vendor not found");
      expect(translateError(req, err)).toBe("Anbieter nicht gefunden");
    });

    it("uses identity translator when req.t is missing", () => {
      const { translateError } = loadModule("true");
      const req: any = {};
      const err = new Error("Vendor not found");
      // No req.t, falls through to identityTranslator which is a no-op
      // (returns the key as-is, with interpolation only).
      expect(translateError(req, err)).toBe("Vendor not found");
    });

    it("ignores i18nKey if it is not a string (defensive)", () => {
      const { translateError, getTranslator } = loadModule("true");
      const req: any = { t: getTranslator("de") };
      const err = {
        message: "Vendor not found",
        i18nKey: 42, // wrong type
      };
      // Should fall through to message-based translation.
      expect(translateError(req, err)).toBe("Anbieter nicht gefunden");
    });

    it("handles non-Error throws (string, null)", () => {
      const { translateError, getTranslator } = loadModule("true");
      const req: any = { t: getTranslator("de") };
      // String throws (rare but legal in JS)
      expect(translateError(req, "raw string")).toBe("raw string");
      // null throw
      expect(translateError(req, null)).toBe("null");
    });

    it("returns English when flag is off, regardless of req.lang", () => {
      const { translateError, getTranslator } = loadModule("false");
      const req: any = { t: getTranslator("de") }; // even with a "de" translator
      const err = new Error("Vendor not found");
      expect(translateError(req, err)).toBe("Vendor not found");
    });
  });
});
