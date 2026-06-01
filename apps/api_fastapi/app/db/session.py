# from __future__ import annotations

# from collections.abc import Generator

# from sqlalchemy import create_engine
# from sqlalchemy.orm import Session, sessionmaker

# from app.utils.config import get_settings

# settings = get_settings()

# engine = (
#     create_engine(settings.DATABASE_URL, pool_pre_ping=True)
#     if settings.DATABASE_URL
#     else None
# )

# SessionLocal = (
#     sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)
#     if engine is not None
#     else None
# )


# def get_db() -> Generator[Session, None, None]:
#     if SessionLocal is None:
#         raise RuntimeError("DATABASE_URL must be set before using database dependencies.")

#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# --------------------
from __future__ import annotations

from functools import lru_cache
from collections.abc import Generator
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, sessionmaker

from apps.api_fastapi.app.db.base import Base
from apps.api_fastapi.app.utils.config import get_settings

@lru_cache(maxsize=1)
def get_engine():
    settings = get_settings()
    database_url = settings.DATABASE_URL

    if not database_url or not database_url.strip():
        raise RuntimeError("DATABASE_URL must be set before creating the engine.")

    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=40,
    )


@lru_cache(maxsize=1)
def get_session_local():
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        class_=Session,
    )


def get_db() -> Generator[Session, None, None]:
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from apps.api_fastapi.app.model import models

    engine = get_engine()
    inspector = inspect(engine)

    existing_tables = set(inspector.get_table_names())
    model_tables = set(Base.metadata.tables.keys())

    missing_tables = model_tables - existing_tables

    if missing_tables:
        Base.metadata.create_all(bind=engine)
