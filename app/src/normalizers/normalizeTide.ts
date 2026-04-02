import {
  NormalizedTideRecord,
  RawJmaTideDayRecord,
  RepositoryResult,
  SourceFetchIssue,
  SourceFetchReport,
  TideObservationPointId,
} from "../domain/sourceIntegration";
import { getSpotIdsForObservationPoint } from "../source-mappers/jmaTidePointMap";

interface NormalizeTideOptions {
  rawResult: RepositoryResult<RawJmaTideDayRecord[]>;
  coveredObservationPointId: TideObservationPointId;
}

function buildNormalizeIssues(record: RawJmaTideDayRecord): SourceFetchIssue[] {
  const issues: SourceFetchIssue[] = [];
  const highCount = record.events.filter((event) => event.kind === "high").length;
  const lowCount = record.events.filter((event) => event.kind === "low").length;

  if (highCount === 0) {
    issues.push({
      code: "JMA_TIDE_HIGH_TIDE_MISSING",
      message: `${record.date} の満潮時刻がありません。`,
      severity: "warning",
    });
  }

  if (lowCount === 0) {
    issues.push({
      code: "JMA_TIDE_LOW_TIDE_MISSING",
      message: `${record.date} の干潮時刻がありません。`,
      severity: "warning",
    });
  }

  return issues;
}

function mergeReports(
  reports: SourceFetchReport[],
  normalizeIssues: SourceFetchIssue[],
  summary?: string,
): SourceFetchReport[] {
  return reports.map((report) => {
    const issues = [...report.issues, ...normalizeIssues];
    const state =
      report.state === "failed"
        ? "failed"
        : report.state === "partial" || issues.length > 0
          ? "partial"
          : "success";

    return {
      ...report,
      summary:
        state === "failed" || !summary
          ? report.summary
          : `${report.summary} / ${summary}`,
      state,
      issueCount: issues.length,
      issues,
    };
  });
}

export function normalizeTide({
  rawResult,
  coveredObservationPointId,
}: NormalizeTideOptions): RepositoryResult<NormalizedTideRecord[]> {
  const normalizeIssues = rawResult.data.flatMap(buildNormalizeIssues);

  const data: NormalizedTideRecord[] = rawResult.data.map((record) => {
    const highTides = record.events
      .filter((event) => event.kind === "high")
      .map((event) => ({ time: event.time, levelCm: event.levelCm }));
    const lowTides = record.events
      .filter((event) => event.kind === "low")
      .map((event) => ({ time: event.time, levelCm: event.levelCm }));

    return {
      observationPointId: coveredObservationPointId,
      spotIds: getSpotIdsForObservationPoint(coveredObservationPointId),
      stationCode: record.stationCode,
      stationName: record.stationName,
      date: record.date,
      highTides,
      lowTides,
      highTideTimes: highTides.map((event) => event.time),
      lowTideTimes: lowTides.map((event) => event.time),
      sourceId: "jma-tide",
      sourceUrl: record.sourceUrl,
    };
  });

  const summary =
    data.length > 0
      ? `${data[0].stationName} の潮位データを正規化しました。`
      : undefined;

  return {
    data,
    partial: rawResult.partial || normalizeIssues.length > 0,
    reports: mergeReports(rawResult.reports, normalizeIssues, summary),
  };
}
