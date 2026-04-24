# Sheet Insights

Monorepo for the campaign analytics dashboard: a React (Vite) frontend and a FastAPI backend that reads public Google Sheets as CSV.

## Layout

| Path | Role |
|------|------|
| `apps/web` | Dashboard UI (`@workspace/web`) |
| `apps/api-fastapi` | FastAPI backend (`/api`) |
| `apps/mockup-sandbox` | Optional UI sandbox (not required for the product) |
| `packages/api-spec` | OpenAPI spec and Orval codegen |
| `packages/api-zod` | Zod schemas generated from the spec |
| `packages/api-client-react` | React Query client and `customFetch` |
| `packages/db` | Drizzle + PostgreSQL (optional; not used by the sheet API at runtime) |
| `scripts` | Workspace utilities |

## Prerequisites

- Node.js 24+
- Python 3.11+
- [pnpm](https://pnpm.io/) (required by this repo)

## Local development

1. Copy `.env.example` to `.env` at the repo root and adjust values if needed.
2. Install workspace dependencies: `pnpm install`
3. Install FastAPI backend dependencies:
   - `cd apps/api-fastapi`
   - `pip install -e .[dev]`
4. Start API and web together from the repo root: `pnpm dev`

The Vite dev server proxies `/api` to `http://127.0.0.1:${API_PORT}` (default `5000`), so the generated client can keep using relative `/api/...` URLs.

Individual apps:

- `pnpm dev:api` - run FastAPI backend
- `pnpm dev:web` - Vite for the dashboard

## Production

- API (FastAPI): run `python apps/api-fastapi/run.py` with `PORT` set.
- Web: `pnpm --filter @workspace/web run build` - static assets are emitted under `apps/web/dist/public`. Serve that folder behind your CDN or static host. If the API is on another origin, set `VITE_API_BASE_URL` at build time.

## API contract

Regenerate Zod types and the React client after changing `packages/api-spec/openapi.yaml`:

`pnpm --filter @workspace/api-spec run codegen`
