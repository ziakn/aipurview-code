# AIPurview Plugin System

This document covers the plugin system architecture in the AIPurview application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Integration](#frontend-integration)
4. [Backend Integration](#backend-integration)
5. [Plugin Slots](#plugin-slots)
6. [Framework Plugins](#framework-plugins)
7. [Configuration](#configuration)

---

## Overview

AIPurview supports a plugin system that allows extending functionality through:

- **Integration plugins**: Connect external services (Slack, MLflow, Azure AI)
- **Data plugins**: Import/export capabilities (Risk Import)
- **Framework plugins**: Compliance frameworks (SOC 2, GDPR, HIPAA, etc.)

Plugins are hosted in the [plugin-marketplace](https://github.com/bluewave-labs/plugin-marketplace) repository.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AIPurview App                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PluginSlot  │  │PluginLoader │  │PluginRegistry│       │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Backend (Express)                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │PluginService│  │PluginRoutes │  │PluginCache  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Plugin Marketplace (GitHub)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ plugins.json│  │ Plugin Code │  │  Plugin UI  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Plugin Discovery**: Backend fetches `plugins.json` from marketplace
2. **Installation**: User installs plugin → backend downloads code
3. **UI Loading**: Frontend loads plugin UI bundle dynamically
4. **Rendering**: PluginSlot components render plugin UI at designated locations

---

## Frontend Integration

### Key Files

| File | Purpose |
|------|---------|
| `Clients/src/application/contexts/PluginRegistry.context.tsx` | Plugin state management |
| `Clients/src/presentation/components/PluginSlot/index.tsx` | Renders plugins at slots |
| `Clients/src/presentation/components/PluginLoader/index.tsx` | Dynamic UI loading |
| `Clients/src/presentation/pages/Plugins/index.tsx` | Plugin marketplace page |
| `Clients/src/domain/types/plugins.ts` | TypeScript definitions |

### Plugin Type Definition

```typescript
// Clients/src/domain/types/plugins.ts

export interface Plugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: PluginCategory;
  region?: string;              // For framework plugins
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: PluginFeature[];
  tags: string[];
  pluginPath?: string;
  entryPoint?: string;
  installationId?: number;
  installationStatus?: PluginInstallationStatus;
  installedAt?: string;
}
```

### PluginSlot Component

Renders plugin UI at designated locations:

```tsx
import { PluginSlot } from "@/presentation/components/PluginSlot";

// In your component
<PluginSlot
  slotId="page.controls.custom-framework"
  project={project}
  // Additional props passed to plugin components
/>
```

### PluginRegistry Context

Manages plugin state across the app:

```tsx
import { usePluginRegistry } from "@/application/contexts/PluginRegistry.context";

const { installedPlugins, getPluginsForSlot, isPluginInstalled } = usePluginRegistry();
```

---

## Backend Integration

### Key Files

| File | Purpose |
|------|---------|
| `Servers/services/plugin/pluginService.ts` | Core plugin operations |
| `Servers/routes/plugin.route.ts` | Plugin API endpoints |
| `Servers/utils/pluginInstallation.utils.ts` | Installation helpers |
| `Servers/temp/plugins/` | Cached plugin code |

### Plugin Service

```typescript
// Servers/services/plugin/pluginService.ts

export class PluginService {
  // Fetch all plugins from marketplace
  static async getAllPlugins(category?: string): Promise<Plugin[]>

  // Get single plugin
  static async getPluginByKey(pluginKey: string): Promise<Plugin | null>

  // Install plugin for tenant
  static async installPlugin(pluginKey: string, userId: number, tenantId: string)

  // Uninstall plugin
  static async uninstallPlugin(installationId: number, userId: number, tenantId: string)

  // Forward request to plugin router
  static async forwardToPlugin(pluginKey: string, context: PluginRouteContext)
}
```

### Plugin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plugins` | GET | List all plugins |
| `/api/plugins/:key` | GET | Get plugin details |
| `/api/plugins/:key/install` | POST | Install plugin |
| `/api/plugins/:key/uninstall` | POST | Uninstall plugin |
| `/api/plugins/:key/*` | * | Forward to plugin router |

### Plugin Caching

Plugins are cached in `Servers/temp/plugins/` for 5 days:

```
Servers/temp/plugins/
├── slack/
│   ├── index.ts
│   ├── package.json
│   ├── node_modules/
│   └── ui/dist/
├── mlflow/
│   └── ...
└── soc2/
    └── ...
```

To force refresh, delete the cached plugin directory.

---

## Plugin Slots

### Available Slots

| Slot ID | Location | Purpose |
|---------|----------|---------|
| `page.risks.actions` | Risk Management | "Insert From" menu items |
| `page.models.tabs` | Model Inventory | Additional tabs |
| `page.plugin.config` | Plugin Management | Configuration UI |
| `page.settings.tabs` | Settings Page | Settings tabs |
| `modal.framework.selection` | Add Framework Modal | Framework cards |
| `page.controls.custom-framework` | Org Controls | Framework controls |
| `page.project-controls.custom-framework` | Project Controls | Framework controls |
| `page.framework-dashboard.custom` | Framework Dashboard | Statistics |
| `page.project-overview.custom-framework` | Project Overview | Progress cards |
| `page.org-framework.management` | Framework Settings | Management UI |

### Using PluginSlot

```tsx
// Basic usage
<PluginSlot slotId="page.controls.custom-framework" />

// With context props
<PluginSlot
  slotId="page.controls.custom-framework"
  project={project}
  apiServices={apiServices}
  onRefresh={handleRefresh}
/>

// Conditional rendering
{isPluginInstalled("soc2") && (
  <PluginSlot slotId="page.controls.custom-framework" project={project} />
)}
```

---

## Framework Plugins

Framework plugins appear in the dedicated "Frameworks" tab on the Plugins page.

### Identification

Plugins are identified as frameworks if:
- `category === "compliance"`, OR
- `tags` includes "compliance" or "framework"

### Region Grouping

Frameworks are grouped by geographic region:

```typescript
// Clients/src/presentation/pages/Plugins/index.tsx

const regionFlags: Record<string, string> = {
  "International": "🌐",
  "United States": "🇺🇸",
  "European Union": "🇪🇺",
  "Canada": "🇨🇦",
  "United Kingdom": "🇬🇧",
  "Australia": "🇦🇺",
  "Singapore": "🇸🇬",
  "India": "🇮🇳",
  "Japan": "🇯🇵",
  "Brazil": "🇧🇷",
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  "Qatar": "🇶🇦",
  "Bahrain": "🇧🇭",
  "Other": "📋",
};
```

### Adding a New Region

1. Add `region` field to plugin in `plugins.json`
2. Add flag to `regionFlags` mapping in `Plugins/index.tsx`

### Framework Tab Features

- Grouped by region with flags
- Sorted: International first, Other last, alphabetically otherwise
- Shows plugin cards with install status
- Separate from general marketplace

---

## Configuration

### Environment Variables

```bash
# Backend: Plugin marketplace URL
PLUGIN_MARKETPLACE_URL=https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/plugins.json
```

### Plugin Installation Database

```sql
-- plugin_installations table
CREATE TABLE plugin_installations (
  id SERIAL PRIMARY KEY,
  plugin_key VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'installed',
  configuration JSONB DEFAULT '{}',
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Event System

Plugins communicate via DOM events for loose coupling:

### Dispatching Events

```typescript
// In plugin component
window.dispatchEvent(
  new CustomEvent("customFrameworkChanged", {
    detail: { projectId: project.id }
  })
);
```

### Listening to Events

```typescript
// In app component
useEffect(() => {
  const handler = (event: CustomEvent) => {
    if (event.detail?.projectId === project.id) {
      refetchData();
    }
  };

  window.addEventListener("customFrameworkChanged", handler);
  return () => window.removeEventListener("customFrameworkChanged", handler);
}, [project.id]);
```

### Common Events

| Event | Purpose | Detail |
|-------|---------|--------|
| `customFrameworkChanged` | Framework added/removed | `{ projectId }` |
| `customFrameworkCountChanged` | Count updated | `{ projectId, count }` |

---

## Troubleshooting

### Plugin Not Loading

1. Check browser console for errors
2. Verify plugin is installed (`/api/plugins` shows installation)
3. Check UI bundle URL is accessible
4. Clear browser cache

### Plugin UI Not Rendering

1. Verify `slotId` matches plugin configuration
2. Check `PluginSlot` component is mounted
3. Ensure plugin exports components with correct names

### API Requests Failing

1. Check plugin is installed for tenant
2. Verify route pattern matches plugin router
3. Check plugin code is cached (`Servers/temp/plugins/`)

### Framework Not in Correct Region

1. Verify `region` field in `plugins.json`
2. Check region name exactly matches `regionFlags` key
3. Region names are case-sensitive

---

## Development Tips

### Testing Plugins Locally

1. Build plugin code
2. Copy to cache: `cp -r plugin-marketplace/plugins/my-plugin Servers/temp/plugins/`
3. Restart server

### Debugging Plugin Code

```typescript
// In plugin code
console.log(`[MyPlugin] Debug message`, { context });
```

Check server logs for plugin console output.

### Hot Reloading

Plugin UI changes require:
1. Rebuild UI bundle
2. Copy to cache
3. Hard refresh browser (Ctrl+Shift+R)
