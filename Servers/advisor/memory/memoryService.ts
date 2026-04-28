/**
 * Phase 3 — Agent Memory Service
 *
 * Three-tier memory system:
 * 1. Message History (short-term) — last N messages per session
 * 2. Working Memory (medium-term) — active task state
 * 3. Semantic Memory (long-term) — past decisions and learnings
 */

import { sequelize } from "../../database/db";
import { QueryTypes } from "sequelize";
import { logStructured } from "../../utils/logger/fileLogger";

const fileName = "memoryService.ts";
const DEFAULT_MESSAGE_WINDOW = 50;

// ── Message History (Short-term) ────────────────────────────────

export async function saveMessage(
  organizationId: number,
  agentName: string,
  userId: number,
  sessionId: string,
  role: "user" | "assistant" | "system" | "tool",
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await sequelize.query(
      `INSERT INTO agent_message_history
        (organization_id, agent_name, user_id, session_id, role, content, metadata, created_at)
       VALUES (:organizationId, :agentName, :userId, :sessionId, :role, :content, :metadata, NOW())`,
      {
        replacements: {
          organizationId,
          agentName,
          userId,
          sessionId,
          role,
          content,
          metadata: JSON.stringify(metadata || {}),
        },
        type: QueryTypes.INSERT,
      }
    );

    // Auto-prune: keep only last N messages per session
    await sequelize.query(
      `DELETE FROM agent_message_history
       WHERE id NOT IN (
         SELECT id FROM agent_message_history
         WHERE organization_id = :organizationId
           AND agent_name = :agentName
           AND session_id = :sessionId
         ORDER BY created_at DESC
         LIMIT :windowSize
       )
       AND organization_id = :organizationId
       AND agent_name = :agentName
       AND session_id = :sessionId`,
      {
        replacements: { organizationId, agentName, sessionId, windowSize: DEFAULT_MESSAGE_WINDOW },
        type: QueryTypes.DELETE,
      }
    );
  } catch (error) {
    logStructured("error", `save message failed: ${error}`, "saveMessage", fileName);
  }
}

export async function getMessages(
  organizationId: number,
  agentName: string,
  sessionId: string,
  limit: number = DEFAULT_MESSAGE_WINDOW
): Promise<Array<{ role: string; content: string; created_at: string; metadata: Record<string, unknown> }>> {
  const rows = await sequelize.query(
    `SELECT role, content, created_at, metadata
     FROM agent_message_history
     WHERE organization_id = :organizationId
       AND agent_name = :agentName
       AND session_id = :sessionId
     ORDER BY created_at ASC
     LIMIT :limit`,
    { replacements: { organizationId, agentName, sessionId, limit }, type: QueryTypes.SELECT }
  ) as any[];

  return rows;
}

export async function clearSession(
  organizationId: number,
  agentName: string,
  sessionId: string
): Promise<void> {
  await sequelize.query(
    `DELETE FROM agent_message_history
     WHERE organization_id = :organizationId
       AND agent_name = :agentName
       AND session_id = :sessionId`,
    { replacements: { organizationId, agentName, sessionId }, type: QueryTypes.DELETE }
  );
}

// ── Working Memory (Medium-term) ────────────────────────────────

export async function setWorkingMemory(
  organizationId: number,
  agentName: string,
  taskId: string,
  key: string,
  value: unknown,
  ttlMinutes?: number
): Promise<void> {
  const expiresAt = ttlMinutes
    ? new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    : null;

  await sequelize.query(
    `INSERT INTO agent_working_memory
      (organization_id, agent_name, task_id, key, value, expires_at, created_at, updated_at)
     VALUES (:organizationId, :agentName, :taskId, :key, :value, :expiresAt, NOW(), NOW())
     ON CONFLICT (organization_id, agent_name, task_id, key)
     DO UPDATE SET value = :value, expires_at = :expiresAt, updated_at = NOW()`,
    {
      replacements: {
        organizationId,
        agentName,
        taskId,
        key,
        value: JSON.stringify(value),
        expiresAt,
      },
      type: QueryTypes.INSERT,
    }
  );
}

