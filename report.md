# Sheet-Insights Discovery Report

## Scope
- Objective: repository discovery and high-impact architecture mapping only.
- Constraints applied: minimal token analysis, no deep utility review, no rewrite suggestions, no functionality changes.

## 1. Project Purpose
- The system analyzes call/campaign data from a public Google Sheet URL and renders analytics dashboards in a web UI.
- Core value path: URL input -> CSV fetch/parse -> feature detection + summarization -> interactive dashboard.

## 2. Architecture Style
- Monorepo (pnpm workspace) with app/package separation.
- Runtime is split:
  - Backend: Python FastAPI (`apps/api-fastapi`)
  - Frontend: React + Vite (`apps/web`)
  - Shared contract/client packages: `packages/api-spec`, `packages/api-zod`, `packages/api-client-react`
  - Database package scaffold: `packages/db` (prepared infra, currently not active in business flow)
- Development root command runs backend + frontend concurrently from workspace `package.json`.

## 3. Main Execution Flow
1. User enters Google Sheet URL in dashboard form (`apps/web/src/features/dashboard/pages/home.tsx`).
2. Frontend calls generated client hook (`useFetchSheetData`) from `@workspace/api-client-react`.
3. API request hits FastAPI router under `/api/*` (`apps/api-fastapi/app/api/router.py`).
4. Sheets service loads sheet data:
   - URL normalization and CSV export resolution (`app/integrations/google_sheets.py`)
   - HTTP fetch via `httpx`
   - CSV parsing and column/feature detection (`app/services/csv_parser.py`, `sheet_validation.py`)
5. Backend returns structured rows/columns/features payload.
6. Frontend computes campaign-level aggregations and renders charts/tables.

## 4. Main Modules
- `apps/api-fastapi`
  - Entry: `run.py`, `app/main.py`
  - API layer: `app/api/router.py`, `app/api/routes/health.py`, `app/api/routes/sheets.py`
  - Service layer: `app/services/*` (`sheets_service.py`, `csv_parser.py`, `sheet_summary.py`, `sheet_validation.py`)
  - Integration layer: `app/integrations/google_sheets.py`
  - Contracts: `app/schemas/*`
  - Middleware/cross-cutting: request logging, exception handlers, CORS
- `apps/web`
  - Entry: `src/main.tsx`, `src/App.tsx`
  - Primary feature module: `src/features/dashboard/*`
  - Uses React Query, Wouter, generated API client
- `packages/api-client-react`
  - Generated/typed API client exports + base URL setter
- `packages/api-spec` and `packages/api-zod`
  - Contract and schema generation chain for client/API shape consistency
- `packages/db`
  - Drizzle + pg setup and config, but schema file is currently placeholder

## 5. Entry Points
- Workspace dev orchestration: root `package.json` scripts (`dev`, `dev:api`, `dev:web`)
- Backend app bootstrap: `apps/api-fastapi/app/main.py`
- Frontend bootstrap: `apps/web/src/main.tsx`

## 6. API Layer
- Prefix: `/api`
- Known routes from router/tests:
  - `/api/healthz`
  - `/api/sheets/data`
  - `/api/sheets/summary`
  - fallback catch-all returns JSON 404 under `/api/*`
- Request/response typing is pydantic-based in backend and consumed via generated React client in frontend.

## 7. Database Layer
- Present as package-level infrastructure (`packages/db`) with:
  - `drizzle-orm/node-postgres` client setup
  - env-driven `DATABASE_URL`
  - drizzle config
- Current schema export is placeholder (`packages/db/src/schema/index.ts`), indicating persistence is not currently part of the active request path.

## 8. Service Layer
- Primary service orchestration sits in `apps/api-fastapi/app/services/sheets_service.py`.
- Responsibilities:
  - invoke Google Sheets integration fetch
  - parse CSV
  - build column metadata
  - detect feature flags in dataset
- Additional summarization/validation logic is distributed across `sheet_summary.py` and `sheet_validation.py`.

## 9. External Integrations
- Google Sheets public export endpoint (`docs.google.com/spreadsheets/.../export?format=csv`)
- HTTP client: `httpx`
- Frontend charting and UI libs (Recharts, Radix/shadcn-style components)
- Optional DB integration path prepared via `pg` + Drizzle (not on live data path currently)

## 10. Key Dependencies
- Backend: `fastapi`, `pydantic`, `httpx`, alembic tooling
- Frontend: `react`, `@tanstack/react-query`, `wouter`, `react-hook-form`, `zod`, `recharts`
- Monorepo/tooling: `pnpm`, `typescript`, `concurrently`
- DB package: `drizzle-orm`, `pg`

## 11. Critical Coupling Areas
- Column-name coupling:
  - Business metrics depend on flexible pattern-matching of CSV headers.
  - Any header naming variation can alter detected features and computed stats.
- Contract coupling:
  - Frontend relies on generated client/contracts from package pipeline.
  - API shape drift can break hooks/types quickly if generation is out-of-sync.
- Integration coupling:
  - Core ingestion path depends on public-access Google Sheets behavior and CSV response validity.
- Logic placement coupling:
  - Significant aggregation logic is implemented in frontend dashboard page, coupling UI rendering with business calculations.

## 12. High-Impact Risk Areas
- Data correctness risk from heuristic header detection and client-side aggregation.
- Operational risk from upstream sheet permissions/network errors.
- Architectural drift risk because DB package exists but runtime appears mostly stateless for current flow.
- Large, dense dashboard page creates maintainability pressure for future feature changes.

## 13. Audit Targets (Next Phase)
- `apps/api-fastapi/app/api/routes/sheets.py`
- `apps/api-fastapi/app/services/sheet_validation.py`
- `apps/api-fastapi/app/services/sheet_summary.py`
- `apps/api-fastapi/app/services/csv_parser.py`
- `apps/web/src/features/dashboard/pages/home.tsx`
- Contract chain: `packages/api-spec` -> `packages/api-zod` -> `packages/api-client-react`
- Runtime alignment check: `packages/db` vs active backend data path

## 14. Conclusion
- The system is a contract-driven FastAPI + React analytics pipeline centered on Google Sheets CSV ingestion.
- Current architecture is clear and functional, with highest sensitivity around schema/header heuristics, external sheet accessibility, and frontend-heavy metric computation.
