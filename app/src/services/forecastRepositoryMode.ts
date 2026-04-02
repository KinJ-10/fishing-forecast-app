import { MockForecastRepository } from "../data/repositories/mockForecastRepository";
import { RealForecastRepository } from "../data/repositories/realForecastRepository";
import { ForecastRepository, RepositoryMeta } from "../domain/models";

export type ForecastRepositoryMode = "mock" | "real" | "hybrid";

export interface ForecastRepositoryRuntime {
  mode: ForecastRepositoryMode;
  requestedMode?: string;
  note: string;
}

export interface ForecastRepositoryEnv {
  VITE_FORECAST_REPOSITORY_MODE?: string;
}

function normalizeMode(value?: string): string | undefined {
  return value?.trim().toLowerCase();
}

export function resolveForecastRepositoryRuntime(
  env: ForecastRepositoryEnv,
): ForecastRepositoryRuntime {
  const requestedMode = env.VITE_FORECAST_REPOSITORY_MODE;
  const normalized = normalizeMode(requestedMode);

  if (!normalized) {
    return {
      mode: "mock",
      requestedMode,
      note: "環境変数が未設定のため mock repository を使っています。",
    };
  }

  if (normalized === "mock" || normalized === "real" || normalized === "hybrid") {
    return {
      mode: normalized,
      requestedMode,
      note:
        normalized === "mock"
          ? "mock repository を使っています。"
          : normalized === "real"
            ? "real tide source を有効にしています。未実装の項目は mock を併用します。"
            : "hybrid repository を使っています。tide のみ real、その他は mock を使います。",
    };
  }

  return {
    mode: "mock",
    requestedMode,
    note: `不明な repository mode "${requestedMode}" のため mock repository を使っています。`,
  };
}

export function createForecastRepositoryForMode(
  runtime: ForecastRepositoryRuntime,
): ForecastRepository {
  if (runtime.mode === "mock") {
    return new MockForecastRepository();
  }

  return new RealForecastRepository({
    repositoryMode: runtime.mode,
  });
}

export function extendRepositoryMeta(
  meta: RepositoryMeta,
  runtime: ForecastRepositoryRuntime,
): RepositoryMeta {
  return {
    ...meta,
    mode: runtime.mode,
  };
}
