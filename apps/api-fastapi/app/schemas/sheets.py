from __future__ import annotations

from typing import Any
from typing import Literal

from pydantic import BaseModel, ConfigDict, HttpUrl, field_validator


ColumnType = Literal["string", "number", "date", "boolean", "unknown"]


class FetchSheetRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    sheetUrl: HttpUrl
    sheetId: str | None = None

    @field_validator("sheetId", mode="before")
    @classmethod
    def validate_sheet_id(cls, value: Any) -> Any:
        if value is None:
            raise ValueError("Input should be a valid string")
        return value


class ColumnInfo(BaseModel):
    name: str
    type: ColumnType
    sampleValues: list[str]
    nonEmptyCount: int


class DetectedFeatures(BaseModel):
    hasCallMetrics: bool
    hasSentiment: bool
    hasCallDirection: bool
    hasCallStatus: bool
    hasTranscript: bool
    hasDriverInfo: bool
    hasBulkCalls: bool
    hasJoinInterest: bool
    hasRecording: bool
    hasPhoneNumbers: bool


class SheetDataResponse(BaseModel):
    rows: list[dict[str, str]]
    columns: list[ColumnInfo]
    totalRows: int
    detectedFeatures: DetectedFeatures


class SentimentBreakdown(BaseModel):
    positive: int
    negative: int
    neutral: int
    unknown: int


class CallDirectionBreakdown(BaseModel):
    inbound: int
    outbound: int


class TopBulkCallName(BaseModel):
    name: str
    count: int


class SheetSummaryResponse(BaseModel):
    totalCalls: int
    totalRows: int
    avgDurationMinutes: float | None = None
    totalDurationMinutes: float | None = None
    sentimentBreakdown: SentimentBreakdown | None = None
    callDirectionBreakdown: CallDirectionBreakdown | None = None
    callStatusBreakdown: dict[str, int] | None = None
    joinInterestCount: int | None = None
    topBulkCallNames: list[TopBulkCallName] | None = None
    detectedFeatures: DetectedFeatures
    columns: list[ColumnInfo]
