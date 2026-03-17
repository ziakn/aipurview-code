/**
 * AI Gateway Prompt Utils
 *
 * Database utilities for managing AI Gateway prompts and prompt versions.
 * Uses raw SQL queries with unqualified table names (resolved via search_path).
 */

import { sequelize } from "../database/db";

export interface IAiGatewayPrompt {
  id: number;
  organization_id: number;
  slug: string;
  name: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  // Joined fields from published version
  published_version?: number | null;
  published_model?: string | null;
  published_status?: string | null;
  version_count?: number;
}

export interface IAiGatewayPromptVersion {
  id: number;
  prompt_id: number;
  organization_id: number;
  version: number;
  content: Array<{ role: string; content: string }>;
  variables: string[] | null;
  model: string | null;
  config: Record<string, any> | null;
  status: "draft" | "published";
  published_at: string | null;
  published_by: number | null;
  created_by: number | null;
  created_at: string;
  commit_message: string | null;
  // Joined fields
  created_by_name?: string;
  published_by_name?: string;
}

export interface IAiGatewayPromptLabel {
  id: number;
  prompt_id: number;
  organization_id: number;
  label_name: string;
  version_id: number;
  assigned_by: number | null;
  assigned_at: string;
  // Joined fields
  version_number?: number;
  assigned_by_name?: string;
}

