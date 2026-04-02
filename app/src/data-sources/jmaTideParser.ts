import {
  RawJmaTideDayRecord,
  SourceFetchIssue,
  TideObservationPointId,
} from "../domain/sourceIntegration";

interface ParseJmaTideHtmlParams {
  html: string;
  observationPointId: TideObservationPointId;
  stationCode: string;
  sourceUrl: string;
  fetchedAt: string;
}

export interface ParseJmaTideHtmlResult {
  records: RawJmaTideDayRecord[];
  issues: SourceFetchIssue[];
}

function decodeHtml(value: string): string {
  return value
    .replace(/<img[^>]*alt="([^"]+)"[^>]*>/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStationName(html: string): string | undefined {
  const titleMatch = html.match(/<title>[^<]*潮位表\s*([^（<]+)（/);
  if (titleMatch?.[1]) {
    return decodeHtml(titleMatch[1]);
  }

  const headingMatch = html.match(/<h1>潮位表\s*([^（<]+)（/);
  return headingMatch?.[1] ? decodeHtml(headingMatch[1]) : undefined;
}

function extractMoonPhase(cellHtml: string): string | undefined {
  const altMatch = cellHtml.match(/alt="([^"]+)"/);
  return altMatch?.[1];
}

function extractCells(rowHtml: string): string[] {
  const cells = [...rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
  return cells.map((match) => match[1]);
}

function extractHiloSection(html: string): string | undefined {
  const headingMatch = html.match(/<h4[^>]*>\s*満潮・干潮[\s\S]*?<\/h4>/i);
  if (!headingMatch || headingMatch.index === undefined) {
    return undefined;
  }

  const startIndex = headingMatch.index;
  const endCandidates = [
    html.indexOf("潮位表ダウンロード", startIndex),
    html.indexOf('<p class="totop">', startIndex),
    html.indexOf("<br /><hr /><br />", startIndex),
  ].filter((index) => index >= 0);
  const endIndex = endCandidates.length > 0 ? Math.min(...endCandidates) : html.length;

  return html.slice(startIndex, endIndex);
}

function extractHiloTable(sectionHtml: string): string | undefined {
  const tables = [...sectionHtml.matchAll(/<table[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]);

  return tables.find((tableHtml) => {
    const text = decodeHtml(tableHtml);
    return text.includes("年/月/日") && text.includes("満潮") && text.includes("干潮");
  });
}

function extractTidePairs(cells: string[], startIndex: number, kind: "high" | "low") {
  const items: RawJmaTideDayRecord["events"] = [];

  for (let index = startIndex; index < startIndex + 8; index += 2) {
    const time = decodeHtml(cells[index] ?? "");
    const level = decodeHtml(cells[index + 1] ?? "");

    if (!time || time === "*") {
      continue;
    }

    items.push({
      kind,
      time,
      levelCm: level === "*" || !level ? null : Number.parseInt(level, 10),
    });
  }

  return items;
}

export function parseJmaTideHtml({
  html,
  observationPointId,
  stationCode,
  sourceUrl,
  fetchedAt,
}: ParseJmaTideHtmlParams): ParseJmaTideHtmlResult {
  const issues: SourceFetchIssue[] = [];
  const stationName = extractStationName(html) ?? stationCode;

  const sectionHtml = extractHiloSection(html);
  if (!sectionHtml) {
    return {
      records: [],
      issues: [
        {
          code: "JMA_TIDE_SECTION_NOT_FOUND",
          message: "JMA 潮位表の「満潮・干潮」セクションを見つけられませんでした。",
          severity: "error",
        },
      ],
    };
  }

  const tableHtml = extractHiloTable(sectionHtml);
  if (!tableHtml) {
    return {
      records: [],
      issues: [
        {
          code: "JMA_TIDE_HEADER_NOT_FOUND",
          message: "JMA 潮位表の満潮・干潮ヘッダーを持つテーブルを見つけられませんでした。",
          severity: "error",
        },
      ],
    };
  }

  const rows = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rows.length === 0) {
    return {
      records: [],
      issues: [
        {
          code: "JMA_TIDE_ROW_PARSE_FAILED",
          message: "JMA 潮位表のデータ行を見つけられませんでした。",
          severity: "error",
        },
      ],
    };
  }

  const records = rows.flatMap((rowMatch) => {
    if (/<th[\s>]/i.test(rowMatch[1])) {
      return [];
    }

    const cells = extractCells(rowMatch[1]);
    const dateLabel = decodeHtml(cells[0] ?? "");
    const dateMatch = dateLabel.match(/\d{4}\/\d{2}\/\d{2}/);

    if (!dateMatch) {
      const rowText = decodeHtml(rowMatch[1]);
      if (!rowText || rowText.includes("注意") || rowText.includes("時刻") || rowText.includes("年/月/日")) {
        return [];
      }

      issues.push({
        code: "JMA_TIDE_ROW_DATE_MISSING",
        message: "日付が解釈できない行をスキップしました。",
        severity: "warning",
      });
      return [];
    }

    // JMA の table は date, moon, high x4, low x4 の固定構造です。
    // HTML 構造変更に弱いので fixture test で崩れを検知します。
    if (cells.length < 18) {
      issues.push({
        code: "JMA_TIDE_ROW_CELL_SHORT",
        message: `${dateMatch[0]} のセル数が不足しています。`,
        severity: "warning",
      });
    }

    const highEvents = extractTidePairs(cells, 2, "high");
    const lowEvents = extractTidePairs(cells, 10, "low");

    if (highEvents.length === 0 || lowEvents.length === 0) {
      issues.push({
        code: "JMA_TIDE_DAY_PARTIAL",
        message: `${dateMatch[0]} は満潮または干潮のデータが不足しています。`,
        severity: "warning",
      });
    }

    return [
      {
        sourceId: "jma-tide" as const,
        observationPointId,
        stationCode,
        stationName,
        date: dateMatch[0].replace(/\//g, "-"),
        moonPhase: extractMoonPhase(cells[1] ?? ""),
        events: [...highEvents, ...lowEvents],
        sourceUrl,
        fetchedAt,
      },
    ];
  });

  if (records.length === 0) {
    issues.push({
      code: "JMA_TIDE_ROW_PARSE_FAILED",
      message: "JMA 潮位表の候補行は見つかりましたが、日別データを解釈できませんでした。",
      severity: "error",
    });
  }

  return {
    records,
    issues,
  };
}
