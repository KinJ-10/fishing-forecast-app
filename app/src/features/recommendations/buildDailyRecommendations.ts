import { ForecastRepository, Recommendation } from "../../domain/models";
import { RepositoryResult } from "../../domain/sourceIntegration";
import { calculateSpotScore } from "../scoring/calculateSpotScore";

export interface DailyRecommendationBuildResult extends RepositoryResult<Recommendation[]> {}

export async function buildDailyRecommendationsResult(
  repository: ForecastRepository,
  date: string,
): Promise<DailyRecommendationBuildResult> {
  const [spotsResult, forecastsResult] = await Promise.all([
    repository.listSpots(),
    repository.getDailyForecasts({ date }),
  ]);

  const bySpotId = new Map(spotsResult.data.map((spot) => [spot.id, spot]));

  const data = forecastsResult.data
    .map((forecast) => {
      const spot = bySpotId.get(forecast.spotId);
      if (!spot) {
        return undefined;
      }
      return calculateSpotScore(spot, forecast);
    })
    .filter((item): item is Omit<Recommendation, "rank"> => Boolean(item))
    .sort((left, right) => right.score - left.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return {
    data,
    partial: spotsResult.partial || forecastsResult.partial,
    reports: [...spotsResult.reports, ...forecastsResult.reports],
  };
}

export async function buildDailyRecommendations(
  repository: ForecastRepository,
  date: string,
): Promise<Recommendation[]> {
  const result = await buildDailyRecommendationsResult(repository, date);
  return result.data;
}
