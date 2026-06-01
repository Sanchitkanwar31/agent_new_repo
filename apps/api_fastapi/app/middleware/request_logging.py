from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from apps.api_fastapi.app.utils.logging import get_logger

logger = get_logger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        request_id = uuid.uuid4().hex
        request.state.request_id = request_id
        path = request.url.path

        logger.info(
            "Incoming request",
            extra={
                "event": "request",
                "request_id": request_id,
                "method": request.method,
                "path": path,
            },
        )

        response = await call_next(request)

        logger.info(
            "Request completed",
            extra={
                "event": "response",
                "request_id": request_id,
                "method": request.method,
                "path": path,
                "status_code": response.status_code,
            },
        )

        return response

