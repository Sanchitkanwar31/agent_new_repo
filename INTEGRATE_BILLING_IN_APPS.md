# Integrate Billing System Into Existing `apps/api_fastapi` and `apps/web`

This document lists exact steps to merge a separate billing frontend and backend into your existing monorepo so you can run both with Vite (frontend) and Uvicorn (backend) using a single root command.

Assumptions
- Your workspace root already uses `pnpm` and has `concurrently` in `devDependencies`.
- Backend code will live under `apps/api_fastapi` (FastAPI app already present).
- Frontend code will live under `apps/web` (Vite React app already present).
- Billing code to integrate has a Python FastAPI backend and a Vite/React frontend.

Summary of changes
1. Copy backend billing code into `apps/api_fastapi` (merge routes/services/models as appropriate).
2. Copy frontend billing UI into `apps/web/src/billing` and wire components.
3. Ensure `apps/web/vite.config.ts` proxies `/api` to the backend port (already configured).
4. Add .env settings and startup scripts; ensure dependencies are installed.
5. Run both with the root `pnpm run dev` command.

Detailed steps

1) Copy backend files into `apps/api_fastapi`

- Place routing files under `apps/api_fastapi/app/api/routes/` or merge into existing route modules.
- Place service and utility modules under `apps/api_fastapi/app/services/` and `apps/api_fastapi/app/utils/`.
- Place Pydantic schemas in `apps/api_fastapi/app/schemas/`.
- Add any DB models under `apps/api_fastapi/app/db/models.py` or split into files and import them in `db/base.py`.

When merging, prefer to:
- Reuse existing dependency injection and router registration patterns (see `apps/api_fastapi/app/main.py` and `apps/api_fastapi/app/api/router.py`).
- Add a new router and include it in `api_router` so your billing endpoints live under `/api/billing`.

Example: create `apps/api_fastapi/app/api/routes/billing.py` and then in the central router import and include it.

2) Copy frontend files into `apps/web`

- Copy billing pages & components to `apps/web/src/billing/`.
- Import and add routes in your React router (e.g., `src/main.jsx` or `src/App.jsx`).
- Add any billing-specific CSS/assets under `apps/web/src/billing` or `apps/web/public`.

3) Configure API base URL and proxy

- `apps/web/vite.config.ts` already contains a proxy configuration:
  - Proxy target uses `API_PORT` environment variable (defaults to `5000`).
- Add environment variable files:
  - `apps/api_fastapi/.env` (example):

```
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug
```

  - `apps/web/.env` (example):

```
VITE_DEV_PORT=5173
API_PORT=5000
VITE_BASE_PATH=/
```

4) Install dependencies

- Install node dependencies at the workspace root (pnpm workspace will install for `apps/web`):

```bash
pnpm install
```

- Create a Python virtual environment and install the backend dependencies. From the workspace root:

```bash
cd apps/api_fastapi
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# (or cmd) .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -e .
```

This installs the dependencies listed in `pyproject.toml` (FastAPI, Uvicorn, etc.).

5) Verify backend start command

- Your repo already has `apps/api_fastapi/run.py` which runs Uvicorn with the app: it calls `uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=...)`.
- From `apps/api_fastapi`, you can run:

```bash
# with venv active
python run.py
# or explicitly via module
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

6) Verify frontend start command

- From the workspace root run the workspace web dev script (root `package.json` already defines a filtered script):

```bash
pnpm --filter @workspace/web dev
# or from apps/web
pnpm dev
```

7) Start both services together from the root

- The monorepo root `package.json` already includes a `dev` script that uses `concurrently`:

```json
"dev": "concurrently -n api,web -c blue,green \"python apps/api_fastapi/run.py\" \"pnpm --filter @workspace/web dev\"",
```

Run from the workspace root:

```bash
pnpm run dev
```

8) Troubleshooting & tips

- If `pnpm run dev` exits quickly with error code 1, check backend logs: likely Python dependencies or PATH issues.
  - Activate the backend virtualenv and run `python run.py` manually to see errors.
  - Ensure `uvicorn` is installed in the environment used.
- If CORS or mixed-origin problems arise, confirm `app.main` has `CORSMiddleware` configured (it does, allowing origins `*`).
- If API requests from the browser are hitting the wrong host/port, double-check `apps/web/vite.config.ts` and `apps/web/.env` `API_PORT` value.
- To avoid creating a per-developer venv, consider adding a Docker Compose file to standardize the environment.

9) Optional: Add helper scripts

- Add explicit root scripts for clarity in `package.json`:

```json
"scripts": {
  "dev:api": "python apps/api_fastapi/run.py",
  "dev:web": "pnpm --filter @workspace/web dev",
  "dev": "concurrently -n api,web -c blue,green \"pnpm run dev:api\" \"pnpm run dev:web\""
}
```

10) Optional: Build & serve frontend from backend

- To serve a production build from the backend:
  1. Run `pnpm --filter @workspace/web build` to produce `apps/web/dist/public`.
  2. Configure your backend to serve static files from that directory (e.g., using Starlette's StaticFiles mount) and route API under `/api`.

---

If you want, I can now:
- Create example `.env` files under `apps/api_fastapi` and `apps/web`.
- Add the helper root `package.json` scripts (if you want them added).
- Create a simple `apps/api_fastapi/app/api/routes/billing.py` scaffold and a React page scaffold under `apps/web/src/billing` to demonstrate wiring.

Which of the above would you like me to do next?