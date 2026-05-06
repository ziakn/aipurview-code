# GRS Module UI — Design Spec

**Date:** 2026-05-06
**Status:** Approved

---

## Overview

A standalone web UI for the GRS Module that replaces direct CLI and config-file usage. Primary audience: the developer/researcher running the pipeline, with secondary audience of ML teammates. Designed to be easily extracted and integrated into the VerifyWise frontend in the future.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Deployment model | Standalone now, extractable later | Not integrated into VerifyWise yet; components must be portable |
| Primary workflow | Full pipeline runs | Configure → Run → Monitor → Results is the dominant path |
| Config editing | YAML-based (Monaco editor) | Reproducibility requirement; technical users comfortable with YAML |
| Config placement | Hybrid — run params inline, YAML in Configs section | Stage pages stay lean; one place for all YAML editing |
| Progress monitoring | Counts polled from JSONL output files | Infer and judge write output incrementally; no log streaming needed |
| Results in UI | Leaderboard + high-level stats only | Deep inspection stays in existing Streamlit viewer |

---

## Architecture

### Two-process development, single-process production

**Development:**
```
npm run dev      → Vite HMR at localhost:5173 (proxies /api → localhost:8200)
uvicorn app:app  → FastAPI at localhost:8200
```

**Production:**
```
npm run build    → React bundle compiled into ui/backend/static/
uvicorn app:app  → FastAPI serves both API + static files at localhost:8200
```

### Directory layout

```
GRSModule/
  ui/
    backend/           ← FastAPI application
      app.py           ← entry point, mounts router + static files
      routers/
        configs.py     ← GET/PUT config YAML files
        runs.py        ← POST run, GET status, GET history
        progress.py    ← GET progress counts per stage
        results.py     ← GET leaderboard, GET summary
      services/
        runner.py      ← subprocess wrapper around GRS CLI
        watcher.py     ← JSONL file polling for progress counts
        snapshot.py    ← config snapshot writer at run start
      static/          ← compiled React build (gitignored)
    frontend/          ← React + TypeScript application
      src/
        pages/
          Overview.tsx
          StagePage.tsx       ← shared by all 7 stage nav items
          ConfigEditor.tsx    ← shared by all config nav items
          Leaderboard.tsx
          RunHistory.tsx
        components/
          Sidebar.tsx
          PipelineStatusFlow.tsx
          ModelProgressBar.tsx
          StageParamForm.tsx
          YamlEditor.tsx      ← Monaco wrapper
        api/                  ← React Query hooks (useProgress, useRun, useConfig…)
      vite.config.ts          ← proxy /api → localhost:8200
  src/                 ← existing pipeline code (untouched)
  configs/             ← YAML files (read/written by backend)
```

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/configs/{name}` | Read a config YAML file as string |
| `PUT` | `/api/configs/{name}` | Write a config YAML file |
| `POST` | `/api/run` | Start a pipeline run (full or single stage) |
| `DELETE` | `/api/run` | Stop the current run (SIGTERM to subprocess) |
| `GET` | `/api/run/status` | Current run state + active stage |
| `GET` | `/api/progress/{stage}` | Completed + total counts from output JSONL files |
| `GET` | `/api/results/leaderboard` | Parsed `final/leaderboard.json` |
| `GET` | `/api/results/summary` | Per-stage output counts (scenarios, responses, scores) |
| `GET` | `/api/runs` | Run history from `final/manifest.json` entries |

**Run request body:**
```json
{
  "dataset_version": "grs_scenarios_v0.1",
  "stages": ["seeds", "render", "perturb", "validate", "infer", "judge"],
  "params": {
    "seed": 42,
    "per_obligation": 2,
    "k_per_base": 3,
    "coverage": "per_family",
    "temperature": 0.2,
    "max_tokens": 500,
    "limit": null,
    "resume": true,
    "judge_temperature": 0.0
  }
}
```

**Config snapshot:** At run start, `snapshot.py` copies all active YAML files + the run request body into `datasets/<version>/configs_snapshot/run_<timestamp>/`.

---

## Frontend

### Tech stack

- **React 19 + TypeScript** — matches VerifyWise frontend
- **Vite** — dev server with HMR and /api proxy
- **Monaco Editor** (`@monaco-editor/react`) — YAML editing with syntax highlighting
- **React Query (`@tanstack/react-query`)** — API calls and progress polling (2s interval)
- **React Router v6** — client-side routing for sidebar navigation
- **No Redux** — component state + React Query is sufficient

### Sidebar navigation

```
PIPELINE
  /              → Overview
  /stage/seeds
  /stage/render
  /stage/perturb
  /stage/validate
  /stage/infer
  /stage/judge

