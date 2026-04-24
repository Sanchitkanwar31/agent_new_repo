from __future__ import annotations

import re
from datetime import datetime

from dateutil import parser as date_parser

from app.schemas.sheets import ColumnInfo, ColumnType, DetectedFeatures

NUMBER_PATTERN = re.compile(r"^-?\d+(\.\d+)?$")
BOOL_PATTERN = re.compile(r"^(true|false|yes|no|1|0)$", re.IGNORECASE)


def _is_parseable_date(value: str) -> bool:
    if len(value) <= 4:
        return False

    try:
        parsed = date_parser.parse(value)
        return isinstance(parsed, datetime)
    except (TypeError, ValueError, OverflowError):
        return False


def detect_column_type(values: list[str]) -> ColumnType:
    non_empty = [value for value in values if value.strip() != ""]
    if not non_empty:
        return "unknown"

    number_count = len([value for value in non_empty if NUMBER_PATTERN.match(value.strip())])
    if number_count / len(non_empty) > 0.8:
        return "number"

    date_count = len([value for value in non_empty if _is_parseable_date(value)])
    if date_count / len(non_empty) > 0.6:
        return "date"

    bool_count = len([value for value in non_empty if BOOL_PATTERN.match(value.strip())])
    if bool_count / len(non_empty) > 0.8:
        return "boolean"

    return "string"


def build_column_infos(headers: list[str], rows: list[dict[str, str]]) -> list[ColumnInfo]:
    columns: list[ColumnInfo] = []
    for name in headers:
        all_values = [row.get(name, "") for row in rows]
        non_empty = [value for value in all_values if value.strip() != ""]
        sample_values = non_empty[:5]
        column_type = detect_column_type(all_values)

        columns.append(
            ColumnInfo(
                name=name,
                type=column_type,
                sampleValues=sample_values,
                nonEmptyCount=len(non_empty),
            )
        )
    return columns


COLUMN_PATTERNS = {
    "callMetrics": [
        "call_duration",
        "duration",
        "call_duration_in_minutes",
        "call_duration_in_seconds",
        "interaction_count",
    ],
    "sentiment": ["sentiment"],
    "callDirection": ["call_direction", "direction"],
    "callStatus": ["call_status", "status"],
    "transcript": ["full_conversation", "transcript", "conversation"],
    "driverInfo": ["driving_experience", "driver_queries", "driver"],
    "bulkCalls": ["bulk_call_name", "bulk_call"],
    "recording": ["recording_url", "recording"],
    "phoneNumbers": ["phone_number", "from_number", "to_number"],
    "joinInterest": ["join_interest", "interest_level"],
}


def detect_features(headers: list[str]) -> DetectedFeatures:
    normalized = [header.lower().replace(" ", "_") for header in headers]

    def has(patterns: list[str]) -> bool:
        return any(
            any(pattern.lower() in header for header in normalized)
            for pattern in patterns
        )

    return DetectedFeatures(
        hasCallMetrics=has(COLUMN_PATTERNS["callMetrics"]),
        hasSentiment=has(COLUMN_PATTERNS["sentiment"]),
        hasCallDirection=has(COLUMN_PATTERNS["callDirection"]),
        hasCallStatus=has(COLUMN_PATTERNS["callStatus"]),
        hasTranscript=has(COLUMN_PATTERNS["transcript"]),
        hasDriverInfo=has(COLUMN_PATTERNS["driverInfo"]),
        hasBulkCalls=has(COLUMN_PATTERNS["bulkCalls"]),
        hasJoinInterest=has(COLUMN_PATTERNS["joinInterest"]),
        hasRecording=has(COLUMN_PATTERNS["recording"]),
        hasPhoneNumbers=has(COLUMN_PATTERNS["phoneNumbers"]),
    )

