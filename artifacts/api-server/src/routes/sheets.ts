import { Router, type IRouter } from "express";
import { FetchSheetDataBody, FetchSheetSummaryBody } from "@workspace/api-zod";

const router: IRouter = Router();

function convertGoogleSheetsUrlToCsvUrl(url: string): string {
  // Handle various Google Sheets URL formats
  // Format 1: https://docs.google.com/spreadsheets/d/{id}/edit#gid={gid}
  // Format 2: https://docs.google.com/spreadsheets/d/{id}/export?format=csv
  // Format 3: https://docs.google.com/spreadsheets/d/{id}/pub?gid={gid}&single=true&output=csv

  const editMatch = url.match(
    /spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/[^?#]*)?(?:\?[^#]*)?(?:#gid=(\d+))?/
  );

  if (!editMatch) {
    throw new Error(
      "Invalid Google Sheets URL. Please provide a valid Google Sheets share link."
    );
  }

  const sheetId = editMatch[1];
  const gid = editMatch[2];

  let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid) {
    csvUrl += `&gid=${gid}`;
  }

  return csvUrl;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(csvText: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = csvText.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });

    // Skip completely empty rows
    const hasData = Object.values(row).some((v) => v.trim() !== "");
    if (hasData) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

type ColumnType = "string" | "number" | "date" | "boolean" | "unknown";

function detectColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return "unknown";

  const numberCount = nonEmpty.filter((v) =>
    /^-?\d+(\.\d+)?$/.test(v.trim())
  ).length;
  if (numberCount / nonEmpty.length > 0.8) return "number";

  const dateCount = nonEmpty.filter((v) => {
    const d = new Date(v);
    return !isNaN(d.getTime()) && v.length > 4;
  }).length;
  if (dateCount / nonEmpty.length > 0.6) return "date";

  const boolCount = nonEmpty.filter((v) =>
    /^(true|false|yes|no|1|0)$/i.test(v.trim())
  ).length;
  if (boolCount / nonEmpty.length > 0.8) return "boolean";

  return "string";
}

function buildColumnInfos(
  headers: string[],
  rows: Record<string, string>[]
): {
  name: string;
  type: ColumnType;
  sampleValues: string[];
  nonEmptyCount: number;
}[] {
  return headers.map((name) => {
    const allValues = rows.map((r) => r[name] ?? "");
    const nonEmpty = allValues.filter((v) => v.trim() !== "");
    const sampleValues = nonEmpty.slice(0, 5);
    const type = detectColumnType(allValues);

    return {
      name,
      type,
      sampleValues,
      nonEmptyCount: nonEmpty.length,
    };
  });
}

const COLUMN_PATTERNS = {
  callMetrics: [
    "call_duration",
    "duration",
    "call_duration_in_minutes",
    "call_duration_in_seconds",
    "interaction_count",
  ],
  sentiment: ["sentiment"],
  callDirection: ["call_direction", "direction"],
  callStatus: ["call_status", "status"],
  transcript: ["full_conversation", "transcript", "conversation"],
  driverInfo: ["driving_experience", "driver_queries", "driver"],
  bulkCalls: ["bulk_call_name", "bulk_call"],
  joinInterest: ["join_interest"],
  recording: ["recording_url", "recording"],
  phoneNumbers: ["phone_number", "from_number", "to_number"],
};

function detectFeatures(headers: string[]): {
  hasCallMetrics: boolean;
  hasSentiment: boolean;
  hasCallDirection: boolean;
  hasCallStatus: boolean;
  hasTranscript: boolean;
  hasDriverInfo: boolean;
  hasBulkCalls: boolean;
  hasJoinInterest: boolean;
  hasRecording: boolean;
  hasPhoneNumbers: boolean;
} {
  const normalized = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const has = (patterns: string[]): boolean =>
    patterns.some((pattern) =>
      normalized.some((h) => h.includes(pattern.toLowerCase()))
    );

  return {
    hasCallMetrics: has(COLUMN_PATTERNS.callMetrics),
    hasSentiment: has(COLUMN_PATTERNS.sentiment),
    hasCallDirection: has(COLUMN_PATTERNS.callDirection),
    hasCallStatus: has(COLUMN_PATTERNS.callStatus),
    hasTranscript: has(COLUMN_PATTERNS.transcript),
    hasDriverInfo: has(COLUMN_PATTERNS.driverInfo),
    hasBulkCalls: has(COLUMN_PATTERNS.bulkCalls),
    hasJoinInterest: has(COLUMN_PATTERNS.joinInterest),
    hasRecording: has(COLUMN_PATTERNS.recording),
    hasPhoneNumbers: has(COLUMN_PATTERNS.phoneNumbers),
  };
}

async function fetchSheetCsv(sheetUrl: string): Promise<string> {
  const csvUrl = convertGoogleSheetsUrlToCsvUrl(sheetUrl);

  const response = await fetch(csvUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CallDashboard/1.0; +https://replit.com)",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sheet data: ${response.status} ${response.statusText}. Make sure the sheet is publicly accessible (share > Anyone with link can view).`
    );
  }

  const text = await response.text();

  // Check if response is an HTML error page
  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error(
      "The sheet returned an HTML page instead of CSV. Make sure the sheet is publicly accessible (share > Anyone with link can view)."
    );
  }

  return text;
}

