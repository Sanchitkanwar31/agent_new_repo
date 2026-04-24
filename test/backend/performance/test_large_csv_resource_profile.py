from __future__ import annotations

import time
import tracemalloc

from app.services.csv_parser import parse_csv


def test_parse_csv_large_sheet_completes_within_resource_budget() -> None:
    row_count = 25_000
    csv_lines = ["name,duration,sentiment"]
    csv_lines.extend(f"user-{index},{index % 120},positive" for index in range(row_count))
    csv_text = "\n".join(csv_lines)

    tracemalloc.start()
    started = time.perf_counter()
    headers, rows = parse_csv(csv_text)
    elapsed = time.perf_counter() - started
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    assert headers == ["name", "duration", "sentiment"]
    assert len(rows) == row_count
    assert elapsed < 8.0
    assert peak < 256 * 1024 * 1024
