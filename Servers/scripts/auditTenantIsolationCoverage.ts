#!/usr/bin/env ts-node
/**
 * Tenant isolation schema-drift audit.
 *
 * Compares the set of tables that carry `organization_id` in the live
 * database against:
 *   1. the tenant-isolation registry, and
 *   2. a justified allow-list of intentionally shared tables.
 *
 * Exit codes:
 *   0 - coverage matches
 *   1 - uncovered scoped table(s) or missing registry table(s)
 *   2 - audit runtime error
 *
 * Usage:
 *   cd Servers && npx ts-node scripts/auditTenantIsolationCoverage.ts
 */

import { QueryTypes } from "sequelize";
import { sequelize } from "../database/db";
import { getRegisteredTenantTables } from "../tests/integration/tenant-isolation/tenantIsolation.registry";

const RUNBOOK_URL = "docs/technical/security/tenant-isolation.md";

interface SharedTableEntry {
  name: string;
  justification: string;
}

/**
 * Intentionally shared tables that carry an `organization_id` column (or that
 * match a documented naming pattern) but are not tenant-scoped.
 *
 * Every entry must include a justification reviewed in PR.
 */
const sharedTables: SharedTableEntry[] = [
  {
    name: "organizations",
    justification: "Tenant root; not scoped to an organization.",
  },
  {
    name: "roles",
    justification: "Global role definitions shared across all tenants.",
  },
  {
    name: "frameworks",
    justification: "Global framework catalog; per-tenant linkage is projects_frameworks.",
  },
  {
    name: "subscription_history",
    justification: "Billing metadata shared across tenants.",
  },
  {
    name: "subscriptions",
    justification: "Billing metadata shared across tenants.",
  },
  {
    name: "tiers",
    justification: "Billing tier definitions shared across tenants.",
  },
  {
    name: "*_struct_*",
    justification:
      "Framework structure/reference tables are global by convention; the wildcard matches all struct tables.",
  },
];

function isSharedTable(tableName: string): boolean {
  return sharedTables.some((entry) => {
    if (entry.name.includes("*")) {
      const regex = new RegExp("^" + entry.name.split("*").map(escapeRegex).join(".*") + "$");
      return regex.test(tableName);
    }
    return entry.name === tableName;
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

async function main(): Promise<void> {
  let dbTables: string[] = [];
  try {
    const rows = await sequelize.query<{ table_name: string }>(
      `
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'verifywise'
        AND column_name = 'organization_id'
      ORDER BY table_name
      `,
      { type: QueryTypes.SELECT },
    );
    dbTables = rows.map((row) => row.table_name);
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          runbook: RUNBOOK_URL,
          error: "Failed to query information_schema.columns",
          details: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const registryTables = new Set(getRegisteredTenantTables());

  const uncoveredScopedTables = dbTables.filter(
    (table) => !registryTables.has(table) && !isSharedTable(table),
  );
  const missingRegistryTables = Array.from(registryTables).filter(
    (table) => !dbTables.includes(table),
  );

  if (uncoveredScopedTables.length > 0 || missingRegistryTables.length > 0) {
    console.error(
      JSON.stringify(
        {
          runbook: RUNBOOK_URL,
          message: "Tenant isolation coverage mismatch",
          uncoveredScopedTables,
          uncoveredCount: uncoveredScopedTables.length,
          missingRegistryTables,
          missingCount: missingRegistryTables.length,
          sharedTables: sharedTables.map((entry) => entry.name),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        runbook: RUNBOOK_URL,
        status: "ok",
        scopedTablesInDatabase: dbTables.length,
        registeredTables: registryTables.size,
        sharedTables: sharedTables.map((entry) => entry.name),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          runbook: RUNBOOK_URL,
          error: "Audit script failed",
          details: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(2);
  })
  .finally(async () => {
    await sequelize.close();
  });
