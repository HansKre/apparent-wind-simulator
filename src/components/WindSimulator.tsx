import { useEffect, useRef, useState } from "react";
import { CANVAS_CONFIG, COLORS } from "../constants/windSimulator";
import { useDragInteraction } from "../hooks/useDragInteraction";
import { useGustSimulation } from "../hooks/useGustSimulation";
import { useLullSimulation } from "../hooks/useLullSimulation";
import { useSimulationConfig } from "../hooks/useSimulationConfig";
import {
  ArrowSegment,
  drawAngleBetweenArrows,
  drawArrow,
  drawBoat,
  drawGoNoGoZone,
  LabelPosition,
} from "../utils/canvasDrawing";
import {
  cartesianToPolar,
  formatAngle,
  getPointOfSail,
  polarToCartesian,
} from "../utils/windCalculations";
import { DataPanel } from "./DataPanel";
import { SimulationModal } from "./SimulationModal";
import { TwsControls } from "./TwsControls";
import { ZoomControls } from "./ZoomControls";

export function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(12);
  const [trueWindAngle, setTrueWindAngle] = useState(90); // TWS at 90° (horizontal on right side of boat at 12 kts)
  const [boatSpeed, setBoatSpeed] = useState(6);
  const [boatDirection, setBoatDirection] = useState(0); // 0° = North (up)

  // Coupled mode state
  const [coupledMode, setCoupledMode] = useState(() => {
    const saved = localStorage.getItem("coupledMode");
    return saved ? JSON.parse(saved) : false;
  });

  // Boat position state (offset from canvas center)
  const [boatOffsetX, setBoatOffsetX] = useState(0);
  const [boatOffsetY, setBoatOffsetY] = useState(0);

  // Gust simulation state
  const [gustSpeed, setGustSpeed] = useState(10);
  const [autoHeadUpGust, setAutoHeadUpGust] = useState(() => {
    const saved = localStorage.getItem("autoHeadUpGust");
    return saved ? JSON.parse(saved) : true;
  });

  // Lull simulation state
  const [lullSpeed, setLullSpeed] = useState(5);
  const [autoHeadUpLull, setAutoHeadUpLull] = useState(() => {
    const saved = localStorage.getItem("autoHeadUpLull");
    return saved ? JSON.parse(saved) : true;
  });

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
    coupledMode,
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

  // Persist auto head up settings
  useEffect(() => {
    localStorage.setItem("autoHeadUpGust", JSON.stringify(autoHeadUpGust));
  }, [autoHeadUpGust]);

  useEffect(() => {
    localStorage.setItem("autoHeadUpLull", JSON.stringify(autoHeadUpLull));
  }, [autoHeadUpLull]);

  useEffect(() => {
    localStorage.setItem("coupledMode", JSON.stringify(coupledMode));
  }, [coupledMode]);

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

  // Calculate apparent wind from the wind vector parallelogram:
  // Apparent wind vector connects from dashedInducedStart to the bow
  const trueWindVector = polarToCartesian(trueWindSpeed, trueWindAngle);
  const inducedWindVector = polarToCartesian(boatSpeed, boatDirection);

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

    // Calculate vector endpoints for the wind vector parallelogram:
    // Boat front: The bow of the boat extends in the direction of travel
    const boatFrontOffset = 40 * zoomLevel; // pixels from center to front of boat (scaled with zoom)
    const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
    const boatFrontX = boatX + boatFrontVector.x;
    const boatFrontY = boatY + boatFrontVector.y;

    // 1. Solid Induced wind (IWS): points toward the bow
    const inducedVector = polarToCartesian(boatSpeed * scale, boatDirection);
    const inducedStartX = boatFrontX + inducedVector.x;
    const inducedStartY = boatFrontY + inducedVector.y;
    const inducedEndX = boatFrontX;
    const inducedEndY = boatFrontY;

    // 2. Solid True wind (TWS): points toward the bow
    const trueWindVector = polarToCartesian(
      trueWindSpeed * scale,
      trueWindAngle
    );
    const trueWindHeadX = boatFrontX;
    const trueWindHeadY = boatFrontY;
    const trueWindTailX = boatFrontX + trueWindVector.x;
    const trueWindTailY = boatFrontY + trueWindVector.y;

    // 3. Additional Dashed Induced wind: points to the outer end (tail) of the TWS vector
    // Same color, same length, same direction as solid IWS
    const dashedInducedStartX = trueWindTailX + inducedVector.x;
    const dashedInducedStartY = trueWindTailY + inducedVector.y;
    const dashedInducedEndX = trueWindTailX;
    const dashedInducedEndY = trueWindTailY;

    // 4. Dashed Apparent wind (AWS): connects from the end of dashed IWS to the front of the bow
    const apparentStartX = dashedInducedStartX;
    const apparentStartY = dashedInducedStartY;
    const apparentEndX = boatFrontX;
    const apparentEndY = boatFrontY;

    // Calculate bow directions for IWS and TWS
    const iwsAngleAtBow =
      (Math.atan2(inducedStartY - boatFrontY, inducedStartX - boatFrontX) *
        180) /
      Math.PI;

    const twsAngleAtBow =
      (Math.atan2(trueWindTailY - boatFrontY, trueWindTailX - boatFrontX) *
        180) /
      Math.PI;

    let diff = twsAngleAtBow - iwsAngleAtBow;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const absDiff = Math.abs(diff);
    const pointOfSail = getPointOfSail(absDiff);
    const isInNoSailZone = absDiff < 45;

    // Draw vectors (from start to end, with arrowhead at end)
    drawBoat(ctx, boatX, boatY, boatDirection, zoomLevel, boatImageRef.current);

    // Draw go-no-go zone BEFORE other arrows so they appear on top (darker red when in no-sail area)
    drawGoNoGoZone(
      ctx,
      boatFrontX,
      boatFrontY,
      boatDirection,
      canvasSize,
      isInNoSailZone
    );

    // Assemble all 4 arrow segments and boat bounding box for collision avoidance
    const arrowSegments: ArrowSegment[] = [
      {
        name: "solid-iws",
        startX: inducedStartX,
        startY: inducedStartY,
        endX: inducedEndX,
        endY: inducedEndY,
      },
      {
        name: "solid-tws",
        startX: trueWindTailX,
        startY: trueWindTailY,
        endX: trueWindHeadX,
        endY: trueWindHeadY,
      },
      {
        name: "dashed-iws",
        startX: dashedInducedStartX,
        startY: dashedInducedStartY,
        endX: dashedInducedEndX,
        endY: dashedInducedEndY,
      },
      {
        name: "dashed-aws",
        startX: apparentStartX,
        startY: apparentStartY,
        endX: apparentEndX,
        endY: apparentEndY,
      },
    ];

    const boatBox = {
      minX: boatX - 25 * zoomLevel,
      maxX: boatX + 25 * zoomLevel,
      minY: boatY - 45 * zoomLevel,
      maxY: boatY + 45 * zoomLevel,
    };

    // Track label positions to prevent overlap
    const labelPositions: LabelPosition[] = [];

    // Draw solid IWS arrow
    const iwsLabel = drawArrow(
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
      "IWS",
      labelPositions,
      false,
      { x: trueWindTailX, y: trueWindTailY },
      arrowSegments,
      boatBox
    );
    if (iwsLabel) labelPositions.push(iwsLabel);

    // Draw solid TWS arrow
    const twsLabel = drawArrow(
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
      "TWS",
      labelPositions,
      false,
      { x: inducedStartX, y: inducedStartY },
      arrowSegments,
      boatBox
    );
    if (twsLabel) labelPositions.push(twsLabel);

    // Draw additional dashed IWS arrow pointing to the end of the TWS vector
    drawArrow(
      ctx,
      dashedInducedStartX,
      dashedInducedStartY,
      dashedInducedEndX,
      dashedInducedEndY,
      COLORS.inducedWind,
      false,
      false,
      false,
      false,
      undefined,
      undefined,
      labelPositions,
      true,
      undefined,
      arrowSegments,
      boatBox
    );

    // Draw dashed AWS arrow connecting end of dashed IWS to the front of the bow
    const awsLabel = drawArrow(
      ctx,
      apparentStartX,
      apparentStartY,
      apparentEndX,
      apparentEndY,
      COLORS.apparentWind,
      false,
      false,
      false,
      false,
      apparentWindSpeed,
      "AWS",
      labelPositions,
      true,
      { x: trueWindTailX, y: trueWindTailY },
      arrowSegments,
      boatBox,
      {
        positionRatio: 0.3,
        maxLabelDistance: 22,
        allowOverlap: true,
      }
    );
    if (awsLabel) labelPositions.push(awsLabel);

    // Calculate bow direction for AWS vector
    const awsAngleAtBow =
      (Math.atan2(apparentStartY - boatFrontY, apparentStartX - boatFrontX) *
        180) /
      Math.PI;

    let diffAWS = awsAngleAtBow - iwsAngleAtBow;
    while (diffAWS > 180) diffAWS -= 360;
    while (diffAWS < -180) diffAWS += 360;
    const absDiffAWS = Math.abs(diffAWS);

    // Draw the second angle arc (between IWS and AWS) without a standalone label
    drawAngleBetweenArrows(
      ctx,
      boatFrontX,
      boatFrontY,
      iwsAngleAtBow,
      awsAngleAtBow,
      labelPositions,
      undefined,
      arrowSegments,
      boatBox,
      {
        radius: CANVAS_CONFIG.angleBetweenAWSArrowsRadius,
        color: COLORS.apparentWind,
        showLabel: false,
      }
    );

    // Draw the primary angle arc (between IWS and TWS) with the combined label colored to match arrows
    const angleLabel = drawAngleBetweenArrows(
      ctx,
      boatFrontX,
      boatFrontY,
      iwsAngleAtBow,
      twsAngleAtBow,
      labelPositions,
      pointOfSail.label,
      arrowSegments,
      boatBox,
      {
        radius: CANVAS_CONFIG.angleBetweenArrowsRadius,
        color: COLORS.trueWind,
        labelSegments: [
          { text: `${formatAngle(absDiff)}° TWA`, color: COLORS.trueWind },
          { text: " | ", color: "rgba(255, 255, 255, 0.8)" },
          {
            text: `${formatAngle(absDiffAWS)}° AWA`,
            color: COLORS.apparentWind,
          },
        ],
      }
    );
    if (angleLabel) labelPositions.push(angleLabel);

    // Draw animation step in top right
    const currentAnimationStep = isSimulatingGust
      ? animationStepGust
      : animationStepLull;
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

  function handleTwsIncrease() {
    setTrueWindSpeed((prev) => Math.min(+(prev + 0.1).toFixed(1), 30));
  }

  function handleTwsDecrease() {
    setTrueWindSpeed((prev) => Math.max(+(prev - 0.1).toFixed(1), 0.1));
  }

  // Reset all values to initial state
  function handleReset() {
    setTrueWindSpeed(12);
    setTrueWindAngle(90);
    setBoatSpeed(6);
    setBoatDirection(0);
    setBoatOffsetX(0);
    setBoatOffsetY(0);
    setZoomLevel(1);
    setGustSpeed(10);
    setLullSpeed(5);
    setAutoHeadUpGust(true);
    setAutoHeadUpLull(true);
    setCoupledMode(true);
    setSimulationConfig({
      windBuildUpDuration: 2000,
      windDecayDuration: 6000,
      boatSpeedDelay: 500,
      boatSpeedBuildUpDuration: 4000,
      boatSpeedDecayDuration: 8000,
      autoRotationDelay: 0,
      autoRotationDuration: 0,
    });
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

  // Speed toggle button handler - always allow toggling
  function handleSpeedToggle() {
    // Always toggle both to keep them in sync
    toggleSpeedGust();
    toggleSpeedLull();
  }

  return (
    <div
      className="w-full h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden"
      data-testid="wind-simulator"
    >
      <div
        ref={containerRef}
        className="flex-1 glass-dark rounded-2xl shadow-2xl overflow-hidden relative min-h-[300px] md:min-h-[450px]"
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
          speedMultiplier={speedMultiplierGust}
          onSpeedToggle={handleSpeedToggle}
        />

        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />

        <TwsControls
          trueWindSpeed={trueWindSpeed}
          onIncrease={handleTwsIncrease}
          onDecrease={handleTwsDecrease}
        />

        {/* Speed control button - desktop only, positioned left of zoom controls */}
        <div
          className="hidden lg:flex absolute bottom-4 right-[8.5rem] flex-col gap-2"
          data-testid="speed-controls-desktop"
        >
          <button
            onClick={handleSpeedToggle}
            className={`w-12 h-12 glass-dark rounded-lg flex items-center justify-center text-white font-bold text-xs hover:bg-white/20 transition-all shadow-lg ${
              speedMultiplierGust === 0.5 || speedMultiplierLull === 0.5
                ? "bg-amber-600/40"
                : ""
            }`}
            data-testid="speed-toggle-button"
            title="Toggle animation speed (0.5x / 1x)"
          >
            {speedMultiplierGust === 0.5 || speedMultiplierLull === 0.5
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
          coupledMode={coupledMode}
          onCoupledModeChange={setCoupledMode}
          onReset={handleReset}
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
          coupledMode={coupledMode}
          onCoupledModeChange={setCoupledMode}
          onReset={handleReset}
        />
      </div>
    </div>
  );
}

type SimulationButtonsProps = {
  onSimulate: () => void;
  onOpenSettings: () => void;
  isSimulating: boolean;
  speedMultiplier: number;
  onSpeedToggle: () => void;
};

function SimulationButtons({
  onSimulate,
  onOpenSettings,
  isSimulating,
  speedMultiplier,
  onSpeedToggle,
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
      <button
        onClick={onSpeedToggle}
        className={`w-12 h-12 glass-dark rounded-lg flex items-center justify-center text-white font-bold text-xs hover:bg-white/20 transition-all shadow-lg ${
          speedMultiplier === 0.5 ? "bg-amber-600/40" : ""
        }`}
        data-testid="speed-toggle-button-mobile"
        title="Toggle animation speed (0.5x / 1x)"
      >
        {speedMultiplier === 0.5 ? "0.5x" : "1x"}
      </button>
    </div>
  );
}