export interface IAiGatewayPromptTestDataset {
  id: number;
  prompt_id: number;
  organization_id: number;
  name: string;
  test_cases: any[];
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Variable resolution ────────────────────────────────────────────────────

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Extract unique variable names from message content.
 */
export function extractVariables(
  messages: Array<{ role: string; content: string }>
): string[] {
  const vars = new Set<string>();
  for (const msg of messages) {
    let match: RegExpExecArray | null;
    const re = new RegExp(VARIABLE_PATTERN.source, "g");
    while ((match = re.exec(msg.content)) !== null) {
      vars.add(match[1]);
    }
  }
  return Array.from(vars);
}

/**
 * Replace {{varName}} placeholders in message content with provided values.
 */
export function resolveVariables(
  messages: Array<{ role: string; content: string }>,
  values: Record<string, string>
): Array<{ role: string; content: string }> {
  return messages.map((msg) => ({
    ...msg,
    content: msg.content.replace(VARIABLE_PATTERN, (_, name) =>
      values[name] !== undefined ? values[name] : `{{${name}}}`
    ),
  }));
}

// ─── Prompt CRUD ────────────────────────────────────────────────────────────

/**
 * Create a new prompt container.
 */
export const createPromptQuery = async (
  organizationId: number,
  data: {
    slug: string;
    name: string;
    description?: string | null;
    created_by?: number;
  }
): Promise<IAiGatewayPrompt> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_prompts
       (organization_id, slug, name, description, created_by, created_at, updated_at)
     VALUES
       (:organizationId, :slug, :name, :description, :created_by, NOW(), NOW())
     RETURNING id, organization_id, slug, name, description, created_by, created_at, updated_at`,
    {
      replacements: {
        organizationId,
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        created_by: data.created_by ?? null,
      },
    }
  )) as [IAiGatewayPrompt[], number];

  return result[0][0];
};

/**
 * List all prompts for an organization with published version info.
 */
export const getAllPromptsQuery = async (
  organizationId: number
): Promise<IAiGatewayPrompt[]> => {
  const result = (await sequelize.query(
    `SELECT p.id, p.organization_id, p.slug, p.name, p.description,
            p.created_by, p.created_at, p.updated_at,
            pv.version AS published_version,
            pv.model AS published_model,
            pv.status AS published_status,
            (SELECT COUNT(*)::int FROM ai_gateway_prompt_versions WHERE prompt_id = p.id) AS version_count
     FROM ai_gateway_prompts p
     LEFT JOIN ai_gateway_prompt_versions pv
       ON pv.prompt_id = p.id AND pv.status = 'published'
     WHERE p.organization_id = :organizationId
     ORDER BY p.updated_at DESC`,
    { replacements: { organizationId } }
  )) as [IAiGatewayPrompt[], number];

  return result[0];
};

/**
 * Get a single prompt by ID.
 */
export const getPromptByIdQuery = async (
  organizationId: number,
  id: number
): Promise<IAiGatewayPrompt | null> => {
  const result = (await sequelize.query(
    `SELECT p.id, p.organization_id, p.slug, p.name, p.description,
            p.created_by, p.created_at, p.updated_at,
            pv.version AS published_version,
            pv.model AS published_model,
            pv.status AS published_status,
            (SELECT COUNT(*)::int FROM ai_gateway_prompt_versions WHERE prompt_id = p.id) AS version_count
     FROM ai_gateway_prompts p
     LEFT JOIN ai_gateway_prompt_versions pv
       ON pv.prompt_id = p.id AND pv.status = 'published'
     WHERE p.organization_id = :organizationId AND p.id = :id`,
    { replacements: { organizationId, id } }
  )) as [IAiGatewayPrompt[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Get a single prompt by slug (for API resolution).
 */
export const getPromptBySlugQuery = async (
  organizationId: number,
  slug: string
): Promise<IAiGatewayPrompt | null> => {
  const result = (await sequelize.query(
    `SELECT p.id, p.organization_id, p.slug, p.name, p.description,
            p.created_by, p.created_at, p.updated_at
     FROM ai_gateway_prompts p
     WHERE p.organization_id = :organizationId AND p.slug = :slug`,
    { replacements: { organizationId, slug } }
  )) as [IAiGatewayPrompt[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Update prompt name/description.
 */
export const updatePromptQuery = async (
  organizationId: number,
  id: number,
  data: { name?: string; description?: string | null }
): Promise<IAiGatewayPrompt | null> => {
  const setClauses: string[] = [];
  const replacements: Record<string, any> = { organizationId, id };

  if (data.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = data.name;
  }
  if (data.description !== undefined) {
    setClauses.push("description = :description");
    replacements.description = data.description;
  }

  if (setClauses.length === 0) {
    return getPromptByIdQuery(organizationId, id);
  }

  setClauses.push("updated_at = NOW()");

  const result = (await sequelize.query(
    `UPDATE ai_gateway_prompts
     SET ${setClauses.join(", ")}
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id, organization_id, slug, name, description, created_by, created_at, updated_at`,
    { replacements }
  )) as [IAiGatewayPrompt[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Hard delete a prompt (CASCADE removes versions).
 */
export const deletePromptQuery = async (
  organizationId: number,
  id: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM ai_gateway_prompts
     WHERE organization_id = :organizationId AND id = :id
     RETURNING id`,
    { replacements: { organizationId, id } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};

// ─── Version CRUD ───────────────────────────────────────────────────────────

/**
 * Create a new version with auto-incremented version number.
 * Auto-detects variables from {{varName}} patterns in content.
 */
export const createVersionQuery = async (
  organizationId: number,
  promptId: number,
  data: {
    content: Array<{ role: string; content: string }>;
    model?: string | null;
    config?: Record<string, any> | null;
    created_by?: number;
    commit_message?: string | null;
  }
): Promise<IAiGatewayPromptVersion> => {
  const variables = extractVariables(data.content);

  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_prompt_versions
       (prompt_id, organization_id, version, content, variables, model, config, status, created_by, commit_message, created_at)
     VALUES
       (:promptId, :organizationId,
        COALESCE((SELECT MAX(version) FROM ai_gateway_prompt_versions WHERE prompt_id = :promptId), 0) + 1,
        :content, :variables, :model, :config, 'draft', :created_by, :commit_message, NOW())
     RETURNING id, prompt_id, organization_id, version, content, variables, model, config, status,
               published_at, published_by, created_by, commit_message, created_at`,
    {
      replacements: {
        promptId,
        organizationId,
        content: JSON.stringify(data.content),
        variables: JSON.stringify(variables),
        model: data.model ?? null,
        config: data.config ? JSON.stringify(data.config) : null,
        created_by: data.created_by ?? null,
        commit_message: data.commit_message ?? null,
      },
    }
  )) as [IAiGatewayPromptVersion[], number];

  // Also touch parent's updated_at
  await sequelize.query(
    `UPDATE ai_gateway_prompts SET updated_at = NOW() WHERE id = :promptId AND organization_id = :organizationId`,
    { replacements: { promptId, organizationId } }
  );

  return result[0][0];
};

/**
 * List versions for a prompt (newest first).
 */
export const getVersionsQuery = async (
  organizationId: number,
  promptId: number
): Promise<IAiGatewayPromptVersion[]> => {
  const result = (await sequelize.query(
    `SELECT v.id, v.prompt_id, v.organization_id, v.version, v.content, v.variables,
            v.model, v.config, v.status, v.published_at, v.published_by,
            v.created_by, v.created_at, v.commit_message,
            cu.name AS created_by_name,
            pu.name AS published_by_name
     FROM ai_gateway_prompt_versions v
     LEFT JOIN users cu ON cu.id = v.created_by
     LEFT JOIN users pu ON pu.id = v.published_by
     WHERE v.organization_id = :organizationId AND v.prompt_id = :promptId
     ORDER BY v.version DESC`,
    { replacements: { organizationId, promptId } }
  )) as [IAiGatewayPromptVersion[], number];

  return result[0];
};

/**
 * Get the published version for a prompt.
 */
export const getPublishedVersionQuery = async (
  organizationId: number,
  promptId: number
): Promise<IAiGatewayPromptVersion | null> => {
  const result = (await sequelize.query(
    `SELECT v.id, v.prompt_id, v.organization_id, v.version, v.content, v.variables,
            v.model, v.config, v.status, v.published_at, v.published_by,
            v.created_by, v.created_at
     FROM ai_gateway_prompt_versions v
     WHERE v.organization_id = :organizationId AND v.prompt_id = :promptId AND v.status = 'published'
     LIMIT 1`,
    { replacements: { organizationId, promptId } }
  )) as [IAiGatewayPromptVersion[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Publish a version: unpublish all others, then publish the target.
 * Uses a transaction for atomicity.
 */
export const publishVersionQuery = async (
  organizationId: number,
  promptId: number,
  versionNumber: number,
  publishedBy: number
): Promise<IAiGatewayPromptVersion | null> => {
  const t = await sequelize.transaction();
  try {
    // Unpublish all versions for this prompt
    await sequelize.query(
      `UPDATE ai_gateway_prompt_versions
       SET status = 'draft', published_at = NULL, published_by = NULL
       WHERE organization_id = :organizationId AND prompt_id = :promptId AND status = 'published'`,
      { replacements: { organizationId, promptId }, transaction: t }
    );

    // Publish the target version
    const result = (await sequelize.query(
      `UPDATE ai_gateway_prompt_versions
       SET status = 'published', published_at = NOW(), published_by = :publishedBy
       WHERE organization_id = :organizationId AND prompt_id = :promptId AND version = :versionNumber
       RETURNING id, prompt_id, organization_id, version, content, variables, model, config, status,
                 published_at, published_by, created_by, created_at`,
      { replacements: { organizationId, promptId, versionNumber, publishedBy }, transaction: t }
    )) as [IAiGatewayPromptVersion[], number];

    if (result[0].length === 0) {
      await t.rollback();
      return null;
    }

    // Touch parent's updated_at
    await sequelize.query(
      `UPDATE ai_gateway_prompts SET updated_at = NOW() WHERE id = :promptId AND organization_id = :organizationId`,
      { replacements: { promptId, organizationId }, transaction: t }
    );

    await t.commit();
    return result[0][0];
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Resolve prompt for proxy: get the published version's content + config for a given prompt_id.
 */
export const resolvePromptQuery = async (
  organizationId: number,
  promptId: number
): Promise<{
  content: Array<{ role: string; content: string }>;
  variables: string[] | null;
  model: string | null;
  config: Record<string, any> | null;
} | null> => {
  const result = (await sequelize.query(
    `SELECT content, variables, model, config
     FROM ai_gateway_prompt_versions
     WHERE organization_id = :organizationId AND prompt_id = :promptId AND status = 'published'
     LIMIT 1`,
    { replacements: { organizationId, promptId } }
  )) as [any[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

// ─── Labels ────────────────────────────────────────────────────────────────

/**
 * List labels for a prompt with version info.
 */
export const getLabelsQuery = async (
  organizationId: number,
  promptId: number
): Promise<IAiGatewayPromptLabel[]> => {
  const result = (await sequelize.query(
    `SELECT l.id, l.prompt_id, l.organization_id, l.label_name,
            l.version_id, l.assigned_by, l.assigned_at,
            v.version AS version_number,
            u.name AS assigned_by_name
     FROM ai_gateway_prompt_labels l
     LEFT JOIN ai_gateway_prompt_versions v ON v.id = l.version_id
     LEFT JOIN users u ON u.id = l.assigned_by
     WHERE l.organization_id = :organizationId AND l.prompt_id = :promptId
     ORDER BY l.assigned_at DESC`,
    { replacements: { organizationId, promptId } }
  )) as [IAiGatewayPromptLabel[], number];

  return result[0];
};

/**
 * Assign (or reassign) a label to a specific version. Uses UPSERT via ON CONFLICT.
 */
export const assignLabelQuery = async (
  organizationId: number,
  promptId: number,
  data: { label_name: string; version_id: number; assigned_by?: number }
): Promise<IAiGatewayPromptLabel> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_prompt_labels
       (prompt_id, organization_id, label_name, version_id, assigned_by, assigned_at)
     VALUES
       (:promptId, :organizationId, :label_name, :version_id, :assigned_by, NOW())
     ON CONFLICT (prompt_id, label_name) DO UPDATE
       SET version_id = EXCLUDED.version_id,
           assigned_by = EXCLUDED.assigned_by,
           assigned_at = NOW()
     RETURNING id, prompt_id, organization_id, label_name, version_id, assigned_by, assigned_at`,
    {
      replacements: {
        promptId,
        organizationId,
        label_name: data.label_name,
        version_id: data.version_id,
        assigned_by: data.assigned_by ?? null,
      },
    }
  )) as [IAiGatewayPromptLabel[], number];

  return result[0][0];
};

