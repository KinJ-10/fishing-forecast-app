import assert from "node:assert/strict";
import test from "node:test";
import {
  getSpotIdsForObservationPoint,
  getTideObservationPointById,
  getTideObservationPointIdForSpot,
} from "./jmaTidePointMap";

test("jma tide point mapper returns fixed mapping", () => {
  assert.equal(getTideObservationPointIdForSpot("daikoku"), "yokohama");
  assert.equal(getTideObservationPointIdForSpot("honmoku"), "yokohama");
  assert.equal(getTideObservationPointIdForSpot("higashi-ogishima"), "kawasaki");
  assert.equal(getTideObservationPointById("kawasaki").stationCode, "KW");
  assert.deepEqual(getSpotIdsForObservationPoint("yokohama"), ["daikoku", "honmoku"]);
});
