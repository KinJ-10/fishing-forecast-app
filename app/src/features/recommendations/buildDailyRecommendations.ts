import { ForecastRepository, Recommendation } from "../../domain/models";
import { calculateSpotScore } from "../scoring/calculateSpotScore";

export async function buildDailyRecommendations(
  repository: ForecastRepository,
  date: string,
): Promise<Recommendation[]> {
  const [spots, forecasts] = await Promise.all([
    repository.listSpots(),
    repository.getDailyForecasts({ date }),
  ]);

  const bySpotId = new Map(spots.map((spot) => [spot.id, spot]));

  return forecasts
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
}
