import { useEffect, useRef, useState } from "react";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";
import {
  drawBoat,
  drawGoNoGoZone,
  drawArrow,
  drawAngleArc,
  drawAngleBetweenArrows,
} from "../utils/canvasDrawing";
import { COLORS } from "../constants/windSimulator";
import { useDragInteraction } from "../hooks/useDragInteraction";
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
  const [isSimulating, setIsSimulating] = useState(false);
  const animationRef = useRef<number | null>(null);

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
  const { dragState, isHoveringHandle, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } =
    useDragInteraction({
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
    drawBoat(ctx, centerX, centerY, boatDirection, zoomLevel, boatImageRef.current);

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

    // Capture current values in local variables BEFORE animation starts
    // This ensures we use the actual current values, not stale state
    const capturedWindSpeed = trueWindSpeed;
    const capturedWindAngle = trueWindAngle;
    const capturedBoatSpeed = boatSpeed;
    const capturedBoatDirection = boatDirection;

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

    // Use captured values in the animation function

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
        setTrueWindSpeed(capturedWindSpeed);
        setTrueWindAngle(capturedWindAngle);
        setBoatSpeed(capturedBoatSpeed);
        setBoatDirection(capturedBoatDirection);
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
      setTrueWindSpeed(capturedWindSpeed + gustSpeed * windMultiplier);
      setBoatSpeed(
        capturedBoatSpeed + inducedSpeedIncrease * boatSpeedMultiplier
      );

      // Ensure boat direction and wind angle remain constant during simulation
      setBoatDirection(capturedBoatDirection);
      setTrueWindAngle(capturedWindAngle);

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
