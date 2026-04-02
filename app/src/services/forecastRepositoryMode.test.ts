import assert from "node:assert/strict";
import test from "node:test";
import {
  createForecastRepositoryForMode,
  resolveForecastRepositoryRuntime,
} from "./forecastRepositoryMode";

test("repository mode defaults to mock when env is not set", async () => {
  const runtime = resolveForecastRepositoryRuntime({});
  const repository = createForecastRepositoryForMode(runtime);
  const meta = await repository.getRepositoryMeta();

  assert.equal(runtime.mode, "mock");
  assert.equal(meta.mode, "mock");
});

test("repository mode keeps real when explicitly configured", async () => {
  const runtime = resolveForecastRepositoryRuntime({
    VITE_FORECAST_REPOSITORY_MODE: "real",
  });
  const repository = createForecastRepositoryForMode(runtime);
  const meta = await repository.getRepositoryMeta();

  assert.equal(runtime.mode, "real");
  assert.equal(meta.mode, "real");
});

test("repository mode falls back to mock when config is invalid", () => {
  const runtime = resolveForecastRepositoryRuntime({
    VITE_FORECAST_REPOSITORY_MODE: "unknown",
  });

  assert.equal(runtime.mode, "mock");
  assert.match(runtime.note, /mock repository/);
});
