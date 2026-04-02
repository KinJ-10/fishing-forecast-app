import { SpotId } from "../domain/models";
import { TideObservationPointId } from "../domain/sourceIntegration";

export interface TideObservationPoint {
  id: TideObservationPointId;
  stationCode: string;
  stationName: string;
  areaName: string;
}

export const tideObservationPoints: Record<TideObservationPointId, TideObservationPoint> = {
  yokohama: {
    id: "yokohama",
    stationCode: "QS",
    stationName: "横浜",
    areaName: "神奈川県 横浜市 中区 新港町1丁目",
  },
  kawasaki: {
    id: "kawasaki",
    stationCode: "KW",
    stationName: "川崎",
    areaName: "神奈川県 川崎市 川崎区",
  },
};

const spotToTidePointMap: Record<SpotId, TideObservationPointId> = {
  daikoku: "yokohama",
  honmoku: "yokohama",
  "higashi-ogishima": "kawasaki",
};

export function getTideObservationPointIdForSpot(spotId: SpotId): TideObservationPointId {
  return spotToTidePointMap[spotId];
}

export function getTideObservationPointById(
  observationPointId: TideObservationPointId,
): TideObservationPoint {
  return tideObservationPoints[observationPointId];
}

export function getSpotIdsForObservationPoint(observationPointId: TideObservationPointId): SpotId[] {
  return Object.entries(spotToTidePointMap)
    .filter(([, pointId]) => pointId === observationPointId)
    .map(([spotId]) => spotId as SpotId);
}
