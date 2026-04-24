# Contribution Guide

## Project Overview

Sheet Insights is a pnpm-based monorepo for analyzing public Google Sheets and rendering the results as a campaign dashboard.

The active runtime is split into:

- `apps/api-fastapi` - FastAPI backend that fetches a public Google Sheet CSV export, parses it, and returns structured data.
- `apps/web` - React + Vite dashboard that consumes the API and renders charts, tables, and summary cards.
- `apps/mockup-sandbox` - Optional preview server for component experiments and mockup rendering.
- `packages/api-spec` - OpenAPI source of truth and Orval code generation entry point.
- `packages/api-zod` - Generated Zod schemas used by the API and any server-side validation.
- `packages/api-client-react` - Generated React Query client used by the web app.
- `packages/db` - Optional PostgreSQL/Drizzle package. It is not part of the live Google Sheets flow today.
- `scripts` - Workspace utilities and helper commands.

The current request flow is:

1. The user submits a Google Sheets URL in the web app.
2. The web app validates the URL and calls `POST /api/sheets/data`.
3. The API converts the Sheets URL to a CSV export URL, downloads the CSV, parses rows, detects column types, and returns data plus metadata.
4. The dashboard computes campaign-level groupings and visualizations from the returned rows.

The API also exposes `POST /api/sheets/summary` for aggregate consumers, but the current web app does not use that endpoint.

## Folder Structure

### Root

- `package.json` - Workspace scripts and pnpm guardrails.
- `pnpm-workspace.yaml` - Workspace package list and supply-chain policy.
- `.env.example` - Example environment variables for local development and deployment.
- `README.md` - Short project summary and quickstart.

### Apps

- `apps/api-fastapi/app/api/routes` - API route handlers (`health`, `sheets`).
- `apps/api-fastapi/app/services` - Sheet feature business services (fetch, pipeline, summary).
- `apps/api-fastapi/app/middleware` - Cross-cutting middleware and exception handlers.
- `apps/api-fastapi/app/core` - Runtime configuration and logging setup.
- `apps/api-fastapi/app/integrations` - External integrations (Google Sheets CSV fetching).
- `apps/web/src/features` - Feature-first frontend modules (for example `dashboard`).
- `apps/web/src/features/dashboard/components` - Dashboard-only components.
- `apps/web/src/features/dashboard/pages` - Dashboard route pages.
- `apps/web/src/features/dashboard/schemas` - Dashboard form schemas/types.
- `apps/web/src/shared/ui` - Reusable UI primitives.
- `apps/web/src/shared/hooks` - Reusable hooks such as toast/mobile helpers.
- `apps/web/src/shared/lib` - Shared browser-side utilities.
- `apps/web/src/pages` - Non-feature route pages (for example `not-found`).
- `apps/mockup-sandbox/src/.generated` - Auto-generated preview module map (kept isolated).

### Packages

- `packages/api-spec/openapi.yaml` - Source contract for API endpoints and schemas.
- `packages/api-spec/orval.config.ts` - Generator configuration for the client and Zod packages.
- `packages/api-client-react/src/generated` - Generated React Query hooks and request wrappers.
- `packages/api-zod/src/generated` - Generated Zod schemas and types.
- `packages/db/src` - Drizzle database client and schema exports.

### Support and legacy areas

- `attached_assets/` - Shared static assets used by the Vite apps.
- Active product code lives in `apps/` and `packages/`. Legacy root `artifacts/` and `lib/` paths have been removed.

## Setup And Local Development

### Prerequisites

- Node.js 24+ recommended
- pnpm required

