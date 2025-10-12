import { useEffect, useRef, useState } from "react";
import {
  cartesianToPolar,
  degToRad,
  distance,
  formatAngle,
  formatSpeed,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";

type DragState = {
  isDragging: boolean;
  dragType: "trueWind" | "inducedWind" | null;
  startX: number;
  startY: number;
  startBoatDirection?: number;
  startBoatSpeed?: number;
};

export function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(10);
  const [trueWindAngle, setTrueWindAngle] = useState(270); // 270° = West (horizontal left)
  const [boatSpeed, setBoatSpeed] = useState(10);
  const [boatDirection, setBoatDirection] = useState(0); // 0° = North (up)

  // Gust simulation state
  const [gustSpeed, setGustSpeed] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [baseWindSpeed, setBaseWindSpeed] = useState(10);
  const [baseWindAngle, setBaseWindAngle] = useState(270);
  const [baseBoatSpeed, setBaseBoatSpeed] = useState(10);
  const [baseBoatDirection, setBaseBoatDirection] = useState(0);
  const animationRef = useRef<number | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boatImageRef = useRef<HTMLImageElement | null>(null);

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
  });

  // Hover state for cursor control
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  // Canvas dimensions and zoom
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [boatImageLoaded, setBoatImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.5 = 50%, 2 = 200%

  // Load boat SVG
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      boatImageRef.current = img;
      setBoatImageLoaded(true);
    };
    img.onerror = (err) => {
      console.error("Failed to load boat SVG:", err);
    };
    img.src = "/boat.svg";
  }, []);

  // Calculate apparent wind using vector addition
  // Apparent wind = True wind + Induced wind (boat speed in opposite direction)
  // First, get the vectors in Cartesian coordinates
  const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
  const inducedWindVector = polarToCartesian(
    boatSpeed,
    normalizeAngle(boatDirection + 180)
  );

  // Add the vectors
  const apparentWindX = trueWindVector.x + inducedWindVector.x;
  const apparentWindY = trueWindVector.y + inducedWindVector.y;

  // Convert back to polar to get speed and angle
  const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
  const apparentWindSpeed = apparentPolar.speed;
  const apparentWindAngle = apparentPolar.angle;

  // Scale factor for visualization (pixels per knot) with zoom applied
  const scale = 15 * zoomLevel;

  // Center point of canvas
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Calculate vector endpoints for the triangle
    // Boat front: The bow of the boat extends in the direction of travel
    const boatFrontOffset = 40 * zoomLevel; // pixels from center to front of boat (scaled with zoom)
    const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
    const boatFrontX = centerX + boatFrontVector.x;
    const boatFrontY = centerY + boatFrontVector.y;

    // Induced wind: arrow comes from opposite direction to boat, ending at boat front
    // Arrow points TOWARD boat front, with arrowhead AT boat front
    // Vector points in the same direction as boat (to position start point on opposite side)
    const inducedVectorDirection = polarToCartesian(
      boatSpeed * scale,
      normalizeAngle(boatDirection + 180)
    );
    const inducedStartX = boatFrontX - inducedVectorDirection.x; // Start in opposite direction from boat
    const inducedStartY = boatFrontY - inducedVectorDirection.y;
    const inducedEndX = boatFrontX; // Arrow ends at boat front with arrowhead pointing at boat
    const inducedEndY = boatFrontY;

    // True wind: arrowhead connects to START of induced wind (the end away from boat)
    const trueWindVector = polarToCartesian(
      trueWindSpeed * scale,
      trueWindAngle
    );
    const trueWindHeadX = inducedStartX;
    const trueWindHeadY = inducedStartY;
    const trueWindTailX = inducedStartX - trueWindVector.x;
    const trueWindTailY = inducedStartY - trueWindVector.y;

    // Apparent wind: closes the triangle from true wind tail to boat front
    const apparentHeadX = boatFrontX;
    const apparentHeadY = boatFrontY;
    const apparentTailX = trueWindTailX;
    const apparentTailY = trueWindTailY;

    // Draw vectors (from start to end, with arrowhead at end)
    drawBoat(ctx, centerX, centerY, boatDirection);

    // Draw go-no-go zone BEFORE other arrows so they appear on top
    drawGoNoGoZone(ctx, boatFrontX, boatFrontY, boatDirection);

    drawInducedWind(
      ctx,
      inducedStartX,
      inducedStartY,
      inducedEndX,
      inducedEndY
    );
    drawTrueWind(
      ctx,
      trueWindTailX,
      trueWindTailY,
      trueWindHeadX,
      trueWindHeadY
    );
    drawApparentWind(
      ctx,
      apparentTailX,
      apparentTailY,
      apparentHeadX,
      apparentHeadY
    );

    // Calculate bow directions as shown above
    const iwsAngleAtBow =
      (Math.atan2(inducedStartY - boatFrontY, inducedStartX - boatFrontX) *
        180) /
      Math.PI;

    const awsAngleAtBow =
      (Math.atan2(apparentTailY - boatFrontY, apparentTailX - boatFrontX) *
        180) /
      Math.PI;

    // Now call the arc drawing function with these values
    drawAngleBetweenArrows(
      ctx,
      boatFrontX,
      boatFrontY,
      iwsAngleAtBow,
      awsAngleAtBow
    );

    // Draw angle arc if dragging
    if (dragState.isDragging) {
      if (dragState.dragType === "trueWind") {
        drawAngleArc(
          ctx,
          trueWindTailX,
          trueWindTailY,
          trueWindAngle,
          "#3b82f6"
        );
      } else if (dragState.dragType === "inducedWind") {
        drawAngleArc(ctx, centerX, centerY, boatDirection, "#10b981");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasSize,
    trueWindSpeed,
    trueWindAngle,
    boatSpeed,
    boatDirection,
    apparentWindSpeed,
    apparentWindAngle,
    dragState,
    boatImageLoaded,
    zoomLevel,
    centerX,
    centerY,
    scale,
  ]);

  // Draw boat
  function drawBoat(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    if (boatImageRef.current) {
      // The SVG has two boats side by side
      // Left boat occupies roughly the first 1/3 of the image width
      // SVG viewBox is "0 0 460.62992 744.09444"
      // Left boat is approximately at x: 0-190, y: 0-744
      const svgHeight = 744.09444;
      const leftBoatWidth = 190; // Crop to just the left boat

      // Calculate proper aspect ratio
      const sourceAspectRatio = leftBoatWidth / svgHeight; // ~0.255

      // Scale to fit our desired size while preserving aspect ratio and applying zoom
      const targetHeight = 80 * zoomLevel; // Apply zoom to boat size
      const targetWidth = targetHeight * sourceAspectRatio; // Width based on aspect ratio

      // Draw only the left portion of the SVG
      ctx.drawImage(
        boatImageRef.current,
        0,
        0,
        leftBoatWidth,
        svgHeight, // Source rectangle (left boat only)
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight // Destination
      );
    } else {
      // Fallback: Draw a simple sailboat shape if image not loaded, scaled by zoom
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(0, -20 * zoomLevel);
      ctx.lineTo(-8 * zoomLevel, 20 * zoomLevel);
      ctx.lineTo(8 * zoomLevel, 20 * zoomLevel);
      ctx.closePath();
      ctx.fill();

      // Draw mast
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2 * zoomLevel;
      ctx.beginPath();
      ctx.moveTo(0, -20 * zoomLevel);
      ctx.lineTo(0, -30 * zoomLevel);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw go-no-go zone (no-sail zone 45° on each side of boat direction)
  function drawGoNoGoZone(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    boatDirection: number
  ) {
    ctx.save();

    // The no-sail zone extends 45° on each side of the boat direction
    // Aligned with boat heading (no rotation offset)
    // Calculate the maximum distance to reach the edge of the canvas
    const maxDistance = Math.max(
      canvasSize.width,
      canvasSize.height,
      Math.sqrt(
        canvasSize.width * canvasSize.width +
          canvasSize.height * canvasSize.height
      )
    );
    const noSailZoneRadius = maxDistance; // Extend to canvas edge
    const rotatedAngle = normalizeAngle(boatDirection); // Aligned with boat direction

    // Calculate the two boundary angles (45° left and right of rotated angle)
    const leftBoundary = normalizeAngle(rotatedAngle - 45);
    const rightBoundary = normalizeAngle(rotatedAngle + 45);

    // Calculate the two outer points of the triangle
    const leftPoint = polarToCartesian(noSailZoneRadius, leftBoundary);
    const rightPoint = polarToCartesian(noSailZoneRadius, rightBoundary);

    // Draw filled triangle with semi-transparent red
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)"; // red with 15% opacity
    ctx.beginPath();
    ctx.moveTo(x, y); // Start at boat front (bow)
    ctx.lineTo(x + leftPoint.x, y + leftPoint.y);
    ctx.lineTo(x + rightPoint.x, y + rightPoint.y);
    ctx.closePath();
    ctx.fill();

    // Draw border lines
    ctx.strokeStyle = "rgba(239, 68, 68, 0.5)"; // red with 50% opacity
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]); // dashed line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + leftPoint.x, y + leftPoint.y);
    ctx.moveTo(x, y);
    ctx.lineTo(x + rightPoint.x, y + rightPoint.y);
    ctx.stroke();
    ctx.setLineDash([]); // reset dash

    ctx.restore();
  }

  // Draw arrow with label
  function drawArrow(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    _label: string,
    speed: number,
    abbreviation: string,
    isDragging: boolean = false,
    showDragHandle: boolean = false,
    arrowheadAtStart: boolean = false,
    dragHandleAtEnd: boolean = false
  ) {
    ctx.save();

    // Draw line with glow if dragging
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

    // Draw arrowhead
    const arrowLength = 15;
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();

    if (arrowheadAtStart) {
      // Arrowhead at start position (pointing from end to start)
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + arrowLength * Math.cos(angle - Math.PI / 6),
        startY + arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        startX + arrowLength * Math.cos(angle + Math.PI / 6),
        startY + arrowLength * Math.sin(angle + Math.PI / 6)
      );
    } else {
      // Arrowhead at end position (pointing from start to end)
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - Math.PI / 6),
        endY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + Math.PI / 6),
        endY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
    }
    ctx.closePath();
    ctx.fill();

    // Draw drag handle (circle at start or end position)
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

    // Draw speed label with abbreviation
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

    ctx.fillText(`${formatSpeed(speed)} kt (${abbreviation})`, labelX, labelY);

    ctx.restore();
  }

  function drawTrueWind(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    drawArrow(
      ctx,
      startX,
      startY,
      endX,
      endY,
      "#3b82f6",
      "True Wind",
      trueWindSpeed,
      "TWS",
      dragState.isDragging && dragState.dragType === "trueWind",
      true,
      false // arrowhead at end (head position)
    );
  }

  function drawInducedWind(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    drawArrow(
      ctx,
      startX,
      startY,
      endX,
      endY,
      "#10b981",
      "Induced Wind",
      boatSpeed,
      "IWS",
      dragState.isDragging && dragState.dragType === "inducedWind",
      true,
      false, // arrowhead at end (at boat front, pointing away)
      false // drag handle at start (away from boat where user can drag)
    );
  }

  function drawApparentWind(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    drawArrow(
      ctx,
      startX,
      startY,
      endX,
      endY,
      "#ef4444",
      "Apparent Wind",
      apparentWindSpeed,
      "AWS",
      false,
      false,
      false // arrowhead at end (head position)
    );
  }

  function drawAngleArc(
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

    const radius = 60;
    const startAngle = -Math.PI / 2; // North (0°)
    const endAngle = ((angle - 90) * Math.PI) / 180;

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw angle text
    ctx.setLineDash([]);
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(`${formatAngle(angle)}°`, x, y - radius - 10);

    ctx.restore();
  }

  function drawAngleBetweenArrows(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    iwsAngle: number, // calculated above
    awsAngle: number // calculated above
  ) {
    ctx.save();
    let diff = awsAngle - iwsAngle;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const absDiff = Math.abs(diff);

    const startRad = degToRad(iwsAngle);
    const endRad = degToRad(awsAngle);
    const radius = 38;
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius, startRad, endRad, diff < 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label: offset right of red arrow
    const labelRad = degToRad(awsAngle + 24);
    const labelRadius = radius + 16;
    const labelX = x + labelRadius * Math.cos(labelRad);
    const labelY = y + labelRadius * Math.sin(labelRad);

    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 8;
    ctx.fillText(`${formatAngle(absDiff)}°`, labelX, labelY);
    ctx.restore();
  }

  // Mouse event handlers
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate current vector positions for drag handles
    // First calculate boat front position
    const boatFrontOffset = 40 * zoomLevel;
    const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
    const boatFrontX = centerX + boatFrontVector.x;
    const boatFrontY = centerY + boatFrontVector.y;

    const inducedVectorDirection = polarToCartesian(
      boatSpeed * scale,
      normalizeAngle(boatDirection + 180)
    );
    const inducedStartX = boatFrontX - inducedVectorDirection.x; // The draggable end (away from boat, opposite direction)
    const inducedStartY = boatFrontY - inducedVectorDirection.y;

    const trueWindVector = polarToCartesian(
      trueWindSpeed * scale,
      trueWindAngle
    );
    const trueWindTailX = inducedStartX - trueWindVector.x;
    const trueWindTailY = inducedStartY - trueWindVector.y;

    // Check if clicking on true wind arrow tail (drag handle)
    if (distance(mouseX, mouseY, trueWindTailX, trueWindTailY) < 20) {
      setDragState({
        isDragging: true,
        dragType: "trueWind",
        startX: mouseX,
        startY: mouseY,
      });
      return;
    }

    // Check if clicking on induced wind arrow start (drag handle - the end away from boat)
    if (distance(mouseX, mouseY, inducedStartX, inducedStartY) < 20) {
      setDragState({
        isDragging: true,
        dragType: "inducedWind",
        startX: mouseX,
        startY: mouseY,
        startBoatDirection: boatDirection,
        startBoatSpeed: boatSpeed,
      });
      return;
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if hovering over any drag handle (only when not dragging)
    if (!dragState.isDragging) {
      // Calculate current vector positions for drag handles
      const boatFrontOffset = 40 * zoomLevel;
      const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
      const boatFrontX = centerX + boatFrontVector.x;
      const boatFrontY = centerY + boatFrontVector.y;

      const inducedVectorDirection = polarToCartesian(
        boatSpeed * scale,
        normalizeAngle(boatDirection + 180)
      );
      const inducedStartX = boatFrontX - inducedVectorDirection.x;
      const inducedStartY = boatFrontY - inducedVectorDirection.y;

      const trueWindVector = polarToCartesian(
        trueWindSpeed * scale,
        trueWindAngle
      );
      const trueWindTailX = inducedStartX - trueWindVector.x;
      const trueWindTailY = inducedStartY - trueWindVector.y;

      // Check if hovering over any drag handle
      const hoveringTrueWind =
        distance(mouseX, mouseY, trueWindTailX, trueWindTailY) < 20;
      const hoveringInducedWind =
        distance(mouseX, mouseY, inducedStartX, inducedStartY) < 20;

      setIsHoveringHandle(hoveringTrueWind || hoveringInducedWind);
      return;
    }

    // Only update if mouse has moved at least 2 pixels from start
    const distFromStart = distance(
      mouseX,
      mouseY,
      dragState.startX,
      dragState.startY
    );
    if (distFromStart < 2) return;

    if (dragState.dragType === "trueWind") {
      // When dragging true wind tail, calculate the vector
      // True wind head connects to induced wind START (the end away from boat)
      const boatFrontOffset = 40 * zoomLevel;
      const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
      const boatFrontX = centerX + boatFrontVector.x;
      const boatFrontY = centerY + boatFrontVector.y;

      const inducedVectorDirection = polarToCartesian(
        boatSpeed * scale,
        normalizeAngle(boatDirection + 180)
      );
      const inducedStartX = boatFrontX - inducedVectorDirection.x;
      const inducedStartY = boatFrontY - inducedVectorDirection.y;

      // True wind vector is from mouse (tail) to induced wind start
      const trueWindX = inducedStartX - mouseX;
      const trueWindY = inducedStartY - mouseY;
      const { speed: newTrueSpeed, angle: newTrueAngle } = cartesianToPolar(
        trueWindX,
        trueWindY
      );
      const clampedSpeed = Math.max(0.1, Math.min(30, newTrueSpeed / scale));

      setTrueWindSpeed(clampedSpeed);
      setTrueWindAngle(newTrueAngle);
    } else if (dragState.dragType === "inducedWind") {
      // When dragging induced wind start (the draggable end away from boat)
      // Calculate boat front position (where the arrowhead is)
      const boatFrontOffset = 40 * zoomLevel;
      const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
      const boatFrontX = centerX + boatFrontVector.x;
      const boatFrontY = centerY + boatFrontVector.y;

      // Vector from mouse (start/drag point) to boat front (end/arrowhead)
      const dx = boatFrontX - mouseX;
      const dy = boatFrontY - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newSpeed = Math.max(0.1, Math.min(30, dist / scale));

      // Calculate the angle the arrow points (from start to end)
      const { angle: arrowAngle } = cartesianToPolar(dx, dy);

      setBoatSpeed(newSpeed);
      // The arrow points in direction arrowAngle (opposite to boat movement)
      // So boat moves in the opposite direction
      setBoatDirection(normalizeAngle(arrowAngle + 180));
    }
  }

  function handleMouseUp() {
    setDragState({
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
    });
  }

  function handleMouseLeave() {
    handleMouseUp();
    setIsHoveringHandle(false);
  }

  // Zoom functions
  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max 3x zoom
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
  }

  function handleZoomReset() {
    setZoomLevel(1);
  }

  // Gust simulation function
  function simulateGust() {
    if (isSimulating) return;

    // Store base values (all current state before simulation)
    setBaseWindSpeed(trueWindSpeed);
    setBaseWindAngle(trueWindAngle);
    setBaseBoatSpeed(boatSpeed);
    setBaseBoatDirection(boatDirection);
    setIsSimulating(true);

    const startTime = Date.now();
    const phase1Duration = 2000; // 2 seconds - wind increases rapidly
    const phase2Duration = 4000; // 4 seconds - boat speed increases (starts at 0.5s)
    const phase3Duration = 2500; // 2.5 seconds - wind decreases
    const phase4Duration = 4000; // 4 seconds - boat speed decreases

    // Boat speed starts picking up very early (25% into wind increase)
    const phase2StartTime = phase1Duration * 0.25; // 0.5s
    // Phase 3 starts when Phase 2 ends
    const phase3StartTime = phase2StartTime + phase2Duration; // 4.5s
    // Phase 4 starts early in Phase 3 (20% into wind decrease)
    const phase4StartTime = phase3StartTime + phase3Duration * 0.2; // 5s
    // Total duration is when Phase 4 ends
    const totalDuration = phase4StartTime + phase4Duration; // 9s

    // Calculate induced speed increase based on gust speed
    // Relationship: For every 1 knot of gust, boat speed increases by ~0.4 knots
    // This represents realistic acceleration from increased wind power
    const inducedSpeedIncrease = gustSpeed * 0.4;

    // Aggressive easing function for gust (hits hard and fast)
    function easeOutExpo(x: number): number {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    // Easing function for wind decrease (drops off quickly)
    function easeInExpo(x: number): number {
      return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    // Cubic easing for boat speed (smoother but still responsive)
    function easeOutCubic(x: number): number {
      return 1 - Math.pow(1 - x, 3);
    }

    function easeInCubic(x: number): number {
      return x * x * x;
    }

    function animate() {
      const elapsed = Date.now() - startTime;

      if (elapsed >= totalDuration) {
        // Animation complete - restore all values to exactly what they were before simulation
        setTrueWindSpeed(baseWindSpeed);
        setTrueWindAngle(baseWindAngle);
        setBoatSpeed(baseBoatSpeed);
        setBoatDirection(baseBoatDirection);
        setIsSimulating(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }

      // Calculate wind progress with aggressive non-linear curve
      let windMultiplier = 0;
      if (elapsed < phase1Duration) {
        // Phase 1: Wind increases rapidly with exponential curve (0-2s)
        const phaseProgress = elapsed / phase1Duration;
        windMultiplier = easeOutExpo(phaseProgress);
      } else if (elapsed < phase3StartTime) {
        // Between Phase 1 and Phase 3: Wind stays at peak
        windMultiplier = 1;
      } else if (elapsed < phase3StartTime + phase3Duration) {
        // Phase 3: Wind decreases rapidly (4.5-7s)
        const phaseProgress = (elapsed - phase3StartTime) / phase3Duration;
        windMultiplier = 1 - easeInExpo(phaseProgress);
      } else {
        // After Phase 3: Wind back to base
        windMultiplier = 0;
      }

      // Calculate boat speed progress with smoother but still aggressive curve
      let boatSpeedMultiplier = 0;
      if (elapsed < phase2StartTime) {
        // Before Phase 2: Boat speed at base (0-0.5s)
        boatSpeedMultiplier = 0;
      } else if (elapsed < phase2StartTime + phase2Duration) {
        // Phase 2: Boat speed increases with cubic ease (0.5-4.5s)
        const phaseProgress = (elapsed - phase2StartTime) / phase2Duration;
        boatSpeedMultiplier = easeOutCubic(phaseProgress);
      } else if (elapsed < phase4StartTime) {
        // Between Phase 2 and Phase 4: Boat speed stays at peak
        boatSpeedMultiplier = 1;
      } else if (elapsed < phase4StartTime + phase4Duration) {
        // Phase 4: Boat speed decreases with cubic ease (5-9s)
        const phaseProgress = (elapsed - phase4StartTime) / phase4Duration;
        boatSpeedMultiplier = 1 - easeInCubic(phaseProgress);
      } else {
        // After Phase 4: Boat speed back to base
        boatSpeedMultiplier = 0;
      }

      // Apply multipliers to base values
      setTrueWindSpeed(baseWindSpeed + gustSpeed * windMultiplier);
      setBoatSpeed(baseBoatSpeed + inducedSpeedIncrease * boatSpeedMultiplier);

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 glass-dark rounded-2xl shadow-2xl overflow-hidden relative"
        style={{ minHeight: "500px" }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={
            isHoveringHandle || dragState.isDragging
              ? "cursor-crosshair"
              : "cursor-default"
          }
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            title="Zoom In"
            data-testid="zoom-in-button"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white font-bold text-xs hover:bg-white/20 transition-all shadow-lg"
            title={`Reset Zoom (${Math.round(zoomLevel * 100)}%)`}
            data-testid="zoom-reset-button"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            title="Zoom Out"
            data-testid="zoom-out-button"
          >
            −
          </button>
        </div>
      </div>

      {/* Data Panel */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* True Wind */}
        <div className="glass rounded-2xl p-6 shadow-xl flex-1">
          <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            True Wind (TWS)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Speed:</span>
              <span className="text-white font-bold text-2xl">
                {formatSpeed(trueWindSpeed)}{" "}
                <span className="text-lg">knots</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Angle:</span>
              <span className="text-white font-bold text-2xl">
                {formatAngle(trueWindAngle)}°
              </span>
            </div>
          </div>
        </div>

        {/* Boat / Induced Wind */}
        <div className="glass rounded-2xl p-6 shadow-xl flex-1">
          <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            Induced Wind (IWS)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Speed:</span>
              <span className="text-white font-bold text-2xl">
                {formatSpeed(boatSpeed)} <span className="text-lg">knots</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Direction:</span>
              <span className="text-white font-bold text-2xl">
                {formatAngle(boatDirection)}°
              </span>
            </div>
          </div>
        </div>

        {/* Apparent Wind */}
        <div className="glass rounded-2xl p-6 shadow-xl flex-1 border-2 border-red-400/50">
          <h3 className="text-red-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            Apparent Wind (AWS)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Speed:</span>
              <span className="text-white font-bold text-2xl">
                {formatSpeed(apparentWindSpeed)}{" "}
                <span className="text-lg">knots</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Angle:</span>
              <span className="text-white font-bold text-2xl">
                {formatAngle(apparentWindAngle)}°
              </span>
            </div>
          </div>
        </div>

        {/* Gust Simulation */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h3 className="text-amber-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            Gust Simulation
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80">Gust Speed:</span>
                <span className="text-white font-bold text-lg">
                  {formatSpeed(gustSpeed)}{" "}
                  <span className="text-sm">knots</span>
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={gustSpeed}
                onChange={(e) => {
                  setGustSpeed(parseFloat(e.target.value));
                }}
                disabled={isSimulating}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isSimulating
                    ? "rgba(255, 255, 255, 0.2)"
                    : `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${
                        ((gustSpeed - 5) / 20) * 100
                      }%, rgba(255, 255, 255, 0.2) ${
                        ((gustSpeed - 5) / 20) * 100
                      }%, rgba(255, 255, 255, 0.2) 100%)`,
                }}
              />
            </div>
            <button
              onClick={simulateGust}
              disabled={isSimulating}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              data-testid="simulate-gust-button"
            >
              {isSimulating ? "Simulating..." : "Simulate Gust"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
