from app.schemas.sheets import ColumnInfo, DetectedFeatures
from app.services.sheet_summary import build_sheet_summary_payload


def test_build_sheet_summary_payload_matches_expected_shape() -> None:
    headers = ["duration", "sentiment", "call_status", "bulk_call_name"]
    rows = [
        {
            "duration": "10",
            "sentiment": "positive",
            "call_status": "connected",
            "bulk_call_name": "Campaign A",
        },
        {
            "duration": "20",
            "sentiment": "negative",
            "call_status": "connected",
            "bulk_call_name": "Campaign B",
        },
    ]
    columns = [
        ColumnInfo(name="duration", type="number", sampleValues=["10", "20"], nonEmptyCount=2)
    ]
    features = DetectedFeatures(
        hasCallMetrics=True,
        hasSentiment=True,
        hasCallDirection=False,
        hasCallStatus=True,
        hasTranscript=False,
        hasDriverInfo=False,
        hasBulkCalls=True,
        hasJoinInterest=False,
        hasRecording=False,
        hasPhoneNumbers=False,
    )

    payload = build_sheet_summary_payload(headers, rows, columns, features)

    assert payload["totalCalls"] == 2
    assert payload["totalRows"] == 2
    assert payload["avgDurationMinutes"] == 15
    assert payload["totalDurationMinutes"] == 30
    assert payload["sentimentBreakdown"] == {
        "positive": 1,
        "negative": 1,
        "neutral": 0,
        "unknown": 0,
    }
    assert payload["callStatusBreakdown"] == {"connected": 2}
    assert payload["topBulkCallNames"] == [
        {"name": "Campaign A", "count": 1},
        {"name": "Campaign B", "count": 1},
    ]

