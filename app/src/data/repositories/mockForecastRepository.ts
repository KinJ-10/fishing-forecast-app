import {
  DailySpotForecast,
  DailyForecastQuery,
  ForecastRepository,
  GlossaryTerm,
  RepositoryMeta,
  Spot,
  SpotForecastQuery,
  SpotId,
} from "../../domain/models";
import { glossaryTerms } from "../glossary";
import { forecasts, spots } from "../mockData";

function sortDates(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export class MockForecastRepository implements ForecastRepository {
  async getRepositoryMeta(): Promise<RepositoryMeta> {
    return {
      sourceName: "mock-forecast-repository",
      mode: "mock",
    };
  }

  async listSpots(): Promise<Spot[]> {
    return spots;
  }

  async listAvailableDates(): Promise<string[]> {
    const dateSet = new Set(forecasts.map((forecast) => forecast.date));
    return sortDates(Array.from(dateSet));
  }

  async getDailyForecasts(query: DailyForecastQuery): Promise<DailySpotForecast[]> {
    return forecasts.filter((forecast) => forecast.date === query.date);
  }

  async getSpotForecast(query: SpotForecastQuery): Promise<DailySpotForecast | undefined> {
    return forecasts.find(
      (forecast) => forecast.date === query.date && forecast.spotId === query.spotId,
    );
  }

  async getSpotById(spotId: SpotId): Promise<Spot | undefined> {
    return spots.find((spot) => spot.id === spotId);
  }

  async listGlossaryTerms(): Promise<GlossaryTerm[]> {
    return glossaryTerms;
  }
}