CONFIGS
  /config/obligations
  /config/mutations
  /config/judge_rubric
  /config/models
  /config/templates

RESULTS
  /results/leaderboard
  /results/history
```

---

## Key Pages

### Overview (`/`)

- **Dataset version** dropdown (derived from `datasets/` directory listing)
- **Seed** input field
- **Stage toggles** — click to include/exclude stages from the run
- **Run Full Pipeline** button → POST `/api/run`
- **Pipeline status flow** — horizontal chain of stage chips: `pending → running (animated) → done / failed`
- **Stats row** — 4 cards: Scenarios · Responses · Scores · Elapsed time
- Stats and pipeline status poll `/api/run/status` every 2s while a run is active

### Stage Page (`/stage/:stage`)

Shared component parameterised by stage name. Content adapts per stage:

- **Run params form** — only the params relevant to this stage (e.g. infer shows temperature, max_tokens, limit, resume toggle)
- **Quick-link** to relevant config file(s) (e.g. infer → `configs/models.yaml`)
- **Run this stage** button → POST `/api/run` with `stages: [stage]`
- **Stop** button (visible while running) → DELETE `/api/run`
- **Progress** (infer + judge only) — per-model progress bars, counts polled from `/api/progress/:stage`
- **Last run status** badge (success / failed / never run)

Stage → relevant config mappings:
| Stage | Config link |
|-------|------------|
| seeds | obligations |
| render | obligations, templates |
| perturb | mutations |
| validate | obligations |
| infer | models |
| judge | judge_rubric, models |

### Config Editor (`/config/:name`)

- **Monaco editor** with YAML language mode, dark theme
- **File path** label (e.g. `configs/obligations.yaml`)
- **Used by** label listing pipeline stages that read this file
- **Save** button → PUT `/api/configs/:name`
- **Reset** button → reloads from disk (discards unsaved edits)
- Unsaved changes indicator in the sidebar nav item

### Leaderboard (`/results/leaderboard`)

- Table: model ID · overall GRS score · per-dimension scores (boundary_management, constraint_adherence, clarity, escalation)
- Dataset version selector (can view past runs)
- Link to open Streamlit viewer for deep scenario inspection

### Run History (`/results/history`)

- List of past runs from manifests: timestamp · stages run · dataset version · status
- Expand a run to see the config snapshot used

---

## Progress Monitoring

Infer and judge write output incrementally to JSONL files. Progress is derived by counting lines:

| Stage | Total | Completed |
|-------|-------|-----------|
| infer | `scenarios.jsonl` line count × model count | lines in each `responses/<model>.jsonl` |
| judge | same total | lines in each `judge_scores/<model>.jsonl` |

`watcher.py` reads these counts on each `/api/progress/:stage` call. No file watchers — polling is sufficient for 2s intervals.

---

## Config Snapshot

On every run start, `snapshot.py` writes:

```
datasets/<version>/configs_snapshot/run_<ISO_timestamp>/
  obligations.yaml
  mutations.yaml
  judge_rubric.yaml
  models.yaml
  templates/
    base_scenarios.yaml
  catalogs/          (all catalog files)
  run_config.json    (the exact POST /api/run body)
```

This supplements the existing manifest + sampling report already written by the pipeline.

---

## VerifyWise Integration Path

When this UI is eventually integrated into VerifyWise:

1. **Frontend**: The React components in `ui/frontend/src/` are moved into the VerifyWise `Clients/` app as a new page/route. No rewrite needed — same React + TypeScript stack.
2. **Backend**: The FastAPI routes in `ui/backend/routers/` are ported to Express controllers in the VerifyWise `Servers/` app, or the FastAPI service is kept as a microservice behind the VerifyWise API gateway.
3. **Config files**: The YAML configs stay in `GRSModule/configs/` and the backend resolves paths relative to the GRSModule root.

---

## Out of Scope

- Real-time log streaming (progress counts are sufficient)
- Editing catalog YAML files (roles, domains, industries — rarely changed)
- Deep scenario / response inspection (stays in Streamlit)
- User authentication (single-user local tool)
- Multi-user / concurrent run support
