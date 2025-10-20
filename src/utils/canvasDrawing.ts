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
  canvasSize: { width: number; height: number }
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

  ctx.fillStyle = COLORS.noSailZone;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + leftPoint.x, y + leftPoint.y);
  ctx.lineTo(x + rightPoint.x, y + rightPoint.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLORS.noSailZoneBorder;
  ctx.lineWidth = 2;
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
  existingLabels?: LabelPosition[]
): LabelPosition | null {
  ctx.save();

  if (isDragging) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = isDragging ? 5 : 3;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

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
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelText = `${speed.toFixed(1)} kt (${abbreviation})`;

    // Measure label dimensions with extra padding to prevent overlap
    const metrics = ctx.measureText(labelText);
    const labelWidth = metrics.width + 50; // Extra padding for safety
    const labelHeight = 50; // Generous height estimate

    // Aggressive spacing buffer to ensure labels never touch
    const SPACING_BUFFER = 30;

    // Try different label positions to avoid overlap
    // Start with closer positions, then move progressively further away
    const labelOffsets = [
      { offset: 40, angleOffset: Math.PI / 2 },       // Right perpendicular
      { offset: 40, angleOffset: -Math.PI / 2 },      // Left perpendicular
      { offset: 40, angleOffset: 0 },                 // Along arrow direction
      { offset: 40, angleOffset: Math.PI },           // Opposite arrow direction
      { offset: 60, angleOffset: Math.PI / 2 },       // Further right
      { offset: 60, angleOffset: -Math.PI / 2 },      // Further left
      { offset: 60, angleOffset: Math.PI / 4 },       // Diagonal right
      { offset: 60, angleOffset: -Math.PI / 4 },      // Diagonal left
      { offset: 60, angleOffset: 3 * Math.PI / 4 },   // Diagonal back-right
      { offset: 60, angleOffset: -3 * Math.PI / 4 },  // Diagonal back-left
      { offset: 80, angleOffset: Math.PI / 2 },       // Far right
      { offset: 80, angleOffset: -Math.PI / 2 },      // Far left
      { offset: 80, angleOffset: Math.PI / 3 },       // 60° right
      { offset: 80, angleOffset: -Math.PI / 3 },      // 60° left
      { offset: 100, angleOffset: Math.PI / 2 },      // Very far right
      { offset: 100, angleOffset: -Math.PI / 2 },     // Very far left
      { offset: 100, angleOffset: 0 },                // Very far forward
      { offset: 100, angleOffset: Math.PI },          // Very far back
      { offset: 120, angleOffset: Math.PI / 2 },      // Extremely far right
      { offset: 120, angleOffset: -Math.PI / 2 },     // Extremely far left
    ];

    let labelX = 0;
    let labelY = 0;
    let foundPosition = false;

    for (const { offset, angleOffset } of labelOffsets) {
      const testAngle = angle + angleOffset;
      const testX = midX + offset * Math.cos(testAngle);
      const testY = midY + offset * Math.sin(testAngle);

      // Check if this position overlaps with any existing labels
      const overlaps = existingLabels?.some(existing => {
        const dx = Math.abs(testX - existing.x);
        const dy = Math.abs(testY - existing.y);
        return dx < (labelWidth + existing.width) / 2 + SPACING_BUFFER &&
               dy < (labelHeight + existing.height) / 2 + SPACING_BUFFER;
      });

      if (!overlaps) {
        labelX = testX;
        labelY = testY;
        foundPosition = true;
        break;
      }
    }

    // If no non-overlapping position found, use a very far offset
    if (!foundPosition) {
      const perpAngle = angle + Math.PI / 2;
      labelX = midX + 150 * Math.cos(perpAngle);
      labelY = midY + 150 * Math.sin(perpAngle);
    }

    ctx.fillText(labelText, labelX, labelY);

    ctx.restore();

    // Return the label position for future collision detection
    return {
      x: labelX,
      y: labelY,
      width: labelWidth,
      height: labelHeight
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

export function drawAngleBetweenArrows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  iwsAngle: number,
  awsAngle: number,
  existingLabels?: LabelPosition[]
): LabelPosition | null {
  ctx.save();
  let diff = awsAngle - iwsAngle;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  const absDiff = Math.abs(diff);

  const startRad = degToRad(iwsAngle);
  const endRad = degToRad(awsAngle);

  ctx.strokeStyle = COLORS.angleArc;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    CANVAS_CONFIG.angleBetweenArrowsRadius,
    startRad,
    endRad,
    diff < 0
  );
  ctx.stroke();
  ctx.setLineDash([]);

  // Calculate label position with collision avoidance
  const labelText = `${formatAngle(absDiff)}°`;
  ctx.font = "bold 16px Inter, sans-serif";

  const metrics = ctx.measureText(labelText);
  const labelWidth = metrics.width + 50;
  const labelHeight = 50;

  // Try different positions around the arc - more positions, further away
  const angleOffsets = [24, 36, 12, 48, 0, -12, -24, 60, -36, 72, -48, 90, -60];
  const radiusOffsets = [16, 26, 36, 46, 56, 66, 76, 6];

  let labelX = 0;
  let labelY = 0;
  let foundPosition = false;
  const SPACING_BUFFER = 30;

  for (const angleOffset of angleOffsets) {
    for (const radiusOffset of radiusOffsets) {
      const labelRad = degToRad(awsAngle + angleOffset);
      const labelRadius = CANVAS_CONFIG.angleBetweenArrowsRadius + radiusOffset;
      const testX = x + labelRadius * Math.cos(labelRad);
      const testY = y + labelRadius * Math.sin(labelRad);

      // Check for overlaps
      const overlaps = existingLabels?.some(existing => {
        const dx = Math.abs(testX - existing.x);
        const dy = Math.abs(testY - existing.y);
        return dx < (labelWidth + existing.width) / 2 + SPACING_BUFFER &&
               dy < (labelHeight + existing.height) / 2 + SPACING_BUFFER;
      });

      if (!overlaps) {
        labelX = testX;
        labelY = testY;
        foundPosition = true;
        break;
      }
    }
    if (foundPosition) break;
  }

  // Fallback position if no good spot found
  if (!foundPosition) {
    const labelRad = degToRad(awsAngle + 24);
    const labelRadius = CANVAS_CONFIG.angleBetweenArrowsRadius + 90;
    labelX = x + labelRadius * Math.cos(labelRad);
    labelY = y + labelRadius * Math.sin(labelRad);
  }

  ctx.fillStyle = COLORS.angleArc;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.fillText(labelText, labelX, labelY);
  ctx.restore();

  return {
    x: labelX,
    y: labelY,
    width: labelWidth,
    height: labelHeight
  };
}
