import { DailySpotForecast, Recommendation, ScoreBreakdown, Spot } from "../../domain/models";
import { getSeasonLabel } from "../../lib/date";

const seasonalSpeciesBySeason: Record<string, string[]> = {
  spring: ["アジ", "イワシ", "コノシロ", "サッパ", "メバル", "カサゴ"],
  summer: ["アジ", "サバ", "イワシ"],
  autumn: ["サバ", "イナダ", "アジ"],
  winter: ["メバル", "カサゴ", "カレイ"],
};

function scoreRecentCatch(forecast: DailySpotForecast): number {
  return forecast.recentCatches.reduce((total, item) => {
    const trendBonus = item.trend === "up" ? 6 : item.trend === "steady" ? 4 : 1;
    const countBonus = Math.min(9, Math.floor(item.latestCount / 5));
    return total + trendBonus + countBonus;
  }, 0);
}

function scoreTide(forecast: DailySpotForecast): number {
  const tideNameBonus =
    forecast.tide.tideName === "大潮" ? 10 : forecast.tide.tideName === "中潮" ? 8 : 5;
  const activeWindowBonus = Math.min(10, forecast.tide.activeWindows.length * 5);
  return tideNameBonus + activeWindowBonus;
}

function scoreMarine(forecast: DailySpotForecast): number {
  const windScore = forecast.weather.windSpeedMps <= 4.5 ? 9 : forecast.weather.windSpeedMps <= 6 ? 6 : 3;
  const waveScore = forecast.weather.waveHeightM <= 0.5 ? 8 : forecast.weather.waveHeightM <= 0.8 ? 5 : 2;
  const temperatureScore =
    forecast.weather.waterTempC >= 15 && forecast.weather.waterTempC <= 19 ? 6 : 4;
  return windScore + waveScore + temperatureScore;
}

function scoreSeasonalFit(forecast: DailySpotForecast): number {
  const season = getSeasonLabel(forecast.date);
  const seasonalSpecies = seasonalSpeciesBySeason[season] ?? [];
  const matches = forecast.targetSpecies.filter((species) => seasonalSpecies.includes(species)).length;
  return Math.min(15, matches * 5);
}

function scoreMigration(forecast: DailySpotForecast): number {
  return forecast.migrationSignals.reduce((total, signal) => {
    if (signal.confidence === "high") {
      return total + 6;
    }
    if (signal.confidence === "medium") {
      return total + 4;
    }
    return total + 2;
  }, 0);
}

function scoreSafetyPenalty(spot: Spot, forecast: DailySpotForecast): number {
  let penalty = 0;

  if (spot.beginnerLevel === "medium") {
    penalty += 3;
  }
  if (forecast.weather.windSpeedMps > 6) {
    penalty += 5;
  }
  if (forecast.weather.waveHeightM > 0.8) {
    penalty += 4;
  }

  return penalty;
}

function buildReasons(spot: Spot, forecast: DailySpotForecast): string[] {
  const reasons: string[] = [];
  const risingCatch = forecast.recentCatches.find((item) => item.trend === "up");

  if (risingCatch) {
    reasons.push(
      `${risingCatch.species}の釣果が増加中で、${risingCatch.note.replace("。", "")}ため期待できます。`,
    );
  }

  reasons.push(
    `${forecast.tide.activeWindows.join("・")}は潮が動き、${forecast.recommendedWindows[0]}の朝まずめと重なります。`,
  );

  if (forecast.weather.windSpeedMps <= 5 && forecast.weather.waveHeightM <= 0.7) {
    reasons.push("風と波が比較的穏やかで、初心者でも仕掛けを扱いやすい海況です。");
  } else {
    reasons.push(
      `${spot.name}は${forecast.weather.windSpeedMps.toFixed(1)}m/sの風予報なので、足元中心なら釣りを組み立てやすいです。`,
    );
  }

  const migrationSignal = forecast.migrationSignals[0];
  if (migrationSignal) {
    reasons.push(
      `${migrationSignal.nearbySpots.join("・")}でも${migrationSignal.species}が見えており、回遊の時間差に期待できます。`,
    );
  }

  return reasons.slice(0, 3);
}

export function calculateSpotScore(spot: Spot, forecast: DailySpotForecast): Omit<Recommendation, "rank"> {
  const breakdown: ScoreBreakdown = {
    recentCatch: Math.min(30, scoreRecentCatch(forecast)),
    tide: Math.min(20, scoreTide(forecast)),
    marine: Math.min(20, scoreMarine(forecast)),
    seasonal: Math.min(15, scoreSeasonalFit(forecast)),
    migration: Math.min(10, scoreMigration(forecast)),
    safetyPenalty: scoreSafetyPenalty(spot, forecast),
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
    reasons: buildReasons(spot, forecast),
    caution: forecast.caution,
  };
}
