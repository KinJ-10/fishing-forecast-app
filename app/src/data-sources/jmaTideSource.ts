import {
  RawJmaTideDayRecord,
  RepositoryResult,
  SourceFetchIssue,
  SourceFetchReport,
  TideObservationPointId,
} from "../domain/sourceIntegration";
import { createSafeFetch, FetchLike } from "../lib/fetchClient";
import {
  getSpotIdsForObservationPoint,
  getTideObservationPointById,
} from "../source-mappers/jmaTidePointMap";
import { parseJmaTideHtml } from "./jmaTideParser";
import { parseJmaTideText } from "./jmaTideTextParser";

export interface JmaTideFetchQuery {
  observationPointId: TideObservationPointId;
  startDate: string;
  endDate: string;
}

export interface JmaTideSourceClient {
  fetchRawTideData(query: JmaTideFetchQuery): Promise<RepositoryResult<RawJmaTideDayRecord[]>>;
}

type JmaTideRequestRoute = "direct" | "vite-dev-proxy";
type JmaTideFetchMode = "auto" | "direct" | "proxy";
type JmaTideFormat = "html" | "text";

const JMA_TIDE_PROXY_PATH = "/api/jma-tide";
const JMA_TIDE_TEXT_PROXY_PATH = "/api/jma-tide-text";

function buildJmaTideSourceUrl(query: JmaTideFetchQuery): string {
  const point = getTideObservationPointById(query.observationPointId);
  const start = new Date(`${query.startDate}T00:00:00+09:00`);
  const end = new Date(`${query.endDate}T00:00:00+09:00`);
  const params = new URLSearchParams({
    stn: point.stationCode,
    ys: String(start.getFullYear()),
    ms: String(start.getMonth() + 1).padStart(2, "0"),
    ds: String(start.getDate()).padStart(2, "0"),
    ye: String(end.getFullYear()),
    me: String(end.getMonth() + 1).padStart(2, "0"),
    de: String(end.getDate()).padStart(2, "0"),
    S_HILO: "on",
    LV: "DL",
  });

  return `https://ds.data.jma.go.jp/gmd/kaiyou/db/tide/suisan/suisan.php?${params.toString()}`;
}

function buildJmaTideTextSourceUrl(year: number, stationCode: string): string {
  return `https://ds.data.jma.go.jp/gmd/kaiyou/data/db/tide/suisan/txt/${year}/${stationCode}.txt`;
}

function readRuntimeEnv(): Partial<ImportMetaEnv> {
  return ((import.meta as ImportMeta & { env?: Partial<ImportMetaEnv> }).env ?? {}) as Partial<
    ImportMetaEnv
  >;
}

function normalizeFetchMode(value?: string): JmaTideFetchMode {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "direct" || normalized === "proxy") {
    return normalized;
  }

  return "auto";
}

export function resolveJmaTideRequest(
  query: JmaTideFetchQuery,
  options: {
    format?: JmaTideFormat;
    year?: number;
  } = {},
  env: Partial<ImportMetaEnv> = readRuntimeEnv(),
): {
  sourceUrl: string;
  requestUrl: string;
  route: JmaTideRequestRoute;
  format: JmaTideFormat;
} {
  const format = options.format ?? "html";
  const point = getTideObservationPointById(query.observationPointId);
  const sourceUrl =
    format === "text"
      ? buildJmaTideTextSourceUrl(options.year ?? new Date(query.startDate).getFullYear(), point.stationCode)
      : buildJmaTideSourceUrl(query);
  const fetchMode = normalizeFetchMode(env.VITE_JMA_TIDE_FETCH_MODE);
  const useProxy = fetchMode === "proxy" || (fetchMode === "auto" && env.DEV === true);

  if (!useProxy) {
    return {
      sourceUrl,
      requestUrl: sourceUrl,
      route: "direct",
      format,
    };
  }

  return {
    sourceUrl,
    requestUrl:
      format === "text"
        ? `${JMA_TIDE_TEXT_PROXY_PATH}/${options.year ?? new Date(query.startDate).getFullYear()}/${point.stationCode}.txt`
        : `${JMA_TIDE_PROXY_PATH}?${new URL(sourceUrl).searchParams.toString()}`,
    route: "vite-dev-proxy",
    format,
  };
}

function isLikelyNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "TypeError" && /failed to fetch|networkerror/i.test(error.message);
}

function buildRouteIssue(
  route: JmaTideRequestRoute,
  requestUrl: string,
  format: JmaTideFormat,
): SourceFetchIssue {
  return {
    code: "JMA_TIDE_REQUEST_ROUTE",
    message: `format=${format}; route=${route}; requestUrl=${requestUrl}`,
    severity: "info",
  };
}

