import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseJmaTideText } from "./jmaTideTextParser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFixture(name: string): string {
  return readFileSync(path.join(__dirname, "__fixtures__", name), "utf-8");
}

test("parseJmaTideText parses yokohama fixture", () => {
  const result = parseJmaTideText({
    text: loadFixture("jma-tide-yokohama.txt"),
    observationPointId: "yokohama",
    stationCode: "QS",
    stationName: "横浜",
    sourceUrl: "https://example.test/yokohama.txt",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(result.issues.length, 0);
  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].date, "2026-04-02");
  assert.equal(result.records[0].events.filter((event) => event.kind === "high")[0]?.time, "4:52");
  assert.equal(result.records[0].events.filter((event) => event.kind === "low")[0]?.time, "11:13");
});

test("parseJmaTideText parses kawasaki fixture", () => {
  const result = parseJmaTideText({
    text: loadFixture("jma-tide-kawasaki.txt"),
    observationPointId: "kawasaki",
    stationCode: "KW",
    stationName: "川崎",
    sourceUrl: "https://example.test/kawasaki.txt",
    fetchedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(result.issues.length, 0);
  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].events.filter((event) => event.kind === "high")[0]?.levelCm, 178);
  assert.equal(result.records[0].events.filter((event) => event.kind === "low")[1]?.time, "23:26");
});
