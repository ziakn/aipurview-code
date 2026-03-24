# VerifyWise - Development Guide

> **Last Updated:** 2026-03-24

This document contains cross-cutting rules for the VerifyWise codebase. Directory-scoped guides load automatically when working in each area:

- **Backend:** `Servers/CLAUDE.md` — multi-tenancy, migrations, backend patterns
- **Frontend:** `Clients/CLAUDE.md` — clean architecture, component patterns
- **EvalServer:** `EvalServer/CLAUDE.md` — Alembic migrations, FastAPI patterns

---

## Instructions for Claude

**Keep documentation up to date.**

When making changes to the codebase:
- **Core architecture changes** (new patterns, conventions, multi-tenancy, migration rules) → Update this CLAUDE.md or the relevant directory CLAUDE.md
- **Feature-specific changes** (new routes, APIs, middleware, services) → Update the relevant reference doc (see [Detailed References](#detailed-references))

Always update the "Last Updated" date when modifying any CLAUDE.md file.

---

## Related Repositories

| Repository | Location | Purpose |
|------------|----------|---------|
| **plugin-marketplace** | `../plugin-marketplace` (sibling directory) | All plugins (30+), framework plugins (SOC 2, GDPR, etc.), integration plugins. See `plugin-marketplace/CLAUDE.md`. |

> Plugin source code is NOT in this repository. Work in the plugin-marketplace repo.

---

## Project Overview

VerifyWise is an AI governance platform supporting EU AI Act, ISO 42001, ISO 27001, NIST AI RMF, and plugin frameworks (SOC 2, GDPR, HIPAA, etc.).

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Material-UI 7, Redux Toolkit, React Query |
| **Backend** | Node.js 22, Express.js 4, TypeScript, Sequelize 6 |
| **Database** | PostgreSQL (shared schema, org_id isolation) |
| **Cache/Queue** | Redis + BullMQ |
| **Python Services** | FastAPI, Python 3.12 (EvalServer) |

### Request Flow

```
Browser → React Component → Redux/React Query → Axios
    ↓
Express Router → Middleware Chain → Controller → Service → Utils → PostgreSQL
```

---

## Authentication & Authorization

### JWT Token Payload

```typescript
interface TokenPayload {
  id: number;              // User ID
  email: string;
  organizationId: number;
  tenantId: string;        // Tenant hash
  roleName: string;        // "Admin" | "Reviewer" | "Editor" | "Auditor"
  expire: Date;
}
```

### Roles

| Role ID | Name | Permissions |
|---------|------|-------------|
| 1 | Admin | Full access |
| 2 | Reviewer | Read + approve/reject |
| 3 | Editor | Read + write |
| 4 | Auditor | Read only |

---

## Development Workflow

### Starting Development

```bash
cd Servers && npm install && npm run watch    # Backend (Terminal 1)
cd Clients && npm install && npm run dev      # Frontend (Terminal 2)
cd Servers && npm run worker                  # BullMQ Worker (Terminal 3, optional)
cd EvalServer/src && alembic upgrade head && uvicorn app:app --port 8000 --workers 4  # EvalServer (Terminal 4, optional)
```

### Git Workflow

```bash
# Branch naming
feature/description    fix/description    docs/description

# Commit format: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
```

### PR Checklist

- [ ] Build passes locally (`cd Servers && npm run build` and `cd Clients && npm run build`)
- [ ] Self-review completed
- [ ] Issue number included
- [ ] No hardcoded values
- [ ] UI elements use theme references
- [ ] Tests written/updated
- [ ] No console.log statements
- [ ] No sensitive data exposed

---

## Testing

- **Minimum coverage:** 80%
- **Frontend:** `cd Clients && npm run test` (Vitest)
- **Backend:** `cd Servers && npm run test` (Jest)

---

## Environment

### Required Services

| Service | Default Port | Required |
|---------|-------------|----------|
| PostgreSQL | 5432 | Yes |
| Redis | 6379 | Yes |
| Backend | 3000 | Yes |
| Frontend | 5173 | Yes |
| EvalServer | 8000 | For LLM Evals |

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables/Functions | camelCase | `getUserData`, `isValid` |
| Components/Classes | PascalCase | `UserProfile`, `AuthService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Files (Components) | PascalCase | `UserProfile.tsx` |
| Files (Utilities) | camelCase | `formatDate.ts` |
| Database Tables | snake_case | `user_profiles` |
| API Endpoints | kebab-case | `/api/user-profiles` |

---

## Detailed References

Read the relevant file BEFORE implementing changes in that area:

| When working on... | Read this file |
|---------------------|---------------|
| Backend controller/route/utils patterns | `docs/technical/guides/backend-patterns.md` |
| Frontend component/page/hook patterns | `docs/technical/guides/frontend-patterns.md` |
| Adding a new feature (full guide) | `docs/technical/guides/adding-new-feature.md` |
| Adding a new framework | `docs/technical/guides/adding-new-framework.md` |
| API conventions | `docs/technical/guides/api-conventions.md` |
| Code style | `docs/technical/guides/code-style.md` |
| Plugin system | `docs/technical/infrastructure/plugin-system.md` |
| API routes & endpoints | `docs/technical/api/endpoints.md` |
| Background jobs (BullMQ) | `docs/technical/infrastructure/automations.md` |
| Email templates (MJML) | `docs/technical/infrastructure/email-service.md` |
| PDF/DOCX reporting | `docs/technical/infrastructure/pdf-generation.md` |
| File upload system | `docs/technical/infrastructure/file-storage.md` |
| Change history tracking | `docs/claude/change-history.md` |
| Error handling & exceptions | `docs/claude/error-handling.md` |
| Logging system | `docs/claude/logging.md` |
| Middleware (rate limit, RBAC, JWT, Redis) | `docs/claude/middleware.md` |
| Assessments, subscriptions, tokens, etc. | `docs/claude/additional-apis.md` |
| Approval workflows | `docs/technical/domains/approvals.md` |
| AI Detection | `docs/technical/domains/ai-detection.md` |
| Post-market monitoring | `docs/technical/domains/post-market-monitoring.md` |
| Notifications | `docs/technical/domains/notifications.md` |
| Risk management | `docs/technical/domains/risk-management.md` |
| Vendors | `docs/technical/domains/vendors.md` |
| Policies | `docs/technical/domains/policies.md` |
| Datasets | `docs/technical/domains/datasets.md` |
| Use cases / projects | `docs/technical/domains/use-cases.md` |
| Tasks | `docs/technical/domains/tasks.md` |
| Incidents | `docs/technical/domains/incidents.md` |
| Evidence hub | `docs/technical/domains/evidence.md` |
| Models / model inventory | `docs/technical/domains/models.md` |
| Training registry | `docs/technical/domains/training.md` |
| Search | `docs/technical/domains/search.md` |
| Share links | `docs/technical/domains/share-links.md` |
| Dashboard | `docs/technical/domains/dashboard.md` |
| Compliance frameworks | `docs/technical/domains/compliance-frameworks.md` |
| MUI theming & design tokens | `docs/technical/guides/design-tokens.md` |
| Frontend styling | `docs/technical/frontend/styling.md` |
| Frontend components | `docs/technical/frontend/components.md` |
| Redux, Axios, frontend architecture | `docs/technical/frontend/overview.md` |
| AI Advisor | `docs/technical/infrastructure/ai-advisor.md` |
| Integrations (Slack, GitHub) | `docs/technical/infrastructure/integrations.md` |
| Docker & deployment | `docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md` |
| CI/CD workflows | `docs/deployment/README.md` |
| Database schema | `docs/technical/architecture/database-schema.md` |
| Authentication architecture | `docs/technical/architecture/authentication.md` |
| Multi-tenancy architecture | `docs/technical/architecture/multi-tenancy.md` |
| Testing guide | `docs/technical/guides/testing.md` |

---

## Additional Resources

- [Code Rules](./CodeRules/README.md) - Detailed coding standards
- [Plugin System](./docs/PLUGIN_SYSTEM.md) - Plugin architecture
- [Technical Docs](./docs/technical/) - Architecture documentation
- [API Docs](./Servers/swagger.yaml) - OpenAPI specification
- [Agent Roles](./agents/) - AI-assisted development roles
