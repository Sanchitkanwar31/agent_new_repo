from __future__ import annotations

import logging
from typing import Any

import pytest


def _detected_features() -> dict[str, bool]:
    return {
        "hasCallMetrics": True,
        "hasSentiment": True,
        "hasCallDirection": True,
        "hasCallStatus": True,
        "hasTranscript": False,
        "hasDriverInfo": False,
        "hasBulkCalls": True,
        "hasJoinInterest": True,
        "hasRecording": False,
        "hasPhoneNumbers": False,
    }


def _large_parsed_sheet(size: int = 1200) -> dict[str, Any]:
    rows = [
        {
            "bulk_call_name": "Campaign A" if index % 2 == 0 else "Campaign B",
            "call_status": "connected",
            "duration": "10",
            "join_interest": "yes" if index % 3 == 0 else "no",
            "sentiment": "positive" if index % 2 == 0 else "negative",
            "call_direction": "inbound" if index % 2 == 0 else "outbound",
        }
        for index in range(size)
    ]
    return {
        "headers": [
            "bulk_call_name",
            "call_status",
            "duration",
            "join_interest",
            "sentiment",
            "call_direction",
        ],
        "rows": rows,
        "columns": [],
        "detectedFeatures": _detected_features(),
    }


def test_sheet_id_null_returns_field_level_422(client) -> None:
    response = client.post(
        "/api/sheets/data",
        json={"sheetUrl": "https://example.com/sheet", "sheetId": None},
    )
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(issue["loc"][-1] == "sheetId" for issue in detail)


def test_sheet_id_omitted_is_accepted(client, monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_loader(_: str) -> dict[str, Any]:
        return _large_parsed_sheet(size=10)

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_loader)

    response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})
    assert response.status_code == 200


def test_data_endpoint_truncates_rows_but_preserves_total_rows(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_loader(_: str) -> dict[str, Any]:
        return _large_parsed_sheet(size=1200)

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_loader)

    response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})
    payload = response.json()
    assert response.status_code == 200
    assert payload["totalRows"] == 1200
    assert len(payload["rows"]) == 900


def test_summary_and_data_endpoint_can_drift_on_large_dataset(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_loader(_: str) -> dict[str, Any]:
        return _large_parsed_sheet(size=1200)

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_loader)

    data_response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})
    summary_response = client.post(
        "/api/sheets/summary", json={"sheetUrl": "https://example.com/sheet"}
    )

    assert data_response.status_code == 200
    assert summary_response.status_code == 200
    assert len(data_response.json()["rows"]) < summary_response.json()["totalRows"]


def test_repeated_submissions_call_backend_each_time_without_cache(
    client, monkeypatch: pytest.MonkeyPatch
) -> None:
    call_counter = {"count": 0}

    async def fake_loader(_: str) -> dict[str, Any]:
        call_counter["count"] += 1
        return _large_parsed_sheet(size=10)

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_loader)

    for _ in range(5):
        response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})
        assert response.status_code == 200

    assert call_counter["count"] == 5


def test_cors_policy_is_wildcard_for_any_origin(client) -> None:
    response = client.options(
        "/api/sheets/data",
        headers={
            "Origin": "https://attacker.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "*"


def test_unhandled_exception_returns_generic_500_and_logs_error(
    client, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    async def fake_loader(_: str) -> dict[str, Any]:
        raise RuntimeError("boom")

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_loader)
    caplog.set_level(logging.ERROR)

    response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})
    assert response.status_code == 500
    assert response.json() == {"detail": "Internal Server Error"}
    assert any("Unhandled error" in record.getMessage() for record in caplog.records)


def test_validation_error_payload_contains_loc_for_field_mapping(client) -> None:
    response = client.post("/api/sheets/data", json={})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list)
    assert all("loc" in issue and "msg" in issue for issue in detail)