export async function getWorkingMemory(
  organizationId: number,
  agentName: string,
  taskId: string,
  key?: string
): Promise<Record<string, unknown> | unknown> {
  if (key) {
    const rows = await sequelize.query(
      `SELECT value FROM agent_working_memory
       WHERE organization_id = :organizationId
         AND agent_name = :agentName
         AND task_id = :taskId
         AND key = :key
         AND (expires_at IS NULL OR expires_at > NOW())`,
      { replacements: { organizationId, agentName, taskId, key }, type: QueryTypes.SELECT }
    ) as any[];
    return rows[0]?.value || null;
  }

  // Get all keys for a task
  const rows = await sequelize.query(
    `SELECT key, value FROM agent_working_memory
     WHERE organization_id = :organizationId
       AND agent_name = :agentName
       AND task_id = :taskId
       AND (expires_at IS NULL OR expires_at > NOW())`,
    { replacements: { organizationId, agentName, taskId }, type: QueryTypes.SELECT }
  ) as any[];

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function clearWorkingMemory(
  organizationId: number,
  agentName: string,
  taskId: string
): Promise<void> {
  await sequelize.query(
    `DELETE FROM agent_working_memory
     WHERE organization_id = :organizationId
       AND agent_name = :agentName
       AND task_id = :taskId`,
    { replacements: { organizationId, agentName, taskId }, type: QueryTypes.DELETE }
  );
}

// ── Semantic Memory (Long-term) ─────────────────────────────────

export async function saveSemanticMemory(
  organizationId: number,
  agentName: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await sequelize.query(
    `INSERT INTO agent_semantic_memory
      (organization_id, agent_name, content, metadata, created_at)
     VALUES (:organizationId, :agentName, :content, :metadata, NOW())`,
    {
      replacements: {
        organizationId,
        agentName,
        content,
        metadata: JSON.stringify(metadata || {}),
      },
      type: QueryTypes.INSERT,
    }
  );
}

export async function recallSemanticMemory(
  organizationId: number,
  agentName: string,
  query: string,
  limit: number = 10
): Promise<Array<{ content: string; metadata: Record<string, unknown>; created_at: string }>> {
  // Text-based search (future: replace with vector similarity)
  const rows = await sequelize.query(
    `SELECT content, metadata, created_at
     FROM agent_semantic_memory
     WHERE organization_id = :organizationId
       AND agent_name = :agentName
       AND content ILIKE :query
     ORDER BY created_at DESC
     LIMIT :limit`,
    {
      replacements: { organizationId, agentName, query: `%${query}%`, limit },
      type: QueryTypes.SELECT,
    }
  ) as any[];

  return rows;
}

// ── Cleanup ─────────────────────────────────────────────────────

/**
 * Clean up expired working memory entries.
 * Called periodically via BullMQ or setInterval.
 */
export async function cleanupExpiredMemory(): Promise<number> {
  try {
    const [, meta] = await sequelize.query(
      `DELETE FROM agent_working_memory WHERE expires_at IS NOT NULL AND expires_at < NOW()`,
      { type: QueryTypes.DELETE }
    ) as any;
    const count = meta?.rowCount || 0;
    if (count > 0) {
      logStructured("successful", `cleaned up ${count} expired working memory entries`, "cleanupExpiredMemory", fileName);
    }
    return count;
  } catch (error) {
    logStructured("error", `memory cleanup failed: ${error}`, "cleanupExpiredMemory", fileName);
    return 0;
  }
}

// ── Admin API ───────────────────────────────────────────────────

export async function getAgentMessages(
  organizationId: number,
  agentName: string,
  limit: number = 50
): Promise<any[]> {
  return await sequelize.query(
    `SELECT * FROM agent_message_history
     WHERE organization_id = :organizationId AND agent_name = :agentName
     ORDER BY created_at DESC LIMIT :limit`,
    { replacements: { organizationId, agentName, limit }, type: QueryTypes.SELECT }
  ) as any[];
}

export async function getAgentWorkingMemory(
  organizationId: number,
  agentName: string
): Promise<any[]> {
  return await sequelize.query(
    `SELECT * FROM agent_working_memory
     WHERE organization_id = :organizationId AND agent_name = :agentName
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY updated_at DESC`,
    { replacements: { organizationId, agentName }, type: QueryTypes.SELECT }
  ) as any[];
}

export async function clearAgentMemory(
  organizationId: number,
  agentName: string
): Promise<void> {
  await sequelize.query(
    `DELETE FROM agent_message_history WHERE organization_id = :organizationId AND agent_name = :agentName`,
    { replacements: { organizationId, agentName }, type: QueryTypes.DELETE }
  );
  await sequelize.query(
    `DELETE FROM agent_working_memory WHERE organization_id = :organizationId AND agent_name = :agentName`,
    { replacements: { organizationId, agentName }, type: QueryTypes.DELETE }
  );
  await sequelize.query(
    `DELETE FROM agent_semantic_memory WHERE organization_id = :organizationId AND agent_name = :agentName`,
    { replacements: { organizationId, agentName }, type: QueryTypes.DELETE }
  );
}
