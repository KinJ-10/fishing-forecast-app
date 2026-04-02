import { SourceCatalogEntry } from "../domain/sourceIntegration";

export const sourceCatalog: SourceCatalogEntry[] = [
  {
    sourceId: "yokohama-city",
    kind: "facility",
    displayName: "横浜市 公式施設案内",
    official: true,
    priority: 1,
  },
  {
    sourceId: "yokohama-fishingpiers",
    kind: "catch",
    displayName: "横浜フィッシングピアーズ",
    official: true,
    priority: 1,
  },
  {
    sourceId: "kawasaki-city",
    kind: "rules",
    displayName: "川崎市 公式公園案内",
    official: true,
    priority: 1,
  },
  {
    sourceId: "jma-tide",
    kind: "tide",
    displayName: "気象庁 潮位表",
    official: true,
    priority: 1,
  },
  {
    sourceId: "open-meteo-weather",
    kind: "weather",
    displayName: "Open-Meteo Weather API",
    official: false,
    priority: 1,
  },
  {
    sourceId: "open-meteo-marine",
    kind: "wave",
    displayName: "Open-Meteo Marine API",
    official: false,
    priority: 1,
  },
  {
    sourceId: "jma-sst",
    kind: "waterTemperature",
    displayName: "気象庁 海面水温",
    official: true,
    priority: 2,
  },
  {
    sourceId: "anglers",
    kind: "catch",
    displayName: "アングラーズ",
    official: false,
    priority: 2,
  },
];
