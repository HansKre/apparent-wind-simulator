export const COLORS = {
  trueWind: "#3b82f6",
  inducedWind: "#10b981",
  apparentWind: "#ef4444",
  noSailZone: "rgba(239, 68, 68, 0.15)",
  noSailZoneBorder: "rgba(239, 68, 68, 0.5)",
  angleArc: "#fbbf24",
} as const;

export const CANVAS_CONFIG = {
  scale: 15, // pixels per knot
  boatFrontOffset: 40, // pixels from center to front of boat
  dragHandleRadius: 20, // hit detection radius for drag handles
  arrowLength: 15, // arrowhead size
  angleArcRadius: 60,
  angleBetweenArrowsRadius: 38,
} as const;

export const WIND_LIMITS = {
  minSpeed: 0.1,
  maxSpeed: 30,
} as const;

export const ZOOM_LIMITS = {
  min: 0.5,
  max: 3,
  step: 0.25,
} as const;
