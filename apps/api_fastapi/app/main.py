# from __future__ import annotations

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from apps.api_fastapi.app.api.router import api_router
# from app.utils.config import get_settings
# from app.core.logging import configure_logging
# from app.middleware.exception_handlers import register_exception_handlers
# from app.middleware.request_logging import RequestLoggingMiddleware

# settings = get_settings()
# configure_logging(settings)

# app = FastAPI(
#     title="Api",
#     version="0.1.0",
# )

# app.add_middleware(RequestLoggingMiddleware)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(api_router)
# register_exception_handlers(app)



from fastapi import FastAPI,Request,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from apps.api_fastapi.app.api.router import api_router

from apps.api_fastapi.app.utils.config import get_settings
from apps.api_fastapi.app.utils.logging import configure_logging

from apps.api_fastapi.app.middleware.exception_handlers import register_exception_handlers
from apps.api_fastapi.app.middleware.request_logging import RequestLoggingMiddleware

settings = get_settings()
configure_logging(settings)

app = FastAPI(
    title="Unified API",
    version="0.1.0",
)

# -------------------
# Middleware
# -------------------
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------
# Routers
# -------------------
app.include_router(api_router)

# -------------------
# Exception handlers
# -------------------
register_exception_handlers(app)

# -------------------
# Routes
# -------------------
# @app.get("/")
# def home():
#     return {"message": "Unified API is running"}

from apps.api_fastapi.app.api.routes.billing import razorpay_webhook
from sqlalchemy.orm import Session

from apps.api_fastapi.app.db.base import Base
from apps.api_fastapi.app.db.session import get_db, get_engine



@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=get_engine())

@app.post("/")
async def root_post(
    request: Request,
    db: Session = Depends(get_db)
):
    return await razorpay_webhook(
        request=request,
        db=db
    )

@app.get("/billing", include_in_schema=False)
def billing_page():
    return FileResponse(
        Path(__file__).resolve().parent / "static" / "billing.html"
    )
