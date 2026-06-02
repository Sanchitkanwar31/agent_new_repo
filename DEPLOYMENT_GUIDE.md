# Sheet Insights Production Deployment Guide

This guide is based on the actual repository structure and the current FastAPI, SQLAlchemy, Alembic, PostgreSQL, billing, webhook, and frontend implementation.

## 1. Deployment Readiness Assessment

### 1.1 What runs continuously
- FastAPI backend must stay online continuously.
- PostgreSQL must stay online continuously.
- Razorpay webhook processing happens inside the FastAPI app, so the API must be reachable at all times.
- Frontend can be static and highly cached, but the billing UI should remain publicly available.

### 1.2 Can this be serverless?
- Frontend: yes.
- Backend: not a good serverless fit in this codebase.
- Reason: SQLAlchemy sessions, Alembic migrations, synchronous payment order creation, webhook processing, row locking, and external transfer calls fit a long-lived container service better than a function-only platform.

### 1.3 Is Vercel suitable?
- Frontend only: yes.
- Full system: no.
- Technical reasons:
  - The backend is a stateful FastAPI service with PostgreSQL.
  - Billing order creation and webhook handling need stable runtime behavior.
  - The payment flow relies on database row locking and retry-safe state transitions.
  - The system depends on outbound calls to Razorpay, transfer API, reseller org API, and Google Sheets.
- Better AWS service for backend: ECS Fargate behind an ALB.

### 1.4 External dependencies in this repo
- PostgreSQL via `DATABASE_URL`
- Razorpay API and checkout script
- Razorpay webhook callbacks
- Transfer API via `TRANSFER_API_URL` and `TRANSFER_API_KEY`
- Reseller organizations API via `RESELLER_ORGANIZATIONS_URL`
- Public Google Sheets CSV fetches from `docs.google.com`
- Google Fonts in the frontend

### 1.5 Current deployment blockers
- No backend Dockerfile exists yet.
- Frontend env mismatch exists in code:
  - `apps/web/src/main.tsx` reads `VITE_API_BASE_URL`
  - `apps/web/src/features/billing/bill_comp/api.ts` reads `VITE_API_BASE`
- `apps/api_fastapi/app/main.py` still exposes `/billing` via `FileResponse`, but `apps/api_fastapi/app/static/billing.html` does not exist.
- Wildcard CORS is still too broad for production.
- Google Sheets fetch uses `timeout=None`.
- Only the root Alembic flow should be used for production migrations.
- The legacy `apps/api_fastapi/alembic` tree should not be used for deployment.

## 2. Recommended AWS Architecture

### 2.1 Backend
- Use ECS Fargate for `apps/api_fastapi`.
- Put the service behind an Application Load Balancer.
- Run at least 2 tasks in production for availability.
- Use CloudWatch Logs for stdout/stderr.

### 2.2 Database
- Use Amazon RDS PostgreSQL.
- Place RDS in private subnets.
- Enable Multi-AZ for production.
- Enable backups and deletion protection.
- Use RDS Proxy if you want better connection pooling with SQLAlchemy.

### 2.3 Frontend
- Use S3 + CloudFront for `apps/web`.
- Build the Vite app to static assets.
- Use Route 53 for the custom domain.
- Use ACM for SSL.

### 2.4 Networking
- Public subnets:
  - ALB
  - NAT Gateway
- Private subnets:
  - ECS tasks
  - RDS PostgreSQL
- Security groups:
  - ALB accepts 443 from the internet
  - ECS accepts only from ALB
  - RDS accepts only from ECS or RDS Proxy

### 2.5 Domain and SSL
- Use `app.example.com` for frontend.
- Use `api.example.com` for backend.
- Use ACM certificates:
  - CloudFront cert in `us-east-1`
  - ALB cert in the application region

## 3. Repository Changes Required Before Deployment

### 3.1 Backend code
- Keep `apps/api_fastapi/app/db/base.py` as the single `DeclarativeBase` source.
- Keep `apps/api_fastapi/app/db/session.py` lazy only.
- Do not create the SQLAlchemy engine at import time.
- Do not run `create_all()` during app startup.
- Use Alembic only for schema creation and schema changes.
- Keep the canonical webhook endpoint only once.
- Preserve the payment order state flow:
  - `INIT`
  - `PENDING`
  - `PROCESSING`
  - `SUCCESS` or `FAILED`

### 3.2 Frontend code
- Standardize on one API env name.
- The repo currently needs the frontend API base variable aligned between:
  - `apps/web/src/main.tsx`
  - `apps/web/src/features/billing/bill_comp/api.ts`
- The billing UI must point to the correct backend origin in production.

### 3.3 Config
Recommended production env vars:

```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_API_URL=https://api.razorpay.com/v1
TRANSFER_API_URL=https://...
TRANSFER_API_KEY=...
RESELLER_ORGANIZATIONS_URL=https://...
HTTP_USER_AGENT=SheetInsights/1.0
```