Do not use npm or yarn for this repository. The root `preinstall` script blocks non-pnpm installs.

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env` at the repository root and adjust values as needed.

Important variables:

- `PORT` - API port, default `5000`
- `NODE_ENV` - `development` or `production`
- `LOG_LEVEL` - Pino log level
- `HTTP_USER_AGENT` - Optional outbound user agent for Google Sheets fetches
- `VITE_DEV_PORT` - Web dev server port, default `5173`
- `API_PORT` - API port used by the Vite proxy during local development
- `VITE_BASE_PATH` - Base path when serving the web app from a subpath
- `VITE_API_BASE_URL` - Optional API origin when the web app cannot use same-origin `/api`
- `DATABASE_URL` - Only required if you use `packages/db`

### Common Commands

```bash
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm run build
pnpm run typecheck
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
```

Notes:

- `pnpm dev` starts the API and web app together.
- `pnpm run build` runs typecheck first, then builds each workspace package that exposes a build script.
- `pnpm --filter @workspace/api-spec run codegen` regenerates the OpenAPI-derived client and Zod packages after API contract changes.
- `pnpm --filter @workspace/db run push` applies Drizzle schema changes if the database package is being used.

### Production Build

- API: `python apps/api-fastapi/run.py`
- Web: `pnpm --filter @workspace/web run build`

The web build is emitted to `apps/web/dist/public`.

## Coding Standards And Conventions

- Use TypeScript for all new code.
- Keep files ESM-only unless there is a strong reason not to.
- Prefer small, pure functions for parsing and metric computation.
- Keep route handlers thin; move business logic into module-level `services/`.
- Use Zod at the API boundary for request validation.
- Keep generated files in `src/generated` and do not edit them manually.
- Prefer the existing `@/` alias in the web app for local imports.
- Keep shared workspace package names under `@workspace/*`.
- Use `prettier` formatting and keep style changes separate from behavior changes when possible.
- Preserve backward compatibility for API responses unless a contract change is intentional and versioned.

### Generated Code Rules

- Treat `packages/api-spec`, `packages/api-client-react`, and `packages/api-zod` as generated-contract areas.
- Update `packages/api-spec/openapi.yaml` first.
- Regenerate downstream packages immediately after changing the spec.
- Review generated diffs instead of hand-editing generated files.

## Git Workflow

Recommended branch naming:

- `feature/<short-name>`
- `fix/<short-name>`
- `chore/<short-name>`

Recommended commit style:

- Keep commits focused and reviewable.
- Use imperative messages, for example: `add sheet summary validation`.
- Separate generated-contract updates from manual source changes when practical.

Pull request checklist:

- Confirm the API contract matches the implementation.
- Regenerate client and Zod packages when the OpenAPI spec changes.
- Run `pnpm run typecheck`.
- Run the relevant app build(s) if you touched runtime code.
- Add screenshots or screen recordings for UI changes.
- Call out any environment variable changes or migration steps.

## Deployment Guidelines

### API

- Set `PORT` and `NODE_ENV=production`.
- Set `LOG_LEVEL` to the desired verbosity.
- If outbound requests need a custom user agent, set `HTTP_USER_AGENT`.
- Run `python apps/api-fastapi/run.py` with production environment variables.

### Web

- Build with `pnpm --filter @workspace/web run build`.
- Serve `apps/web/dist/public` from a static host or CDN.
- If the API is on another origin, set `VITE_API_BASE_URL` at build time.
- If the site is hosted below `/`, set `VITE_BASE_PATH` consistently in both build and hosting config.

### Database

- Only provision `DATABASE_URL` if the optional Drizzle/PostgreSQL package is part of the deployment.
- Keep migrations and schema changes separate from API releases when possible.

### Security And Operations

- Tighten CORS before exposing the API broadly.
- Keep secrets out of git and out of the frontend bundle.
- Review logging redaction before adding new headers or sensitive fields.
- Add rate limiting and request size limits before public traffic.

## Scaling And Maintenance Best Practices

- Cache or memoize sheet fetches if the same URL is analyzed repeatedly.
- Add request timeouts and abort handling for external Google Sheets fetches.
- Consider streaming or incremental parsing for large sheets.
- Keep client-side and server-side metric heuristics in sync.
- Move repeated pattern matching into shared helpers if more endpoints need the same logic.
- Add automated tests for CSV parsing, column detection, and summary aggregation.
- Add integration coverage for the API endpoints and contract generation.
- Introduce CI that runs install, typecheck, codegen checks, and builds on every pull request.
- Expand observability with request IDs, latency metrics, and upstream fetch timing.
- Treat `apps/mockup-sandbox` as optional tooling and keep it isolated from the production apps.

## Notes For Contributors

- Be careful with changes to the Google Sheets parsing flow. It is the core production path.
- Keep backwards compatibility for existing response shapes whenever possible.
- If you need persistence, design the schema and migrations in `packages/db` before using it in the API.
- Avoid editing legacy or generated artifacts directly unless the repository owner explicitly asks for that.
