import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseJmaTideHtml } from "../data-sources/jmaTideParser";
import { normalizeTide } from "./normalizeTide";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name: string): string {
  return readFileSync(path.join(__dirname, "..", "data-sources", "__fixtures__", name), "utf-8");
}

test("normalizeTide maps yokohama point to daikoku and honmoku", () => {
  const parsed = parseJmaTideHtml({
    html: loadFixture("jma-tide-yokohama.html"),
    observationPointId: "yokohama",
    stationCode: "QS",
    sourceUrl: "https://example.test/yokohama",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  const result = normalizeTide({
    rawResult: {
      data: parsed.records,
      partial: false,
      reports: [
        {
          sourceId: "jma-tide",
          sourceName: "JMA Tide Table",
          summary: "fixture",
          state: "success",
          fetchedAt: "2026-04-02T00:00:00.000Z",
          cacheStatus: "bypass",
          coveredSpotIds: [],
          issueCount: 0,
          issues: [],
        },
      ],
    },
    coveredObservationPointId: "yokohama",
  });

  assert.equal(result.partial, false);
  assert.equal(result.data.length, 2);
  assert.deepEqual(result.data[0].spotIds, ["daikoku", "honmoku"]);
  assert.equal(result.data[0].highTides[0].time, "4:52");
  assert.equal(result.reports[0].state, "success");
  assert.match(result.reports[0].summary, /fixture \/ 横浜 の潮位データを正規化しました/);
});

test("normalizeTide keeps source failure summary when raw fetch failed", () => {
  const failureSummary =
    "横浜 の潮位表取得に失敗しました。browser 直 fetch が CORS 制約で拒否された可能性があります。";
  const result = normalizeTide({
    rawResult: {
      data: [],
      partial: true,
      reports: [
        {
          sourceId: "jma-tide",
          sourceName: "JMA Tide Table",
          summary: failureSummary,
          state: "failed",
          fetchedAt: "2026-04-02T00:00:00.000Z",
          cacheStatus: "bypass",
          coveredSpotIds: ["daikoku", "honmoku"],
          issueCount: 1,
          issues: [
            {
              code: "JMA_TIDE_BROWSER_CORS_LIKELY",
              message: "browser 直 fetch は CORS 制約で失敗した可能性があります。",
              severity: "error",
            },
          ],
        },
      ],
    },
    coveredObservationPointId: "yokohama",
  });

  assert.equal(result.data.length, 0);
  assert.equal(result.reports[0].summary, failureSummary);
  assert.match(result.reports[0].summary, /CORS 制約/);
  assert.equal(result.reports[0].state, "failed");
});
