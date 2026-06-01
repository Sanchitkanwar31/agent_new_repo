# FastAPI Backend (`apps/api_fastapi`)

This is the backend service for Sheet Insights.

## Goals

- Keep the same `/api` route contract used by the frontend.
- Preserve endpoint behavior and response payload shapes.
- Keep Google Sheets ingestion and summary logic unchanged.
- Provide production-ready Python architecture with clear separation of concerns.

## Run locally

1. Create a Python 3.11+ virtualenv.
2. Install dependencies:
   - `pip install -e .[dev]`
3. Start API server:
   - `python run.py`

The API runs on `PORT` (default `5000`) and exposes:

- `GET /api/healthz`
- `POST /api/sheets/data`
- `POST /api/sheets/summary`

## Notes about database layer

The current runtime sheet API does not persist data into PostgreSQL. This mirrors
the current TypeScript backend state where `packages/db/src/schema/index.ts` is
empty. SQLAlchemy session/base and Alembic scaffolding are still provided for
future table mappings without changing schema behavior today.
