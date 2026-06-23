/**
 * Persistence helpers for integration tests.
 *
 * These functions insert rows directly into the database. They are used by the
 * tenant-isolation harness and by any integration test that needs seed data.
 */

import { sequelize } from "../../database/db";

export interface CreateTestProjectOptions {
  project_title?: string;
  uc_id?: string;
}

export async function createTestProject(
  orgId: number,
  ownerId: number,
  options: CreateTestProjectOptions = {},
): Promise<number> {
  const suffix = Date.now();
  const title = options.project_title ?? `Test Project ${suffix}`;
  const ucId = options.uc_id ?? `UC-${suffix}`;
  const [result] = await sequelize.query(
    `INSERT INTO projects (organization_id, project_title, owner, uc_id, created_at)
     VALUES (:orgId, :title, :ownerId, :ucId, NOW()) RETURNING id`,
    { replacements: { orgId, title, ownerId, ucId } },
  );
  return (result as any[])[0].id;
}

export interface CreateTestFileOptions {
  filename?: string;
  project_id?: number;
}

export async function createTestFile(
  orgId: number,
  uploadedBy: number,
  options: CreateTestFileOptions = {},
): Promise<number> {
  const filename = options.filename ?? `file-${Date.now()}.txt`;
  const [result] = await sequelize.query(
    `INSERT INTO files (organization_id, filename, uploaded_by, org_id, project_id)
     VALUES (:orgId, :filename, :uploadedBy, :orgId, :projectId) RETURNING id`,
    {
      replacements: {
        orgId,
        filename,
        uploadedBy,
        projectId: options.project_id ?? null,
      },
    },
  );
  return (result as any[])[0].id;
}

export interface CreateTestRiskOptions {
  risk_name?: string;
  risk_owner?: number;
}

export async function createTestRisk(
  orgId: number,
  options: CreateTestRiskOptions = {},
): Promise<number> {
  const name = options.risk_name ?? `Risk ${Date.now()}`;
  const [result] = await sequelize.query(
    `INSERT INTO risks (organization_id, risk_name, risk_owner, created_at, updated_at)
     VALUES (:orgId, :name, :riskOwner, NOW(), NOW()) RETURNING id`,
    {
      replacements: {
        orgId,
        name,
        riskOwner: options.risk_owner ?? null,
      },
    },
  );
  return (result as any[])[0].id;
}

export interface CreateTestTaskOptions {
  title?: string;
  creator_id?: number;
}

export async function createTestTask(
  orgId: number,
  options: CreateTestTaskOptions = {},
): Promise<number> {
  const title = options.title ?? `Task ${Date.now()}`;
  const [result] = await sequelize.query(
    `INSERT INTO tasks (organization_id, title, creator_id, created_at, updated_at)
     VALUES (:orgId, :title, :creatorId, NOW(), NOW()) RETURNING id`,
    {
      replacements: {
        orgId,
        title,
        creatorId: options.creator_id ?? null,
      },
    },
  );
  return (result as any[])[0].id;
}

export interface CreateTestVendorOptions {
  vendor_name?: string;
  vendor_provides?: string;
  website?: string;
  vendor_contact_person?: string;
}

export async function createTestVendor(
  orgId: number,
  options: CreateTestVendorOptions = {},
): Promise<number> {
  const suffix = Date.now();
  const [result] = await sequelize.query(
    `INSERT INTO vendors (organization_id, vendor_name, vendor_provides, website, vendor_contact_person, created_at, updated_at)
     VALUES (:orgId, :name, :provides, :website, :contact, NOW(), NOW()) RETURNING id`,
    {
      replacements: {
        orgId,
        name: options.vendor_name ?? `Vendor ${suffix}`,
        provides: options.vendor_provides ?? "Services",
        website: options.website ?? "https://example.com",
        contact: options.vendor_contact_person ?? "Contact Person",
      },
    },
  );
  return (result as any[])[0].id;
}

export interface CreateTestAssessmentOptions {
  project_id?: number;
  projects_frameworks_id?: number;
}

export async function createTestAssessment(
  orgId: number,
  options: CreateTestAssessmentOptions = {},
): Promise<number> {
  const [result] = await sequelize.query(
    `INSERT INTO assessments (organization_id, project_id, projects_frameworks_id, created_at)
     VALUES (:orgId, :projectId, :projectsFrameworksId, NOW()) RETURNING id`,
    {
      replacements: {
        orgId,
        projectId: options.project_id ?? null,
        projectsFrameworksId: options.projects_frameworks_id ?? null,
      },
    },
  );
  return (result as any[])[0].id;
}

export interface CreateTestControlEUOptions {
  projects_frameworks_id?: number;
}

export async function createTestControlEU(
  orgId: number,
  options: CreateTestControlEUOptions = {},
): Promise<number> {
  const [result] = await sequelize.query(
    `INSERT INTO controls_eu (organization_id, projects_frameworks_id, created_at)
     VALUES (:orgId, :projectsFrameworksId, NOW()) RETURNING id`,
    {
      replacements: {
        orgId,
        projectsFrameworksId: options.projects_frameworks_id ?? null,
      },
    },
  );
  return (result as any[])[0].id;
}

export async function createTestProjectFramework(
  orgId: number,
  projectId: number,
  frameworkId: number,
): Promise<number> {
  const [result] = await sequelize.query(
    `INSERT INTO projects_frameworks (organization_id, project_id, framework_id)
     VALUES (:orgId, :projectId, :frameworkId) RETURNING id`,
    { replacements: { orgId, projectId, frameworkId } },
  );
  return (result as any[])[0].id;
}

export async function linkRiskToProject(
  orgId: number,
  riskId: number,
  projectId: number,
): Promise<void> {
  await sequelize.query(
    `INSERT INTO projects_risks (organization_id, risk_id, project_id)
     VALUES (:orgId, :riskId, :projectId)
     ON CONFLICT (risk_id, project_id) DO NOTHING`,
    { replacements: { orgId, riskId, projectId } },
  );
}

export async function linkVendorToProject(
  orgId: number,
  vendorId: number,
  projectId: number,
): Promise<void> {
  await sequelize.query(
    `INSERT INTO vendors_projects (organization_id, vendor_id, project_id)
     VALUES (:orgId, :vendorId, :projectId)
     ON CONFLICT (vendor_id, project_id) DO NOTHING`,
    { replacements: { orgId, vendorId, projectId } },
  );
}

export async function assignTaskToUser(
  orgId: number,
  taskId: number,
  userId: number,
): Promise<void> {
  await sequelize.query(
    `INSERT INTO task_assignees (organization_id, task_id, user_id)
     VALUES (:orgId, :taskId, :userId)
     ON CONFLICT (task_id, user_id) DO NOTHING`,
    { replacements: { orgId, taskId, userId } },
  );
}
