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
import { RepositoryResult, SourceCatalogEntry } from "../../domain/sourceIntegration";
import { sourceCatalog } from "../../data-sources/sourceCatalog";
import {
  createJmaTideHttpSourceClient,
  JmaTideSourceClient,
} from "../../data-sources/jmaTideSource";
import { normalizeTide } from "../../normalizers/normalizeTide";
import { getTideObservationPointIdForSpot } from "../../source-mappers/jmaTidePointMap";
import { MockForecastRepository } from "./mockForecastRepository";

interface RealForecastRepositoryOptions {
  fallbackRepository?: ForecastRepository;
  tideSourceClient?: JmaTideSourceClient;
  repositoryMode?: RepositoryMeta["mode"];
}

function mergeReports<T>(
  base: RepositoryResult<T>,
  extraReports: RepositoryResult<unknown>["reports"],
  data: T,
): RepositoryResult<T> {
  return {
    data,
    partial: base.partial || extraReports.some((report) => report.state !== "success"),
    reports: [...base.reports, ...extraReports],
  };
}

function buildMovementSummary(kind: "満潮" | "干潮"): string {
  return `${kind}の前後は海の動きが出やすい時間の目安になります。`;
}

function overlayForecastTide(
  forecast: DailySpotForecast,
  tideRecord: ReturnType<typeof normalizeTide>["data"][number],
): DailySpotForecast {
  const highTide = tideRecord.highTideTimes[0] ?? forecast.tide.highTide;
  const lowTide = tideRecord.lowTideTimes[0] ?? forecast.tide.lowTide;
  const movementWindows = [
    tideRecord.highTides[0]
      ? {
          label: `${tideRecord.highTides[0].time}前後`,
          summary: buildMovementSummary("満潮"),
        }
      : undefined,
    tideRecord.lowTides[0]
      ? {
          label: `${tideRecord.lowTides[0].time}前後`,
          summary: buildMovementSummary("干潮"),
        }
      : undefined,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...forecast,
    tide: {
      ...forecast.tide,
      highTide,
      lowTide,
      movementWindows: movementWindows.length > 0 ? movementWindows : forecast.tide.movementWindows,
      summary: `${tideRecord.stationName} の潮位表をもとに、${highTide} の満潮と ${lowTide} の干潮を確認しています。`,
      sourceStatus:
        tideRecord.highTides.length > 0 && tideRecord.lowTides.length > 0 ? "available" : "limited",
    },
  };
}

export class RealForecastRepository implements ForecastRepository {
  private readonly fallbackRepository: ForecastRepository;

  private readonly tideSourceClient: JmaTideSourceClient;

  private readonly repositoryMode: RepositoryMeta["mode"];

  constructor(options: RealForecastRepositoryOptions = {}) {
    this.fallbackRepository = options.fallbackRepository ?? new MockForecastRepository();
    this.tideSourceClient = options.tideSourceClient ?? createJmaTideHttpSourceClient();
    this.repositoryMode = options.repositoryMode ?? "hybrid";
  }

  async getRepositoryMeta(): Promise<RepositoryMeta> {
    return {
      sourceName: "real-forecast-repository",
      mode: this.repositoryMode,
      supportsCache: false,
      supportsPartialData: true,
    };
  }

  async getSourceCatalog(): Promise<SourceCatalogEntry[]> {
    return sourceCatalog;
  }

  async listSpots(): Promise<RepositoryResult<Spot[]>> {
    return this.fallbackRepository.listSpots();
  }

  async listAvailableDates(): Promise<RepositoryResult<string[]>> {
    return this.fallbackRepository.listAvailableDates();
  }

  async getDailyForecasts(
    query: DailyForecastQuery,
  ): Promise<RepositoryResult<DailySpotForecast[]>> {
    const baseResult = await this.fallbackRepository.getDailyForecasts(query);
    const observationPointIds = Array.from(
      new Set(baseResult.data.map((forecast) => getTideObservationPointIdForSpot(forecast.spotId))),
    );

    const tideResults = await Promise.all(
      observationPointIds.map(async (observationPointId) => {
        const rawResult = await this.tideSourceClient.fetchRawTideData({
          observationPointId,
          startDate: query.date,
          endDate: query.date,
        });

        return normalizeTide({
          rawResult,
          coveredObservationPointId: observationPointId,
        });
      }),
    );

    const normalizedBySpotAndDate = new Map<string, ReturnType<typeof normalizeTide>["data"][number]>();
    for (const tideResult of tideResults) {
      for (const record of tideResult.data) {
        for (const spotId of record.spotIds) {
          normalizedBySpotAndDate.set(`${spotId}:${record.date}`, record);
        }
      }
    }

    const data = baseResult.data.map((forecast) => {
      const normalized = normalizedBySpotAndDate.get(`${forecast.spotId}:${forecast.date}`);
      return normalized ? overlayForecastTide(forecast, normalized) : forecast;
    });

    return mergeReports(
      baseResult,
      tideResults.flatMap((result) => result.reports),
      data,
    );
  }

  async getSpotForecast(
    query: SpotForecastQuery,
  ): Promise<RepositoryResult<DailySpotForecast | undefined>> {
    const dailyResult = await this.getDailyForecasts(query);
    return {
      ...dailyResult,
      data: dailyResult.data.find((forecast) => forecast.spotId === query.spotId),
    };
  }

  async getSpotById(spotId: SpotId): Promise<RepositoryResult<Spot | undefined>> {
    return this.fallbackRepository.getSpotById(spotId);
  }

  async listGlossaryTerms(): Promise<RepositoryResult<GlossaryTerm[]>> {
    return this.fallbackRepository.listGlossaryTerms();
  }
}
