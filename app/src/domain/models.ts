export type SpotId = "daikoku" | "honmoku" | "higashi-ogishima";

export interface Spot {
  id: SpotId;
  name: string;
  area: string;
  beginnerLevel: "high" | "medium";
  summary: string;
  accessNote: string;
  features: string[];
  rules: string[];
  safetyNote: string;
}

export interface TideInfo {
  tideName: string;
  highTide: string;
  lowTide: string;
  activeWindows: string[];
  comment: string;
}

export interface WeatherInfo {
  windSpeedMps: number;
  waveHeightM: number;
  waterTempC: number;
  sky: string;
}

export interface RecentCatch {
  species: string;
  latestCount: number;
  trend: "up" | "steady" | "down";
  note: string;
}

export interface MigrationSignal {
  species: string;
  nearbySpots: string[];
  confidence: "high" | "medium" | "low";
  note: string;
}

export interface DailySpotForecast {
  date: string;
  spotId: SpotId;
  targetSpecies: string[];
  recommendedWindows: string[];
  tide: TideInfo;
  weather: WeatherInfo;
  recentCatches: RecentCatch[];
  migrationSignals: MigrationSignal[];
  caution: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  meaning: string;
  beginnerTip: string;
}

export interface ScoreBreakdown {
  recentCatch: number;
  tide: number;
  marine: number;
  seasonal: number;
  migration: number;
  safetyPenalty: number;
}

export interface Recommendation {
  spot: Spot;
  forecast: DailySpotForecast;
  score: number;
  breakdown: ScoreBreakdown;
  rank: number;
  reasons: string[];
  caution: string;
}

export interface ForecastRepository {
  listSpots(): Promise<Spot[]>;
  listAvailableDates(): Promise<string[]>;
  getForecastsByDate(date: string): Promise<DailySpotForecast[]>;
  getSpotById(spotId: SpotId): Promise<Spot | undefined>;
  getGlossaryTerms(): Promise<GlossaryTerm[]>;
}
