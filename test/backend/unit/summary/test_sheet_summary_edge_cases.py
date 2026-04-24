from __future__ import annotations

import pytest

from app.schemas.sheets import ColumnInfo, DetectedFeatures
from app.services.sheet_summary import build_sheet_summary_payload


def _features() -> DetectedFeatures:
    return DetectedFeatures(
        hasCallMetrics=True,
        hasSentiment=True,
        hasCallDirection=True,
        hasCallStatus=True,
        hasTranscript=False,
        hasDriverInfo=False,
        hasBulkCalls=False,
        hasJoinInterest=True,
        hasRecording=False,
        hasPhoneNumbers=False,
    )


def _columns() -> list[ColumnInfo]:
    return [
        ColumnInfo(
            name="call_status",
            type="string",
            sampleValues=["Connected", "connected"],
            nonEmptyCount=2,
        ),
        ColumnInfo(
            name="duration",
            type="number",
            sampleValues=["-10", "20"],
            nonEmptyCount=2,
        ),
    ]


def test_build_sheet_summary_status_buckets_are_case_sensitive_today() -> None:
    payload = build_sheet_summary_payload(
        headers=["call_status", "duration"],
        rows=[
            {"call_status": "Connected", "duration": "10"},
            {"call_status": "connected", "duration": "20"},
        ],
        columns=_columns(),
        detected_features=_features(),
    )
    assert payload["callStatusBreakdown"] == {"Connected": 1, "connected": 1}


@pytest.mark.xfail(
    reason="Status buckets are currently not normalized and can split by case.",
    strict=True,
)
def test_build_sheet_summary_normalizes_status_case_into_single_bucket() -> None:
    payload = build_sheet_summary_payload(
        headers=["call_status", "duration"],
        rows=[
            {"call_status": "Connected", "duration": "10"},
            {"call_status": "connected", "duration": "20"},
        ],
        columns=_columns(),
        detected_features=_features(),
    )
    assert payload["callStatusBreakdown"] == {"connected": 2}


def test_build_sheet_summary_negative_duration_included_current_behavior() -> None:
    payload = build_sheet_summary_payload(
        headers=["duration"],
        rows=[{"duration": "-10"}, {"duration": "20"}, {"duration": "invalid"}],
        columns=_columns(),
        detected_features=_features(),
    )
    assert payload["totalDurationMinutes"] == 10
    assert payload["avgDurationMinutes"] == 5


@pytest.mark.xfail(
    reason="Negative durations are currently included in summary calculations.",
    strict=True,
)
def test_build_sheet_summary_ignores_negative_duration_values() -> None:
    payload = build_sheet_summary_payload(
        headers=["duration"],
        rows=[{"duration": "-10"}, {"duration": "20"}, {"duration": "invalid"}],
        columns=_columns(),
        detected_features=_features(),
    )
    assert payload["totalDurationMinutes"] == 20
    assert payload["avgDurationMinutes"] == 20