function buildSourceUrlIssue(sourceUrl: string, format: JmaTideFormat): SourceFetchIssue {
  return {
    code: "JMA_TIDE_SOURCE_URL",
    message: `format=${format}; sourceUrl=${sourceUrl}`,
    severity: "info",
  };
}

function buildFetchExceptionIssues(params: {
  error: unknown;
  sourceUrl: string;
  requestUrl: string;
  route: JmaTideRequestRoute;
  format: JmaTideFormat;
}): SourceFetchIssue[] {
  const errorMessage =
    params.error instanceof Error
      ? `${params.error.name}: ${params.error.message}`
      : "JMA 潮位表の取得で例外が発生しました。";
  const issues: SourceFetchIssue[] = [
    {
      code: "JMA_TIDE_FETCH_EXCEPTION",
      message: errorMessage,
      severity: "error",
    },
    buildRouteIssue(params.route, params.requestUrl, params.format),
    buildSourceUrlIssue(params.sourceUrl, params.format),
  ];

  if (isLikelyNetworkError(params.error)) {
    if (params.route === "direct") {
      issues.push({
        code: "JMA_TIDE_BROWSER_CORS_LIKELY",
        message:
          "browser 直 fetch は CORS 制約で失敗した可能性があります。dev では Vite proxy、恒久対応は server-side fetch / BFF を前提にしてください。",
        severity: "error",
      });
    } else {
      issues.push({
        code: "JMA_TIDE_DEV_PROXY_FAILURE",
        message:
          "Vite dev proxy 経由の取得に失敗しました。dev server 側の proxy 設定か、proxy 先への到達性を確認してください。",
        severity: "error",
      });
    }
  }

  return issues;
}

function buildFetchFailureSummary(route: JmaTideRequestRoute, stationName: string): string {
  if (route === "direct") {
    return `${stationName} の潮位表取得に失敗しました。browser 直 fetch が CORS 制約で拒否された可能性があります。`;
  }

  return `${stationName} の潮位表取得に失敗しました。Vite dev proxy 経由の到達性を確認してください。`;
}

function buildHttpErrorIssue(
  response: Response,
  request: ReturnType<typeof resolveJmaTideRequest>,
): SourceFetchIssue[] {
  return [
    {
      code: "JMA_TIDE_HTTP_ERROR",
      message: `JMA 潮位表の取得に失敗しました。status=${response.status}; format=${request.format}`,
      severity: "error",
    },
    buildRouteIssue(request.route, request.requestUrl, request.format),
    buildSourceUrlIssue(request.sourceUrl, request.format),
  ];
}

function filterRecordsByDateRange(records: RawJmaTideDayRecord[], query: JmaTideFetchQuery) {
  return records.filter((record) => record.date >= query.startDate && record.date <= query.endDate);
}

function buildYearRange(query: JmaTideFetchQuery): number[] {
  const startYear = new Date(`${query.startDate}T00:00:00+09:00`).getFullYear();
  const endYear = new Date(`${query.endDate}T00:00:00+09:00`).getFullYear();
  const years: number[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }

  return years;
}

