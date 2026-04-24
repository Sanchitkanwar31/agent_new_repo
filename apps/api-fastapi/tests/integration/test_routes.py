from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_api_route_returns_not_found() -> None:
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not found"}


def test_sheet_data_validation_error_shape() -> None:
    response = client.post("/api/sheets/data", json={})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any(issue["loc"][-1] == "sheetUrl" for issue in data["detail"])


def test_sheet_data_rejects_null_sheet_id() -> None:
    response = client.post(
        "/api/sheets/data",
        json={"sheetUrl": "https://example.com/sheet", "sheetId": None},
    )
    assert response.status_code == 422
    assert any(issue["loc"][-1] == "sheetId" for issue in response.json()["detail"])


def test_sheet_data_returns_limited_rows(monkeypatch) -> None:
    async def fake_load_parsed_sheet(_: str) -> dict[str, object]:
        rows = [{"name": f"row-{index}"} for index in range(600)]
        return {
            "headers": ["name"],
            "rows": rows,
            "columns": [],
            "detectedFeatures": {
                "hasCallMetrics": False,
                "hasSentiment": False,
                "hasCallDirection": False,
                "hasCallStatus": False,
                "hasTranscript": False,
                "hasDriverInfo": False,
                "hasBulkCalls": False,
                "hasJoinInterest": False,
                "hasRecording": False,
                "hasPhoneNumbers": False,
            },
        }

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_load_parsed_sheet)
    response = client.post("/api/sheets/data", json={"sheetUrl": "https://example.com/sheet"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["totalRows"] == 600
    assert len(payload["rows"]) == 600


def test_sheet_summary_handles_http_error(monkeypatch) -> None:
    async def fake_load_parsed_sheet(_: str) -> dict[str, object]:
        raise HTTPException(
            status_code=400,
            detail="Invalid Google Sheets URL. Please provide a valid Google Sheets share link.",
        )

    monkeypatch.setattr("app.services.sheets_service.load_parsed_sheet", fake_load_parsed_sheet)
    response = client.post("/api/sheets/summary", json={"sheetUrl": "https://example.com/sheet"})

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Invalid Google Sheets URL. Please provide a valid Google Sheets share link."
    }
