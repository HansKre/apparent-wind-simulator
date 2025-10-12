import { CANVAS_CONFIG } from "../constants/windSimulator";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "./windCalculations";

type VectorEndpoints = {
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

  const inducedVectorDirection = polarToCartesian(
    boatSpeed * scale,
    normalizeAngle(boatDirection + 180)
  );
  const inducedStartX = boatFrontX - inducedVectorDirection.x;
  const inducedStartY = boatFrontY - inducedVectorDirection.y;
  const inducedEndX = boatFrontX;
  const inducedEndY = boatFrontY;

  const trueWindVector = polarToCartesian(trueWindSpeed * scale, trueWindAngle);
  const trueWindHeadX = inducedStartX;
  const trueWindHeadY = inducedStartY;
  const trueWindTailX = inducedStartX - trueWindVector.x;
  const trueWindTailY = inducedStartY - trueWindVector.y;

  const apparentHeadX = boatFrontX;
  const apparentHeadY = boatFrontY;
  const apparentTailX = trueWindTailX;
  const apparentTailY = trueWindTailY;

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
  const inducedWindVector = polarToCartesian(
    boatSpeed,
    normalizeAngle(boatDirection + 180)
  );

  const apparentWindX = trueWindVector.x + inducedWindVector.x;
  const apparentWindY = trueWindVector.y + inducedWindVector.y;

  const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);

  return {
    speed: apparentPolar.speed,
    angle: apparentPolar.angle,
  };
}