Frontend build env vars:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_BASE_PATH=/
```

### 3.4 Docker
- Backend Dockerfile is required.
- Frontend is static and does not need a runtime container if deployed to S3 + CloudFront.

### 3.5 Health checks
- Backend health endpoint exists at `GET /api/healthz`.
- Use that for ALB target health checks.

## 4. AWS Infrastructure Setup

### 4.1 IAM
- ECS task execution role:
  - pull from ECR
  - write CloudWatch logs
- ECS task role:
  - read Secrets Manager values
  - access any needed AWS APIs if added later
- GitHub Actions role:
  - push to ECR
  - update ECS service
  - read secrets if needed for deploy-time injection

### 4.2 VPC
- 2 or 3 AZs.
- Public subnets for ALB and NAT Gateway.
- Private subnets for ECS and RDS.
- Prefer no public IPs on ECS tasks.

### 4.3 Security groups
- ALB SG: inbound 443 from internet, outbound to ECS.
- ECS SG: inbound only from ALB SG.
- RDS SG: inbound only from ECS SG or RDS Proxy SG.

### 4.4 Database setup
- Create RDS PostgreSQL first.
- Then run Alembic migrations.
- Do not rely on app startup to create schema.

### 4.5 Secrets management
- Store secrets in AWS Secrets Manager or SSM Parameter Store.
- Do not hardcode Razorpay or transfer credentials into the image.

### 4.6 ECR
- Create one ECR repository for the backend image.
- Tag images with commit SHA and release tag.

### 4.7 Compute
- ECS Fargate service for backend.
- Desired count: 2 for production.
- CPU/memory sizing should account for CSV parsing and concurrent webhook/order traffic.

### 4.8 DNS and SSL
- Route 53 for custom domains.
- ACM for certificates.
- Frontend via CloudFront.
- Backend via ALB.

## 5. Deployment Pipeline

### 5.1 Suggested flow
1. Merge to main.
2. CI runs tests.
3. Build backend image.
4. Push backend image to ECR.
5. Deploy a one-off migration task or job.
6. Update ECS service to the new task definition.
7. Build frontend static bundle.
8. Upload frontend artifacts to S3.
9. Invalidate CloudFront cache.
10. Smoke test backend and billing paths.

### 5.2 GitHub Actions recommendations
- Frontend:
  - install via pnpm
  - typecheck
  - build
- Backend:
  - install Python dependencies
  - run tests
  - build Docker image
  - push to ECR
  - run Alembic migration step
  - update ECS service

### 5.3 Rollback strategy
- Backend rollback:
  - revert ECS service to previous task definition
  - if a migration was destructive, restore from snapshot
- Frontend rollback:
  - restore previous S3 deployment
  - invalidate CloudFront

## 6. Database and Migrations

### 6.1 Migration flow
- Use the root `alembic.ini` and root `alembic/env.py`.
- Do not use `apps/api_fastapi/alembic` for production deployment.
- `models_import.py` is the controlled model-registration hook for Alembic metadata discovery.

### 6.2 Safe migration strategy
- Start RDS first.
- Set `DATABASE_URL`.
- Run:

```bash
alembic upgrade head
```

- Only then update or start the backend service.

### 6.3 Rollback considerations
- Prefer database snapshot restore for destructive schema mistakes.
- Do not depend on app startup to repair schema.

## 7. Security

### 7.1 Secret handling
- Keep all secrets in Secrets Manager or Parameter Store.
- Never commit `.env` to git.

### 7.2 Webhook security
- Razorpay webhook signature verification is required.
- Keep one canonical webhook endpoint only.
- Do not expose duplicate webhook paths.

### 7.3 CORS
- Replace wildcard CORS with explicit frontend origins in production.

### 7.4 Authentication
- Public billing routes are currently unauthenticated.
- Protect with WAF and rate limiting.
- If future auth is added, it should not break webhook delivery.

### 7.5 Rate limiting
- Use AWS WAF rate-based rules on:
  - billing order creation
  - webhook endpoint
- This is important because the code accepts public requests on those routes.

## 8. Monitoring

### 8.1 Logging
- The backend already emits structured JSON logs to stdout.
- Send those logs to CloudWatch Logs from ECS.

### 8.2 Health monitoring
- Use `GET /api/healthz` for ALB target checks.

### 8.3 Metrics and alerts
- ECS task restarts
- ALB 5xx spikes
- p95 latency
- RDS CPU
- RDS connections
- RDS storage
- Webhook failure rate

### 8.4 Error tracking
- Not present in the repo.
- Sentry is optional.

## 9. Production Behavior Notes

### 9.1 Webhook and payment concurrency
- Different payment orders are isolated by row-level locking.
- The same payment retried concurrently should resolve to one transfer only.
- Transfer execution uses a stable idempotency key derived from the Razorpay payment id.

### 9.2 Stuck processing rows
- The current flow is retry-safe against duplicates, but a separate reconciliation job would be needed to recover stale `PROCESSING` rows after a crash.

### 9.3 Two users paying at the same time
- They are processed independently because each payment maps to a separate `RazorpayPaymentOrder` row.
- One user’s lock does not block another user’s transfer.

## 10. Exact Implementation-Ready Deployment Checklist

### Required
- Fix the frontend API env mismatch.
- Remove or repair the missing backend `/billing` file route.
- Add a backend Dockerfile.
- Use the root Alembic path only.
- Create the RDS PostgreSQL database first.
- Set `DATABASE_URL` in Secrets Manager or ECS environment.
- Run `alembic upgrade head` before service rollout.
- Deploy backend on ECS Fargate behind ALB.
- Deploy frontend to S3 + CloudFront.
- Lock down CORS to the real frontend domain.

### Recommended
- Add RDS Proxy.
- Add WAF rate limits.
- Add a stale `PROCESSING` reconciliation job.
- Add deployment smoke tests for:
  - `GET /api/healthz`
  - `GET /api/v1/billing/plans`
  - `POST /api/v1/billing/razorpay/orders`

### Optional
- Use blue/green ECS deployment.
- Add Sentry.
- Add a DB readiness endpoint if you want the ALB to reflect database availability.

## 11. Suggested AWS Release Flow

1. Merge code to main.
2. Run tests and builds.
3. Build backend image and push to ECR.
4. Run Alembic migration against RDS.
5. Update ECS service.
6. Upload frontend build to S3.
7. Invalidate CloudFront.
8. Smoke test API and billing endpoints.
9. Monitor logs and alarms for the rollout window.

