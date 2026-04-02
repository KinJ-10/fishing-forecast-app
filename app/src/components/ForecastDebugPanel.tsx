import { RepositoryMeta } from "../domain/models";
import { SourceFetchReport } from "../domain/sourceIntegration";
import {
  formatFetchedAt,
  formatReportState,
  shouldShowForecastDebugPanel,
} from "../lib/forecastDebug";
import { ForecastRepositoryRuntime } from "../services/forecastRepositoryMode";

interface ForecastDebugPanelProps {
  runtime: ForecastRepositoryRuntime;
  repositoryMeta: RepositoryMeta;
  reports: SourceFetchReport[];
  partial: boolean;
}

export function ForecastDebugPanel(props: ForecastDebugPanelProps) {
  if (!shouldShowForecastDebugPanel(props.runtime, props.reports)) {
    return null;
  }

  return (
    <section className="card debug-panel">
      <div className="debug-panel__header">
        <div>
          <p className="section-kicker">Debug</p>
          <h3>Repository / Source Reports</h3>
        </div>
        <div className="debug-pills">
          <span className="pill">mode: {props.runtime.mode}</span>
          <span className="pill">partial: {props.partial ? "yes" : "no"}</span>
        </div>
      </div>

      <p className="muted">{props.runtime.note}</p>
      <p className="muted">
        repository: {props.repositoryMeta.sourceName} / supports partial:{" "}
        {props.repositoryMeta.supportsPartialData ? "yes" : "no"}
      </p>

      {props.reports.length === 0 ? (
        <div className="card-note">source report はまだありません。</div>
      ) : (
        <ul className="debug-report-list">
          {props.reports.map((report) => (
            <li key={`${report.sourceId}-${report.fetchedAt}-${report.summary}`}>
              <div className="debug-report-list__title">
                <strong>{report.sourceName}</strong>
                <span className={`debug-state debug-state--${report.state}`}>
                  {formatReportState(report.state)}
                </span>
              </div>
              <span>fetchedAt: {formatFetchedAt(report.fetchedAt)}</span>
              <span>summary: {report.summary}</span>
              {report.coveredSpotIds.length > 0 ? (
                <span>spots: {report.coveredSpotIds.join(", ")}</span>
              ) : null}
              {report.issues.length > 0 ? (
                <span>
                  issues:{" "}
                  {report.issues.map((issue) => `[${issue.code}] ${issue.message}`).join(" / ")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
