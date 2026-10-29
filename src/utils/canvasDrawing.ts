import { CANVAS_CONFIG, COLORS } from "../constants/windSimulator";
import {
  degToRad,
  formatAngle,
  normalizeAngle,
  polarToCartesian,
} from "./windCalculations";

export function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  zoomLevel: number,
  boatImage: HTMLImageElement | null
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  if (boatImage) {
    const svgHeight = 744.09444;
    const leftBoatWidth = 220;
    const sourceAspectRatio = leftBoatWidth / svgHeight;
    const targetHeight = 80 * zoomLevel;
    const targetWidth = targetHeight * sourceAspectRatio;

    ctx.drawImage(
      boatImage,
      0,
      0,
      leftBoatWidth,
      svgHeight,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, -20 * zoomLevel);
    ctx.lineTo(-8 * zoomLevel, 20 * zoomLevel);
    ctx.lineTo(8 * zoomLevel, 20 * zoomLevel);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2 * zoomLevel;
    ctx.beginPath();
    ctx.moveTo(0, -20 * zoomLevel);
    ctx.lineTo(0, -30 * zoomLevel);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawGoNoGoZone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  boatDirection: number,
  canvasSize: { width: number; height: number },
  isActive: boolean = false
) {
  ctx.save();

  const maxDistance = Math.max(
    canvasSize.width,
    canvasSize.height,
    Math.sqrt(canvasSize.width ** 2 + canvasSize.height ** 2)
  );
  const noSailZoneRadius = maxDistance;
  const rotatedAngle = normalizeAngle(boatDirection);

  const leftBoundary = normalizeAngle(rotatedAngle - 45);
  const rightBoundary = normalizeAngle(rotatedAngle + 45);

  const leftPoint = polarToCartesian(noSailZoneRadius, leftBoundary);
  const rightPoint = polarToCartesian(noSailZoneRadius, rightBoundary);

  ctx.fillStyle = isActive ? COLORS.noSailZoneActive : COLORS.noSailZone;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + leftPoint.x, y + leftPoint.y);
  ctx.lineTo(x + rightPoint.x, y + rightPoint.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isActive
    ? COLORS.noSailZoneBorderActive
    : COLORS.noSailZoneBorder;
  ctx.lineWidth = isActive ? 2.5 : 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + leftPoint.x, y + leftPoint.y);
  ctx.moveTo(x, y);
  ctx.lineTo(x + rightPoint.x, y + rightPoint.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

export type LabelPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ArrowSegment = {
  name?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

/**
 * Exact line-segment to Axis-Aligned Bounding Box (AABB) intersection using Liang-Barsky
 */
export function segmentIntersectsAABB(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;

  const p = [-dx, dx, -dy, dy];
  const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

/**
 * Checks if a candidate label position is free from collisions with arrows, labels, and the boat
 */
export function isPositionCollisionFree(
  cx: number,
  cy: number,
  width: number,
  height: number,
  padding: number,
  arrows?: ArrowSegment[],
  existingLabels?: LabelPosition[],
  boatBox?: { minX: number; maxX: number; minY: number; maxY: number }
): boolean {
  const minX = cx - width / 2 - padding;
  const maxX = cx + width / 2 + padding;
  const minY = cy - height / 2 - padding;
  const maxY = cy + height / 2 + padding;

  if (arrows) {
    for (const a of arrows) {
      if (
        segmentIntersectsAABB(
          a.startX,
          a.startY,
          a.endX,
          a.endY,
          minX,
          minY,
          maxX,
          maxY
        )
      ) {
        return false;
      }
    }
  }

  if (existingLabels) {
    for (const l of existingLabels) {
      const lMinX = l.x - l.width / 2 - padding;
      const lMaxX = l.x + l.width / 2 + padding;
      const lMinY = l.y - l.height / 2 - padding;
      const lMaxY = l.y + l.height / 2 + padding;
      if (minX < lMaxX && maxX > lMinX && minY < lMaxY && maxY > lMinY) {
        return false;
      }
    }
  }

  if (boatBox) {
    if (
      minX < boatBox.maxX &&
      maxX > boatBox.minX &&
      minY < boatBox.maxY &&
      maxY > boatBox.minY
    ) {
      return false;
    }
  }

  return true;
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
  isDragging: boolean = false,
  showDragHandle: boolean = false,
  arrowheadAtStart: boolean = false,
  dragHandleAtEnd: boolean = false,
  speed?: number,
  abbreviation?: string,
  existingLabels?: LabelPosition[],
  isDashed: boolean = false,
  awayFromPoint?: { x: number; y: number },
  arrows?: ArrowSegment[],
  boatBox?: { minX: number; maxX: number; minY: number; maxY: number }
): LabelPosition | null {
  ctx.save();

  if (isDragging) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = isDragging ? 5 : 3;
  if (isDashed) {
    ctx.setLineDash([8, 6]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);

  ctx.fillStyle = color;
  ctx.beginPath();

  if (arrowheadAtStart) {
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + CANVAS_CONFIG.arrowLength * Math.cos(angle - Math.PI / 6),
      startY + CANVAS_CONFIG.arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      startX + CANVAS_CONFIG.arrowLength * Math.cos(angle + Math.PI / 6),
      startY + CANVAS_CONFIG.arrowLength * Math.sin(angle + Math.PI / 6)
    );
  } else {
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - CANVAS_CONFIG.arrowLength * Math.cos(angle - Math.PI / 6),
      endY - CANVAS_CONFIG.arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - CANVAS_CONFIG.arrowLength * Math.cos(angle + Math.PI / 6),
      endY - CANVAS_CONFIG.arrowLength * Math.sin(angle + Math.PI / 6)
    );
  }
  ctx.closePath();
  ctx.fill();

  if (showDragHandle) {
    const handleX = dragHandleAtEnd ? endX : startX;
    const handleY = dragHandleAtEnd ? endY : startY;
    ctx.fillStyle = isDragging ? "#ffffff" : color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(handleX, handleY, isDragging ? 12 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Draw speed label with abbreviation if provided
  if (speed !== undefined && abbreviation) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 4;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelText = `${speed.toFixed(1)} kt (${abbreviation})`;

    // Measure label dimensions
    const metrics = ctx.measureText(labelText);
    const labelWidth = metrics.width + 20;
    const labelHeight = 24;

    // Vector points from start to end; arrow tip is at end (or start if arrowheadAtStart).
    // Tilt angle runs in direction from arrow-tip towards the outer end.
    let tipToEndAngle = arrowheadAtStart
      ? Math.atan2(endY - startY, endX - startX)
      : Math.atan2(startY - endY, startX - endX);

    // Auto-flip upright so text is never upside-down on screen
    if (tipToEndAngle > Math.PI / 2) {
      tipToEndAngle -= Math.PI;
    } else if (tipToEndAngle < -Math.PI / 2) {
      tipToEndAngle += Math.PI;
    }

    // Rotated AABB for collision avoidance
    const cosT = Math.abs(Math.cos(tipToEndAngle));
    const sinT = Math.abs(Math.sin(tipToEndAngle));
    const aabbWidth = labelWidth * cosT + labelHeight * sinT;
    const aabbHeight = labelWidth * sinT + labelHeight * cosT;

    let primaryNormal = angle + Math.PI / 2;
    let secondaryNormal = angle - Math.PI / 2;

    if (awayFromPoint) {
      const d1 =
        Math.pow(midX + Math.cos(primaryNormal) - awayFromPoint.x, 2) +
        Math.pow(midY + Math.sin(primaryNormal) - awayFromPoint.y, 2);
      const d2 =
        Math.pow(midX + Math.cos(secondaryNormal) - awayFromPoint.x, 2) +
        Math.pow(midY + Math.sin(secondaryNormal) - awayFromPoint.y, 2);
      if (d2 > d1) {
        const temp = primaryNormal;
        primaryNormal = secondaryNormal;
        secondaryNormal = temp;
      }
    }

    const distances = [18, 26, 38, 54, 76, 105, 140];
    const angleOffsets = [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75];

    let labelX = 0;
    let labelY = 0;
    let foundPosition = false;

    for (const dist of distances) {
      for (const aOff of angleOffsets) {
        for (const baseN of [primaryNormal, secondaryNormal]) {
          const testX = midX + dist * Math.cos(baseN + aOff);
          const testY = midY + dist * Math.sin(baseN + aOff);

          if (
            isPositionCollisionFree(
              testX,
              testY,
              aabbWidth,
              aabbHeight,
              4,
              arrows,
              existingLabels,
              boatBox
            )
          ) {
            labelX = testX;
            labelY = testY;
            foundPosition = true;
            break;
          }
        }
        if (foundPosition) break;
      }
      if (foundPosition) break;
    }

    // Fallback if no candidate cleared all constraints
    if (!foundPosition) {
      labelX = midX + 26 * Math.cos(primaryNormal);
      labelY = midY + 26 * Math.sin(primaryNormal);
    }

    ctx.save();
    ctx.translate(labelX, labelY);
    ctx.rotate(tipToEndAngle);
    ctx.fillText(labelText, 0, 0);
    ctx.restore();

    ctx.restore();

    // Return the label position for future collision detection
    return {
      x: labelX,
      y: labelY,
      width: aabbWidth,
      height: aabbHeight,
    };
  }

  return null;
}

export function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);

  const startAngle = -Math.PI / 2;
  const endAngle = ((angle - 90) * Math.PI) / 180;

  ctx.beginPath();
  ctx.arc(x, y, CANVAS_CONFIG.angleArcRadius, startAngle, endAngle);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.font = "bold 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.fillText(
    `${formatAngle(angle)}°`,
    x,
    y - CANVAS_CONFIG.angleArcRadius - 10
  );

  ctx.restore();
}

