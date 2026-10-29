import { describe, expect, test } from "vitest";
import {
  isPositionCollisionFree,
  segmentIntersectsAABB,
} from "./canvasDrawing";
import {
  calculateApparentWindVector,
  calculateVectorEndpoints,
} from "./vectorCalculations";

describe("Vector Endpoints & Triangle Layout", () => {
  test("TWS connects directly to the boat front (bow)", () => {
    const centerX = 400;
    const centerY = 300;
    const trueWindSpeed = 10;
    const trueWindAngle = 90; // Wind coming from East
    const boatSpeed = 6;
    const boatDirection = 0; // Boat heading North
    const scale = 15;
    const zoomLevel = 1;

    const endpoints = calculateVectorEndpoints(
      centerX,
      centerY,
      trueWindSpeed,
      trueWindAngle,
      boatSpeed,
      boatDirection,
      scale,
      zoomLevel
    );

    // TWS head must terminate exactly at the boat front (bow)
    expect(endpoints.trueWindHeadX).toBeCloseTo(endpoints.boatFrontX, 5);
    expect(endpoints.trueWindHeadY).toBeCloseTo(endpoints.boatFrontY, 5);

    // IWS head also terminates at the boat front
    expect(endpoints.inducedEndX).toBeCloseTo(endpoints.boatFrontX, 5);
    expect(endpoints.inducedEndY).toBeCloseTo(endpoints.boatFrontY, 5);

    // TWS tail originates in direction of wind (East)
    expect(endpoints.trueWindTailX).toBeCloseTo(
      endpoints.boatFrontX + 10 * scale,
      5
    );
    expect(endpoints.trueWindTailY).toBeCloseTo(endpoints.boatFrontY, 5);
  });

  test("Dashed IWS points to TWS tail and dashed AWS connects dashed IWS tail to bow", () => {
    const centerX = 400;
    const centerY = 300;
    const trueWindSpeed = 10;
    const trueWindAngle = 90;
    const boatSpeed = 8;
    const boatDirection = 0;
    const scale = 15;
    const zoomLevel = 1;

    const endpoints = calculateVectorEndpoints(
      centerX,
      centerY,
      trueWindSpeed,
      trueWindAngle,
      boatSpeed,
      boatDirection,
      scale,
      zoomLevel
    );

    // Dashed IWS head points to the TWS tail
    expect(endpoints.dashedInducedEndX).toBeCloseTo(endpoints.trueWindTailX, 5);
    expect(endpoints.dashedInducedEndY).toBeCloseTo(endpoints.trueWindTailY, 5);

    // Dashed IWS vector has same length and direction as solid IWS
    const solidDx = endpoints.inducedEndX - endpoints.inducedStartX;
    const solidDy = endpoints.inducedEndY - endpoints.inducedStartY;
    const dashedDx =
      endpoints.dashedInducedEndX - endpoints.dashedInducedStartX;
    const dashedDy =
      endpoints.dashedInducedEndY - endpoints.dashedInducedStartY;
    expect(dashedDx).toBeCloseTo(solidDx, 5);
    expect(dashedDy).toBeCloseTo(solidDy, 5);

    // Dashed AWS starts at the tail of dashed IWS and ends at the bow
    expect(endpoints.apparentTailX).toBeCloseTo(
      endpoints.dashedInducedStartX,
      5
    );
    expect(endpoints.apparentTailY).toBeCloseTo(
      endpoints.dashedInducedStartY,
      5
    );
    expect(endpoints.apparentHeadX).toBeCloseTo(endpoints.boatFrontX, 5);
    expect(endpoints.apparentHeadY).toBeCloseTo(endpoints.boatFrontY, 5);
  });

  test("90°-TWS-vector rotates clockwise and is on the right side of the boat", () => {
    const centerX = 400;
    const centerY = 300;
    const trueWindSpeed = 10;
    const trueWindAngle = 90; // 90° clockwise from North (0°)
    const boatSpeed = 6;
    const boatDirection = 0; // Heading North
    const scale = 15;
    const zoomLevel = 1;

    const endpoints = calculateVectorEndpoints(
      centerX,
      centerY,
      trueWindSpeed,
      trueWindAngle,
      boatSpeed,
      boatDirection,
      scale,
      zoomLevel
    );

    // Tail of 90° TWS is on the right side of the boat front (x > boatFrontX)
    expect(endpoints.trueWindTailX).toBeGreaterThan(endpoints.boatFrontX);
    expect(endpoints.trueWindTailX - endpoints.boatFrontX).toBeCloseTo(
      10 * scale,
      5
    );
    expect(endpoints.trueWindTailY).toBeCloseTo(endpoints.boatFrontY, 5);
  });

  test("Angle calculation between IWS and TWS at the bow matches relative angle", () => {
    const centerX = 400;
    const centerY = 300;
    const trueWindSpeed = 10;
    const trueWindAngle = 270; // Wind coming from West
    const boatSpeed = 6;
    const boatDirection = 0; // Heading North
    const scale = 15;
    const zoomLevel = 1;

    const endpoints = calculateVectorEndpoints(
      centerX,
      centerY,
      trueWindSpeed,
      trueWindAngle,
      boatSpeed,
      boatDirection,
      scale,
      zoomLevel
    );

    const iwsAngleAtBow =
      (Math.atan2(
        endpoints.inducedStartY - endpoints.boatFrontY,
        endpoints.inducedStartX - endpoints.boatFrontX
      ) *
        180) /
      Math.PI;

    const twsAngleAtBow =
      (Math.atan2(
        endpoints.trueWindTailY - endpoints.boatFrontY,
        endpoints.trueWindTailX - endpoints.boatFrontX
      ) *
        180) /
      Math.PI;

    let diff = twsAngleAtBow - iwsAngleAtBow;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const absDiff = Math.abs(diff);

    // When boat heads North (0°) and wind comes from West (270°), angle at bow is 90° (beam reach)
    expect(absDiff).toBeCloseTo(90, 1);
  });

  describe("Fix regression: IWS of 6kts and TWS of 8.7kts", () => {
    test("IWS of 6kts and TWS of 8.7kts results in 6.3kts when AWS is at 90° angle, NOT 13.6kts", () => {
      // User scenario: 'For example: IWS of 6kts and TWS of 8.7kts. Currently results in 13.6kts of AWS. This is absolute bullshit.'
      // The triangle has IWS = 6.0 and TWS = 8.7 on the right side of the boat (TWA = 133.6°).
      // With AWS perpendicular to the boat (at 90° angle),
      // Pythagorean theorem requires: AWS = √(8.7² - 6.0²) = √(75.69 - 36) = √39.69 = 6.30 kts.
      const result = calculateApparentWindVector(8.7, 133.6, 6, 0);

      expect(result.speed).toBeCloseTo(6.3, 1);
      expect(result.speed).not.toBeCloseTo(13.6, 0.5);
      expect(result.angle).toBeCloseTo(90, 1);
    });

    test("Initial state positions TWS at clockwise 90° (12 kts) on the right side of the boat with adjusted AWS", () => {
      // Initial state: TWS = 12 kts at 90° (horizontal on right side of boat), boatSpeed = 6 kts heading North (0°)
      const result = calculateApparentWindVector(12, 90, 6, 0);

      // AWS speed = √(12² + 6²) = √180 ≈ 13.42 kts
      const expectedAWS = Math.sqrt(12 ** 2 + 6 ** 2);
      expect(result.speed).toBeCloseTo(expectedAWS, 2);
      // Apparent wind angle = atan2(12, 6) = 63.43°
      expect(result.angle).toBeCloseTo(63.43, 1);
    });
  });

  describe("Collision Avoidance Engine", () => {
    test("segmentIntersectsAABB detects line intersecting bounding box", () => {
      // Box at (80, 80) to (120, 120)
      // Line passing through from (50, 100) to (150, 100)
      expect(segmentIntersectsAABB(50, 100, 150, 100, 80, 80, 120, 120)).toBe(
        true
      );

      // Line passing outside above
      expect(segmentIntersectsAABB(50, 60, 150, 60, 80, 80, 120, 120)).toBe(
        false
      );

      // Line passing outside to the left
      expect(segmentIntersectsAABB(40, 50, 40, 150, 80, 80, 120, 120)).toBe(
        false
      );
    });

    test("isPositionCollisionFree prevents label-arrow and label-label collisions", () => {
      const arrows = [
        { name: "arrow1", startX: 100, startY: 0, endX: 100, endY: 200 },
      ];
      const existingLabels = [{ x: 300, y: 300, width: 80, height: 40 }];
      const boatBox = { minX: 480, maxX: 520, minY: 480, maxY: 520 };

      // Candidate directly overlapping arrow line at x = 100
      expect(
        isPositionCollisionFree(
          100,
          100,
          60,
          30,
          8,
          arrows,
          existingLabels,
          boatBox
        )
      ).toBe(false);

      // Candidate overlapping existing label at (300, 300)
      expect(
        isPositionCollisionFree(
          320,
          310,
          60,
          30,
          8,
          arrows,
          existingLabels,
          boatBox
        )
      ).toBe(false);

      // Candidate overlapping boat at (500, 500)
      expect(
        isPositionCollisionFree(
          500,
          500,
          60,
          30,
          8,
          arrows,
          existingLabels,
          boatBox
        )
      ).toBe(false);

      // Candidate clear of all obstacles
      expect(
        isPositionCollisionFree(
          200,
          100,
          60,
          30,
          8,
          arrows,
          existingLabels,
          boatBox
        )
      ).toBe(true);
    });
  });
});
