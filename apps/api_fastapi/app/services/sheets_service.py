from __future__ import annotations

from typing import TypedDict

from apps.api_fastapi.app.schemas.sheets import ColumnInfo, DetectedFeatures

from apps.api_fastapi.app.utils.config import get_settings
from apps.api_fastapi.app.integrations.google_sheets import fetch_sheet_csv
from apps.api_fastapi.app.services.csv_parser import parse_csv
from apps.api_fastapi.app.services.sheet_validation import build_column_infos, detect_features


class ParsedSheet(TypedDict):
    headers: list[str] 
    rows: list[dict[str, str]]
    columns: list[ColumnInfo]
    detectedFeatures: DetectedFeatures


async def load_parsed_sheet(sheet_url: str) -> ParsedSheet:
    settings = get_settings()
    csv_text = await fetch_sheet_csv(sheet_url, user_agent=settings.http_user_agent)
    headers, rows = parse_csv(csv_text)
    columns = build_column_infos(headers, rows)
    detected_features = detect_features(headers)

    return {
        "headers": headers,
        "rows": rows,
        "columns": columns,
        "detectedFeatures": detected_features,
    }
