/**
 * File-time handler for `agent_delete_task`.
 */

import { sequelize } from "../../../database/db";
import logger from "../../../utils/logger/fileLogger";
import { createApprovalRequestQuery } from "../../../utils/approvalRequest.utils";
import { getWorkflowStepsQuery } from "../../../utils/approvalWorkflow.utils";
import { getTaskByIdQuery } from "../../../utils/task.utils";
import {
  ApprovalRequestStatus,
  EntityType,
} from "../../../domain.layer/enums/approval-workflow.enum";
import type { AiActionFileResult } from "../types";
import { ensureAiActionWorkflow } from "../workflow";
import { AgentDeleteTaskSchema } from "./schema";
import { renderDeleteTaskDetailedPreview } from "./preview";

export const DELETE_TASK_TOOL_NAME = "agent_delete_task";

export async function fileDeleteTask(
  params: Record<string, unknown>,
  organizationId: number,
  userId?: number,
): Promise<AiActionFileResult> {
  if (!userId) {
    return {
      status: "error",
      message: "Cannot propose AI write action: no authenticated user context.",
    };
  }

  const parsed = AgentDeleteTaskSchema.safeParse(params);
  if (!parsed.success) {
    return {
      status: "validation_failed",
      errors: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
      message: "The proposed task deletion failed validation.",
    };
  }

  const currentTask = await getTaskByIdQuery(
    parsed.data.task_id,
    { userId, role: "Admin" },
    organizationId,
  );

  if (!currentTask) {
    return {
      status: "error",
      message: `Task #${parsed.data.task_id} not found (or already deleted). Call fetch_tasks to find the right task.`,
    };
  }

  const transaction = await sequelize.transaction();
  try {
    const workflow = await ensureAiActionWorkflow(organizationId, userId, transaction);
    const workflowSteps = await getWorkflowStepsQuery(workflow.id!, organizationId, transaction);

    if (!workflowSteps || workflowSteps.length === 0) {
      throw new Error("AI Action workflow has no steps");
    }

    const preview = renderDeleteTaskDetailedPreview(parsed.data, {
      title: currentTask.title,
      status: currentTask.status,
      priority: currentTask.priority,
    });

    const approvalRequest = await createApprovalRequestQuery(
      {
        request_name: `AI: delete task "${currentTask.title ?? `#${parsed.data.task_id}`}"`,
        workflow_id: workflow.id!,
        entity_type: EntityType.AI_ACTION,
        entity_data: {
          tool_name: DELETE_TASK_TOOL_NAME,
          input_params: parsed.data,
          preview,
          requested_via: "ai_advisor",
        },
        status: ApprovalRequestStatus.PENDING,
        requested_by: userId,
      },
      workflowSteps,
      organizationId,
      transaction,
    );

    await transaction.commit();

    return {
      status: "pending_approval",
      approvalRequestId: approvalRequest.id!,
      preview,
      message: `Created approval request #${approvalRequest.id}. Tell the user to open Pending Approvals to approve or reject "${preview}".`,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(`[${DELETE_TASK_TOOL_NAME}] failed to file approval request`, error);
    return {
      status: "error",
      message: `Failed to file approval request: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}
