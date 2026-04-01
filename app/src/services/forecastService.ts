import { GlossaryTerm, Recommendation, Spot, SpotId } from "../domain/models";
import { MockForecastRepository } from "../data/repositories/mockForecastRepository";
import { buildDailyRecommendations } from "../features/recommendations/buildDailyRecommendations";

const repository = new MockForecastRepository();

export async function getAvailableDates(): Promise<string[]> {
  return repository.listAvailableDates();
}

export async function getDailyRecommendations(date: string): Promise<Recommendation[]> {
  return buildDailyRecommendations(repository, date);
}

export async function getSpotDetail(
  spotId: SpotId,
  date: string,
): Promise<{ spot?: Spot; recommendation?: Recommendation }> {
  const [spot, recommendations] = await Promise.all([
    repository.getSpotById(spotId),
    buildDailyRecommendations(repository, date),
  ]);

  return {
    spot,
    recommendation: recommendations.find((item) => item.spot.id === spotId),
  };
}

export async function getGlossary(): Promise<GlossaryTerm[]> {
  return repository.getGlossaryTerms();
}
