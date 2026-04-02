import assert from "node:assert/strict";
import test from "node:test";
import { formatFetchedAt, formatReportState, shouldShowForecastDebugPanel } from "./forecastDebug";

test("formatReportState returns readable labels", () => {
  assert.equal(formatReportState("success"), "成功");
  assert.equal(formatReportState("partial"), "一部取得");
  assert.equal(formatReportState("failed"), "失敗");
});

test("formatFetchedAt returns fallback label for invalid date", () => {
  assert.equal(formatFetchedAt("invalid"), "時刻不明");
});

test("shouldShowForecastDebugPanel is enabled for non-mock runtime", () => {
  assert.equal(
    shouldShowForecastDebugPanel(
      {
        mode: "real",
        note: "real tide source を有効にしています。",
      },
      [],
    ),
    true,
  );
});
