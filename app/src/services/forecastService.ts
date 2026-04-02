import { ForecastRepository, GlossaryTerm, Recommendation, RepositoryMeta, Spot, SpotId } from "../domain/models";
import { SourceCatalogEntry, SourceFetchReport } from "../domain/sourceIntegration";
import {
  buildDailyRecommendations,
  buildDailyRecommendationsResult,
} from "../features/recommendations/buildDailyRecommendations";
import {
  createForecastRepositoryForMode,
  extendRepositoryMeta,
  ForecastRepositoryRuntime,
  resolveForecastRepositoryRuntime,
} from "./forecastRepositoryMode";

export interface ForecastDiagnostics {
  runtime: ForecastRepositoryRuntime;
  repositoryMeta: RepositoryMeta;
  partial: boolean;
  reports: SourceFetchReport[];
}

let repositoryRuntime = resolveForecastRepositoryRuntime(import.meta.env);
let repository: ForecastRepository = createForecastRepositoryForMode(repositoryRuntime);

export function setForecastRepository(
  nextRepository: ForecastRepository,
  runtimeOverride?: ForecastRepositoryRuntime,
): void {
  repository = nextRepository;
  repositoryRuntime =
    runtimeOverride ??
    {
      mode: "mock",
      note: "manual repository override を使っています。",
    };
}

export function getForecastRepositoryRuntime(): ForecastRepositoryRuntime {
  return repositoryRuntime;
}

export function resetForecastRepositoryFromEnv(env: ImportMetaEnv = import.meta.env): void {
  repositoryRuntime = resolveForecastRepositoryRuntime(env);
  repository = createForecastRepositoryForMode(repositoryRuntime);
}

export async function getRepositoryMeta(): Promise<RepositoryMeta> {
  const meta = await repository.getRepositoryMeta();
  return extendRepositoryMeta(meta, repositoryRuntime);
}

export async function getSourceCatalog(): Promise<SourceCatalogEntry[]> {
  return repository.getSourceCatalog();
}

export async function getAvailableDates(): Promise<string[]> {
  const result = await repository.listAvailableDates();
  return result.data;
}

export async function getDailyRecommendations(date: string): Promise<Recommendation[]> {
  return buildDailyRecommendations(repository, date);
}

export async function getDailyRecommendationsWithDiagnostics(date: string): Promise<{
  recommendations: Recommendation[];
  diagnostics: ForecastDiagnostics;
}> {
  const [meta, result] = await Promise.all([
    getRepositoryMeta(),
    buildDailyRecommendationsResult(repository, date),
  ]);

  return {
    recommendations: result.data,
    diagnostics: {
      runtime: repositoryRuntime,
      repositoryMeta: meta,
      partial: result.partial,
      reports: result.reports,
    },
  };
}

export async function getSpotDetail(
  spotId: SpotId,
  date: string,
): Promise<{ spot?: Spot; recommendation?: Recommendation }> {
  const [spotResult, recommendations] = await Promise.all([
    repository.getSpotById(spotId),
    buildDailyRecommendations(repository, date),
  ]);

  return {
    spot: spotResult.data,
    recommendation: recommendations.find((item) => item.spot.id === spotId),
  };
}

export async function getSpotDetailWithDiagnostics(
  spotId: SpotId,
  date: string,
): Promise<{
  spot?: Spot;
  recommendation?: Recommendation;
  diagnostics: ForecastDiagnostics;
}> {
  const [spotResult, meta, recommendationResult] = await Promise.all([
    repository.getSpotById(spotId),
    getRepositoryMeta(),
    buildDailyRecommendationsResult(repository, date),
  ]);

  return {
    spot: spotResult.data,
    recommendation: recommendationResult.data.find((item) => item.spot.id === spotId),
    diagnostics: {
      runtime: repositoryRuntime,
      repositoryMeta: meta,
      partial: spotResult.partial || recommendationResult.partial,
      reports: [...spotResult.reports, ...recommendationResult.reports],
    },
  };
}

export async function getGlossary(): Promise<GlossaryTerm[]> {
  const result = await repository.listGlossaryTerms();
  return result.data;
}
