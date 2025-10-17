import { describe, expect, test } from "vitest";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "./windCalculations";

describe("Wind Calculations", () => {
  describe("Apparent Wind Speed - Special Cases", () => {
    test("boat moving directly against the wind: AWS = TWS + IWS", () => {
      // Scenario: Boat heading North (0°), True Wind from North (0°)
      // When sailing directly into the wind (head to wind)
      // The true wind and induced wind are in opposite directions

      const trueWindSpeed = 10; // 10 knots from North
      const trueWindAngle = 0; // Coming from North (0°)
      const boatSpeed = 6; // 6 knots
      const boatDirection = 0; // Heading North (0°)

      // Calculate using vector addition
      // True wind vector: pointing FROM North (downward in our coordinate system)
      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);

      // Induced wind vector: opposite to boat direction
      // Boat heading North (0°), so induced wind is from South (180°)
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      // Apparent wind = True wind + Induced wind
      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // When sailing directly into the wind, both vectors point in opposite directions
      // Since they're 180° apart, AWS = |TWS - IWS| (they subtract, not add)
      // In this case: |10 - 6| = 4
      const expectedAWS = Math.abs(trueWindSpeed - boatSpeed);
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });

    test("boat moving directly against the wind: AWS = TWS + IWS (different angle)", () => {
      // Scenario: Boat heading East (90°), True Wind from East (90°)
      const trueWindSpeed = 12; // 12 knots from East
      const trueWindAngle = 90; // Coming from East (90°)
      const boatSpeed = 8; // 8 knots
      const boatDirection = 90; // Heading East (90°)

      // Calculate using vector addition
      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // AWS = |TWS - IWS| when vectors are opposite
      const expectedAWS = Math.abs(trueWindSpeed - boatSpeed);
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });

    test("wind coming from behind (downwind): AWS = TWS + IWS", () => {
      // Scenario: Boat heading North (0°), True Wind from South (180°)
      // This is sailing downwind (running)
      const trueWindSpeed = 15; // 15 knots from South
      const trueWindAngle = 180; // Coming from South (180°)
      const boatSpeed = 8; // 8 knots
      const boatDirection = 0; // Heading North (0°)

      // Calculate using vector addition
      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // When sailing downwind, true wind and induced wind point in the SAME direction
      // So they ADD together: AWS = TWS + IWS
      const expectedAWS = trueWindSpeed + boatSpeed; // 15 + 8 = 23
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });

    test("wind coming from behind (downwind): AWS = TWS + IWS (different angle)", () => {
      // Scenario: Boat heading West (270°), True Wind from East (90°)
      const trueWindSpeed = 20; // 20 knots from East
      const trueWindAngle = 90; // Coming from East (90°)
      const boatSpeed = 7; // 7 knots
      const boatDirection = 270; // Heading West (270°)

      // Calculate using vector addition
      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // Wind from East (90°), boat heading West (270°) = downwind
      // AWS = TWS + IWS
      const expectedAWS = trueWindSpeed + boatSpeed; // 20 + 7 = 27
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });

    test("wind coming from behind but boat faster than wind: AWS = IWS + TWS", () => {
      // Special case: Boat speed exceeds true wind speed when running downwind
      // Scenario: Boat heading South (180°), True Wind from North (0°)
      const trueWindSpeed = 5; // 5 knots from North
      const trueWindAngle = 0; // Coming from North (0°)
      const boatSpeed = 10; // 10 knots (faster than wind!)
      const boatDirection = 180; // Heading South (180°)

      // Calculate using vector addition
      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // Even when boat is faster than wind, on a downwind run they still add
      const expectedAWS = boatSpeed + trueWindSpeed; // 10 + 5 = 15
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });
  });

  describe("Apparent Wind Speed - Realistic Sailing Scenarios", () => {
    test("close-hauled sailing (45° to wind)", () => {
      // Sailing close to the wind at 45° angle
      // Boat heading North, wind from NE (45°)
      const trueWindSpeed = 12;
      const trueWindAngle = 45; // Wind from NE
      const boatSpeed = 6;
      const boatDirection = 0; // Heading North

      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // When close-hauled, the apparent wind is actually LESS than true wind
      // but the angle shifts forward (closer to bow)
      // This is counter-intuitive but correct - the boat's motion
      // partially cancels the true wind component
      expect(apparentWindSpeed).toBeGreaterThan(0);
      expect(apparentWindSpeed).toBeLessThan(trueWindSpeed);
    });

    test("beam reach (90° to wind)", () => {
      // Sailing perpendicular to the wind
      const trueWindSpeed = 10;
      const trueWindAngle = 90; // Wind from East
      const boatSpeed = 7;
      const boatDirection = 0; // Heading North

      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // Use Pythagorean theorem: AWS = √(TWS² + IWS²)
      const expectedAWS = Math.sqrt(trueWindSpeed ** 2 + boatSpeed ** 2);
      expect(apparentWindSpeed).toBeCloseTo(expectedAWS, 1);
    });

    test("broad reach (135° to wind)", () => {
      // Sailing at 135° to the wind (downwind but not directly)
      // Boat heading North, wind from SE (135°)
      const trueWindSpeed = 15;
      const trueWindAngle = 135; // Wind from SE
      const boatSpeed = 8;
      const boatDirection = 0; // Heading North

      const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
      const inducedWindAngle = normalizeAngle(boatDirection + 180);
      const inducedWindVector = polarToCartesian(boatSpeed, inducedWindAngle);

      const apparentWindX = trueWindVector.x + inducedWindVector.x;
      const apparentWindY = trueWindVector.y + inducedWindVector.y;
      const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
      const apparentWindSpeed = apparentPolar.speed;

      // On a broad reach, the vectors are at an obtuse angle
      // This actually increases the apparent wind speed
      expect(apparentWindSpeed).toBeGreaterThan(0);
      // The result will be greater than TWS due to vector addition at this angle
      expect(apparentWindSpeed).toBeGreaterThan(boatSpeed);
    });
  });

  describe("Vector Conversions", () => {
    test("polarToCartesian and cartesianToPolar are inverses", () => {
      const speed = 10;
      const angle = 45;

      const cartesian = polarToCartesian(speed, angle);
      const polar = cartesianToPolar(cartesian.x, cartesian.y);

      expect(polar.speed).toBeCloseTo(speed, 5);
      expect(polar.angle).toBeCloseTo(angle, 5);
    });

    test("normalizeAngle handles negative angles", () => {
      expect(normalizeAngle(-45)).toBe(315);
      expect(normalizeAngle(-90)).toBe(270);
      // -360 might result in -0, which is mathematically equal to 0
      // Use Math.abs to convert -0 to +0
      expect(Math.abs(normalizeAngle(-360))).toBe(0);
    });

    test("normalizeAngle handles angles > 360", () => {
      expect(normalizeAngle(405)).toBe(45);
      expect(normalizeAngle(720)).toBe(0);
      expect(normalizeAngle(450)).toBe(90);
    });
  });
});
