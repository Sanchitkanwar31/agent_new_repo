from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from apps.api_fastapi.app.api.routes.health import router as health_router
from apps.api_fastapi.app.api.routes.sheets import router as sheets_router
from apps.api_fastapi.app.utils.config import get_settings
from apps.api_fastapi.app.api.routes.billing import router as billing_router
api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(sheets_router)
api_router.include_router(billing_router)


@api_router.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    include_in_schema=False,
)
async def not_found_handler(_: Request, full_path: str) -> JSONResponse:
    del full_path
    return JSONResponse(status_code=404, content={"detail": "Not found"})
