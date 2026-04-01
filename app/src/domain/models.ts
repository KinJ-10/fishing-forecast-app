export type SpotId = "daikoku" | "honmoku" | "higashi-ogishima";
export type BeginnerLevel = "high" | "medium";
export type DataStatus = "available" | "limited" | "missing";
export type DataSourceType =
  | "directCatch"
  | "nearbyCatch"
  | "tide"
  | "weather"
  | "seasonal"
  | "manual";
export type ConfidenceLevel = "high" | "medium" | "low";
export type TrendDirection = "up" | "steady" | "down" | "unknown";
export type RuleImportance = "must" | "attention";
export type AdvisoryLevel = "info" | "attention" | "warning";
export type SpeciesLikelihood = "high" | "medium" | "low";
export type CatchFallbackPolicy = "direct" | "nearby" | "seasonal" | "none";

export interface FacilityRule {
  id: string;
  title: string;
  description: string;
  importance: RuleImportance;
}

export interface Spot {
  id: SpotId;
  name: string;
  area: string;
  beginnerLevel: BeginnerLevel;
  summary: string;
  accessNote: string;
  features: string[];
  facilityRules: FacilityRule[];
  safetyNote: string;
}

export interface TideWindow {
  label: string;
  summary: string;
}

export interface TideInfo {
  tideName: string;
  highTide: string;
  lowTide: string;
  movementWindows: TideWindow[];
  summary: string;
  sourceStatus: DataStatus;
}

export interface MarineCondition {
  sky: string;
  windSpeedMps: number | null;
  waveHeightM: number | null;
  waterTempC: number | null;
  summary: string;
  beginnerComment: string;
  sourceStatus: DataStatus;
}

export interface CatchObservation {
  species: string;
  countLabel: string;
  trend: TrendDirection;
  summary: string;
}

export interface CatchSummary {
  sourceStatus: DataStatus;
  fallbackPolicy: CatchFallbackPolicy;
  summary: string;
  observations: CatchObservation[];
}

export interface SpeciesCandidate {
  name: string;
  likelihood: SpeciesLikelihood;
  recommendedMethod: string;
  comment: string;
  dataStatus: DataStatus;
}

export interface ReasonItem {
  id: string;
  title: string;
  summary: string;
  actionTip: string;
  sourceTypes: DataSourceType[];
  dataStatus: DataStatus;
}

export interface AdvisoryItem {
  id: string;
  level: AdvisoryLevel;
  title: string;
  summary: string;
  actionTip: string;
}

export interface MigrationExpectation {
  level: ConfidenceLevel;
  summary: string;
  nearbySpots: string[];
  actionTip: string;
  sourceStatus: DataStatus;
}

export interface DailySpotForecast {
  date: string;
  spotId: SpotId;
  targetSpecies: SpeciesCandidate[];
  recommendedTimeSlots: string[];
  tide: TideInfo;
  marine: MarineCondition;
  catchSummary: CatchSummary;
  migration: MigrationExpectation;
  reasons: ReasonItem[];
  advisories: AdvisoryItem[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  plainMeaning: string;
  actionTip: string;
}

export interface ScoreBreakdown {
  recentCatch: number;
  tide: number;
  marine: number;
  seasonal: number;
  migration: number;
  safetyPenalty: number;
  fallbackNotes: string[];
}

export interface Recommendation {
  spot: Spot;
  forecast: DailySpotForecast;
  score: number;
  breakdown: ScoreBreakdown;
  rank: number;
  reasons: ReasonItem[];
  primaryAdvisory: AdvisoryItem;
}

export interface DailyForecastQuery {
  date: string;
}

export interface SpotForecastQuery {
  spotId: SpotId;
  date: string;
}

export interface RepositoryMeta {
  sourceName: string;
  mode: "mock" | "live";
}

export interface ForecastRepository {
  getRepositoryMeta(): Promise<RepositoryMeta>;
  listSpots(): Promise<Spot[]>;
  listAvailableDates(): Promise<string[]>;
  getDailyForecasts(query: DailyForecastQuery): Promise<DailySpotForecast[]>;
  getSpotForecast(query: SpotForecastQuery): Promise<DailySpotForecast | undefined>;
  getSpotById(spotId: SpotId): Promise<Spot | undefined>;
  listGlossaryTerms(): Promise<GlossaryTerm[]>;
}
