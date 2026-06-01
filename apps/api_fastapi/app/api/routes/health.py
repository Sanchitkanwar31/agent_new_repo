from __future__ import annotations

from fastapi import APIRouter

from apps.api_fastapi.app.schemas.health import HealthStatus

router = APIRouter()


@router.get("/healthz", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    return HealthStatus(status="ok")

