# Sheet Insights Deployment Guide

This guide covers production deployment for:
- `apps/api_fastapi` (FastAPI backend)
- `apps/web` (Vite static frontend)

## 1. Prerequisites

- Node.js 24+
- Python 3.11+
- `pnpm`
- AWS account with access to:
  - ECR (optional, if containerizing API)
  - ECS Fargate or EC2 (for API runtime)
  - S3 + CloudFront (for frontend hosting)
  - ACM + Route53 (TLS and DNS)
  - WAF (recommended)

## 2. Environment Variables

Create production env values (do not commit secrets):

- `PORT=5000`
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `HTTP_USER_AGENT=<optional custom UA>`
- `VITE_BASE_PATH=/`
- `VITE_API_BASE_URL=https://<your-api-domain>`

Notes:
- Keep `.env` out of git (already ignored).
- `DATABASE_URL` is optional for current sheet API runtime.

## 3. Local Production Smoke Test

From repo root:

```bash
pnpm install
cd apps/api_fastapi
pip install -e .[dev]
cd ../..
pnpm --filter @workspace/web run build
python apps/api_fastapi/run.py
```

Validate:
- `GET /api/healthz` returns `200`.
- `POST /api/sheets/data` and `/api/sheets/summary` return expected payloads.

## 4. Backend Deployment (AWS)

Choose one:

1. ECS Fargate (recommended for simplicity)
2. EC2 + systemd + reverse proxy

### ECS Fargate high-level flow

1. Build API image from `apps/api_fastapi`.
2. Push image to ECR.
3. Create ECS task definition:
   - CPU/memory sized for CSV parsing workload.
   - Env vars via ECS secrets/SSM.
4. Create ECS service behind an Application Load Balancer.
5. Add HTTPS listener (ACM certificate).
6. Route traffic via Route53.

### Required API hardening before public traffic

- Restrict CORS origins (do not keep wildcard in production).
- Add request timeout (Google Sheets fetch currently uses no timeout).
- Add rate limiting (API Gateway, ALB/WAF, or app-level).
- Add payload/response size limits.
- Set autoscaling + concurrency caps to mitigate abuse.
- Add alarms on:
  - 5xx spikes
  - latency
  - task restarts

## 5. Frontend Deployment (AWS S3 + CloudFront)

Build:

```bash
pnpm --filter @workspace/web run build
```

Output folder:
- `apps/web/dist/public`

Deploy:

1. Create S3 bucket for static hosting.
2. Upload `apps/web/dist/public/*`.
3. Create CloudFront distribution with S3 origin.
4. Configure custom domain + ACM cert.
5. Invalidate cache after each release.

## 6. API and Frontend Integration

- Set `VITE_API_BASE_URL` at build time if API is on a different domain.
- If same domain + reverse proxy, keep relative `/api`.
- Ensure CORS allowlist matches actual frontend domain(s).

## 7. CI/CD Recommended Pipeline

1. Install dependencies.
2. Run tests:
   - Python tests (`pytest`)
   - Frontend checks/build
3. Build API image + push ECR.
4. Deploy ECS service (rolling update).
5. Build frontend + upload to S3.
6. CloudFront invalidation.
7. Post-deploy smoke checks:
   - `/api/healthz`
   - one known Sheets URL on `/api/sheets/data`

## 8. Security Checklist

- No secrets in repo or frontend bundle.
- Use AWS Secrets Manager or SSM Parameter Store.
- Enable HTTPS only (HSTS recommended).
- Enable WAF managed rules and rate limiting.
- Restrict security groups to minimum required ports.
- Enable CloudWatch logs retention policy.
- Redact sensitive fields from logs where applicable.

## 9. Rollback Plan

- Keep previous stable ECS task definition revision.
- Keep previous frontend artifact version in S3.
- Roll back ECS service revision first, then frontend if needed.
- Re-run smoke tests after rollback.

## 10. Known Runtime Risks

Current backend behavior includes:
- Open CORS policy by default.
- No timeout for Google Sheets fetch.
- Memory/CPU pressure possible on very large CSV inputs.

Address these before full production exposure.

