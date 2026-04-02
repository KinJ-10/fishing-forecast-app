import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  JmaTideFetchQuery,
  JmaTideSourceClient,
} from "../../data-sources/jmaTideSource";
import { RepositoryResult, RawJmaTideDayRecord } from "../../domain/sourceIntegration";
import { parseJmaTideHtml } from "../../data-sources/jmaTideParser";
import { RealForecastRepository } from "./realForecastRepository";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name: string): string {
  return readFileSync(
    path.join(__dirname, "..", "..", "data-sources", "__fixtures__", name),
    "utf-8",
  );
}

class FixtureJmaTideSourceClient implements JmaTideSourceClient {
  async fetchRawTideData(
    query: JmaTideFetchQuery,
  ): Promise<RepositoryResult<RawJmaTideDayRecord[]>> {
    const fixtureName =
      query.observationPointId === "yokohama"
        ? "jma-tide-yokohama.html"
        : "jma-tide-kawasaki.html";
    const stationCode = query.observationPointId === "yokohama" ? "QS" : "KW";
    const parsed = parseJmaTideHtml({
      html: loadFixture(fixtureName),
      observationPointId: query.observationPointId,
      stationCode,
      sourceUrl: `https://example.test/${query.observationPointId}`,
      fetchedAt: "2026-04-02T00:00:00.000Z",
    });

    return {
      data: parsed.records.filter((record) => record.date >= query.startDate && record.date <= query.endDate),
      partial: false,
      reports: [
        {
          sourceId: "jma-tide" as const,
          sourceName: "JMA Tide Table",
          summary: `${query.observationPointId} fixture`,
          state: "success" as const,
          fetchedAt: "2026-04-02T00:00:00.000Z",
          cacheStatus: "bypass" as const,
          coveredSpotIds: [],
          issueCount: 0,
          issues: [],
        },
      ],
    };
  }
}

test("RealForecastRepository overlays tide data into daily forecasts and exposes reports", async () => {
  const repository = new RealForecastRepository({
    tideSourceClient: new FixtureJmaTideSourceClient(),
  });

  const result = await repository.getDailyForecasts({ date: "2026-04-02" });
  const daikoku = result.data.find((forecast) => forecast.spotId === "daikoku");
  const higashi = result.data.find((forecast) => forecast.spotId === "higashi-ogishima");

  assert.ok(daikoku);
  assert.ok(higashi);
  assert.equal(daikoku?.tide.highTide, "4:52");
  assert.equal(higashi?.tide.highTide, "4:55");
  assert.equal(result.reports.length, 2);
  assert.ok(result.reports.every((report) => report.sourceName === "JMA Tide Table"));
});
