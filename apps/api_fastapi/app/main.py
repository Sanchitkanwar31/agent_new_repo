from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from apps.api_fastapi.app.api.router import api_router
from apps.api_fastapi.app.middleware.exception_handlers import register_exception_handlers
from apps.api_fastapi.app.middleware.request_logging import RequestLoggingMiddleware
from apps.api_fastapi.app.utils.config import get_settings
from apps.api_fastapi.app.utils.logging import configure_logging

settings = get_settings()
configure_logging(settings)

app = FastAPI(title="Unified API", version="0.1.0")

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://agent-new-repo-front.onrender.com",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
register_exception_handlers(app)


@app.get("/billing", include_in_schema=False)
def billing_page():
    return FileResponse(Path(__file__).resolve().parent / "static" / "billing.html")
