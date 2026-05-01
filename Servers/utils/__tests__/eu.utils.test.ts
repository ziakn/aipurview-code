import { describe, it, expect } from "@jest/globals";

jest.mock("../../database/db", () => ({
  sequelize: { query: jest.fn() },
}));

import { deriveControlStatus } from "../eu.utils";

describe("deriveControlStatus", () => {
  it("returns Waiting when there are no subcontrols", () => {
    expect(deriveControlStatus([])).toBe("Waiting");
  });

  it("returns Waiting when every subcontrol is Waiting or null", () => {
    expect(deriveControlStatus(["Waiting", "Waiting"])).toBe("Waiting");
    expect(deriveControlStatus([null, null])).toBe("Waiting");
    expect(deriveControlStatus(["Waiting", null, undefined])).toBe("Waiting");
  });

  it("returns Done only when every subcontrol is Done", () => {
    expect(deriveControlStatus(["Done", "Done"])).toBe("Done");
    expect(deriveControlStatus(["Done"])).toBe("Done");
  });

  it("returns In progress when a subcontrol is mid-flight", () => {
    expect(deriveControlStatus(["In progress"])).toBe("In progress");
    expect(deriveControlStatus(["Waiting", "Done"])).toBe("In progress");
    expect(deriveControlStatus(["In progress", "Waiting"])).toBe("In progress");
    expect(deriveControlStatus([null, "Done"])).toBe("In progress");
    expect(deriveControlStatus(["In progress", "Done", "Waiting"])).toBe("In progress");
  });
});
