# Sheet Insights

Monorepo for a React + FastAPI product that analyzes public Google Sheets and includes a Razorpay-based billing flow.

## What is in the repo

| Path | Role |
|------|------|
| `apps/web` | Vite + React frontend |
| `apps/api_fastapi` | FastAPI backend |
| `apps/mockup-sandbox` | Optional UI sandbox |
| `packages/api-spec` | OpenAPI spec used for codegen |
| `packages/api-zod` | Generated Zod schemas |
| `packages/api-client-react` | Generated React client |
| `packages/db` | Shared database package, not the FastAPI runtime DB layer |

## Runtime overview

The production backend currently depends on:

- PostgreSQL via `DATABASE_URL`
- Razorpay API and webhooks
- Transfer API for credit transfer
- Reseller organizations API
- Public Google Sheets CSV access

The backend is designed to run as a long-lived service. The frontend can be hosted statically.

## Local development

### Prerequisites

- Node.js 24+
- Python 3.11+
- `pnpm`

### Setup

1. Copy `.env.example` to `.env` at the repo root.
2. Install workspace dependencies:

```bash
pnpm install
```

3. Install backend dependencies:

```bash
cd apps/api_fastapi
pip install -e .[dev]
```

4. Start both apps:

```bash
pnpm dev
```

The Vite dev server proxies `/api` to the backend port configured in `.env`.

### Individual apps

- `pnpm dev:api` - FastAPI backend
- `pnpm dev:web` - Vite frontend

## Backend details

The active FastAPI app lives in `apps/api_fastapi/app`.

Important runtime notes:

- SQLAlchemy `Base` is defined in `apps/api_fastapi/app/db/base.py`
- Engine and session creation are lazy and live in `apps/api_fastapi/app/db/session.py`
- Alembic is the source of truth for schema changes
- The root Alembic config is the one used for migrations
- The legacy `apps/api_fastapi/alembic` tree is not the production migration entrypoint

Health endpoint:

- `GET /api/healthz`

Billing endpoints:

- `GET /api/v1/billing/plans`
- `POST /api/v1/billing/razorpay/orders`
- `POST /api/v1/billing/razorpay/webhook`

## Environment variables

### Backend

```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:password@host:5432/dbname
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_API_URL=https://api.razorpay.com/v1
TRANSFER_API_URL=https://...
TRANSFER_API_KEY=...
RESELLER_ORGANIZATIONS_URL=https://...
HTTP_USER_AGENT=SheetInsights/1.0
```

### Frontend

```env
VITE_API_BASE_URL=https://api.example.com
VITE_BASE_PATH=/
```

## Migrations

Use the root Alembic config from the repository root:

```bash
alembic upgrade head
```

Notes:

- Run migrations against an existing PostgreSQL database.
- Do not rely on FastAPI startup for schema creation.
- Do not use `apps/api_fastapi/alembic` for deployment.

## Production deployment

Recommended AWS layout:

- Frontend: S3 + CloudFront
- Backend: ECS Fargate behind an ALB
- Database: RDS PostgreSQL
- Secrets: AWS Secrets Manager or SSM Parameter Store

Deployment flow:

1. Build and test frontend and backend.
2. Build backend Docker image and push to ECR.
3. Run Alembic migrations.
4. Deploy backend service to ECS.
5. Upload frontend build to S3 and invalidate CloudFront.
6. Smoke test the backend health and billing routes.

## Billing and webhook notes

The billing flow is designed around:

- Razorpay signature verification
- row-level locking on payment orders
- idempotent transfer execution keyed by Razorpay payment ID
- retry-safe webhook handling

For production, keep the webhook endpoint reachable and apply rate limiting/WAF controls.

## API contract

If you change `packages/api-spec/openapi.yaml`, regenerate the clients:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Helpful commands

```bash
pnpm build
pnpm typecheck
pnpm dev
pnpm dev:api
pnpm dev:web
```