/**
 * Remove a label from a prompt.
 */
export const removeLabelQuery = async (
  organizationId: number,
  promptId: number,
  labelName: string
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM ai_gateway_prompt_labels
     WHERE organization_id = :organizationId AND prompt_id = :promptId AND label_name = :labelName
     RETURNING id`,
    { replacements: { organizationId, promptId, labelName } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};

/**
 * Resolve prompt by label: join labels -> versions to get content/config.
 * Falls back to status = 'published' if no label exists (backward compat).
 */
export const resolvePromptByLabelQuery = async (
  organizationId: number,
  promptId: number,
  label: string
): Promise<{
  content: Array<{ role: string; content: string }>;
  variables: string[] | null;
  model: string | null;
  config: Record<string, any> | null;
} | null> => {
  // Try label-based resolution first
  const labelResult = (await sequelize.query(
    `SELECT v.content, v.variables, v.model, v.config
     FROM ai_gateway_prompt_labels l
     JOIN ai_gateway_prompt_versions v ON v.id = l.version_id
     WHERE l.organization_id = :organizationId
       AND l.prompt_id = :promptId
       AND l.label_name = :label
     LIMIT 1`,
    { replacements: { organizationId, promptId, label } }
  )) as [any[], number];

  if (labelResult[0].length > 0) return labelResult[0][0];

  // Fallback: published version
  return resolvePromptQuery(organizationId, promptId);
};

// ─── Composability ─────────────────────────────────────────────────────────

const PROMPT_REF_PATTERN = /@prompt:([a-z0-9-]+)/g;

/**
 * Resolve @prompt:slug references in message content.
 * Replaces each reference with the published version's messages from the referenced prompt.
 * Depth-limited to prevent infinite recursion.
 */
export const resolvePromptReferences = async (
  organizationId: number,
  messages: Array<{ role: string; content: string }>,
  depth: number = 0,
  maxDepth: number = 3
): Promise<Array<{ role: string; content: string }>> => {
  if (depth >= maxDepth) return messages;

  const resolved: Array<{ role: string; content: string }> = [];

  for (const msg of messages) {
    const refs: string[] = [];
    let match: RegExpExecArray | null;
    const re = new RegExp(PROMPT_REF_PATTERN.source, "g");
    while ((match = re.exec(msg.content)) !== null) {
      refs.push(match[1]);
    }

    if (refs.length === 0) {
      resolved.push(msg);
      continue;
    }

    // If the message content is ONLY a @prompt:slug reference, replace with referenced messages
    const trimmed = msg.content.trim();
    if (refs.length === 1 && trimmed === `@prompt:${refs[0]}`) {
      const refPrompt = await getPromptBySlugQuery(organizationId, refs[0]);
      if (refPrompt) {
        const refData = await resolvePromptQuery(organizationId, refPrompt.id);
        if (refData?.content) {
          const inner = await resolvePromptReferences(
            organizationId,
            refData.content,
            depth + 1,
            maxDepth
          );
          resolved.push(...inner);
          continue;
        }
      }
      // If reference couldn't be resolved, keep original message
      resolved.push(msg);
    } else {
      // Mixed content: replace references inline with content from referenced prompt
      let newContent = msg.content;
      for (const slug of refs) {
        const refPrompt = await getPromptBySlugQuery(organizationId, slug);
        if (refPrompt) {
          const refData = await resolvePromptQuery(organizationId, refPrompt.id);
          if (refData?.content) {
            const inlineText = refData.content.map((m) => m.content).join("\n");
            newContent = newContent.replace(`@prompt:${slug}`, inlineText);
          }
        }
      }
      resolved.push({ ...msg, content: newContent });
    }
  }

  return resolved;
};

// ─── Test datasets ─────────────────────────────────────────────────────────

/**
 * Create a test dataset for a prompt.
 */
export const createTestDatasetQuery = async (
  organizationId: number,
  promptId: number,
  data: { name: string; test_cases?: any[]; created_by?: number }
): Promise<IAiGatewayPromptTestDataset> => {
  const result = (await sequelize.query(
    `INSERT INTO ai_gateway_prompt_test_datasets
       (prompt_id, organization_id, name, test_cases, created_by, created_at, updated_at)
     VALUES
       (:promptId, :organizationId, :name, :test_cases, :created_by, NOW(), NOW())
     RETURNING id, prompt_id, organization_id, name, test_cases, created_by, created_at, updated_at`,
    {
      replacements: {
        promptId,
        organizationId,
        name: data.name,
        test_cases: JSON.stringify(data.test_cases ?? []),
        created_by: data.created_by ?? null,
      },
    }
  )) as [IAiGatewayPromptTestDataset[], number];

  return result[0][0];
};

/**
 * List test datasets for a prompt.
 */
export const getTestDatasetsQuery = async (
  organizationId: number,
  promptId: number
): Promise<IAiGatewayPromptTestDataset[]> => {
  const result = (await sequelize.query(
    `SELECT id, prompt_id, organization_id, name, test_cases, created_by, created_at, updated_at
     FROM ai_gateway_prompt_test_datasets
     WHERE organization_id = :organizationId AND prompt_id = :promptId
     ORDER BY created_at DESC`,
    { replacements: { organizationId, promptId } }
  )) as [IAiGatewayPromptTestDataset[], number];

  return result[0];
};

/**
 * Update a test dataset.
 */
export const updateTestDatasetQuery = async (
  organizationId: number,
  promptId: number,
  datasetId: number,
  data: { name?: string; test_cases?: any[] }
): Promise<IAiGatewayPromptTestDataset | null> => {
  const setClauses: string[] = [];
  const replacements: Record<string, any> = { organizationId, promptId, datasetId };

  if (data.name !== undefined) {
    setClauses.push("name = :name");
    replacements.name = data.name;
  }
  if (data.test_cases !== undefined) {
    setClauses.push("test_cases = :test_cases");
    replacements.test_cases = JSON.stringify(data.test_cases);
  }

  if (setClauses.length === 0) return null;
  setClauses.push("updated_at = NOW()");

  const result = (await sequelize.query(
    `UPDATE ai_gateway_prompt_test_datasets
     SET ${setClauses.join(", ")}
     WHERE organization_id = :organizationId AND prompt_id = :promptId AND id = :datasetId
     RETURNING id, prompt_id, organization_id, name, test_cases, created_by, created_at, updated_at`,
    { replacements }
  )) as [IAiGatewayPromptTestDataset[], number];

  return result[0].length > 0 ? result[0][0] : null;
};

/**
 * Delete a test dataset.
 */
export const deleteTestDatasetQuery = async (
  organizationId: number,
  promptId: number,
  datasetId: number
): Promise<boolean> => {
  const result = (await sequelize.query(
    `DELETE FROM ai_gateway_prompt_test_datasets
     WHERE organization_id = :organizationId AND prompt_id = :promptId AND id = :datasetId
     RETURNING id`,
    { replacements: { organizationId, promptId, datasetId } }
  )) as [{ id: number }[], number];

  return (result[0] as any[]).length > 0;
};
