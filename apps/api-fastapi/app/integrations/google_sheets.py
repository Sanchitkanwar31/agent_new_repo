from __future__ import annotations

import re

import httpx
from fastapi import HTTPException

DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; SheetInsights/1.0; +https://github.com/)"
SHEET_URL_PATTERN = re.compile(
    r"spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/[^?#]*)?(?:\?[^#]*)?(?:#gid=(\d+))?"
)


def convert_google_sheets_url_to_csv_url(url: str) -> str:
    match = SHEET_URL_PATTERN.search(url)
    if not match:
        raise HTTPException(
            status_code=400,
            detail="Invalid Google Sheets URL. Please provide a valid Google Sheets share link.",
        )

    sheet_id = match.group(1)
    gid = match.group(2)

    csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    if gid:
        csv_url = f"{csv_url}&gid={gid}"

    return csv_url


async def fetch_sheet_csv(sheet_url: str, user_agent: str | None = None) -> str:
    csv_url = convert_google_sheets_url_to_csv_url(sheet_url)

    async with httpx.AsyncClient(follow_redirects=True, timeout=None) as client:
        response = await client.get(
            csv_url,
            headers={"User-Agent": user_agent or DEFAULT_USER_AGENT},
        )

    if not response.is_success:
        client_side = response.status_code in {403, 404}
        raise HTTPException(
            status_code=400 if client_side else 502,
            detail=(
                f"Failed to fetch sheet data: {response.status_code} {response.reason_phrase}. "
                "Make sure the sheet is publicly accessible (share > Anyone with link can view)."
            ),
        )

    text = response.text
    stripped = text.strip()
    if stripped.startswith("<!DOCTYPE") or stripped.startswith("<html"):
        raise HTTPException(
            status_code=400,
            detail=(
                "The sheet returned an HTML page instead of CSV. Make sure the sheet is publicly "
                "accessible (share > Anyone with link can view)."
            ),
        )

    return text
