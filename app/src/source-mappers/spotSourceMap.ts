import { SpotId } from "../domain/models";
import { SpotAliasRule } from "../domain/sourceIntegration";

export const spotSourceAliasRules: SpotAliasRule[] = [
  {
    sourceId: "yokohama-city",
    spotId: "daikoku",
    canonicalName: "大黒海づり施設",
    aliases: ["大黒海づり施設", "大黒海釣り施設", "大黒"],
    normalizedTokens: ["大黒", "海づり", "海釣り"],
    matchingHints: ["横浜市鶴見区", "大黒ふ頭", "daikoku"],
  },
  {
    sourceId: "yokohama-fishingpiers",
    spotId: "daikoku",
    canonicalName: "大黒海づり施設",
    aliases: ["大黒海づり施設", "大黒海釣り施設", "DAIKOKU"],
    normalizedTokens: ["大黒", "海づり"],
    matchingHints: ["daikoku.yokohama-fishingpiers.jp"],
  },
  {
    sourceId: "yokohama-city",
    spotId: "honmoku",
    canonicalName: "本牧海づり施設",
    aliases: ["本牧海づり施設", "本牧海釣り施設", "本牧"],
    normalizedTokens: ["本牧", "海づり", "海釣り"],
    matchingHints: ["横浜市中区", "海づり桟橋", "honmoku"],
  },
  {
    sourceId: "yokohama-fishingpiers",
    spotId: "honmoku",
    canonicalName: "本牧海づり施設",
    aliases: ["本牧海づり施設", "本牧海釣り施設", "HONMOKU"],
    normalizedTokens: ["本牧", "海づり"],
    matchingHints: ["honmoku.yokohama-fishingpiers.jp"],
  },
  {
    sourceId: "kawasaki-city",
    spotId: "higashi-ogishima",
    canonicalName: "東扇島西公園",
    aliases: ["東扇島西公園", "東扇島西公園 釣り施設", "西公園", "東扇島"],
    normalizedTokens: ["東扇島", "西公園"],
    matchingHints: ["川崎市川崎区東扇島", "釣り施設", "58kouei"],
  },
  {
    sourceId: "anglers",
    spotId: "higashi-ogishima",
    canonicalName: "東扇島西公園",
    aliases: ["東扇島西公園", "東扇島西公園の釣果", "西公園"],
    normalizedTokens: ["東扇島", "西公園"],
    matchingHints: ["anglers.jp/areas/123", "東扇島西公園の釣果"],
  },
];

export function findSpotAliases(spotId: SpotId): SpotAliasRule[] {
  return spotSourceAliasRules.filter((rule) => rule.spotId === spotId);
}

export function normalizeSpotName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/海釣り/g, "海づり")
    .replace(/[()（）・\s_-]/g, "")
    .replace(/施設/g, "施設")
    .trim();
}

export function matchSpotIdByAlias(
  sourceId: SpotAliasRule["sourceId"],
  externalName: string,
): SpotId | undefined {
  const normalized = normalizeSpotName(externalName);

  return spotSourceAliasRules.find((rule) => {
    if (rule.sourceId !== sourceId) {
      return false;
    }

    const names = [rule.canonicalName, ...rule.aliases].map(normalizeSpotName);
    if (names.includes(normalized)) {
      return true;
    }

    return rule.normalizedTokens.every((token) => normalized.includes(normalizeSpotName(token)));
  })?.spotId;
}
