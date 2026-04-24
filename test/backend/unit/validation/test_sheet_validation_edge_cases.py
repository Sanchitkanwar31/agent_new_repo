from __future__ import annotations

import pytest

from app.services.sheet_validation import detect_column_type, detect_features


def test_detect_column_type_ambiguous_date_strings_are_consistent() -> None:
    sample_values = ["01/02/2024", "02/03/2024", "03/04/2024", "unknown"]
    reversed_values = list(reversed(sample_values))

    result_a = detect_column_type(sample_values)
    result_b = detect_column_type(reversed_values)

    assert result_a == result_b
    assert result_a in {"date", "string"}


def test_detect_features_false_positive_current_behavior_status_code() -> None:
    features = detect_features(["status_code", "request_id"])
    assert features.hasCallStatus is True


@pytest.mark.xfail(
    reason="Feature detection uses loose substring matching and can false-positive.",
    strict=True,
)
def test_detect_features_should_not_flag_status_code_as_call_status() -> None:
    features = detect_features(["status_code", "request_id"])
    assert features.hasCallStatus is False
