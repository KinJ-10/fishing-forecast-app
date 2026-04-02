import {
  RawJmaTideDayRecord,
  SourceFetchIssue,
  TideObservationPointId,
} from "../domain/sourceIntegration";

interface ParseJmaTideTextParams {
  text: string;
  observationPointId: TideObservationPointId;
  stationCode: string;
  stationName: string;
  sourceUrl: string;
  fetchedAt: string;
}

export interface ParseJmaTideTextResult {
  records: RawJmaTideDayRecord[];
  issues: SourceFetchIssue[];
}

const HOURLY_END = 72;
const DATE_END = 78;
const STATION_END = 80;
const HIGH_TIDE_END = 108;
const LOW_TIDE_END = 136;

function parseDateSegment(segment: string): string | undefined {
  if (segment.length < 6) {
    return undefined;
  }

  const year = Number.parseInt(segment.slice(0, 2).trim(), 10);
  const month = Number.parseInt(segment.slice(2, 4).trim(), 10);
  const day = Number.parseInt(segment.slice(4, 6).trim(), 10);

  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return `20${String(year).padStart(2, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTideTime(value: string): string | undefined {
  const trimmed = value.replace(/\s+/g, "");
  if (!trimmed || trimmed === "9999") {
    return undefined;
  }

  const digits = trimmed.padStart(4, "0");
  if (!/^\d{4}$/.test(digits)) {
    return undefined;
  }

  return `${Number.parseInt(digits.slice(0, 2), 10)}:${digits.slice(2, 4)}`;
}

function parseTideEventSegment(
  segment: string,
  kind: "high" | "low",
  lineNumber: number,
  date: string,
  issues: SourceFetchIssue[],
): RawJmaTideDayRecord["events"] {
  const events: RawJmaTideDayRecord["events"] = [];

  for (let index = 0; index < 28; index += 7) {
    const chunk = segment.slice(index, index + 7);
    if (chunk.length < 7) {
      issues.push({
        code: "JMA_TIDE_TEXT_LINE_SHORT",
        message: `${date} のテキスト行が短いため ${kind === "high" ? "満潮" : "干潮"}列を最後まで読めませんでした。line=${lineNumber}`,
        severity: "warning",
      });
      break;
    }

    const time = formatTideTime(chunk.slice(0, 4));
    const levelText = chunk.slice(4, 7).trim();

    if (!time) {
      if (chunk.slice(0, 4).trim() && chunk.slice(0, 4).trim() !== "9999") {
        issues.push({
          code: "JMA_TIDE_TEXT_ROW_PARSE_FAILED",
          message: `${date} の${kind === "high" ? "満潮" : "干潮"}時刻を解釈できませんでした。line=${lineNumber}`,
          severity: "warning",
        });
      }
      continue;
    }

    const level = levelText === "999" || !levelText ? null : Number.parseInt(levelText, 10);
    events.push({
      kind,
      time,
      levelCm: Number.isNaN(level) ? null : level,
    });
  }

  return events;
}

export function parseJmaTideText({
  text,
  observationPointId,
  stationCode,
  stationName,
  sourceUrl,
  fetchedAt,
}: ParseJmaTideTextParams): ParseJmaTideTextResult {
  const issues: SourceFetchIssue[] = [];
  const records: RawJmaTideDayRecord[] = [];
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    if (line.length < LOW_TIDE_END) {
      issues.push({
        code: "JMA_TIDE_TEXT_LINE_SHORT",
        message: `テキストデータの行長が不足しています。line=${lineNumber}`,
        severity: "warning",
      });
      return;
    }

    const date = parseDateSegment(line.slice(HOURLY_END, DATE_END));
    if (!date) {
      issues.push({
        code: "JMA_TIDE_TEXT_DATE_NOT_FOUND",
        message: `テキストデータの日付を解釈できませんでした。line=${lineNumber}`,
        severity: "warning",
      });
      return;
    }

    const lineStationCode = line.slice(DATE_END, STATION_END).trim();
    if (lineStationCode !== stationCode) {
      return;
    }

    const highEvents = parseTideEventSegment(
      line.slice(STATION_END, HIGH_TIDE_END),
      "high",
      lineNumber,
      date,
      issues,
    );
    const lowEvents = parseTideEventSegment(
      line.slice(HIGH_TIDE_END, LOW_TIDE_END),
      "low",
      lineNumber,
      date,
      issues,
    );

    if (highEvents.length === 0 && lowEvents.length === 0) {
      issues.push({
        code: "JMA_TIDE_TEXT_ROW_PARSE_FAILED",
        message: `${date} の満潮・干潮データを解釈できませんでした。line=${lineNumber}`,
        severity: "warning",
      });
      return;
    }

    records.push({
      sourceId: "jma-tide",
      observationPointId,
      stationCode,
      stationName,
      date,
      events: [...highEvents, ...lowEvents],
      sourceUrl,
      fetchedAt,
    });
  });

  return {
    records,
    issues,
  };
}
