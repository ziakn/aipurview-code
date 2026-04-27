# Frontend Unit Test Coverage Gap Analysis

> **Generated:** 2026-04-27
> **Branch:** `mo-340-april-27-more-test-coverage`

## Summary

| Category | Existing Tests | New Tests Added | Total |
|----------|---------------|-----------------|-------|
| Application Repositories | 88 | 4 | 92 |
| Application Hooks | 68 | 0 | 68 |
| Application Tools | 10 | 0 | 10 |
| Application Utils | 10 | 0 | 10 |
| Application Validations | 4 | 0 | 4 |
| Application Mappers | 4 | 0 | 4 |
| Application Commands | 2 | 0 | 2 |
| Application Redux | 3 | 4 | 7 |
| Application Config | 0 | 3 | 3 |
| Application Events | 0 | 2 | 2 |
| Application Registry | 0 | 1 | 1 |
| Infrastructure API | 16 | 0 | 16 |
| Infrastructure Exceptions | 1 | 0 | 1 |
| Domain Models | 6 | 0 | 6 |
| Presentation Components | 8 | 65 | 73 |
| Presentation Pages | 2 | 30 | 32 |
| Presentation Tools | 4 | 0 | 4 |
| Presentation Utils | 6 | 0 | 6 |
| Presentation Hooks | 2 | 0 | 2 |
| Presentation Containers | 1 | 0 | 1 |
| **Total** | **235** | **109** | **344** |

---

## Previously Covered (No Action Needed)

### Application Layer
- **Hooks (68 tests):** All hooks covered including useAuth, useDashboard, useProjects, useVendors, useRoles, etc.
- **Repositories (88 tests):** All major repositories covered — auth, entity, project, vendor, policy, task, etc.
- **Tools (10 tests):** alertUtils, downloadResource, error, extractToken, fileDownload, fileUtil, getProjectData, log.engine, stringUtil, userHelpers
- **Utils (10 tests):** dateFormatter, deploymentHelpers, fileErrorHandler, fileTransform, frameworkDataUtils, generateId, greetings, paginationStorage, secureLogger, tableExport
- **Validations (4 tests):** emailAddress, formValidation, selectValidation, stringValidation
- **Mappers (4 tests):** project, task, user, vendor
- **Commands (2 tests):** actionHandler, registry

### Infrastructure Layer
- **API Services (16 tests):** automations, biasAudit, ceMarking, customAxios, deepEval (arena, datasets, orgs, projects, scorers), evalModels, evaluationLlmApiKeys, evaluationLogs, networkServices, postMarketMonitoring, search
- **Exceptions (1 test):** customException

### Domain Layer
- **Models (6 tests):** Common models, Common business logic, EU AI Act, ISO 27001, ISO 42001, AI Detection risk scoring

### Presentation Layer
- **Components (8 tests):** Alert, Checkbox, CommandPalette, Field, FileUpload, ProtectedRoute, Sidebar, Table
- **Pages (2 tests):** Login, IntegratedDashboard
- **Tools (4 tests):** fairCalculator, isoDateToString, riskCalculator, stringToColor
- **Utils (6 tests):** browserDownload, cardEnhancements, providers, riskClassification, statusColors, tabUtils
- **Hooks (2 tests):** usePersistedViewMode, userMap
- **Containers (1 test):** Dashboard

---

## New Tests Added (This Session)

### Application Layer — 14 new tests

| File | Test Path |
|------|-----------|
| `redux/store.ts` | `redux/__tests__/store.test.ts` |
| `redux/auth/authTransform.ts` | `redux/auth/__tests__/authTransform.test.ts` |
| `redux/auth/getAuthToken.ts` | `redux/auth/__tests__/getAuthToken.test.ts` |
| `config/queryClient.ts` | `config/__tests__/queryClient.test.ts` |
| `config/entityTips.ts` | `config/__tests__/entityTips.test.ts` |
| `config/routes.tsx` | `config/__tests__/routes.test.tsx` |
| `events/aiActionEvents.ts` | `events/__tests__/aiActionEvents.test.ts` |
| `events/fileEvents.ts` | `events/__tests__/fileEvents.test.ts` |
| `registry/builtinPlugins.registry.ts` | `registry/__tests__/builtinPlugins.registry.test.ts` |
| `repository/fria.repository.ts` | `repository/tests/fria.repository.test.ts` |
| `repository/modelEvaluations.repository.ts` | `repository/tests/modelEvaluations.repository.test.ts` |
| `repository/quantitativeRisk.repository.ts` | `repository/tests/quantitativeRisk.repository.test.ts` |
| `repository/superAdmin.repository.ts` | `repository/tests/superAdmin.repository.test.ts` |

