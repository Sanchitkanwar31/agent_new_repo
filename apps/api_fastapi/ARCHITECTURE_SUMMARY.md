# api_fastapi Architecture Summary

## 1. Purpose
`api_fastapi` is the backend API service for the Sheet Insights project. It exposes HTTP endpoints for sheet loading, sheet summarization, health checks, and billing-related operations.

## 2. Top-level structure
- `app/main.py` — FastAPI application startup.
- `app/api/router.py` — central API router that mounts all route groups.
- `app/api/routes/` — individual route modules.
- `app/services/` — business logic and data processing services.
- `app/integrations/` — external service adapters (Google Sheets fetch logic).
- `app/schemas/` — request and response Pydantic models.
- `app/utils/` — shared config and logging utilities.
- `app/middleware/` — request logging and exception handling.
- `app/db/` and `app/model/` — database session and ORM model definitions.

## 3. Main application flow
1. `app/main.py` creates the FastAPI app.
2. Middleware is added:
   - `RequestLoggingMiddleware` logs every incoming request and response.
   - `CORSMiddleware` allows cross-origin calls.
3. API routers are mounted via `app/api/router.py`.
4. Custom exception handling is registered.
5. A root health route (`/`) and a static billing page route (`/billing`) are defined directly in `main.py`.

## 4. API routing layout
- `app/api/router.py` contains `api_router` with prefix `/api`.
- It includes three routers:
  - `health_router` → `/healthz`
  - `sheets_router` → `/sheets/data` and `/sheets/summary`
  - `billing_router` → `/api/v1/*` billing endpoints
- A catch-all route returns `404` for unknown API paths.

## 5. Schema layer
- `app/schemas/health.py` defines `HealthStatus` for health checks.
- `app/schemas/sheets.py` defines input and output models for sheet requests:
  - `FetchSheetRequest`
  - `SheetDataResponse`
  - `SheetSummaryResponse`
- Billing schemas are referenced from `app/schemas/user_schema.py` for Razorpay order requests.

## 6. Service layer
- `app/services/sheets_service.py`
  - orchestrates sheet loading from Google Sheets, CSV parsing, column information generation, and feature detection.
- `app/services/csv_parser.py`
  - parses raw CSV text into header and row structures.
- `app/services/sheet_validation.py`
  - detects column types and feature flags based on header names.
- `app/services/sheet_summary.py`
  - builds the response payload for sheet summaries.
- `app/services/payment_service.py`, `credit_transfer_service.py`, `user_entry_service.py`, and `transfer_service.py`
  - support billing workflows and database-backed payment flows.

## 7. Integration layer
- `app/integrations/google_sheets.py`
  - converts Google Sheets URLs into CSV export URLs.
  - fetches CSV text using `httpx`.
  - detects invalid or inaccessible sheets and raises appropriate HTTP errors.

## 8. Billing architecture and external dependencies
- `app/api/routes/billing.py` exposes billing endpoints for:
  - fetching billing plans
  - listing organizations
  - retrieving organization details
- It relies on:
  - `app.utils.config.Settings` for Razorpay and reseller API configuration
  - `httpx.AsyncClient` for external REST calls
  - database session helpers from `app.db.base.get_db`
  - ORM models such as `RazorpayPaymentOrder`
- The billing router is configured under prefix `/api/v1`.

## 9. Database and persistence
- `app/db/session.py` sets up SQLAlchemy engine and session factory.
- `app/model/models.py` defines ORM models such as:
  - `CreditTransaction`
  - `RazorpayPaymentOrder`
- `app/db/base.py` exposes `get_db` for dependency injection, while the SQLAlchemy base class is defined in `app/db/session.py`.

## 10. Configuration and logging
- `app/utils/config.py` defines `Settings` using `pydantic.BaseSettings`.
  - loads values from `.env` and environment variables
  - includes billing plan defaults and payment configuration
- `app/utils/logging.py` configures structured JSON-style logging
  - used by middleware and exception handlers

## 11. Key design patterns
- Layered separation: API routes, business services, external adapters, schemas, and infrastructure are separated into focused modules.
- Dependency injection: database sessions and settings are loaded through shared helpers.
- Async I/O: external sheet fetching and HTTP calls use `async` functions for concurrency.
- Validation: Pydantic schemas validate request payloads and response shapes.

## 12. How to explain it briefly
- `api_fastapi` is a FastAPI backend that serves data from Google Sheets and billing services.
- The app starts in `app/main.py`, adds middleware, and mounts route groups.
- Sheet operations are handled by `sheets_service` and `google_sheets` integration.
- Billing operations call external reseller services and use SQLAlchemy models for persistence.
- Shared config, logging, and error handling keep the service consistent.

## 13. Notes
- The project contains some commented-out legacy code in billing and DB layers.
- The actual sheet API endpoints are `/api/sheets/data` and `/api/sheets/summary`.
- Billing endpoints are under `/api/v1` and include plan and organization operations.
