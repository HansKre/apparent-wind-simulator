import { useEffect, useRef, useState } from "react";
import { COLORS } from "../constants/windSimulator";
import { useDragInteraction } from "../hooks/useDragInteraction";
import { useGustSimulation } from "../hooks/useGustSimulation";
import { useLullSimulation } from "../hooks/useLullSimulation";
import { useSimulationConfig } from "../hooks/useSimulationConfig";
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
import { SimulationModal } from "./SimulationModal";
import { ZoomControls } from "./ZoomControls";

export function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(10);
  const [trueWindAngle, setTrueWindAngle] = useState(270); // 270° = West (horizontal left)
  const [boatSpeed, setBoatSpeed] = useState(10);
  const [boatDirection, setBoatDirection] = useState(0); // 0° = North (up)

  // Boat position state (offset from canvas center)
  const [boatOffsetX, setBoatOffsetX] = useState(0);
  const [boatOffsetY, setBoatOffsetY] = useState(0);

  // Gust simulation state
  const [gustSpeed, setGustSpeed] = useState(10);
  const [autoHeadUpGust, setAutoHeadUpGust] = useState(false);

  // Lull simulation state
  const [lullSpeed, setLullSpeed] = useState(5);
  const [autoHeadUpLull, setAutoHeadUpLull] = useState(false);

  // Simulation configuration
  const { simulationConfig, setSimulationConfig } = useSimulationConfig();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boatImageRef = useRef<HTMLImageElement | null>(null);

  // Canvas dimensions and zoom
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [boatImageLoaded, setBoatImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.5 = 50%, 2 = 200%

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSimulatedOnce, setHasSimulatedOnce] = useState(false);
  const [lastSimulationType, setLastSimulationType] = useState<"gust" | "lull">(
    "gust"
  );

  // Click detection state
  const [mouseDownPos, setMouseDownPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Scale factor for visualization (pixels per knot) with zoom applied
  const scale = 15 * zoomLevel;

  // Center point of canvas
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  // Boat position (center + offset)
  const boatX = centerX + boatOffsetX;
  const boatY = centerY + boatOffsetY;

  // Drag interaction hook
  const {
    dragState,
    isHoveringHandle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragInteraction({
    canvasRef,
    centerX,
    centerY,
    boatX,
    boatY,
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
    setBoatOffsetX,
    setBoatOffsetY,
    setZoomLevel,
  });

  // Gust simulation hook
  const {
    isSimulating: isSimulatingGust,
    isPaused: isPausedGust,
    speedMultiplier: speedMultiplierGust,
    animationStep: animationStepGust,
    simulateGust,
    togglePause: togglePauseGust,
    toggleSpeed: toggleSpeedGust,
  } = useGustSimulation({
    gustSpeed,
    trueWindSpeed,
    trueWindAngle,
    boatSpeed,
    boatDirection,
    autoHeadUp: autoHeadUpGust,
    config: simulationConfig,
    setTrueWindSpeed,
    setTrueWindAngle,
    setBoatSpeed,
    setBoatDirection,
  });

  // Lull simulation hook
  const {
    isSimulating: isSimulatingLull,
    isPaused: isPausedLull,
    speedMultiplier: speedMultiplierLull,
    animationStep: animationStepLull,
    simulateLull,
    togglePause: togglePauseLull,
    toggleSpeed: toggleSpeedLull,
  } = useLullSimulation({
    lullSpeed,
    trueWindSpeed,
    trueWindAngle,
    boatSpeed,
    boatDirection,
    autoHeadUp: autoHeadUpLull,
    config: simulationConfig,
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

  // Add touch event listeners with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add touch event listeners with passive: false
    canvas.addEventListener(
      "touchstart",
      handleTouchStart as unknown as EventListener,
      {
        passive: false,
      }
    );
    canvas.addEventListener(
      "touchmove",
      handleTouchMove as unknown as EventListener,
      {
        passive: false,
      }
    );
    canvas.addEventListener(
      "touchend",
      handleTouchEnd as unknown as EventListener,
      {
        passive: false,
      }
    );

    return () => {
      canvas.removeEventListener(
        "touchstart",
        handleTouchStart as unknown as EventListener
      );
      canvas.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      canvas.removeEventListener(
        "touchend",
        handleTouchEnd as unknown as EventListener
      );
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

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
    const boatFrontX = boatX + boatFrontVector.x;
    const boatFrontY = boatY + boatFrontVector.y;

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
    drawBoat(ctx, boatX, boatY, boatDirection, zoomLevel, boatImageRef.current);

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
        drawAngleArc(ctx, boatX, boatY, boatDirection, COLORS.inducedWind);
      }
    }

    // Draw animation step in top right
    const currentAnimationStep =
      isSimulatingGust ? animationStepGust : animationStepLull;
    const currentIsPaused = isSimulatingGust ? isPausedGust : isPausedLull;

    if (currentAnimationStep) {
      const padding = 20;
      const textX = canvasSize.width - padding;
      const textY = padding;

      // Set text styles
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";

      // Draw phase name
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(currentAnimationStep.phase, textX, textY);

      // Draw timing
      const timingText = `${currentAnimationStep.elapsed}/${currentAnimationStep.duration}ms`;
      ctx.fillText(timingText, textX, textY + 20);

      // Draw pause indicator if paused
      if (currentIsPaused) {
        ctx.fillStyle = "rgba(255, 193, 7, 0.95)";
        ctx.fillText("⏸ PAUSED", textX, textY + 40);
      }

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
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
    boatX,
    boatY,
    scale,
    isSimulatingGust,
    isSimulatingLull,
    animationStepGust,
    animationStepLull,
    isPausedGust,
    isPausedLull,
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

  // Canvas click handlers to toggle pause/resume
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    handleMouseDown(e);
  }

  function handleCanvasMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    // Check if this was a click (not a drag) BEFORE calling handleMouseUp
    let wasClick = false;
    if (mouseDownPos) {
      const dx = e.clientX - mouseDownPos.x;
      const dy = e.clientY - mouseDownPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // If mouse moved less than 5 pixels, treat it as a click
      wasClick = distance < 5;
    }

    handleMouseUp();

    // Toggle pause if it was a click during simulation
    if (wasClick && (isSimulatingGust || isSimulatingLull)) {
      if (isSimulatingGust) {
        togglePauseGust();
      } else if (isSimulatingLull) {
        togglePauseLull();
      }
    }

    setMouseDownPos(null);
  }

  // Speed toggle button handler
  function handleSpeedToggle() {
    if (isSimulatingGust) {
      toggleSpeedGust();
    } else if (isSimulatingLull) {
      toggleSpeedLull();
    }
  }

  return (
    <div
      className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden"
      data-testid="wind-simulator"
    >
      <div
        ref={containerRef}
        className="flex-1 glass-dark rounded-2xl shadow-2xl overflow-hidden relative min-h-[450px]"
        data-testid="canvas-container"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleMouseLeave}
          className={
            dragState.isDragging
              ? "cursor-grabbing"
              : isHoveringHandle
                ? "cursor-grab"
                : "cursor-default"
          }
          style={{ touchAction: "none" }}
        />

        <SimulationButtons
          onSimulate={() => {
            if (!hasSimulatedOnce) {
              setIsModalOpen(true);
            } else {
              if (lastSimulationType === "gust") {
                simulateGust();
              } else {
                simulateLull();
              }
            }
          }}
          onOpenSettings={() => setIsModalOpen(true)}
          isSimulating={isSimulatingGust || isSimulatingLull}
        />

        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />

        {/* Speed control button - positioned to left of zoom controls */}
        <div
          className="absolute bottom-4 right-16 flex flex-col gap-2"
          data-testid="speed-controls"
        >
          <button
            onClick={handleSpeedToggle}
            disabled={!isSimulatingGust && !isSimulatingLull}
            className={`glass-dark px-3 py-2 rounded-lg text-white font-bold hover:bg-white/20 transition-all shadow-lg ${
              (isSimulatingGust && speedMultiplierGust === 0.5) ||
              (isSimulatingLull && speedMultiplierLull === 0.5)
                ? "bg-amber-600/40"
                : ""
            } ${!isSimulatingGust && !isSimulatingLull ? "opacity-50 cursor-not-allowed" : ""}`}
            data-testid="speed-toggle-button"
            title={
              isSimulatingGust || isSimulatingLull
                ? "Toggle animation speed (0.5x / 1x)"
                : "Start a simulation to change speed"
            }
          >
            {(isSimulatingGust && speedMultiplierGust === 0.5) ||
            (isSimulatingLull && speedMultiplierLull === 0.5)
              ? "0.5x"
              : "1x"}
          </button>
        </div>
      </div>

      {/* Show DataPanel on desktop only */}
      <div className="hidden lg:block" data-testid="desktop-data-panel">
        <DataPanel
          gustSpeed={gustSpeed}
          isSimulatingGust={isSimulatingGust}
          autoHeadUpGust={autoHeadUpGust}
          onGustSpeedChange={setGustSpeed}
          onSimulateGust={() => {
            setHasSimulatedOnce(true);
            setLastSimulationType("gust");
            simulateGust();
          }}
          onAutoHeadUpGustChange={setAutoHeadUpGust}
          lullSpeed={lullSpeed}
          isSimulatingLull={isSimulatingLull}
          autoHeadUpLull={autoHeadUpLull}
          onLullSpeedChange={setLullSpeed}
          onSimulateLull={() => {
            setHasSimulatedOnce(true);
            setLastSimulationType("lull");
            simulateLull();
          }}
          onAutoHeadUpLullChange={setAutoHeadUpLull}
          simulationConfig={simulationConfig}
          onSimulationConfigChange={setSimulationConfig}
        />
      </div>

      {/* Show modal on mobile only */}
      <div className="lg:hidden" data-testid="mobile-modal-container">
        <SimulationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          gustSpeed={gustSpeed}
          isSimulatingGust={isSimulatingGust}
          autoHeadUpGust={autoHeadUpGust}
          onGustSpeedChange={setGustSpeed}
          onSimulateGust={() => {
            setHasSimulatedOnce(true);
            setLastSimulationType("gust");
            simulateGust();
          }}
          onAutoHeadUpGustChange={setAutoHeadUpGust}
          lullSpeed={lullSpeed}
          isSimulatingLull={isSimulatingLull}
          autoHeadUpLull={autoHeadUpLull}
          onLullSpeedChange={setLullSpeed}
          onSimulateLull={() => {
            setHasSimulatedOnce(true);
            setLastSimulationType("lull");
            simulateLull();
          }}
          onAutoHeadUpLullChange={setAutoHeadUpLull}
          simulationConfig={simulationConfig}
          onSimulationConfigChange={setSimulationConfig}
        />
      </div>
    </div>
  );
}

type SimulationButtonsProps = {
  onSimulate: () => void;
  onOpenSettings: () => void;
  isSimulating: boolean;
};

function SimulationButtons({
  onSimulate,
  onOpenSettings,
  isSimulating,
}: SimulationButtonsProps) {
  return (
    <div
      className="lg:hidden absolute bottom-4 left-4 flex gap-2"
      data-testid="simulation-buttons"
    >
      <button
        onClick={onSimulate}
        className="glass-dark px-4 py-2 rounded-lg text-white font-medium hover:bg-white/20 transition-all shadow-lg"
        data-testid="simulate-button"
      >
        {isSimulating ? "Simulating..." : "Simulate"}
      </button>
      <button
        onClick={onOpenSettings}
        className="glass-dark p-2 rounded-lg text-white hover:bg-white/20 transition-all shadow-lg"
        data-testid="settings-button"
        aria-label="Simulation settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}
