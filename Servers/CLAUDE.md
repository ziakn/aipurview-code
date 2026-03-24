# Servers — Backend Development Guide

> **Last Updated:** 2026-03-24

---

## Multi-Tenancy

Shared-schema isolation with `organization_id` column on all tenant-scoped tables. All data lives in the `verifywise` schema (via `search_path`).

| Schema | Purpose |
|--------|---------|
| `verifywise` | All tables — users, organizations, projects, vendors, risks, files, model_inventories, frameworks, llm_evals_*, etc. |
| `public` | PostgreSQL extensions only (uuid-ossp, pgcrypto). Also `public.organizations` and `public.users` which EvalServer FKs reference (since EvalServer starts in parallel). |

**Access:** `req.organizationId` from auth middleware. Queries use unqualified table names (resolved by `search_path`): `SELECT * FROM projects WHERE organization_id = :orgId AND id = :id`.

**Legacy:** Previously used schema-per-tenant (`{tenantHash}` schemas). Migration script: `scripts/migrateToSharedSchema.ts` (runs on startup). Config in `scripts/migrationConfig.ts` defines table order, FK mappings, and skip lists.

Key behaviors:
- `copySharedTables()` runs FIRST — copies `roles`, `organizations`, `users`, `tiers`, `subscriptions`, `frameworks` from `public` → `verifywise` with automatic type casting and COALESCE for NOT NULL columns
- Then queries `verifywise.organizations` (via search_path) to discover orgs
- Skips all `llm_evals_*` tables (owned by EvalServer, different schema structure)
- NOT NULL safety check: skips tables where target has NOT NULL columns missing from source
- `SKIP_TABLES` in `migrationConfig.ts` lists tables to skip (all 13 `llm_evals_*` tables + others)

---

## Database & Migrations

### Creating Migrations

**CRITICAL: Always generate timestamp with `date` command**

```bash
date +%Y%m%d%H%M%S
npx sequelize migration:create --name my-migration-name
```

### Schema Rules

All tables live in the `verifywise` PostgreSQL schema. The `public` schema only holds extensions.

- **Application SQL:** Use **unqualified** table names (e.g., `SELECT * FROM projects`). Resolved via `search_path = verifywise` set in Sequelize `afterConnect` hook.
- **NEVER** use `public.tablename` or `verifywise.tablename` in application code (controllers, utils, services).
- **Consolidated DDL migrations** (`20260226234300` through `20260226234302`): Use explicit `verifywise.` prefix for CREATE TABLE, CREATE TYPE, etc.
- **Framework struct tables** (shared, no org_id): `*_struct_*` tables in `20260226234301-public-schema-tables.js`
- **Tenant-scoped tables** (with org_id): in `20260226234302-tenant-tables.js`
- **Seed data:** `20260302111132-seed-framework-struct-data.js`

### Migration Pattern

```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use unqualified table names — search_path resolves to verifywise
    await queryInterface.addColumn('users', 'new_field', {
      type: Sequelize.STRING, allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'new_field');
  }
};
```

### Running Migrations

```bash
npm run build                    # Build TypeScript first (migrations use dist/)
npx sequelize db:migrate         # Run migrations
npx sequelize db:migrate:undo    # Rollback last
```

---

## Backend Development

### Layer Flow

1. **Route** (`routes/{entity}.route.ts`) — Define endpoints, apply `authenticateJWT`
2. **Controller** (`controllers/{entity}.ctrl.ts`) — Handle request, validate, call utils, use `logProcessing`/`logSuccess`/`logFailure`, return `STATUS_CODE[xxx](...)`
3. **Utils** (`utils/{entity}.utils.ts`) — Raw SQL via `sequelize.query()` with unqualified table names and `:replacements` (including `organization_id` for tenant isolation)
4. **Model** (`domain.layer/models/{entity}/`) — Sequelize-typescript decorators

**Don't forget:** Register new routes in `index.ts`:
```typescript
import entityRoutes from "./routes/entity.route";
app.use("/api/entities", entityRoutes);
```

---

## Key Files

| Purpose | Path |
|---------|------|
| Backend entry | `index.ts` |
| Route definitions | `routes/*.ts` |
| Database models | `domain.layer/models/` |
| Shared schema migration | `scripts/migrateToSharedSchema.ts` |
| Migration config | `scripts/migrationConfig.ts` |
| Auth middleware | `middleware/auth.middleware.ts` |
| Custom exceptions | `domain.layer/exceptions/custom.exception.ts` |
| Log helper | `utils/logger/logHelper.ts` |

---

## References

Read the relevant file BEFORE implementing changes in that area:

| When working on... | Read this file |
|---------------------|---------------|
| Controller/route/utils patterns | `docs/technical/guides/backend-patterns.md` |
| Adding a new feature (full guide) | `docs/technical/guides/adding-new-feature.md` |
| Adding a new framework | `docs/technical/guides/adding-new-framework.md` |
| API conventions | `docs/technical/guides/api-conventions.md` |
| Code style | `docs/technical/guides/code-style.md` |
| API routes & endpoints | `docs/technical/api/endpoints.md` |
| Background jobs (BullMQ) | `docs/technical/infrastructure/automations.md` |
| Email templates (MJML) | `docs/technical/infrastructure/email-service.md` |
| PDF/DOCX reporting | `docs/technical/infrastructure/pdf-generation.md` |
| File upload system | `docs/technical/infrastructure/file-storage.md` |
| Error handling & exceptions | `docs/claude/error-handling.md` |
| Logging system | `docs/claude/logging.md` |
| Middleware (rate limit, RBAC, JWT, Redis) | `docs/claude/middleware.md` |
| Database schema | `docs/technical/architecture/database-schema.md` |
| Multi-tenancy architecture | `docs/technical/architecture/multi-tenancy.md` |

> All `docs/` paths are relative to the repository root.
