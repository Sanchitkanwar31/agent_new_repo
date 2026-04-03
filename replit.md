# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Call Analytics Dashboard (`artifacts/call-dashboard`)
- React + Vite frontend served at `/`
- Users paste a Google Sheets URL and get an adaptive dashboard
- Auto-detects available columns and shows only relevant charts/metrics
- Supported features: call metrics, sentiment analysis, call direction, call status, bulk call names, join interest, raw data table

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- `/api/sheets/data` — POST: fetches & parses a public Google Sheet CSV, returns rows + column info + detected features
- `/api/sheets/summary` — POST: returns computed aggregates (sentiment breakdown, call direction, durations, etc.)
- No database required — all data is fetched live from Google Sheets

## Notes

- Google Sheets must be set to "Anyone with the link can view" for the dashboard to work
- Supports up to 500 rows for the raw data table (full data used for summary calculations)
- Column detection is fuzzy-matched against known call analytics column patterns
