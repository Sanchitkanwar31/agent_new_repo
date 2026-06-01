from app.services.csv_parser import parse_csv, parse_csv_line


def test_parse_csv_line_handles_quotes_and_commas() -> None:
    line = 'A,"B, C","D""E",F'
    assert parse_csv_line(line) == ["A", "B, C", 'D"E', "F"]


def test_parse_csv_skips_empty_rows() -> None:
    csv_text = "name,age\nalice,32\n,\n\nbob,45\n"
    headers, rows = parse_csv(csv_text)

    assert headers == ["name", "age"]
    assert rows == [{"name": "alice", "age": "32"}, {"name": "bob", "age": "45"}]

