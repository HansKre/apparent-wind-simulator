import { CANVAS_CONFIG } from "../constants/windSimulator";
import { cartesianToPolar, polarToCartesian } from "./windCalculations";

export type VectorEndpoints = {
  boatFrontX: number;
  boatFrontY: number;
  inducedStartX: number;
  inducedStartY: number;
  inducedEndX: number;
  inducedEndY: number;
  trueWindTailX: number;
  trueWindTailY: number;
  trueWindHeadX: number;
  trueWindHeadY: number;
  dashedInducedStartX: number;
  dashedInducedStartY: number;
  dashedInducedEndX: number;
  dashedInducedEndY: number;
  apparentTailX: number;
  apparentTailY: number;
  apparentHeadX: number;
  apparentHeadY: number;
};

export function calculateVectorEndpoints(
  centerX: number,
  centerY: number,
  trueWindSpeed: number,
  trueWindAngle: number,
  boatSpeed: number,
  boatDirection: number,
  scale: number,
  zoomLevel: number
): VectorEndpoints {
  const boatFrontOffset = CANVAS_CONFIG.boatFrontOffset * zoomLevel;
  const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
  const boatFrontX = centerX + boatFrontVector.x;
  const boatFrontY = centerY + boatFrontVector.y;

  // Solid Induced wind (IWS): points toward the bow
  const inducedVector = polarToCartesian(boatSpeed * scale, boatDirection);
  const inducedStartX = boatFrontX + inducedVector.x;
  const inducedStartY = boatFrontY + inducedVector.y;
  const inducedEndX = boatFrontX;
  const inducedEndY = boatFrontY;

  // Solid True wind (TWS): points toward the bow
  const trueWindVector = polarToCartesian(trueWindSpeed * scale, trueWindAngle);
  const trueWindHeadX = boatFrontX;
  const trueWindHeadY = boatFrontY;
  const trueWindTailX = boatFrontX + trueWindVector.x;
  const trueWindTailY = boatFrontY + trueWindVector.y;

  // Dashed Induced wind: points to the outer end (tail) of the TWS vector
  // Same color, same length, same direction as solid IWS
  const dashedInducedEndX = trueWindTailX;
  const dashedInducedEndY = trueWindTailY;
  const dashedInducedStartX = trueWindTailX + inducedVector.x;
  const dashedInducedStartY = trueWindTailY + inducedVector.y;

  // Dashed Apparent wind (AWS): connects from the end of dashed IWS to the front of the bow
  const apparentTailX = dashedInducedStartX;
  const apparentTailY = dashedInducedStartY;
  const apparentHeadX = boatFrontX;
  const apparentHeadY = boatFrontY;

  return {
    boatFrontX,
    boatFrontY,
    inducedStartX,
    inducedStartY,
    inducedEndX,
    inducedEndY,
    trueWindTailX,
    trueWindTailY,
    trueWindHeadX,
    trueWindHeadY,
    dashedInducedStartX,
    dashedInducedStartY,
    dashedInducedEndX,
    dashedInducedEndY,
    apparentTailX,
    apparentTailY,
    apparentHeadX,
    apparentHeadY,
  };
}

export function calculateApparentWindVector(
  trueWindSpeed: number,
  trueWindAngle: number,
  boatSpeed: number,
  boatDirection: number
) {
  const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
  const inducedWindVector = polarToCartesian(boatSpeed, boatDirection);

  // Apparent wind vector (comes from dashedInducedStart pointing to the bow):
  // apparentTail = bow + trueWindVector + inducedWindVector
  // apparentHead = bow
  // Vector representing direction wind comes from (apparentTail - bow):
  const apparentWindX = trueWindVector.x + inducedWindVector.x;
  const apparentWindY = trueWindVector.y + inducedWindVector.y;

  const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);

  return {
    speed: apparentPolar.speed,
    angle: apparentPolar.angle,
  };
}
