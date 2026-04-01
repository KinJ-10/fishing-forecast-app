import {
  CatchSummary,
  DailySpotForecast,
  MarineCondition,
  Recommendation,
  ScoreBreakdown,
  Spot,
} from "../../domain/models";
import { getSeasonLabel } from "../../lib/date";

const seasonalSpeciesBySeason: Record<string, string[]> = {
  spring: ["アジ", "イワシ", "コノシロ", "サッパ", "メバル", "カサゴ"],
  summer: ["アジ", "サバ", "イワシ"],
  autumn: ["サバ", "イナダ", "アジ"],
  winter: ["メバル", "カサゴ", "カレイ"],
};

function scoreRecentCatch(catchSummary: CatchSummary): { score: number; fallbackNotes: string[] } {
  if (catchSummary.sourceStatus === "missing") {
    return {
      score: 8,
      fallbackNotes: ["直近の釣果情報がないため、最近の実績は中立点で扱っています。"],
    };
  }

  const baseScore = catchSummary.observations.reduce((total, item) => {
    const trendBonus =
      item.trend === "up" ? 6 : item.trend === "steady" ? 4 : item.trend === "down" ? 1 : 3;
    return total + trendBonus;
  }, 0);

  if (catchSummary.sourceStatus === "limited") {
    return {
      score: Math.min(16, 10 + baseScore),
      fallbackNotes: ["直近の釣果が少ない地点なので、近くの釣り場の様子も参考にしています。"],
    };
  }

  const countBonus = catchSummary.observations.reduce((total, item) => {
    const numeric = Number.parseInt(item.countLabel, 10);
    return Number.isNaN(numeric) ? total + 2 : total + Math.min(8, Math.floor(numeric / 5));
  }, 0);

  return {
    score: Math.min(30, baseScore + countBonus),
    fallbackNotes: [],
  };
}

function scoreTide(forecast: DailySpotForecast): number {
  const tideNameBonus =
    forecast.tide.tideName === "大潮" ? 10 : forecast.tide.tideName === "中潮" ? 8 : 5;
  const movementWindowBonus = Math.min(10, forecast.tide.movementWindows.length * 5);
  return tideNameBonus + movementWindowBonus;
}

function scoreMarine(marine: MarineCondition): { score: number; fallbackNotes: string[] } {
  const fallbackNotes: string[] = [];
  const windScore =
    marine.windSpeedMps === null
      ? (fallbackNotes.push("風の実測がないため、海況の読みは保守的にしています。"), 5)
      : marine.windSpeedMps <= 4.5
        ? 9
        : marine.windSpeedMps <= 6
          ? 6
          : 3;
  const waveScore =
    marine.waveHeightM === null ? 4 : marine.waveHeightM <= 0.5 ? 8 : marine.waveHeightM <= 0.8 ? 5 : 2;
  const temperatureScore =
    marine.waterTempC === null
      ? 4
      : marine.waterTempC >= 15 && marine.waterTempC <= 19
        ? 6
        : 4;
  return {
    score: windScore + waveScore + temperatureScore,
    fallbackNotes,
  };
}

function scoreSeasonalFit(forecast: DailySpotForecast): number {
  const season = getSeasonLabel(forecast.date);
  const seasonalSpecies = seasonalSpeciesBySeason[season] ?? [];
  const matches = forecast.targetSpecies.filter((species) =>
    seasonalSpecies.includes(species.name),
  ).length;
  return Math.min(15, matches * 5);
}

function scoreMigration(forecast: DailySpotForecast): { score: number; fallbackNotes: string[] } {
  if (forecast.migration.sourceStatus === "missing") {
    return {
      score: 3,
      fallbackNotes: ["回遊の手がかりが弱いため、回遊期待は控えめに計算しています。"],
    };
  }

  return {
    score:
      forecast.migration.level === "high"
        ? 8
        : forecast.migration.level === "medium"
          ? 5
          : 3,
    fallbackNotes:
      forecast.migration.sourceStatus === "limited"
        ? ["近くの釣り場の情報を含めて、回ってきそうかを見ています。"]
        : [],
  };
}

function scoreSafetyPenalty(spot: Spot, forecast: DailySpotForecast): number {
  let penalty = 0;

  if (spot.beginnerLevel === "medium") {
    penalty += 3;
  }
  if ((forecast.marine.windSpeedMps ?? 0) > 6) {
    penalty += 5;
  }
  if ((forecast.marine.waveHeightM ?? 0) > 0.8) {
    penalty += 4;
  }

  return penalty;
}

export function calculateSpotScore(
  spot: Spot,
  forecast: DailySpotForecast,
): Omit<Recommendation, "rank"> {
  const catchResult = scoreRecentCatch(forecast.catchSummary);
  const marineResult = scoreMarine(forecast.marine);
  const migrationResult = scoreMigration(forecast);

  const breakdown: ScoreBreakdown = {
    recentCatch: Math.min(30, catchResult.score),
    tide: Math.min(20, scoreTide(forecast)),
    marine: Math.min(20, marineResult.score),
    seasonal: Math.min(15, scoreSeasonalFit(forecast)),
    migration: Math.min(10, migrationResult.score),
    safetyPenalty: scoreSafetyPenalty(spot, forecast),
    fallbackNotes: [
      ...catchResult.fallbackNotes,
      ...marineResult.fallbackNotes,
      ...migrationResult.fallbackNotes,
    ],
  };

  const score = Math.max(
    0,
    Math.min(
      100,
      breakdown.recentCatch +
        breakdown.tide +
        breakdown.marine +
        breakdown.seasonal +
        breakdown.migration -
        breakdown.safetyPenalty,
    ),
  );

  return {
    spot,
    forecast,
    score,
    breakdown,
    reasons: forecast.reasons.slice(0, 3),
    primaryAdvisory: forecast.advisories[0],
  };
}
