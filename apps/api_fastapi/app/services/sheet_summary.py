from __future__ import annotations

from apps.api_fastapi.app.schemas.sheets import ColumnInfo, DetectedFeatures


def _dump(value: object) -> dict[str, object]:
    if hasattr(value, "model_dump"):
        return value.model_dump()  # type: ignore[no-any-return]
    if isinstance(value, dict):
        return value
    raise TypeError("Unsupported summary value type")


def _find_column(headers: list[str], patterns: list[str]) -> str | None:
    normalized = [header.lower().replace(" ", "_") for header in headers]
    for pattern in patterns:
        for index, header in enumerate(normalized):
            if pattern in header:
                return headers[index]
    return None


def build_sheet_summary_payload(
    headers: list[str],
    rows: list[dict[str, str]],
    columns: list[ColumnInfo] | list[dict[str, object]],
    detected_features: DetectedFeatures | dict[str, object],
) -> dict[str, object]:
    duration_min_col = _find_column(
        headers, ["call_duration_in_minutes", "duration_in_minutes"]
    )
    duration_sec_col = _find_column(
        headers, ["call_duration_in_seconds", "duration_in_seconds"]
    )
    duration_col = duration_min_col or duration_sec_col or _find_column(headers, ["duration"])

    avg_duration_minutes: float | None = None
    total_duration_minutes: float | None = None

    if duration_col:
        durations: list[float] = []
        for row in rows:
            raw_value = row.get(duration_col, "")
            try:
                value = float(raw_value)
                durations.append(value)
            except (TypeError, ValueError):
                continue

        if durations:
            values = durations
            if duration_col == duration_sec_col:
                values = [duration / 60 for duration in durations]

            total_duration_minutes = sum(values)
            avg_duration_minutes = total_duration_minutes / len(values)

    sentiment_breakdown = {
        "positive": 0,
        "negative": 0,
        "neutral": 0,
        "unknown": 0,
    }
    sentiment_col = _find_column(headers, ["sentiment"])
    if sentiment_col:
        for row in rows:
            value = row.get(sentiment_col, "").lower().strip()
            if "positive" in value or value == "good":
                sentiment_breakdown["positive"] += 1
            elif "negative" in value or value == "bad":
                sentiment_breakdown["negative"] += 1
            elif "neutral" in value:
                sentiment_breakdown["neutral"] += 1
            elif value != "":
                sentiment_breakdown["unknown"] += 1

    call_direction_breakdown = {"inbound": 0, "outbound": 0}
    direction_col = _find_column(headers, ["call_direction", "direction"])
    if direction_col:
        for row in rows:
            value = row.get(direction_col, "").lower().strip()
            if "inbound" in value or value == "in":
                call_direction_breakdown["inbound"] += 1
            elif "outbound" in value or value == "out":
                call_direction_breakdown["outbound"] += 1

    call_status_breakdown: dict[str, int] = {}
    status_col = _find_column(headers, ["call_status", "status"])
    if status_col:
        for row in rows:
            value = row.get(status_col, "").strip()
            if value:
                call_status_breakdown[value] = call_status_breakdown.get(value, 0) + 1

    join_interest_count = 0
    join_interest_col = _find_column(headers, ["join_interest", "interest_level"])
    if join_interest_col:
        join_interest_count = len(
            [
                row
                for row in rows
                if row.get(join_interest_col, "").lower().strip() in {"true", "yes", "1"}
            ]
        )

    top_bulk_call_names: list[dict[str, object]] = []
    bulk_call_col = _find_column(headers, ["bulk_call_name", "bulk_call"])
    if bulk_call_col:
        counts: dict[str, int] = {}
        for row in rows:
            value = row.get(bulk_call_col, "").strip()
            if value:
                counts[value] = counts.get(value, 0) + 1

        for name, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:10]:
            top_bulk_call_names.append({"name": name, "count": count})

    payload: dict[str, object] = {
        "totalCalls": len(rows),
        "totalRows": len(rows),
        "sentimentBreakdown": sentiment_breakdown,
        "callDirectionBreakdown": call_direction_breakdown,
        "callStatusBreakdown": call_status_breakdown,
        "joinInterestCount": join_interest_count,
        "topBulkCallNames": top_bulk_call_names,
        "detectedFeatures": _dump(detected_features),
        "columns": [_dump(column) for column in columns],
    }

    if avg_duration_minutes is not None:
        payload["avgDurationMinutes"] = avg_duration_minutes
    if total_duration_minutes is not None:
        payload["totalDurationMinutes"] = total_duration_minutes

    return payload
