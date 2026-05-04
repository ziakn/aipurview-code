import { DatasetStatus } from "../enums/dataset-status.enum";
import { DatasetType } from "../enums/dataset-type.enum";

jest.mock("sequelize-typescript", () => ({
  Column: jest.fn(), DataType: {
    INTEGER: "INTEGER", STRING: jest.fn(() => "STRING"), TEXT: "TEXT",
    DATE: "DATE", BOOLEAN: "BOOLEAN", ENUM: jest.fn(), JSONB: "JSONB", NOW: "NOW",
  },
  ForeignKey: jest.fn(), BelongsTo: jest.fn(), Table: jest.fn(),
  Model: class MockModel { constructor(data?: any) { if (data) Object.assign(this, data); } },
}));

class TestDatasetModel {
  id?: number; name!: string; description?: string; status!: string;
  type!: string; version?: string; organization_id!: number;
  created_at?: Date; updated_at?: Date;
  constructor(data?: any) { if (data) Object.assign(this, data); }
}

class TestDatasetChangeHistoryModel {
  id?: number; dataset_id!: number; change_type!: string;
  changed_by!: number; created_at?: Date;
  constructor(data?: any) { if (data) Object.assign(this, data); }
}

class TestDatasetModelInventoryModel {
  id?: number; dataset_id!: number; model_inventory_id!: number;
  constructor(data?: any) { if (data) Object.assign(this, data); }
}

class TestDatasetProjectModel {
  id?: number; dataset_id!: number; project_id!: number;
  constructor(data?: any) { if (data) Object.assign(this, data); }
}

describe("DatasetModel", () => {
  it("should instantiate with required fields", () => {
    const d = new TestDatasetModel({
      id: 1, name: "Training Data v1", status: DatasetStatus.ACTIVE,
      type: DatasetType.TRAINING, organization_id: 1,
    });
    expect(d.name).toBe("Training Data v1");
    expect(d.status).toBe(DatasetStatus.ACTIVE);
    expect(d.type).toBe(DatasetType.TRAINING);
  });

  it("should support all statuses", () => {
    Object.values(DatasetStatus).forEach((status) => {
      const d = new TestDatasetModel({ name: "T", status, type: "Training", organization_id: 1 });
      expect(d.status).toBe(status);
    });
  });

  it("should support all types", () => {
    Object.values(DatasetType).forEach((type) => {
      const d = new TestDatasetModel({ name: "T", status: "Active", type, organization_id: 1 });
      expect(d.type).toBe(type);
    });
  });
});

describe("DatasetChangeHistoryModel", () => {
  it("should track changes", () => {
    const h = new TestDatasetChangeHistoryModel({
      id: 1, dataset_id: 10, change_type: "status_changed", changed_by: 42,
    });
    expect(h.dataset_id).toBe(10);
    expect(h.change_type).toBe("status_changed");
  });
});

describe("DatasetModelInventoryModel", () => {
  it("should link dataset to model inventory", () => {
    const m = new TestDatasetModelInventoryModel({ dataset_id: 1, model_inventory_id: 2 });
    expect(m.dataset_id).toBe(1);
    expect(m.model_inventory_id).toBe(2);
  });
});

describe("DatasetProjectModel", () => {
  it("should link dataset to project", () => {
    const m = new TestDatasetProjectModel({ dataset_id: 1, project_id: 3 });
    expect(m.dataset_id).toBe(1);
    expect(m.project_id).toBe(3);
  });
});
