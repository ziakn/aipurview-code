import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  getConfirmation,
  resolveConfirmation,
  listPendingConfirmations,
} from "../advisor/confirmation/confirmationStore";
import { writeToolExecutors } from "../advisor/confirmation/createWriteTool";
import { trackAIContent } from "../middleware/aiContentTracker.middleware";

const fileName = "aiConfirmation.ctrl.ts";

/**
 * POST /api/ai-confirmation/approve/:id
 * Approve a pending write operation and execute it.
 */
export async function approveConfirmation(req: Request, res: Response) {
  const functionName = "approveConfirmation";
  const id = req.params.id as string;
  const organizationId = req.organizationId!;
  const userId = Number(req.userId);

  try {
    const pending = await getConfirmation(organizationId, id);
    if (!pending) {
      return res
        .status(404)
        .json(STATUS_CODE[404]("Confirmation not found or expired"));
    }
    if (pending.status !== "pending") {
      return res
        .status(400)
        .json(STATUS_CODE[400](`Confirmation already ${pending.status}`));
    }

    // Look up the executor for this tool
    const executor = writeToolExecutors.get(pending.toolName);
    if (!executor) {
      // Auto-reject: no executor means the tool can never succeed
      await resolveConfirmation(
        organizationId, id, "rejected", userId, undefined,
        `No executor registered for tool: ${pending.toolName}`
      );
      logStructured("error", `no executor for tool: ${pending.toolName}`, functionName, fileName);
      return res
        .status(500)
        .json(STATUS_CODE[500](`No executor registered for tool: ${pending.toolName}`));
    }

    // Execute the actual write operation
    let result: unknown;
    try {
      result = await executor(pending.params, organizationId);
    } catch (execError) {
      const errorMsg =
        execError instanceof Error ? execError.message : "Unknown error";
      // Mark as rejected — the execution failed, the write did not happen
      await resolveConfirmation(organizationId, id, "rejected", userId, undefined, errorMsg);
      logStructured("error", `write execution failed: ${errorMsg}`, functionName, fileName);
      return res.status(500).json(STATUS_CODE[500](errorMsg));
    }

    // Mark as approved with result
    await resolveConfirmation(organizationId, id, "approved", userId, result);

    // Track as AI-generated content (fire-and-forget)
    trackAIContent(
      organizationId,
      "confirmation",
      parseInt(id, 10) || 0,
      {
        badgeType: "generated",
        modelUsed: "ai-advisor",
        modelProvider: "verifywise",
        toolName: pending.toolName,
        confidenceScore: 100,
        promptSummary: `Approved: ${pending.description}`,
      },
      userId
    ).catch(() => {});

    logStructured("successful", `confirmation ${id} approved`, functionName, fileName);
    return res.status(200).json(
      STATUS_CODE[200]({
        confirmation_id: id,
        status: "approved",
        result,
      })
    );
  } catch (error) {
    logStructured("error", "failed to approve confirmation", functionName, fileName);
    logger.error("Error in approveConfirmation:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * POST /api/ai-confirmation/reject/:id
 * Reject a pending write operation.
 */
export async function rejectConfirmation(req: Request, res: Response) {
  const functionName = "rejectConfirmation";
  const id = req.params.id as string;
  const organizationId = req.organizationId!;
  const userId = Number(req.userId);

  try {
    const pending = await getConfirmation(organizationId, id);
    if (!pending) {
      return res
        .status(404)
        .json(STATUS_CODE[404]("Confirmation not found or expired"));
    }
    if (pending.status !== "pending") {
      return res
        .status(400)
        .json(STATUS_CODE[400](`Confirmation already ${pending.status}`));
    }

    await resolveConfirmation(organizationId, id, "rejected", userId);

    logStructured("successful", `confirmation ${id} rejected`, functionName, fileName);
    return res.status(200).json(
      STATUS_CODE[200]({
        confirmation_id: id,
        status: "rejected",
      })
    );
  } catch (error) {
    logStructured("error", "failed to reject confirmation", functionName, fileName);
    logger.error("Error in rejectConfirmation:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * GET /api/ai-confirmation/pending
 * List all pending confirmations for the organization.
 */
export async function getPendingConfirmations(req: Request, res: Response) {
  const functionName = "getPendingConfirmations";
  const organizationId = req.organizationId!;

  try {
    const pending = await listPendingConfirmations(organizationId);

    logStructured("successful", `fetched ${pending.length} pending confirmations`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](pending));
  } catch (error) {
    logStructured("error", "failed to list pending confirmations", functionName, fileName);
    logger.error("Error in getPendingConfirmations:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
