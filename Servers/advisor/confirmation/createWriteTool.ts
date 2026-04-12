/**
 * Human Confirmation Flow — Write Tool Wrapper
 *
 * Wraps any write function so it creates a pending confirmation instead
 * of executing the write directly. The actual execution happens only
 * when the user approves via the confirmation endpoint.
 */

import {
  generateConfirmationId,
  storeConfirmation,
} from "./confirmationStore";
import type {
  WarningLevel,
  ConfirmationRequest,
  ConfirmationToolResult,
} from "./types";

export type WriteExecuteFn = (
  params: Record<string, unknown>,
  organizationId: number
) => Promise<unknown>;

interface WriteToolConfig {
  toolName: string;
  warningLevel: WarningLevel;
  descriptionFn: (params: Record<string, unknown>) => string;
  executeFn: WriteExecuteFn;
}

/**
 * Registry of write tool executors.
 * The approval endpoint uses this to look up and execute the actual function.
 */
export const writeToolExecutors = new Map<string, WriteExecuteFn>();

/**
 * Creates a tool function that, instead of executing a write operation,
 * stores a pending confirmation in Redis and returns a confirmation payload.
 *
 * The LLM sees the confirmation_required result and tells the user to approve.
 * The frontend renders approve/reject buttons via ConfirmationToolUI.
 */
export function createWriteToolFn(
  config: WriteToolConfig
): (params: Record<string, unknown>, organizationId: number) => Promise<ConfirmationToolResult> {
  // Register the executor so the approval endpoint can find it
  writeToolExecutors.set(config.toolName, config.executeFn);

  return async (
    params: Record<string, unknown>,
    organizationId: number
  ): Promise<ConfirmationToolResult> => {
    const id = generateConfirmationId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min

    const description = config.descriptionFn(params);

    const request: ConfirmationRequest = {
      id,
      organizationId,
      userId: (params._userId as number) || 0,
      toolName: config.toolName,
      warningLevel: config.warningLevel,
      description,
      params: { ...params },
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Remove internal params before storing
    delete request.params._userId;

    try {
      await storeConfirmation(request);
    } catch (storeError) {
      throw new Error(
        `Failed to store confirmation for ${config.toolName}: ${storeError instanceof Error ? storeError.message : "Redis unavailable"}`
      );
    }

    return {
      confirmation_required: true,
      confirmation_id: id,
      warning_level: config.warningLevel,
      description,
      tool_name: config.toolName,
      params_summary: sanitizeParams(params),
    };
  };
}

/**
 * Remove internal/sensitive fields from params before showing to user.
 */
function sanitizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  const sanitized = { ...params };
  delete sanitized._userId;
  delete sanitized._organizationId;
  return sanitized;
}