export type DrawAngleOptions = {
  radius?: number;
  color?: string;
  labelSuffix?: string;
  showLabel?: boolean;
  customLabelText?: string;
};

export function drawAngleBetweenArrows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  iwsAngle: number,
  twsAngle: number,
  existingLabels?: LabelPosition[],
  pointOfSailLabel?: string,
  arrows?: ArrowSegment[],
  boatBox?: { minX: number; maxX: number; minY: number; maxY: number },
  options?: DrawAngleOptions
): LabelPosition | null {
  ctx.save();
  let diff = twsAngle - iwsAngle;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  const absDiff = Math.abs(diff);

  const startRad = degToRad(iwsAngle);
  const endRad = degToRad(twsAngle);

  const arcRadius = options?.radius ?? CANVAS_CONFIG.angleBetweenArrowsRadius;
  const arcColor = options?.color ?? COLORS.angleArc;
  const labelSuffix = options?.labelSuffix ?? "";

  ctx.strokeStyle = arcColor;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(x, y, arcRadius, startRad, endRad, diff < 0);
  ctx.stroke();
  ctx.setLineDash([]);

  if (options?.showLabel === false) {
    ctx.restore();
    return null;
  }

  // Calculate label position with collision avoidance
  const labelText =
    options?.customLabelText ?? `${formatAngle(absDiff)}°${labelSuffix}`;
  ctx.font = "bold 16px Inter, sans-serif";

  const metrics = ctx.measureText(labelText);
  let labelWidth = metrics.width + 30;
  let labelHeight = 36;

  if (pointOfSailLabel) {
    ctx.font = "12px Inter, sans-serif";
    const posMetrics = ctx.measureText(pointOfSailLabel);
    labelWidth = Math.max(labelWidth, posMetrics.width + 20);
    labelHeight = 52;
  }

  // Find the bisector angle between the two arrows
  const sign = diff >= 0 ? 1 : -1;
  const bisectorRad = startRad + sign * degToRad(absDiff / 2);

  // Generate radial and fan candidates
  const candidates: Array<{ x: number; y: number; dist: number }> = [];
  const distances = [
    arcRadius + 14,
    arcRadius + 28,
    arcRadius + 48,
    arcRadius + 70,
    arcRadius + 95,
    arcRadius + 125,
    arcRadius + 160,
  ];
  const angleOffsets = [
    0,
    0.2,
    -0.2,
    0.4,
    -0.4,
    0.8,
    -0.8,
    Math.PI / 2,
    -Math.PI / 2,
    Math.PI,
  ];

  for (const dist of distances) {
    for (const aOff of angleOffsets) {
      candidates.push({
        x: x + dist * Math.cos(bisectorRad + aOff),
        y: y + dist * Math.sin(bisectorRad + aOff),
        dist,
      });
    }
  }

  // Sort candidates by closeness to the arc
  candidates.sort(
    (a, b) =>
      Math.abs(a.dist - arcRadius - 20) - Math.abs(b.dist - arcRadius - 20)
  );

  let labelX = 0;
  let labelY = 0;
  let foundPosition = false;

  for (const c of candidates) {
    if (
      isPositionCollisionFree(
        c.x,
        c.y,
        labelWidth,
        labelHeight,
        6,
        arrows,
        existingLabels,
        boatBox
      )
    ) {
      labelX = c.x;
      labelY = c.y;
      foundPosition = true;
      break;
    }
  }

  if (!foundPosition) {
    labelX = x + (arcRadius + 50) * Math.cos(bisectorRad);
    labelY = y + (arcRadius + 50) * Math.sin(bisectorRad);
  }

  ctx.fillStyle = arcColor;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillText(labelText, labelX, pointOfSailLabel ? labelY - 8 : labelY);

  if (pointOfSailLabel) {
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(pointOfSailLabel, labelX, labelY + 12);
  }

  ctx.restore();

  return {
    x: labelX,
    y: labelY,
    width: labelWidth,
    height: labelHeight,
  };
}
