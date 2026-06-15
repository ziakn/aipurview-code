import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { logFailure, logProcessing, logSuccess } from "../utils/logger/logHelper";
import { translateError } from "../utils/i18n.utils";

export async function getAllAiApps(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllAiApps",
    functionName: "getAllAiApps",
    fileName: "aiApp.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });

  try {
    await logSuccess({
      eventType: "Read",
      description: "Retrieved AI Apps placeholder",
      functionName: "getAllAiApps",
      fileName: "aiApp.ctrl.ts",
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(200).json(STATUS_CODE[200]([]));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve AI Apps",
      functionName: "getAllAiApps",
      fileName: "aiApp.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json(STATUS_CODE[500](translateError(req, error)));
  }
}

export async function getAiAppById(req: Request, res: Response): Promise<any> {
  const aiAppId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({
    description: `starting getAiAppById for ID ${aiAppId}`,
    functionName: "getAiAppById",
    fileName: "aiApp.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });

  try {
    return res.status(200).json(STATUS_CODE[200]({ id: aiAppId }));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve AI App by ID",
      functionName: "getAiAppById",
      fileName: "aiApp.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json(STATUS_CODE[500](translateError(req, error)));
  }
}

export async function createAiApp(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting createAiApp",
    functionName: "createAiApp",
    fileName: "aiApp.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });

  try {
    return res.status(201).json(STATUS_CODE[201]({ id: 1 }));
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: "Failed to create AI App",
      functionName: "createAiApp",
      fileName: "aiApp.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json(STATUS_CODE[500](translateError(req, error)));
  }
}

export async function updateAiAppById(req: Request, res: Response): Promise<any> {
  const aiAppId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({
    description: `starting updateAiAppById for ID ${aiAppId}`,
    functionName: "updateAiAppById",
    fileName: "aiApp.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });

  try {
    return res.status(200).json(STATUS_CODE[200]({ id: aiAppId }));
  } catch (error) {
    await logFailure({
      eventType: "Update",
      description: "Failed to update AI App",
      functionName: "updateAiAppById",
      fileName: "aiApp.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json(STATUS_CODE[500](translateError(req, error)));
  }
}

export async function deleteAiAppById(req: Request, res: Response): Promise<any> {
  const aiAppId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

  logProcessing({
    description: `starting deleteAiAppById for ID ${aiAppId}`,
    functionName: "deleteAiAppById",
    fileName: "aiApp.ctrl.ts",
    userId: req.userId!,
    tenantId: req.organizationId!,
  });

  try {
    return res.status(200).json(STATUS_CODE[200]({ id: aiAppId }));
  } catch (error) {
    await logFailure({
      eventType: "Delete",
      description: "Failed to delete AI App",
      functionName: "deleteAiAppById",
      fileName: "aiApp.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.organizationId!,
    });
    return res.status(500).json(STATUS_CODE[500](translateError(req, error)));
  }
}
