from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parents[1]
API_FASTAPI_ROOT = PROJECT_ROOT / "apps" / "api-fastapi"

if str(API_FASTAPI_ROOT) not in sys.path:
    sys.path.insert(0, str(API_FASTAPI_ROOT))

from app.main import app  # noqa: E402


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)
