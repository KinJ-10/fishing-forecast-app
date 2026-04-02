import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseJmaTideHtml } from "./jmaTideParser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name: string): string {
  return readFileSync(path.join(__dirname, "__fixtures__", name), "utf-8");
}

test("parseJmaTideHtml parses yokohama fixture", () => {
  const result = parseJmaTideHtml({
    html: loadFixture("jma-tide-yokohama.html"),
    observationPointId: "yokohama",
    stationCode: "QS",
    sourceUrl: "https://example.test/yokohama",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].stationName, "横浜");
  assert.equal(result.records[0].events.filter((event) => event.kind === "high")[0]?.time, "4:52");
  assert.equal(result.records[0].events.filter((event) => event.kind === "low")[1]?.levelCm, 47);
  assert.equal(result.issues.filter((issue) => issue.severity === "error").length, 0);
});

test("parseJmaTideHtml parses kawasaki fixture", () => {
  const result = parseJmaTideHtml({
    html: loadFixture("jma-tide-kawasaki.html"),
    observationPointId: "kawasaki",
    stationCode: "KW",
    sourceUrl: "https://example.test/kawasaki",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].stationName, "川崎");
  assert.equal(result.records[0].events.filter((event) => event.kind === "high").length, 2);
  assert.equal(result.records[0].events.filter((event) => event.kind === "low").length, 2);
  assert.equal(result.records[0].events[0].time, "4:55");
  assert.equal(result.records[0].events[0].levelCm, 178);
  assert.equal(result.issues.filter((issue) => issue.severity === "error").length, 0);
});

test("parseJmaTideHtml reports section-level failures with granular issue codes", () => {
  const result = parseJmaTideHtml({
    html: "<html><body><h1>潮位表</h1></body></html>",
    observationPointId: "kawasaki",
    stationCode: "KW",
    sourceUrl: "https://example.test/kawasaki",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(result.records.length, 0);
  assert.equal(result.issues[0]?.code, "JMA_TIDE_SECTION_NOT_FOUND");
});
