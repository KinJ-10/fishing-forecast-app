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
import { RepositoryResult } from "../../domain/sourceIntegration";
import { sourceCatalog } from "../../data-sources/sourceCatalog";
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
      supportsCache: false,
      supportsPartialData: true,
    };
  }

  async getSourceCatalog() {
    return sourceCatalog;
  }

  async listSpots(): Promise<RepositoryResult<Spot[]>> {
    return {
      data: spots,
      partial: false,
      reports: [],
    };
  }

  async listAvailableDates(): Promise<RepositoryResult<string[]>> {
    const dateSet = new Set(forecasts.map((forecast) => forecast.date));
    return {
      data: sortDates(Array.from(dateSet)),
      partial: false,
      reports: [],
    };
  }

  async getDailyForecasts(query: DailyForecastQuery): Promise<RepositoryResult<DailySpotForecast[]>> {
    return {
      data: forecasts.filter((forecast) => forecast.date === query.date),
      partial: false,
      reports: [],
    };
  }

  async getSpotForecast(
    query: SpotForecastQuery,
  ): Promise<RepositoryResult<DailySpotForecast | undefined>> {
    return {
      data: forecasts.find(
        (forecast) => forecast.date === query.date && forecast.spotId === query.spotId,
      ),
      partial: false,
      reports: [],
    };
  }

  async getSpotById(spotId: SpotId): Promise<RepositoryResult<Spot | undefined>> {
    return {
      data: spots.find((spot) => spot.id === spotId),
      partial: false,
      reports: [],
    };
  }

  async listGlossaryTerms(): Promise<RepositoryResult<GlossaryTerm[]>> {
    return {
      data: glossaryTerms,
      partial: false,
      reports: [],
    };
  }
}
