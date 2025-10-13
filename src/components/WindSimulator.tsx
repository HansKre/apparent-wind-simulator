import { useEffect, useRef, useState } from "react";
import { COLORS } from "../constants/windSimulator";
import { useDragInteraction } from "../hooks/useDragInteraction";
import { useGustSimulation } from "../hooks/useGustSimulation";
import {
  drawAngleArc,
  drawAngleBetweenArrows,
  drawArrow,
  drawBoat,
  drawGoNoGoZone,
} from "../utils/canvasDrawing";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";
import { DataPanel } from "./DataPanel";
import { ZoomControls } from "./ZoomControls";

export function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(10);
  const [trueWindAngle, setTrueWindAngle] = useState(270); // 270° = West (horizontal left)
  const [boatSpeed, setBoatSpeed] = useState(10);
  const [boatDirection, setBoatDirection] = useState(0); // 0° = North (up)

  // Gust simulation state
  const [gustSpeed, setGustSpeed] = useState(10);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boatImageRef = useRef<HTMLImageElement | null>(null);

  // Canvas dimensions and zoom
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [boatImageLoaded, setBoatImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.5 = 50%, 2 = 200%

  // Scale factor for visualization (pixels per knot) with zoom applied
  const scale = 15 * zoomLevel;

  // Center point of canvas
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  // Drag interaction hook
  const {
    dragState,
    isHoveringHandle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useDragInteraction({
    canvasRef,
    centerX,
    centerY,
    scale,
    zoomLevel,
    boatDirection,
    boatSpeed,
    trueWindSpeed,
    trueWindAngle,
    setTrueWindSpeed,
    setTrueWindAngle,
    setBoatSpeed,
    setBoatDirection,
  });

  // Gust simulation hook
  const { isSimulating, simulateGust } = useGustSimulation({
    gustSpeed,
    trueWindSpeed,
    trueWindAngle,
    boatSpeed,
    boatDirection,
    setTrueWindSpeed,
    setTrueWindAngle,
    setBoatSpeed,
    setBoatDirection,
  });

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
    drawBoat(
      ctx,
      centerX,
      centerY,
      boatDirection,
      zoomLevel,
      boatImageRef.current
    );

    // Draw go-no-go zone BEFORE other arrows so they appear on top
    drawGoNoGoZone(ctx, boatFrontX, boatFrontY, boatDirection, canvasSize);

    drawArrow(
      ctx,
      inducedStartX,
      inducedStartY,
      inducedEndX,
      inducedEndY,
      COLORS.inducedWind,
      dragState.isDragging && dragState.dragType === "inducedWind",
      true,
      false,
      false,
      boatSpeed,
      "IWS"
    );
    drawArrow(
      ctx,
      trueWindTailX,
      trueWindTailY,
      trueWindHeadX,
      trueWindHeadY,
      COLORS.trueWind,
      dragState.isDragging && dragState.dragType === "trueWind",
      true,
      false,
      false,
      trueWindSpeed,
      "TWS"
    );
    drawArrow(
      ctx,
      apparentTailX,
      apparentTailY,
      apparentHeadX,
      apparentHeadY,
      COLORS.apparentWind,
      false,
      false,
      false,
      false,
      apparentWindSpeed,
      "AWS"
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
          COLORS.trueWind
        );
      } else if (dragState.dragType === "inducedWind") {
        drawAngleArc(ctx, centerX, centerY, boatDirection, COLORS.inducedWind);
      }
    }
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

  return (
    <div
      className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden"
      data-testid="wind-simulator"
    >
      <div
        ref={containerRef}
        className="flex-1 glass-dark rounded-2xl shadow-2xl overflow-hidden relative"
        data-testid="canvas-container"
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

        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />
      </div>

      <DataPanel
        gustSpeed={gustSpeed}
        isSimulating={isSimulating}
        onGustSpeedChange={setGustSpeed}
        onSimulateGust={simulateGust}
      />
    </div>
  );
}