router.post("/sheets/data", async (req, res): Promise<void> => {
  const parsed = FetchSheetDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const csvText = await fetchSheetCsv(parsed.data.sheetUrl);
    const { headers, rows } = parseCsv(csvText);
    const columns = buildColumnInfos(headers, rows);
    const detectedFeatures = detectFeatures(headers);

    // Limit rows returned to avoid huge payloads
    const limitedRows = rows.slice(0, 500);

    res.json({
      rows: limitedRows,
      columns,
      totalRows: rows.length,
      detectedFeatures,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    req.log.warn({ error: message }, "Failed to fetch sheet data");
    res.status(500).json({ error: message });
  }
});

router.post("/sheets/summary", async (req, res): Promise<void> => {
  const parsed = FetchSheetSummaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const csvText = await fetchSheetCsv(parsed.data.sheetUrl);
    const { headers, rows } = parseCsv(csvText);
    const columns = buildColumnInfos(headers, rows);
    const detectedFeatures = detectFeatures(headers);

    // Helper to find column by pattern
    const findCol = (patterns: string[]): string | null => {
      const normalized = headers.map((h) =>
        h.toLowerCase().replace(/\s+/g, "_")
      );
      for (const pattern of patterns) {
        const idx = normalized.findIndex((h) => h.includes(pattern));
        if (idx !== -1) return headers[idx];
      }
      return null;
    };

    // Call metrics
    const durationMinCol = findCol([
      "call_duration_in_minutes",
      "duration_in_minutes",
    ]);
    const durationSecCol = findCol([
      "call_duration_in_seconds",
      "duration_in_seconds",
    ]);
    const durationCol = durationMinCol ?? durationSecCol ?? findCol(["duration"]);

    let avgDurationMinutes: number | undefined;
    let totalDurationMinutes: number | undefined;

    if (durationCol) {
      const durations = rows
        .map((r) => parseFloat(r[durationCol] ?? ""))
        .filter((n) => !isNaN(n));

      if (durations.length > 0) {
        let vals = durations;
        // Convert seconds to minutes if needed
        if (durationCol === durationSecCol) {
          vals = durations.map((d) => d / 60);
        }
        totalDurationMinutes = vals.reduce((a, b) => a + b, 0);
        avgDurationMinutes = totalDurationMinutes / vals.length;
      }
    }

    // Sentiment
    const sentimentCol = findCol(["sentiment"]);
    const sentimentBreakdown = { positive: 0, negative: 0, neutral: 0, unknown: 0 };

    if (sentimentCol) {
      rows.forEach((r) => {
        const val = (r[sentimentCol] ?? "").toLowerCase().trim();
        if (val.includes("positive") || val === "good") sentimentBreakdown.positive++;
        else if (val.includes("negative") || val === "bad") sentimentBreakdown.negative++;
        else if (val.includes("neutral")) sentimentBreakdown.neutral++;
        else if (val !== "") sentimentBreakdown.unknown++;
      });
    }

    // Call direction
    const directionCol = findCol(["call_direction", "direction"]);
    const callDirectionBreakdown = { inbound: 0, outbound: 0 };

    if (directionCol) {
      rows.forEach((r) => {
        const val = (r[directionCol] ?? "").toLowerCase().trim();
        if (val.includes("inbound") || val === "in") callDirectionBreakdown.inbound++;
        else if (val.includes("outbound") || val === "out") callDirectionBreakdown.outbound++;
      });
    }

    // Call status
    const statusCol = findCol(["call_status", "status"]);
    const callStatusBreakdown: Record<string, number> = {};

    if (statusCol) {
      rows.forEach((r) => {
        const val = (r[statusCol] ?? "").trim();
        if (val) {
          callStatusBreakdown[val] = (callStatusBreakdown[val] ?? 0) + 1;
        }
      });
    }

    // Join interest
    const joinInterestCol = findCol(["join_interest"]);
    let joinInterestCount = 0;

    if (joinInterestCol) {
      joinInterestCount = rows.filter((r) => {
        const val = (r[joinInterestCol] ?? "").toLowerCase().trim();
        return val === "true" || val === "yes" || val === "1";
      }).length;
    }

    // Bulk call names
    const bulkCallCol = findCol(["bulk_call_name", "bulk_call"]);
    const topBulkCallNames: { name: string; count: number }[] = [];

    if (bulkCallCol) {
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        const val = (r[bulkCallCol] ?? "").trim();
        if (val) {
          counts[val] = (counts[val] ?? 0) + 1;
        }
      });

      topBulkCallNames.push(
        ...Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
      );
    }

    res.json({
      totalCalls: rows.length,
      totalRows: rows.length,
      avgDurationMinutes,
      totalDurationMinutes,
      sentimentBreakdown,
      callDirectionBreakdown,
      callStatusBreakdown,
      joinInterestCount,
      topBulkCallNames,
      detectedFeatures,
      columns,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    req.log.warn({ error: message }, "Failed to compute sheet summary");
    res.status(500).json({ error: message });
  }
});

export default router;
