from __future__ import annotations


def parse_csv_line(line: str) -> list[str]:
    result: list[str] = []
    current = ""
    in_quotes = False

    i = 0
    while i < len(line):
        char = line[i]

        if char == '"':
            if in_quotes and i + 1 < len(line) and line[i + 1] == '"':
                current += '"'
                i += 1
            else:
                in_quotes = not in_quotes
        elif char == "," and not in_quotes:
            result.append(current.strip())
            current = ""
        else:
            current += char

        i += 1

    result.append(current.strip())
    return result


def parse_csv(csv_text: str) -> tuple[list[str], list[dict[str, str]]]:
    lines = [line for line in csv_text.split("\n") if line.strip()]

    if not lines:
        return [], []

    headers = parse_csv_line(lines[0])
    rows: list[dict[str, str]] = []

    for line in lines[1:]:
        values = parse_csv_line(line)
        row: dict[str, str] = {}

        for index, header in enumerate(headers):
            row[header] = values[index] if index < len(values) else ""

        has_data = any(value.strip() != "" for value in row.values())
        if has_data:
            rows.append(row)

    return headers, rows