### Presentation Components — 65 new tests

ActivityItem, AppSwitcher, Avatar, breadcrumbs, button, button-toggle, Cards/DashboardCard, Cards/StatCard, Charts, Checks, Chip, ChunkErrorBoundary, CreateDemoData, CustomSelect, Dashboard, DemoBanner, Dialogs/ConfirmationModal, EditableText, EmptyState, EmptyStateMessage, EnhancedTooltip, FeatureVideos, FileIcon, FlyingHearts, FrameworkProgress, Helpers, InfoBox, Layout, Link/VWLink, LinkedModelsView, LinkedRisks, LogLine, MetricInfoIcon, MetricSection, NoProject, Notes, PageTour, PluginCard, Policies, Popup, ProviderIcons, QuantitativeRiskForm, RadioGroup, ReadyToSubscribeBox, RiskBadge, RiskLevel, RiskPopup, RiskVisualization, SectionSidebar, SelectableCard, ShareViewDropdown, Skeletons, StatusDropdown, StepProgressDialog, TabBar, TablePagination, Tags, Toast, UpdateBanner, Uploader, VendorLogo, VerifyWiseMultiSelect, ViewRelationshipsButton, ViewToggle, VWTooltip

### Presentation Pages — 30 new tests

AgentDiscovery, AIDetection, AIGateway, AITrustCenter, AITrustCentrePublic, ApprovalWorkflows, Assessment, Authentication/ForgotPassword, Authentication/RegisterAdmin, Automations, ComplianceTracker, Datasets, EntityGraph, EvalsDashboard, FileManager, Framework, Home, IncidentManagement, IntakeFormBuilder, ISO/Clause, ModelInventory, PageNotFound, Plugins, PolicyDashboard, PostMarketMonitoring, ProjectView, PublicIntakeForm, Reporting, RiskManagement, SettingsPage, ShadowAI, SharedView, StartHere, SuperAdmin, Tasks, TrainingRegistar, Vendors, WatchTower, WizardShowcase

---

## Remaining Gaps (Not Covered Yet)

### Application Layer
- **Contexts (7 files):** AdvisorConversation, AIDetectionSidebar, AIGatewaySidebar, EvalsSidebar, PluginRegistry, ShadowAISidebar, VerifyWise — mostly `createContext` calls, low testing value
- **DTOs (4 files):** Type-only files, no runtime logic to test
- **Interfaces / Types:** Type-only files, no runtime logic to test
- **Constants (5 files):** Static data exports, low testing value

### Presentation Layer
- **Structures (~29 files):** AssessmentTracker, ComplianceTracker structures — data transformation files
- **Themes (9 files):** Pure MUI theme objects, no logic
- **Styles (1 file):** CSS-in-JS constants

### Components Not Tested (complex, require significant mocking)
- AddNewRiskForm, AddNewRiskIBMForm, AddNewRiskMITForm, AddNewVendorRiskForm
- AdvisorChat, AIDepGraph, AIDepGraphModal
- AnalyticsDrawer, ContextSidebar, CreateProjectForm
- EntityGraphModal, EntityLinkSelector, FilePickerModal
- Forms, FrameworkFilter, IconButton
- MegaDropdown, Modals, ModelInventoryHistory, ModelRisksDialog
- NotificationBell, Onboarding, OrgSwitcher
- PluginLoader, PluginSlot, ProjectCard, ProjectRiskMitigation, ProjectsList
- ReadOnlyBanner, Reporting, RichTextEditor
- RiskDatabaseModal, Risks, RisksView
- Search, SuperAdminSidebar, TipBox, UserGuide
- VendorRisksDialog, VWQuestion
