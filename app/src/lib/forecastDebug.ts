import { SourceFetchReport } from "../domain/sourceIntegration";
import { ForecastRepositoryRuntime } from "../services/forecastRepositoryMode";

export function formatReportState(state: SourceFetchReport["state"]): string {
  switch (state) {
    case "success":
      return "成功";
    case "partial":
      return "一部取得";
    case "failed":
      return "失敗";
    case "skipped":
      return "未実行";
    default:
      return state;
  }
}

export function formatFetchedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "時刻不明";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(date);
}

export function shouldShowForecastDebugPanel(
  runtime: ForecastRepositoryRuntime,
  reports: SourceFetchReport[],
): boolean {
  return runtime.mode !== "mock" || reports.length > 0;
}
