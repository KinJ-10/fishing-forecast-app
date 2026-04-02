import { SpotId } from "./models";

export type SourceId =
  | "yokohama-city"
  | "yokohama-fishingpiers"
  | "kawasaki-city"
  | "jma-tide"
  | "jma-sst"
  | "open-meteo-weather"
  | "open-meteo-marine"
  | "anglers";

export type SourceKind =
  | "facility"
  | "rules"
  | "catch"
  | "tide"
  | "weather"
  | "wave"
  | "waterTemperature";

export type SourceReliability = "high" | "medium" | "low";
export type MissingnessRisk = "low" | "medium" | "high";
export type ImplementationDifficulty = "low" | "medium" | "high";
export type CachePolicy = "cache-first" | "network-first" | "stale-while-revalidate";
export type CacheStatus = "hit" | "miss" | "stale" | "bypass";
export type SourceFetchState = "success" | "partial" | "failed" | "skipped";
export type TideObservationPointId = "yokohama" | "kawasaki";

export interface SourceCatalogEntry {
  sourceId: SourceId;
  kind: SourceKind;
  displayName: string;
  official: boolean;
  priority: number;
}

export interface RepositoryReadOptions {
  cachePolicy?: CachePolicy;
  allowPartial?: boolean;
  maxStalenessMinutes?: number;
}

export interface SourceFetchIssue {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface SourceFetchReport {
  sourceId: SourceId;
  sourceName: string;
  summary: string;
  state: SourceFetchState;
  fetchedAt: string;
  cacheStatus: CacheStatus;
  coveredSpotIds: SpotId[];
  issueCount: number;
  issues: SourceFetchIssue[];
}

export interface RepositoryResult<T> {
  data: T;
  partial: boolean;
  reports: SourceFetchReport[];
}

export interface SpotAliasRule {
  sourceId: SourceId;
  spotId: SpotId;
  canonicalName: string;
  aliases: string[];
  normalizedTokens: string[];
  matchingHints: string[];
}

export interface RawFacilitySourceRecord {
  sourceId: SourceId;
  sourceName: string;
  externalSpotName: string;
  address?: string;
  businessHoursText?: string;
  ruleTexts: string[];
  noteTexts: string[];
  fetchedAt: string;
}

export interface RawCatchSourceRecord {
  sourceId: SourceId;
  externalSpotName: string;
  observedAt: string;
  speciesName: string;
  countText?: string;
  sizeText?: string;
  methodText?: string;
  commentText?: string;
}

export interface RawTideSourceRecord {
  sourceId: SourceId;
  stationName: string;
  date: string;
  highTideTimes: string[];
  lowTideTimes: string[];
  tideLevelTexts: string[];
  fetchedAt: string;
}

export interface RawJmaTideEvent {
  kind: "high" | "low";
  time: string;
  levelCm: number | null;
}

export interface RawJmaTideDayRecord {
  sourceId: "jma-tide";
  observationPointId: TideObservationPointId;
  stationCode: string;
  stationName: string;
  date: string;
  moonPhase?: string;
  events: RawJmaTideEvent[];
  sourceUrl: string;
  fetchedAt: string;
}

export interface RawWeatherSourceRecord {
  sourceId: SourceId;
  latitude: number;
  longitude: number;
  observedAt: string;
  windSpeedText?: string;
  windDirectionText?: string;
  weatherCodeText?: string;
}

export interface RawWaveSourceRecord {
  sourceId: SourceId;
  latitude: number;
  longitude: number;
  observedAt: string;
  waveHeightText?: string;
  wavePeriodText?: string;
  noteText?: string;
}

export interface RawWaterTemperatureSourceRecord {
  sourceId: SourceId;
  latitude: number;
  longitude: number;
  observedAt: string;
  temperatureText?: string;
  areaLabel?: string;
}

export interface NormalizedFacilityRecord {
  spotId: SpotId;
  displayName: string;
  accessNote?: string;
  rules: {
    title: string;
    description: string;
    sourceId: SourceId;
  }[];
  sourceReport: SourceFetchReport;
}

export interface NormalizedCatchRecord {
  spotId: SpotId;
  observedDate: string;
  speciesName: string;
  countEstimate: number | null;
  countLabel: string;
  comment: string;
  sourceId: SourceId;
}

export interface NormalizedTideRecord {
  observationPointId: TideObservationPointId;
  spotIds: SpotId[];
  stationCode: string;
  stationName: string;
  date: string;
  highTides: Array<{ time: string; levelCm: number | null }>;
  lowTides: Array<{ time: string; levelCm: number | null }>;
  highTideTimes: string[];
  lowTideTimes: string[];
  sourceId: SourceId;
  sourceUrl?: string;
}

export interface NormalizedMarineRecord {
  spotId: SpotId;
  date: string;
  hourlyWindSpeedMps: number[];
  hourlyWaveHeightM: number[];
  hourlyWaterTempC: number[];
  sourceIds: SourceId[];
}
