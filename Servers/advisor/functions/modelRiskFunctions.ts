import { ModelRiskCategory } from "../../domain.layer/enums/model-risk-category.enum";
import { ModelRiskLevel } from "../../domain.layer/enums/model-risk-level.enum";
import { ModelRiskStatus } from "../../domain.layer/enums/model-risk-status.enum";
import { getAllModelRisksQuery } from "../../utils/modelRisk.utils";
import { ModelRiskModel } from "../../domain.layer/models/modelRisk/modelRisk.model";
import logger from "../../utils/logger/fileLogger";

export interface FetchModelRisksParams {
  modelId?: number;
  risk_category?: "Performance" | "Bias & Fairness" | "Security" | "Data Quality" | "Compliance";
  risk_level?: "Low" | "Medium" | "High" | "Critical";
  status?: "Open" | "In Progress" | "Resolved" | "Accepted";
  // owner is the user ID FK (model_risks.owner is INTEGER REFERENCES users.id),
  // not a name. Resolve names via list_users first.
  owner?: number;
  limit?: number;
}

const fetchModelRisks = async (
  params: FetchModelRisksParams,
  organizationId: number,
): Promise<Partial<ModelRiskModel>[]> => {
  let risks: ModelRiskModel[] = [];

  try {
    // Fetch all active model risks
    risks = await getAllModelRisksQuery(organizationId, "active");

    // Apply filters
    if (params.modelId) {
      risks = risks.filter((r) => r.model_id === params.modelId);
    }
    if (params.risk_category) {
      risks = risks.filter((r) => r.risk_category === params.risk_category);
    }
    if (params.risk_level) {
      risks = risks.filter((r) => r.risk_level === params.risk_level);
    }
    if (params.status) {
      risks = risks.filter((r) => r.status === params.status);
    }
    if (params.owner !== undefined && params.owner !== null) {
      // The TS interface IModelRisk types `owner` as string but the DB
      // column is `INTEGER REFERENCES users(id)` — a pre-existing type lie.
      // At runtime Sequelize returns the raw number; cast to compare.
      const ownerId = params.owner;
      risks = risks.filter((r) => (r.owner as unknown as number) === ownerId);
    }

    // Limit results
    if (params.limit && params.limit > 0) {
      risks = risks.slice(0, params.limit);
    }

    // Return lightweight projections — exclude verbose text fields
    return risks.map((r) => ({
      id: r.id,
      risk_name: r.risk_name,
      risk_category: r.risk_category,
      risk_level: r.risk_level,
      status: r.status,
      owner: r.owner,
      target_date: r.target_date,
      model_id: r.model_id,
      created_at: r.created_at,
    }));
  } catch (error) {
    logger.error("Error fetching model risks:", error);
    throw new Error(
      `Failed to fetch model risks: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export interface ModelRiskAnalytics {
  categoryDistribution: {
    [category: string]: number;
  };
  levelDistribution: {
    [level: string]: number;
  };
  statusDistribution: {
    [status: string]: number;
  };
  ownerDistribution: Array<{
    owner: string;
    count: number;
    percentage: number;
  }>;
  risksByModel: Array<{
    modelId: number;
    count: number;
    criticalCount: number;
    highCount: number;
  }>;
  totalRisks: number;
}

const getModelRiskAnalytics = async (
  params: { modelId?: number },
  organizationId: number,
): Promise<ModelRiskAnalytics> => {
  try {
    // Fetch all model risks
    let risks = await getAllModelRisksQuery(organizationId, "active");

    // Filter by model if specified
    if (params.modelId) {
      risks = risks.filter((r) => r.model_id === params.modelId);
    }

    const totalRisks = risks.length;

    // 1. Category Distribution
    const categoryDistribution: { [category: string]: number } = {};
    Object.values(ModelRiskCategory).forEach((category) => {
      categoryDistribution[category] = 0;
    });

    risks.forEach((risk) => {
      if (risk.risk_category) {
        categoryDistribution[risk.risk_category] =
          (categoryDistribution[risk.risk_category] || 0) + 1;
      }
    });

    // 2. Level Distribution
    const levelDistribution: { [level: string]: number } = {};
    Object.values(ModelRiskLevel).forEach((level) => {
      levelDistribution[level] = 0;
    });

    risks.forEach((risk) => {
      if (risk.risk_level) {
        levelDistribution[risk.risk_level] =
          (levelDistribution[risk.risk_level] || 0) + 1;
      }
    });

    // 3. Status Distribution
    const statusDistribution: { [status: string]: number } = {};
    Object.values(ModelRiskStatus).forEach((status) => {
      statusDistribution[status] = 0;
    });

    risks.forEach((risk) => {
      if (risk.status) {
        statusDistribution[risk.status] =
          (statusDistribution[risk.status] || 0) + 1;
      }
    });

    // 4. Owner Distribution
    const ownerMap = new Map<string, number>();
    risks.forEach((risk) => {
      if (risk.owner) {
        ownerMap.set(risk.owner, (ownerMap.get(risk.owner) || 0) + 1);
      }
    });

    const ownerDistribution = Array.from(ownerMap.entries())
      .map(([owner, count]) => ({
        owner,
        count,
        percentage:
          totalRisks > 0 ? Math.round((count / totalRisks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Risks by Model
    const modelMap = new Map<number, { count: number; criticalCount: number; highCount: number }>();
    risks.forEach((risk) => {
      if (risk.model_id) {
        const existing = modelMap.get(risk.model_id) || { count: 0, criticalCount: 0, highCount: 0 };
        existing.count++;
        if (risk.risk_level === ModelRiskLevel.CRITICAL) {
          existing.criticalCount++;
        } else if (risk.risk_level === ModelRiskLevel.HIGH) {
          existing.highCount++;
        }
        modelMap.set(risk.model_id, existing);
      }
    });

    const risksByModel = Array.from(modelMap.entries())
      .map(([modelId, data]) => ({
        modelId,
        count: data.count,
        criticalCount: data.criticalCount,
        highCount: data.highCount,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      categoryDistribution,
      levelDistribution,
      statusDistribution,
      ownerDistribution,
      risksByModel,
      totalRisks,
    };
  } catch (error) {
    logger.error("Error getting model risk analytics:", error);
    throw new Error(
      `Failed to get model risk analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export interface ModelRiskExecutiveSummary {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  openRisks: number;
  inProgressRisks: number;
  resolvedRisks: number;
  acceptedRisks: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  risksNeedingAttention: Array<{
    id: number;
    risk_name: string;
    risk_level: string;
    status: string;
    owner: string;
    target_date: string;
    daysUntilDue: number;
  }>;
  ownerWorkload: Array<{
    owner: string;
    totalRisks: number;
    openRisks: number;
  }>;
  resolutionProgress: {
    resolved: number;
    total: number;
    percentage: number;
  };
}

const getModelRiskExecutiveSummary = async (
  params: { modelId?: number },
  organizationId: number,
): Promise<ModelRiskExecutiveSummary> => {
  try {
    // Fetch all model risks
    let risks = await getAllModelRisksQuery(organizationId, "active");

    // Filter by model if specified
    if (params.modelId) {
      risks = risks.filter((r) => r.model_id === params.modelId);
    }

    const totalRisks = risks.length;

    // Count by level
    const criticalRisks = risks.filter(
      (r) => r.risk_level === ModelRiskLevel.CRITICAL,
    ).length;
    const highRisks = risks.filter(
      (r) => r.risk_level === ModelRiskLevel.HIGH,
    ).length;
    const mediumRisks = risks.filter(
      (r) => r.risk_level === ModelRiskLevel.MEDIUM,
    ).length;
    const lowRisks = risks.filter(
      (r) => r.risk_level === ModelRiskLevel.LOW,
    ).length;

    // Count by status
    const openRisks = risks.filter(
      (r) => r.status === ModelRiskStatus.OPEN,
    ).length;
    const inProgressRisks = risks.filter(
      (r) => r.status === ModelRiskStatus.IN_PROGRESS,
    ).length;
    const resolvedRisks = risks.filter(
      (r) => r.status === ModelRiskStatus.RESOLVED,
    ).length;
    const acceptedRisks = risks.filter(
      (r) => r.status === ModelRiskStatus.ACCEPTED,
    ).length;

    // Top categories
    const categoryMap = new Map<string, number>();
    risks.forEach((risk) => {
      if (risk.risk_category) {
        categoryMap.set(
          risk.risk_category,
          (categoryMap.get(risk.risk_category) || 0) + 1,
        );
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Risks needing attention (Critical or High, not resolved)
    const now = new Date();
    const risksNeedingAttention = risks
      .filter(
        (r) =>
          (r.risk_level === ModelRiskLevel.CRITICAL ||
            r.risk_level === ModelRiskLevel.HIGH) &&
          r.status !== ModelRiskStatus.RESOLVED,
      )
      .map((r) => {
        const targetDate = r.target_date ? new Date(r.target_date) : null;
        const daysUntilDue = targetDate
          ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          id: r.id || 0,
          risk_name: r.risk_name,
          risk_level: r.risk_level,
          status: r.status,
          owner: r.owner,
          target_date: r.target_date,
          daysUntilDue,
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .slice(0, 5);

    // Owner workload
    const ownerWorkloadMap = new Map<string, { total: number; open: number }>();
    risks.forEach((risk) => {
      if (risk.owner) {
        const existing = ownerWorkloadMap.get(risk.owner) || { total: 0, open: 0 };
        existing.total++;
        if (risk.status === ModelRiskStatus.OPEN || risk.status === ModelRiskStatus.IN_PROGRESS) {
          existing.open++;
        }
        ownerWorkloadMap.set(risk.owner, existing);
      }
    });

    const ownerWorkload = Array.from(ownerWorkloadMap.entries())
      .map(([owner, data]) => ({
        owner,
        totalRisks: data.total,
        openRisks: data.open,
      }))
      .sort((a, b) => b.openRisks - a.openRisks)
      .slice(0, 5);

    // Resolution progress
    const resolutionProgress = {
      resolved: resolvedRisks + acceptedRisks,
      total: totalRisks,
      percentage:
        totalRisks > 0
          ? Math.round(((resolvedRisks + acceptedRisks) / totalRisks) * 100)
          : 0,
    };

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      openRisks,
      inProgressRisks,
      resolvedRisks,
      acceptedRisks,
      topCategories,
      risksNeedingAttention,
      ownerWorkload,
      resolutionProgress,
    };
  } catch (error) {
    logger.error("Error getting model risk executive summary:", error);
    throw new Error(
      `Failed to get model risk executive summary: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// --- Write Tools (Human Confirmation Flow) ---

import { z } from "zod";
import { createWriteToolFn } from "../confirmation/createWriteTool";
import {
  createNewModelRiskQuery,
  updateModelRiskByIdQuery,
  deleteModelRiskByIdQuery,
} from "../../utils/modelRisk.utils";

// Mirrors the Postgres enums (enum_model_risks_*) and the TS enums
// (ModelRiskCategory / ModelRiskLevel / ModelRiskStatus). Strict so the
// LLM gets a clear error when it hallucinates a value the DB would reject
// later anyway.
const ModelRiskCategorySchema = z.enum([
  "Performance",
  "Bias & Fairness",
  "Security",
  "Data Quality",
  "Compliance",
]);
const ModelRiskLevelSchema = z.enum(["Low", "Medium", "High", "Critical"]);
const ModelRiskStatusSchema = z.enum([
  "Open",
  "In Progress",
  "Resolved",
  "Accepted",
]);
const isoDateString = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "must be a valid ISO date string (e.g. 2026-04-15)",
  });

const AgentCreateModelRiskSchema = z
  .object({
    model_id: z.number().int().positive().optional(),
    risk_name: z.string().min(3).max(255),
    description: z.string().max(2048).optional(),
    risk_category: ModelRiskCategorySchema.optional(),
    risk_level: ModelRiskLevelSchema.optional(),
    status: ModelRiskStatusSchema.optional(),
    owner: z.number().int().positive().optional(),
    target_date: isoDateString.optional(),
    mitigation_plan: z.string().max(2048).optional(),
    impact: z.string().max(2048).optional(),
    likelihood: z.string().max(255).optional(),
  })
  .strict();

const AgentUpdateModelRiskSchema = z
  .object({
    model_risk_id: z.number().int().positive(),
    risk_name: z.string().min(3).max(255).optional(),
    description: z.string().max(2048).optional(),
    risk_category: ModelRiskCategorySchema.optional(),
    risk_level: ModelRiskLevelSchema.optional(),
    status: ModelRiskStatusSchema.optional(),
    owner: z.number().int().positive().nullable().optional(),
    target_date: isoDateString.optional(),
    mitigation_plan: z.string().max(2048).optional(),
    impact: z.string().max(2048).optional(),
    likelihood: z.string().max(255).optional(),
  })
  .strict();

function throwOnValidationFailure(
  toolName: string,
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): void {
  const errorList = issues
    .map((i) => {
      const pathStr = i.path
        .filter((p): p is string | number => typeof p !== "symbol")
        .join(".");
      return `- ${pathStr || "(root)"}: ${i.message}`;
    })
    .join("\n");
  throw new Error(
    `${toolName} validation failed. You MUST tell the user verbatim that the following fields had invalid values and ask them for corrected values for each one before retrying. DO NOT call this tool again until every error below is addressed:\n${errorList}`,
  );
}

const agentCreateModelRisk = createWriteToolFn({
  toolName: "agent_create_model_risk",
  warningLevel: "warning",
  descriptionFn: (params) =>
    params.model_id !== undefined
      ? `Create model risk "${params.risk_name}" for model #${params.model_id}`
      : `Create unattached model risk "${params.risk_name}"`,
  executeFn: async (params, organizationId) => {
    // The approval gateway re-injects `_userId` (and may inject
    // `_organizationId`) before calling the executor — see
    // `approvalGateway.ts:226,366`. Strip those internal fields before
    // running strict Zod validation, otherwise `.strict()` rejects them
    // as unknown keys.
    const { _userId: _u, _organizationId: _o, ...userParams } =
      params as Record<string, unknown>;
    void _u;
    void _o;
    const parsed = AgentCreateModelRiskSchema.safeParse(userParams);
    if (!parsed.success) {
      throwOnValidationFailure("agent_create_model_risk", parsed.error.issues);
    }
    const data = parsed.data!;

    // Defense-in-depth: if model_id is provided, verify the model exists
    // and belongs to this org. Catches cases where the LLM passed the id
    // of a row that's still pending approval (no row inserted yet) or a
    // bogus id from another org. The system prompt enforces parent-first
    // ordering; this is the belt to that suspenders.
    if (data.model_id !== undefined) {
      const [modelRows] = (await sequelize.query(
        `SELECT id FROM model_inventories
           WHERE id = :model_id AND organization_id = :organization_id`,
        {
          replacements: { model_id: data.model_id, organization_id: organizationId },
        },
      )) as [Array<{ id: number }>, unknown];
      if (!modelRows || modelRows.length === 0) {
        throw new Error(
          `agent_create_model_risk cannot link to model #${data.model_id}: that model does not exist (yet) in this organization. If you just filed an approval to create it, the model row is not inserted until the approval is granted. Tell the user the model must be approved first, then call this tool again with the resolved model_id (look it up via fetch_model_inventories after approval).`,
        );
      }
    }

    const result = await createNewModelRiskQuery(
      {
        model_id: data.model_id,
        risk_name: data.risk_name,
        description: data.description || "",
        risk_category: data.risk_category as any,
        risk_level: data.risk_level as any,
        status: (data.status as any) || "Open",
        // owner is INTEGER FK to users.id — pass null when omitted, not "".
        owner: (data.owner ?? null) as any,
        target_date: data.target_date || new Date().toISOString(),
        mitigation_plan: data.mitigation_plan || "",
        impact: data.impact || "",
        likelihood: data.likelihood || "",
      },
      organizationId,
    );
    return result;
  },
});

const agentUpdateModelRisk = createWriteToolFn({
  toolName: "agent_update_model_risk",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Update model risk #${params.model_risk_id}${params.risk_name ? ` ("${params.risk_name}")` : ""}`,
  executeFn: async (params, organizationId) => {
    const { _userId: _u, _organizationId: _o, ...userParams } =
      params as Record<string, unknown>;
    void _u;
    void _o;
    const parsed = AgentUpdateModelRiskSchema.safeParse(userParams);
    if (!parsed.success) {
      throwOnValidationFailure("agent_update_model_risk", parsed.error.issues);
    }
    const data = parsed.data!;
    const id = data.model_risk_id;
    const updateData: Record<string, unknown> = {};

    const updatableFields = [
      "risk_name",
      "description",
      "risk_category",
      "risk_level",
      "status",
      "owner",
      "target_date",
      "mitigation_plan",
      "impact",
      "likelihood",
    ];

    for (const field of updatableFields) {
      if ((data as any)[field] !== undefined) {
        updateData[field] = (data as any)[field];
      }
    }

    const result = await updateModelRiskByIdQuery(
      id,
      updateData as any,
      organizationId,
    );
    if (!result) {
      throw new Error(
        `Model risk #${id} not found or does not belong to this organization`,
      );
    }
    return result;
  },
});

const agentChangeModelRiskStatus = createWriteToolFn({
  toolName: "agent_change_model_risk_status",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Change status of model risk #${params.model_risk_id} to "${params.status}"`,
  executeFn: async (params, organizationId) => {
    const id = params.model_risk_id as number;
    const status = params.status as string;

    const result = await updateModelRiskByIdQuery(
      id,
      { status } as any,
      organizationId,
    );
    if (!result) {
      throw new Error(
        `Model risk #${id} not found or does not belong to this organization`,
      );
    }
    return result;
  },
});

const agentDeleteModelRisk = createWriteToolFn({
  toolName: "agent_delete_model_risk",
  warningLevel: "danger",
  descriptionFn: (params) =>
    `Delete model risk #${params.model_risk_id}`,
  executeFn: async (params, organizationId) => {
    const id = params.model_risk_id as number;
    const deleted = await deleteModelRiskByIdQuery(id, organizationId);
    if (!deleted) {
      throw new Error(
        `Model risk #${id} not found or already deleted`,
      );
    }
    return { success: true, deleted_id: id };
  },
});

// --- Cross-entity additions ---

import { sequelize } from "../../database/db";

const agentRestoreModelRisk = createWriteToolFn({
  toolName: "agent_restore_model_risk",
  warningLevel: "warning",
  descriptionFn: (params) => `Restore soft-deleted model risk #${params.model_risk_id}`,
  executeFn: async (params, organizationId) => {
    const id = params.model_risk_id as number;
    const [rows, rowCount] = (await sequelize.query(
      `UPDATE model_risks
         SET is_deleted = false, deleted_at = NULL, updated_at = NOW()
       WHERE id = :id
         AND organization_id = :organization_id
         AND is_deleted = true
       RETURNING id`,
      {
        replacements: { id, organization_id: organizationId },
      },
    )) as [Array<{ id: number }>, number];
    const affected = rowCount || (Array.isArray(rows) ? rows.length : 0);
    if (!affected) {
      throw new Error(
        `Model risk #${id} not found, not deleted, or does not belong to this organization`,
      );
    }
    return { id, restored: true, message: "Model risk restored successfully" };
  },
});

const agentAttachModelRiskToModel = createWriteToolFn({
  toolName: "agent_attach_model_risk_to_model",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Attach model risk #${params.model_risk_id} to model #${params.model_id}`,
  executeFn: async (params, organizationId) => {
    const id = params.model_risk_id as number;
    const modelId = params.model_id as number;

    const [modelRows] = (await sequelize.query(
      `SELECT id FROM model_inventories WHERE id = :model_id AND organization_id = :organization_id`,
      { replacements: { model_id: modelId, organization_id: organizationId } },
    )) as [Array<{ id: number }>, unknown];
    if (!modelRows || modelRows.length === 0) {
      throw new Error(
        `Model #${modelId} not found or does not belong to this organization`,
      );
    }

    const result = await updateModelRiskByIdQuery(
      id,
      { model_id: modelId } as any,
      organizationId,
    );
    if (!result) {
      throw new Error(
        `Model risk #${id} not found or does not belong to this organization`,
      );
    }
    return {
      id,
      model_id: modelId,
      message: "Model risk attached to model successfully",
    };
  },
});

const agentDetachModelRiskFromModel = createWriteToolFn({
  toolName: "agent_detach_model_risk_from_model",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Detach model risk #${params.model_risk_id} from its model (set model_id = NULL)`,
  executeFn: async (params, organizationId) => {
    const id = params.model_risk_id as number;
    const result = await updateModelRiskByIdQuery(
      id,
      { model_id: null } as any,
      organizationId,
    );
    if (!result) {
      throw new Error(
        `Model risk #${id} not found or does not belong to this organization`,
      );
    }
    return {
      id,
      message: "Model risk detached from model (model_id set to NULL)",
    };
  },
});

const listUnattachedModelRisks = async (
  params: {
    risk_level?: "Low" | "Medium" | "High" | "Critical";
    status?: "Open" | "In Progress" | "Resolved" | "Accepted";
    limit?: number;
  },
  organizationId: number,
): Promise<Partial<ModelRiskModel>[]> => {
  try {
    let risks = await getAllModelRisksQuery(organizationId, "active");
    risks = risks.filter((r) => r.model_id === null || r.model_id === undefined);

    if (params.risk_level) {
      risks = risks.filter((r) => r.risk_level === params.risk_level);
    }
    if (params.status) {
      risks = risks.filter((r) => r.status === params.status);
    }
    if (params.limit && params.limit > 0) {
      risks = risks.slice(0, params.limit);
    }

    return risks.map((r) => ({
      id: r.id,
      risk_name: r.risk_name,
      risk_category: r.risk_category,
      risk_level: r.risk_level,
      status: r.status,
      owner: r.owner,
      target_date: r.target_date,
      model_id: r.model_id,
      created_at: r.created_at,
    }));
  } catch (error) {
    logger.error("Error listing unattached model risks:", error);
    throw new Error(
      `Failed to list unattached model risks: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

const availableModelRiskTools: any = {
  fetch_model_risks: fetchModelRisks,
  get_model_risk_analytics: getModelRiskAnalytics,
  get_model_risk_executive_summary: getModelRiskExecutiveSummary,
  agent_create_model_risk: agentCreateModelRisk,
  agent_update_model_risk: agentUpdateModelRisk,
  agent_change_model_risk_status: agentChangeModelRiskStatus,
  agent_delete_model_risk: agentDeleteModelRisk,
  agent_restore_model_risk: agentRestoreModelRisk,
  agent_attach_model_risk_to_model: agentAttachModelRiskToModel,
  agent_detach_model_risk_from_model: agentDetachModelRiskFromModel,
  list_unattached_model_risks: listUnattachedModelRisks,
};

export { availableModelRiskTools };