function mergeIssues(...groups: SourceFetchIssue[][]): SourceFetchIssue[] {
  const seen = new Set<string>();
  const merged: SourceFetchIssue[] = [];

  groups.flat().forEach((issue) => {
    const key = `${issue.code}:${issue.message}:${issue.severity}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(issue);
    }
  });

  return merged;
}

function createReport(params: {
  state: SourceFetchReport["state"];
  fetchedAt: string;
  issues: SourceFetchIssue[];
  summary: string;
  coveredSpotIds?: SourceFetchReport["coveredSpotIds"];
}): SourceFetchReport {
  return {
    sourceId: "jma-tide",
    sourceName: "JMA Tide Table",
    summary: params.summary,
    state: params.state,
    fetchedAt: params.fetchedAt,
    cacheStatus: "bypass",
    coveredSpotIds: params.coveredSpotIds ?? [],
    issueCount: params.issues.length,
    issues: params.issues,
  };
}

export class JmaTideHttpSourceClient implements JmaTideSourceClient {
  private readonly fetchImpl: FetchLike;

  constructor(fetchImpl?: FetchLike) {
    this.fetchImpl = createSafeFetch(fetchImpl);
  }

  async fetchRawTideData(query: JmaTideFetchQuery): Promise<RepositoryResult<RawJmaTideDayRecord[]>> {
    const fetchedAt = new Date().toISOString();
    const point = getTideObservationPointById(query.observationPointId);
    const coveredSpotIds = getSpotIdsForObservationPoint(query.observationPointId);
    const textIssues: SourceFetchIssue[] = [];
    const textRecords: RawJmaTideDayRecord[] = [];

    for (const year of buildYearRange(query)) {
      const request = resolveJmaTideRequest(query, { format: "text", year });

      try {
        const response = await this.fetchImpl(request.requestUrl);
        if (!response.ok) {
          textIssues.push(...buildHttpErrorIssue(response, request));
          continue;
        }

        const text = await response.text();
        const parsed = parseJmaTideText({
          text,
          observationPointId: query.observationPointId,
          stationCode: point.stationCode,
          stationName: point.stationName,
          sourceUrl: request.sourceUrl,
          fetchedAt,
        });

        textIssues.push(...parsed.issues);
        textRecords.push(...filterRecordsByDateRange(parsed.records, query));
      } catch (error) {
        textIssues.push(
          ...buildFetchExceptionIssues({
            error,
            sourceUrl: request.sourceUrl,
            requestUrl: request.requestUrl,
            route: request.route,
            format: request.format,
          }),
        );
      }
    }

    if (textRecords.length === 0) {
      textIssues.push({
        code: "JMA_TIDE_TEXT_NO_RECORDS",
        message: `${point.stationName} のテキストデータ版から対象日のレコードを得られませんでした。`,
        severity: "warning",
      });
    }

    if (textRecords.length > 0) {
      const state = textIssues.length > 0 ? "partial" : "success";

      return {
        data: textRecords,
        partial: state !== "success",
        reports: [
          createReport({
            state,
            fetchedAt,
            issues: textIssues,
            summary:
              state === "success"
                ? `${point.stationName} の潮位テキストを解析しました。parserRecords=${textRecords.length}`
                : `${point.stationName} の潮位テキストを一部警告つきで解析しました。parserRecords=${textRecords.length}`,
            coveredSpotIds,
          }),
        ],
      };
    }

    const request = resolveJmaTideRequest(query, { format: "html" });

    try {
      const response = await this.fetchImpl(request.requestUrl);
      if (!response.ok) {
        const issues = mergeIssues(
          textIssues,
          [
            {
              code: "JMA_TIDE_TEXT_FALLBACK_HTML",
              message: "テキストデータ版でレコードを得られなかったため HTML 版へフォールバックしました。",
              severity: "warning",
            },
          ],
          buildHttpErrorIssue(response, request),
        );

        return {
          data: [],
          partial: true,
          reports: [
            createReport({
              state: "failed",
              fetchedAt,
              issues,
              summary: `${point.stationName} の潮位テキストと HTML の取得に失敗しました。status=${response.status}`,
              coveredSpotIds,
            }),
          ],
        };
      }

      const html = await response.text();
      const parsed = parseJmaTideHtml({
        html,
        observationPointId: query.observationPointId,
        stationCode: point.stationCode,
        sourceUrl: request.sourceUrl,
        fetchedAt,
      });
      const filteredHtmlRecords = filterRecordsByDateRange(parsed.records, query);

      const state =
        filteredHtmlRecords.length === 0
          ? "failed"
          : textIssues.length > 0 || parsed.issues.length > 0
            ? "partial"
            : "success";
      const issues = mergeIssues(
        textIssues,
        [
          {
            code: "JMA_TIDE_TEXT_FALLBACK_HTML",
            message: "テキストデータ版でレコードを得られなかったため HTML 版へフォールバックしました。",
            severity: "warning",
          },
        ],
        parsed.issues,
      );

      return {
        data: filteredHtmlRecords,
        partial: state !== "success",
        reports: [
          createReport({
            state,
            fetchedAt,
            issues,
            summary:
              state === "success"
                ? `${point.stationName} の HTML fallback を解析しました。parserRecords=${filteredHtmlRecords.length}`
                : state === "partial"
                  ? `${point.stationName} の HTML fallback を一部警告つきで解析しました。parserRecords=${filteredHtmlRecords.length}`
                  : `${point.stationName} の潮位表は取得できましたが、表を解釈できませんでした。parserRecords=0`,
            coveredSpotIds,
          }),
        ],
      };
    } catch (error) {
      const issues = mergeIssues(
        textIssues,
        [
          {
            code: "JMA_TIDE_TEXT_FALLBACK_HTML",
            message: "テキストデータ版でレコードを得られなかったため HTML 版へフォールバックしました。",
            severity: "warning",
          },
        ],
        buildFetchExceptionIssues({
          error,
          sourceUrl: request.sourceUrl,
          requestUrl: request.requestUrl,
          route: request.route,
          format: request.format,
        }),
      );

      return {
        data: [],
        partial: true,
        reports: [
          createReport({
            state: "failed",
            fetchedAt,
            issues,
            summary: buildFetchFailureSummary(request.route, point.stationName),
            coveredSpotIds,
          }),
        ],
      };
    }
  }
}

export function createJmaTideHttpSourceClient(fetchImpl?: FetchLike): JmaTideSourceClient {
  return new JmaTideHttpSourceClient(fetchImpl);
}
