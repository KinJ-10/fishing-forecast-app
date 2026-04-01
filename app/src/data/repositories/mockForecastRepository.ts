import {
  DailySpotForecast,
  ForecastRepository,
  GlossaryTerm,
  Spot,
  SpotId,
} from "../../domain/models";
import { glossaryTerms } from "../glossary";
import { forecasts, spots } from "../mockData";

function sortDates(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export class MockForecastRepository implements ForecastRepository {
  async listSpots(): Promise<Spot[]> {
    return spots;
  }

  async listAvailableDates(): Promise<string[]> {
    const dateSet = new Set(forecasts.map((forecast) => forecast.date));
    return sortDates(Array.from(dateSet));
  }

  async getForecastsByDate(date: string): Promise<DailySpotForecast[]> {
    return forecasts.filter((forecast) => forecast.date === date);
  }

  async getSpotById(spotId: SpotId): Promise<Spot | undefined> {
    return spots.find((spot) => spot.id === spotId);
  }

  async getGlossaryTerms(): Promise<GlossaryTerm[]> {
    return glossaryTerms;
  }
}
