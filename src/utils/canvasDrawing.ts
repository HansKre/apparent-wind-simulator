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
    const leftBoatWidth = 190;
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
  abbreviation?: string
) {
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
    const labelOffset = 25;
    const perpAngle = angle + Math.PI / 2;
    const labelX = midX + labelOffset * Math.cos(perpAngle);
    const labelY = midY + labelOffset * Math.sin(perpAngle);

    ctx.fillText(`${speed.toFixed(1)} kt (${abbreviation})`, labelX, labelY);

    ctx.restore();
  }
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
  awsAngle: number
) {
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

  const labelRad = degToRad(awsAngle + 24);
  const labelRadius = CANVAS_CONFIG.angleBetweenArrowsRadius + 16;
  const labelX = x + labelRadius * Math.cos(labelRad);
  const labelY = y + labelRadius * Math.sin(labelRad);

  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillStyle = COLORS.angleArc;
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.fillText(`${formatAngle(absDiff)}°`, labelX, labelY);
  ctx.restore();
}
