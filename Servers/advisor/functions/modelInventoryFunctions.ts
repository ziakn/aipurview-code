import { IModelInventory } from "../../domain.layer/interfaces/i.modelInventory";
import { ModelInventoryStatus } from "../../domain.layer/enums/model-inventory-status.enum";
import {
  getAllModelInventoriesQuery,
  getModelByProjectIdQuery,
  getModelByFrameworkIdQuery,
  deleteModelInventoryByIdQuery,
} from "../../utils/modelInventory.utils";
import { createWriteToolFn } from "../confirmation/createWriteTool";
import { sequelize } from "../../database/db";
import logger from "../../utils/logger/fileLogger";

export interface FetchModelInventoriesParams {
  projectId?: number;
  frameworkId?: number;
  status?: "Approved" | "Restricted" | "Pending" | "Blocked";
  security_assessment?: boolean;
  provider?: string;
  hosting_provider?: string;
  model?: string;
  limit?: number;
}

const fetchModelInventories = async (
  params: FetchModelInventoriesParams,
  organizationId: number,
): Promise<Partial<IModelInventory>[]> => {
  let models: IModelInventory[] = [];

  try {
    // Fetch based on scope
    if (params.projectId) {
      const result = await getModelByProjectIdQuery(params.projectId, organizationId);
      models = result || [];
    } else if (params.frameworkId) {
      const result = await getModelByFrameworkIdQuery(params.frameworkId, organizationId);
      models = result || [];
    } else {
      models = await getAllModelInventoriesQuery(organizationId);
    }

    // Apply filters
    if (params.status) {
      models = models.filter((m) => m.status === params.status);
    }
    if (params.security_assessment !== undefined) {
      models = models.filter((m) => m.security_assessment === params.security_assessment);
    }
    if (params.provider) {
      models = models.filter(
        (m) => m.provider && m.provider.toLowerCase().includes(params.provider!.toLowerCase()),
      );
    }
    if (params.hosting_provider) {
      models = models.filter(
        (m) =>
          m.hosting_provider &&
          m.hosting_provider.toLowerCase().includes(params.hosting_provider!.toLowerCase()),
      );
    }
    if (params.model) {
      models = models.filter(
        (m) => m.model && m.model.toLowerCase().includes(params.model!.toLowerCase()),
      );
    }

    // Limit results
    if (params.limit && params.limit > 0) {
      models = models.slice(0, params.limit);
    }

    // Return lightweight projections — exclude verbose text fields and file data
    return models.map((m) => ({
      id: m.id,
      provider_model: m.provider_model,
      provider: m.provider,
      model: m.model,
      version: m.version,
      capabilities: m.capabilities,
      security_assessment: m.security_assessment,
      status: m.status,
      status_date: m.status_date,
      hosting_provider: m.hosting_provider,
      created_at: m.created_at,
    }));
  } catch (error) {
    logger.error("Error fetching model inventories:", error);
    throw new Error(
      `Failed to fetch model inventories: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export interface ModelInventoryAnalytics {
  statusDistribution: {
    [status: string]: number;
  };
  providerDistribution: Array<{
    provider: string;
    count: number;
    percentage: number;
  }>;
  securityAssessmentBreakdown: {
    assessed: number;
    notAssessed: number;
  };
  hostingProviderDistribution: Array<{
    hostingProvider: string;
    count: number;
    percentage: number;
  }>;
  capabilitiesDistribution: Array<{
    capability: string;
    count: number;
    percentage: number;
  }>;
  totalModels: number;
}

const getModelInventoryAnalytics = async (
  params: { projectId?: number },
  organizationId: number,
): Promise<ModelInventoryAnalytics> => {
  try {
    // Fetch models for analysis
    const models = params.projectId
      ? (await getModelByProjectIdQuery(params.projectId, organizationId)) || []
      : await getAllModelInventoriesQuery(organizationId);

    const totalModels = models.length;

    // 1. Status Distribution
    const statusDistribution: { [status: string]: number } = {};
    Object.values(ModelInventoryStatus).forEach((status) => {
      statusDistribution[status] = 0;
    });

    models.forEach((model) => {
      if (model.status) {
        statusDistribution[model.status] = (statusDistribution[model.status] || 0) + 1;
      }
    });

    // 2. Provider Distribution
    const providerMap = new Map<string, number>();
    models.forEach((model) => {
      if (model.provider) {
        providerMap.set(model.provider, (providerMap.get(model.provider) || 0) + 1);
      }
    });

    const providerDistribution = Array.from(providerMap.entries())
      .map(([provider, count]) => ({
        provider,
        count,
        percentage: totalModels > 0 ? Math.round((count / totalModels) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 3. Security Assessment Breakdown
    const securityAssessmentBreakdown = {
      assessed: models.filter((m) => m.security_assessment === true).length,
      notAssessed: models.filter((m) => m.security_assessment === false).length,
    };

    // 4. Hosting Provider Distribution
    const hostingProviderMap = new Map<string, number>();
    models.forEach((model) => {
      if (model.hosting_provider) {
        hostingProviderMap.set(
          model.hosting_provider,
          (hostingProviderMap.get(model.hosting_provider) || 0) + 1,
        );
      }
    });

    const hostingProviderDistribution = Array.from(hostingProviderMap.entries())
      .map(([hostingProvider, count]) => ({
        hostingProvider,
        count,
        percentage: totalModels > 0 ? Math.round((count / totalModels) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Capabilities Distribution
    const capabilitiesMap = new Map<string, number>();
    models.forEach((model) => {
      if (model.capabilities) {
        const caps = model.capabilities.split(", ").filter((cap) => cap.trim());
        caps.forEach((cap) => {
          const normalizedCap = cap.trim();
          capabilitiesMap.set(normalizedCap, (capabilitiesMap.get(normalizedCap) || 0) + 1);
        });
      }
    });

    const capabilitiesDistribution = Array.from(capabilitiesMap.entries())
      .map(([capability, count]) => ({
        capability,
        count,
        percentage: totalModels > 0 ? Math.round((count / totalModels) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      statusDistribution,
      providerDistribution,
      securityAssessmentBreakdown,
      hostingProviderDistribution,
      capabilitiesDistribution,
      totalModels,
    };
  } catch (error) {
    logger.error("Error getting model inventory analytics:", error);
    throw new Error(
      `Failed to get model inventory analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export interface ModelInventoryExecutiveSummary {
  totalActiveModels: number;
  approvedModels: number;
  restrictedModels: number;
  blockedModels: number;
  pendingModels: number;
  topProviders: string[];
  securityAssessmentProgress: {
    assessed: number;
    notAssessed: number;
    percentage: number;
  };
  recentModels: Array<{
    id: number;
    provider: string;
    model: string;
    version: string;
    status: string;
    daysOld: number;
  }>;
  modelsByHostingProvider: Array<{
    hostingProvider: string;
    count: number;
  }>;
}

const getModelInventoryExecutiveSummary = async (
  params: { projectId?: number },
  organizationId: number,
): Promise<ModelInventoryExecutiveSummary> => {
  try {
    // Fetch models
    const models = params.projectId
      ? (await getModelByProjectIdQuery(params.projectId, organizationId)) || []
      : await getAllModelInventoriesQuery(organizationId);

    const totalActiveModels = models.length;

    // Count models by status
    const approvedModels = models.filter((m) => m.status === ModelInventoryStatus.APPROVED).length;

    const restrictedModels = models.filter(
      (m) => m.status === ModelInventoryStatus.RESTRICTED,
    ).length;

    const blockedModels = models.filter((m) => m.status === ModelInventoryStatus.BLOCKED).length;

    const pendingModels = models.filter((m) => m.status === ModelInventoryStatus.PENDING).length;

    // Top providers (top 3)
    const providerMap = new Map<string, number>();
    models.forEach((model) => {
      if (model.provider) {
        providerMap.set(model.provider, (providerMap.get(model.provider) || 0) + 1);
      }
    });

    const topProviders = Array.from(providerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([provider]) => provider);

    // Security assessment progress
    const assessed = models.filter((m) => m.security_assessment === true).length;
    const notAssessed = models.filter((m) => m.security_assessment === false).length;
    const percentage = totalActiveModels > 0 ? Math.round((assessed / totalActiveModels) * 100) : 0;

    const securityAssessmentProgress = {
      assessed,
      notAssessed,
      percentage,
    };

    // Recent models (created within last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentModels = models
      .filter((m) => m.created_at && new Date(m.created_at) > sevenDaysAgo)
      .map((m) => {
        const createdAt = m.created_at ? new Date(m.created_at) : now;
        const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: m.id || 0,
          provider: m.provider,
          model: m.model,
          version: m.version,
          status: m.status,
          daysOld,
        };
      })
      .sort((a, b) => a.daysOld - b.daysOld)
      .slice(0, 5); // Top 5 most recent

    // Models by hosting provider
    const hostingProviderMap = new Map<string, number>();
    models.forEach((model) => {
      if (model.hosting_provider) {
        hostingProviderMap.set(
          model.hosting_provider,
          (hostingProviderMap.get(model.hosting_provider) || 0) + 1,
        );
      }
    });

    const modelsByHostingProvider = Array.from(hostingProviderMap.entries())
      .map(([hostingProvider, count]) => ({
        hostingProvider,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalActiveModels,
      approvedModels,
      restrictedModels,
      blockedModels,
      pendingModels,
      topProviders,
      securityAssessmentProgress,
      recentModels,
      modelsByHostingProvider,
    };
  } catch (error) {
    logger.error("Error getting model inventory executive summary:", error);
    throw new Error(
      `Failed to get model inventory executive summary: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

// --- Write Tools (Human Confirmation Flow) ---

const agentRegisterModel = createWriteToolFn({
  toolName: "agent_register_model",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Register model "${params.name}"${params.model_type ? ` from ${params.model_type}` : ""}${params.version ? ` (v${params.version})` : ""}`,
  executeFn: async (params, organizationId) => {
    const now = new Date();
    const result = (await sequelize.query(
      `INSERT INTO model_inventories (organization_id, provider_model, provider, model, version, capabilities, security_assessment, status, status_date, biases, limitations, hosting_provider, security_assessment_data, is_demo, created_at, updated_at)
       VALUES (:organization_id, :provider_model, :provider, :model, :version, :capabilities, false, 'Pending', :status_date, :biases, :limitations, '', '[]', false, :created_at, :updated_at) RETURNING *`,
      {
        replacements: {
          organization_id: organizationId,
          provider_model: params.model_type ? `${params.model_type} / ${params.name}` : String(params.name),
          provider: params.model_type || "",
          model: params.name,
          version: params.version || "",
          capabilities: params.description || "",
          biases: "",
          limitations: "",
          status_date: now,
          created_at: now,
          updated_at: now,
        },
      },
    )) as [any[], number];
    const created = result[0][0];

    // Link to project if provided
    if (params.project_id) {
      await sequelize.query(
        `INSERT INTO model_inventories_projects_frameworks (organization_id, model_inventory_id, project_id)
         VALUES (:organization_id, :model_inventory_id, :project_id)`,
        {
          replacements: {
            organization_id: organizationId,
            model_inventory_id: created.id,
            project_id: params.project_id,
          },
        },
      );
    }

    return { id: created.id, model: created.model, message: "Model registered successfully" };
  },
});

const agentUpdateModel = createWriteToolFn({
  toolName: "agent_update_model",
  warningLevel: "warning",
  descriptionFn: (params) => {
    const fields = Object.keys(params).filter((k) => k !== "model_id");
    return `Update model #${params.model_id} — fields: ${fields.join(", ")}`;
  },
  executeFn: async (params, organizationId) => {
    const modelId = params.model_id as number;
    const setClauses: string[] = [];
    const replacements: Record<string, unknown> = {
      organization_id: organizationId,
      model_id: modelId,
    };

    if (params.name !== undefined) {
      setClauses.push("model = :model");
      replacements.model = params.name;
    }
    if (params.model_type !== undefined) {
      setClauses.push("provider = :provider");
      replacements.provider = params.model_type;
    }
    if (params.version !== undefined) {
      setClauses.push("version = :version");
      replacements.version = params.version;
    }
    if (params.description !== undefined) {
      setClauses.push("capabilities = :capabilities");
      replacements.capabilities = params.description;
    }
    if (params.status !== undefined) {
      setClauses.push("status = :status, status_date = NOW()");
      replacements.status = params.status;
    }
    if (params.hosting_provider !== undefined) {
      setClauses.push("hosting_provider = :hosting_provider");
      replacements.hosting_provider = params.hosting_provider;
    }
    if (params.capabilities !== undefined) {
      setClauses.push("capabilities = :capabilities");
      replacements.capabilities = params.capabilities;
    }

    if (setClauses.length === 0) {
      return { id: modelId, message: "No fields to update" };
    }

    setClauses.push("updated_at = NOW()");
    // Update provider_model if provider or model changed
    if (params.name !== undefined || params.model_type !== undefined) {
      setClauses.push("provider_model = COALESCE(:pm_provider, provider) || ' / ' || COALESCE(:pm_model, model)");
      replacements.pm_provider = params.model_type !== undefined ? params.model_type : null;
      replacements.pm_model = params.name !== undefined ? params.name : null;
    }

    await sequelize.query(
      `UPDATE model_inventories SET ${setClauses.join(", ")} WHERE id = :model_id AND organization_id = :organization_id`,
      { replacements },
    );
    return { id: modelId, updated: true, message: "Model updated successfully" };
  },
});

const agentUpdateModelLifecyclePhase = createWriteToolFn({
  toolName: "agent_update_model_lifecycle_phase",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Update model #${params.model_id} lifecycle phase to "${params.lifecycle_phase}"`,
  executeFn: async (params, organizationId) => {
    const modelId = params.model_id as number;
    const phase = params.lifecycle_phase as string;
    await sequelize.query(
      `UPDATE model_inventories SET status = :status, status_date = NOW(), updated_at = NOW() WHERE id = :model_id AND organization_id = :organization_id`,
      {
        replacements: { status: phase, model_id: modelId, organization_id: organizationId },
      },
    );
    return { id: modelId, status: phase, message: "Model lifecycle phase updated successfully" };
  },
});

const agentRetireModel = createWriteToolFn({
  toolName: "agent_retire_model",
  warningLevel: "warning",
  descriptionFn: (params) => `Retire model #${params.model_id} (set status to Blocked)`,
  executeFn: async (params, organizationId) => {
    const modelId = params.model_id as number;
    await sequelize.query(
      `UPDATE model_inventories SET status = 'Blocked', status_date = NOW(), updated_at = NOW() WHERE id = :model_id AND organization_id = :organization_id`,
      {
        replacements: { model_id: modelId, organization_id: organizationId },
      },
    );
    return { id: modelId, status: "Blocked", message: "Model retired successfully" };
  },
});

const agentDeleteModel = createWriteToolFn({
  toolName: "agent_delete_model",
  warningLevel: "danger",
  descriptionFn: (params) => `Permanently delete model #${params.model_id}`,
  executeFn: async (params, organizationId) => {
    const modelId = params.model_id as number;
    const transaction = await sequelize.transaction();
    try {
      await deleteModelInventoryByIdQuery(modelId, true, organizationId, transaction);
      await transaction.commit();
      return { id: modelId, deleted: true, message: "Model deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
});

const agentLinkModelToProject = createWriteToolFn({
  toolName: "agent_link_model_to_project",
  warningLevel: "warning",
  descriptionFn: (params) =>
    `Link model #${params.model_id} to project #${params.project_id}`,
  executeFn: async (params, organizationId) => {
    const modelId = params.model_id as number;
    const projectId = params.project_id as number;
    await sequelize.query(
      `INSERT INTO model_inventories_projects_frameworks (organization_id, model_inventory_id, project_id)
       VALUES (:organization_id, :model_inventory_id, :project_id)
       ON CONFLICT DO NOTHING`,
      {
        replacements: {
          organization_id: organizationId,
          model_inventory_id: modelId,
          project_id: projectId,
        },
      },
    );
    return { model_id: modelId, project_id: projectId, message: "Model linked to project successfully" };
  },
});

const availableModelInventoryTools: any = {
  fetch_model_inventories: fetchModelInventories,
  get_model_inventory_analytics: getModelInventoryAnalytics,
  get_model_inventory_executive_summary: getModelInventoryExecutiveSummary,
  agent_register_model: agentRegisterModel,
  agent_update_model: agentUpdateModel,
  agent_update_model_lifecycle_phase: agentUpdateModelLifecyclePhase,
  agent_retire_model: agentRetireModel,
  agent_delete_model: agentDeleteModel,
  agent_link_model_to_project: agentLinkModelToProject,
};

export { availableModelInventoryTools };
