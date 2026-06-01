from __future__ import annotations

from fastapi import APIRouter

from apps.api_fastapi.app.schemas.sheets import FetchSheetRequest, SheetDataResponse, SheetSummaryResponse
from apps.api_fastapi.app.services import sheets_service
from apps.api_fastapi.app.services.sheet_summary import build_sheet_summary_payload

router = APIRouter()


def _dump(value: object) -> object:
    if hasattr(value, "model_dump"):
        return value.model_dump()  # type: ignore[no-any-return]
    return value


@router.post("/sheets/data", response_model=SheetDataResponse)
async def fetch_sheet_data(payload: FetchSheetRequest) -> SheetDataResponse:
    loaded = await sheets_service.load_parsed_sheet(str(payload.sheetUrl))
    rows = loaded["rows"]
    columns = loaded["columns"]
    detected_features = loaded["detectedFeatures"]
    limited_rows = rows[:900]

    response_payload = {
        "rows": limited_rows,
        "columns": [_dump(column) for column in columns],
        "totalRows": len(rows),
        "detectedFeatures": _dump(detected_features),
    }
    return SheetDataResponse(**response_payload)


@router.post("/sheets/summary", response_model=SheetSummaryResponse, response_model_exclude_none=True)
async def fetch_sheet_summary(payload: FetchSheetRequest) -> SheetSummaryResponse:
    loaded = await sheets_service.load_parsed_sheet(str(payload.sheetUrl))
    headers = loaded["headers"]
    rows = loaded["rows"]
    columns = loaded["columns"]
    detected_features = loaded["detectedFeatures"]

    summary_payload = build_sheet_summary_payload(
        headers=headers,
        rows=rows,
        columns=columns,
        detected_features=detected_features,
    )
    return SheetSummaryResponse(**summary_payload)
