import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  JmaTideHttpSourceClient,
  resolveJmaTideRequest,
} from "./jmaTideSource";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name: string): string {
  return readFileSync(path.join(__dirname, "__fixtures__", name), "utf-8");
}

const baseQuery = {
  observationPointId: "yokohama" as const,
  startDate: "2026-04-02",
  endDate: "2026-04-02",
};

test("resolveJmaTideRequest uses Vite proxy in dev by default", () => {
  const result = resolveJmaTideRequest(baseQuery, {}, { DEV: true });

  assert.equal(result.route, "vite-dev-proxy");
  assert.match(result.requestUrl, /^\/api\/jma-tide\?/);
  assert.match(result.sourceUrl, /^https:\/\/ds\.data\.jma\.go\.jp\//);
});

test("resolveJmaTideRequest can force direct mode even in dev", () => {
  const result = resolveJmaTideRequest(
    baseQuery,
    {},
    {
      DEV: true,
      VITE_JMA_TIDE_FETCH_MODE: "direct",
    },
  );

  assert.equal(result.route, "direct");
  assert.equal(result.requestUrl, result.sourceUrl);
});

test("resolveJmaTideRequest builds text proxy path in dev", () => {
  const result = resolveJmaTideRequest(baseQuery, { format: "text", year: 2026 }, { DEV: true });

  assert.equal(result.route, "vite-dev-proxy");
  assert.equal(result.requestUrl, "/api/jma-tide-text/2026/QS.txt");
  assert.equal(
    result.sourceUrl,
    "https://ds.data.jma.go.jp/gmd/kaiyou/data/db/tide/suisan/txt/2026/QS.txt",
  );
});

test("JmaTideHttpSourceClient prefers text data when available", async () => {
  const client = new JmaTideHttpSourceClient(async (input) => {
    const url = String(input);
    if (url.includes("/api/jma-tide-text/2026/QS.txt") || url.endsWith("/2026/QS.txt")) {
      return {
        ok: true,
        text: async () => loadFixture("jma-tide-yokohama.txt"),
      } as Response;
    }

    throw new Error(`unexpected request: ${url}`);
  });

  const result = await client.fetchRawTideData(baseQuery);

  assert.equal(result.partial, false);
  assert.equal(result.data.length, 1);
  assert.match(result.reports[0]?.summary ?? "", /parserRecords=1/);
  assert.match(result.reports[0]?.summary ?? "", /潮位テキスト/);
});

test("JmaTideHttpSourceClient falls back to html when text parsing yields no records", async () => {
  const client = new JmaTideHttpSourceClient(async (input) => {
    const url = String(input);
    if (url.includes("/api/jma-tide-text/2026/QS.txt") || url.endsWith("/2026/QS.txt")) {
      return {
        ok: true,
        text: async () => "broken text",
      } as Response;
    }

    return {
      ok: true,
      text: async () => loadFixture("jma-tide-yokohama.html"),
    } as Response;
  });

  const result = await client.fetchRawTideData(baseQuery);

  assert.equal(result.data.length, 1);
  assert.equal(result.reports[0]?.state, "partial");
  assert.ok(result.reports[0]?.issues.some((issue) => issue.code === "JMA_TIDE_TEXT_FALLBACK_HTML"));
  assert.match(result.reports[0]?.summary ?? "", /HTML fallback/);
});

test("JmaTideHttpSourceClient reports CORS-likely diagnostics on direct fetch failure", async () => {
  const client = new JmaTideHttpSourceClient(async () => {
    throw new TypeError("Failed to fetch");
  });

  const result = await client.fetchRawTideData(baseQuery);
  const report = result.reports[0];

  assert.equal(result.partial, true);
  assert.equal(report.state, "failed");
  assert.match(report.summary, /CORS 制約/);
  assert.deepEqual(report.coveredSpotIds, ["daikoku", "honmoku"]);
  assert.ok(report.issues.some((issue) => issue.code === "JMA_TIDE_FETCH_EXCEPTION"));
  assert.ok(report.issues.some((issue) => issue.code === "JMA_TIDE_REQUEST_ROUTE"));
  assert.ok(report.issues.some((issue) => issue.code === "JMA_TIDE_SOURCE_URL"));
  assert.ok(report.issues.some((issue) => issue.code === "JMA_TIDE_BROWSER_CORS_LIKELY"));
});
