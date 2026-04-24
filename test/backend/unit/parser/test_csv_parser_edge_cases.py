from __future__ import annotations

import pytest

from app.services.csv_parser import parse_csv


@pytest.mark.xfail(
    reason="Parser splits input on newline before quoted-cell parsing.",
    strict=True,
)
def test_parse_csv_handles_newline_inside_quoted_cell() -> None:
    csv_text = 'name,notes\nalice,"line one\nline two"\n'

    headers, rows = parse_csv(csv_text)

    assert headers == ["name", "notes"]
    assert rows == [{"name": "alice", "notes": "line one\nline two"}]


def test_parse_csv_duplicate_headers_overwrite_value_current_behavior() -> None:
    csv_text = "status,status\nConnected,Failed\n"
    headers, rows = parse_csv(csv_text)

    assert headers == ["status", "status"]
    assert rows == [{"status": "Failed"}]


@pytest.mark.xfail(
    reason="Duplicate headers are not rejected and silently collide in dict output.",
    strict=True,
)
def test_parse_csv_rejects_duplicate_headers() -> None:
    csv_text = "status,status\nConnected,Failed\n"
    headers, _ = parse_csv(csv_text)
    assert len(headers) == len(set(headers))


def test_parse_csv_bom_header_preserved_current_behavior() -> None:
    csv_text = "\ufeffcall_status,duration\nconnected,10\n"
    headers, rows = parse_csv(csv_text)

    assert headers[0].startswith("\ufeff")
    assert rows[0]["\ufeffcall_status"] == "connected"


@pytest.mark.xfail(
    reason="BOM is not stripped from first header during CSV parsing.",
    strict=True,
)
def test_parse_csv_strips_utf8_bom_from_first_header() -> None:
    csv_text = "\ufeffcall_status,duration\nconnected,10\n"
    headers, _ = parse_csv(csv_text)
    assert headers[0] == "call_status"
