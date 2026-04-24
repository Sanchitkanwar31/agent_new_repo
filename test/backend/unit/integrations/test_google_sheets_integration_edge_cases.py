from __future__ import annotations

import asyncio
from typing import Any

import httpx
import pytest
from fastapi import HTTPException

from app.integrations import google_sheets
from app.integrations.google_sheets import (
    convert_google_sheets_url_to_csv_url,
    fetch_sheet_csv,
)


class _FakeAsyncClient:
    def __init__(self, response: httpx.Response | None = None, delay_seconds: float = 0.0):
        self.response = response
        self.delay_seconds = delay_seconds

    async def __aenter__(self) -> "_FakeAsyncClient":
        return self

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        del exc_type, exc, tb

    async def get(self, *_args: Any, **_kwargs: Any) -> httpx.Response:
        if self.delay_seconds:
            await asyncio.sleep(self.delay_seconds)
        if self.response is None:
            raise RuntimeError("response must be configured")
        return self.response


def test_convert_google_sheets_url_extracts_gid_from_hash_fragment() -> None:
    url = "https://docs.google.com/spreadsheets/d/abc123/edit#gid=987"
    csv_url = convert_google_sheets_url_to_csv_url(url)
    assert csv_url.endswith("export?format=csv&gid=987")


@pytest.mark.xfail(
    reason="gid is currently extracted from #gid fragment only, not query params.",
    strict=True,
)
def test_convert_google_sheets_url_extracts_gid_from_query_param() -> None:
    url = "https://docs.google.com/spreadsheets/d/abc123/edit?gid=12345"
    csv_url = convert_google_sheets_url_to_csv_url(url)
    assert csv_url.endswith("export?format=csv&gid=12345")


@pytest.mark.parametrize("status_code", [403, 404])
@pytest.mark.anyio
async def test_fetch_sheet_csv_maps_private_sheet_like_statuses_to_400(
    monkeypatch: pytest.MonkeyPatch, status_code: int
) -> None:
    response = httpx.Response(
        status_code=status_code,
        request=httpx.Request("GET", "https://docs.google.com/"),
    )
    monkeypatch.setattr(
        google_sheets.httpx,
        "AsyncClient",
        lambda **_kwargs: _FakeAsyncClient(response=response),
    )

    with pytest.raises(HTTPException) as exc:
        await fetch_sheet_csv("https://docs.google.com/spreadsheets/d/abc123/edit")

    assert exc.value.status_code == 400


@pytest.mark.parametrize("status_code", [429, 500, 503])
@pytest.mark.anyio
async def test_fetch_sheet_csv_maps_upstream_server_or_rate_limit_to_502(
    monkeypatch: pytest.MonkeyPatch, status_code: int
) -> None:
    response = httpx.Response(
        status_code=status_code,
        request=httpx.Request("GET", "https://docs.google.com/"),
    )
    monkeypatch.setattr(
        google_sheets.httpx,
        "AsyncClient",
        lambda **_kwargs: _FakeAsyncClient(response=response),
    )

    with pytest.raises(HTTPException) as exc:
        await fetch_sheet_csv("https://docs.google.com/spreadsheets/d/abc123/edit")

    assert exc.value.status_code == 502


@pytest.mark.anyio
async def test_fetch_sheet_csv_can_hang_without_external_timeout(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    response = httpx.Response(
        status_code=200,
        text="name,duration\nalice,10\n",
        request=httpx.Request("GET", "https://docs.google.com/"),
    )
    monkeypatch.setattr(
        google_sheets.httpx,
        "AsyncClient",
        lambda **_kwargs: _FakeAsyncClient(response=response, delay_seconds=10),
    )

    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(
            fetch_sheet_csv("https://docs.google.com/spreadsheets/d/abc123/edit"),
            timeout=0.05,
        )
