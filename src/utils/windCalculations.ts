/**
 * Wind calculation utilities based on sailing physics
 *
 * Formulas:
 * - Apparent Wind Speed (AWS) = √((W cos α + V)² + (W sin α)²)
 * - Apparent Wind Angle (AWA) = atan2(W sin α, W cos α + V)
 *
 * Where:
 * - W: True Wind Speed (TWS) in knots
 * - V: Boat Speed (SOG) in knots
 * - α: The angle between the boat's course and the true wind, in radians (TWA)
 */

export type Vector2D = {
  x: number;
  y: number;
};

export type WindData = {
  trueWindSpeed: number; // W in knots
  trueWindAngle: number; // α in degrees
  boatSpeed: number; // V in knots
  boatDirection: number; // Boat heading in degrees
  apparentWindSpeed: number; // AWS in knots
  apparentWindAngle: number; // AWA in degrees
};

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate apparent wind speed and angle
 */
export function calculateApparentWind(
  trueWindSpeed: number,
  trueWindAngle: number,
  boatSpeed: number
): { speed: number; angle: number } {
  // Convert angle to radians
  const alpha = degToRad(trueWindAngle);

  // Calculate apparent wind speed using the formula:
  // AWS = √((W cos α + V)² + (W sin α)²)
  const apparentWindSpeed = Math.sqrt(
    Math.pow(trueWindSpeed * Math.cos(alpha) + boatSpeed, 2) +
      Math.pow(trueWindSpeed * Math.sin(alpha), 2)
  );

  // Calculate apparent wind angle using atan2:
  // AWA = atan2(W sin α, W cos α + V)
  const apparentWindAngle = Math.atan2(
    trueWindSpeed * Math.sin(alpha),
    trueWindSpeed * Math.cos(alpha) + boatSpeed
  );

  return {
    speed: apparentWindSpeed,
    angle: radToDeg(apparentWindAngle),
  };
}

/**
 * Convert polar coordinates (speed, angle) to Cartesian (x, y)
 * Angle is in degrees, measured clockwise from north (0°)
 */
export function polarToCartesian(speed: number, angleDeg: number): Vector2D {
  const angleRad = degToRad(angleDeg);
  return {
    x: speed * Math.sin(angleRad),
    y: -speed * Math.cos(angleRad), // Negative because canvas Y is inverted
  };
}

/**
 * Convert Cartesian coordinates to polar (speed, angle)
 * Returns angle in degrees, measured clockwise from north (0°)
 */
export function cartesianToPolar(
  x: number,
  y: number
): { speed: number; angle: number } {
  const speed = Math.sqrt(x * x + y * y);
  const angleRad = Math.atan2(x, -y);
  const angle = normalizeAngle(radToDeg(angleRad));

  return { speed, angle };
}

/**
 * Calculate distance between two points
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Format speed for display
 */
export function formatSpeed(speed: number): string {
  return speed.toFixed(1);
}

/**
 * Format angle for display
 */
export function formatAngle(angle: number): string {
  return Math.round(normalizeAngle(angle)).toString();
}

/**
 * Get wind direction abbreviation from angle (N, NE, E, SE, S, SW, W, NW)
 */
export function getWindDirectionAbbr(angle: number): string {
  const normalized = normalizeAngle(angle);
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}
