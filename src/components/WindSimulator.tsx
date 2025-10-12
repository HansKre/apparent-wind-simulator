import { useEffect, useRef, useState } from 'react';
import {
  calculateApparentWind,
  polarToCartesian,
  cartesianToPolar,
  distance,
  formatSpeed,
  formatAngle,
  normalizeAngle,
} from '../utils/windCalculations';

interface DragState {
  isDragging: boolean;
  dragType: 'trueWind' | 'inducedWind' | null;
  startX: number;
  startY: number;
  startBoatDirection?: number;
  startBoatSpeed?: number;
}

export default function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(10);
  const [trueWindAngle, setTrueWindAngle] = useState(270); // 270° = West (horizontal left)
  const [boatSpeed, setBoatSpeed] = useState(10);
  const [boatDirection, setBoatDirection] = useState(0); // 0° = North (up)

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

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [boatImageLoaded, setBoatImageLoaded] = useState(false);

  // Load boat SVG
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      boatImageRef.current = img;
      setBoatImageLoaded(true);
    };
    img.onerror = (err) => {
      console.error('Failed to load boat SVG:', err);
    };
    img.src = '/boat.svg';
  }, []);

  // Calculate apparent wind
  const apparent = calculateApparentWind(trueWindSpeed, trueWindAngle - boatDirection, boatSpeed);
  const apparentWindSpeed = apparent.speed;
  const apparentWindAngle = normalizeAngle(apparent.angle + boatDirection);

  // Scale factor for visualization (pixels per knot)
  const scale = 15;

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
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Calculate vector endpoints for the triangle
    // Boat front: The bow of the boat extends in the direction of travel
    const boatFrontOffset = 40; // pixels from center to front of boat
    const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
    const boatFrontX = centerX + boatFrontVector.x;
    const boatFrontY = centerY + boatFrontVector.y;

    // Induced wind: arrow comes from opposite direction to boat, ending at boat front
    // Arrow points TOWARD boat front, with arrowhead AT boat front
    // Vector points in the same direction as boat (to position start point on opposite side)
    const inducedVectorDirection = polarToCartesian(boatSpeed * scale, normalizeAngle(boatDirection + 180));
    const inducedStartX = boatFrontX - inducedVectorDirection.x; // Start in opposite direction from boat
    const inducedStartY = boatFrontY - inducedVectorDirection.y;
    const inducedEndX = boatFrontX; // Arrow ends at boat front with arrowhead pointing at boat
    const inducedEndY = boatFrontY;

    // True wind: arrowhead connects to START of induced wind (the end away from boat)
    const trueWindVector = polarToCartesian(trueWindSpeed * scale, trueWindAngle);
    const trueWindHeadX = inducedStartX;
    const trueWindHeadY = inducedStartY;
    const trueWindTailX = inducedStartX - trueWindVector.x;
    const trueWindTailY = inducedStartY - trueWindVector.y;

    // Apparent wind: arrowhead at boat front, tail connects to tail of true wind
    const apparentHeadX = boatFrontX;
    const apparentHeadY = boatFrontY;
    const apparentTailX = trueWindTailX;
    const apparentTailY = trueWindTailY;

    // Draw vectors (from start to end, with arrowhead at end)
    drawBoat(ctx, centerX, centerY, boatDirection);
    drawInducedWind(ctx, inducedStartX, inducedStartY, inducedEndX, inducedEndY);
    drawTrueWind(ctx, trueWindTailX, trueWindTailY, trueWindHeadX, trueWindHeadY);
    drawApparentWind(ctx, apparentTailX, apparentTailY, apparentHeadX, apparentHeadY);

    // Draw angle arc if dragging
    if (dragState.isDragging) {
      if (dragState.dragType === 'trueWind') {
        drawAngleArc(ctx, trueWindTailX, trueWindTailY, trueWindAngle, '#3b82f6');
      } else if (dragState.dragType === 'inducedWind') {
        drawAngleArc(ctx, centerX, centerY, boatDirection, '#10b981');
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
  ]);

  // Draw boat
  function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    if (boatImageRef.current) {
      // The SVG has two boats side by side
      // Left boat occupies roughly the first 1/3 of the image width
      // SVG viewBox is "0 0 460.62992 744.09444"
      // Left boat is approximately at x: 0-190, y: 0-744
      const svgWidth = 460.62992;
      const svgHeight = 744.09444;
      const leftBoatWidth = 190; // Crop to just the left boat

      // Calculate proper aspect ratio
      const sourceAspectRatio = leftBoatWidth / svgHeight; // ~0.255

      // Scale to fit our desired size while preserving aspect ratio
      const targetHeight = 80; // Desired height
      const targetWidth = targetHeight * sourceAspectRatio; // Width based on aspect ratio

      // Draw only the left portion of the SVG
      ctx.drawImage(
        boatImageRef.current,
        0, 0, leftBoatWidth, svgHeight, // Source rectangle (left boat only)
        -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight // Destination
      );
    } else {
      // Fallback: Draw a simple sailboat shape if image not loaded
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(-8, 20);
      ctx.lineTo(8, 20);
      ctx.closePath();
      ctx.fill();

      // Draw mast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -30);
      ctx.stroke();
    }

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
    label: string,
    speed: number,
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
    const arrowWidth = 8;
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
      ctx.fillStyle = isDragging ? '#ffffff' : color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handleX, handleY, isDragging ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Draw label
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const labelOffset = 30;
    const perpAngle = angle + Math.PI / 2;
    const labelX = midX + labelOffset * Math.cos(perpAngle);
    const labelY = midY + labelOffset * Math.sin(perpAngle);

    ctx.fillText(label, labelX, labelY);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`${formatSpeed(speed)} knot`, labelX, labelY + 20);

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
      '#3b82f6',
      'True Wind',
      trueWindSpeed,
      dragState.isDragging && dragState.dragType === 'trueWind',
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
      '#10b981',
      'Induced Wind',
      boatSpeed,
      dragState.isDragging && dragState.dragType === 'inducedWind',
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
      '#ef4444',
      'Apparent Wind',
      apparentWindSpeed,
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
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${formatAngle(angle)}°`, x, y - radius - 10);

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
    const boatFrontOffset = 40;
    const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
    const boatFrontX = centerX + boatFrontVector.x;
    const boatFrontY = centerY + boatFrontVector.y;

    const inducedVectorDirection = polarToCartesian(boatSpeed * scale, normalizeAngle(boatDirection + 180));
    const inducedStartX = boatFrontX - inducedVectorDirection.x; // The draggable end (away from boat, opposite direction)
    const inducedStartY = boatFrontY - inducedVectorDirection.y;

    const trueWindVector = polarToCartesian(trueWindSpeed * scale, trueWindAngle);
    const trueWindTailX = inducedStartX - trueWindVector.x;
    const trueWindTailY = inducedStartY - trueWindVector.y;

    // Check if clicking on true wind arrow tail (drag handle)
    if (distance(mouseX, mouseY, trueWindTailX, trueWindTailY) < 20) {
      setDragState({
        isDragging: true,
        dragType: 'trueWind',
        startX: mouseX,
        startY: mouseY,
      });
      return;
    }

    // Check if clicking on induced wind arrow start (drag handle - the end away from boat)
    if (distance(mouseX, mouseY, inducedStartX, inducedStartY) < 20) {
      setDragState({
        isDragging: true,
        dragType: 'inducedWind',
        startX: mouseX,
        startY: mouseY,
        startBoatDirection: boatDirection,
        startBoatSpeed: boatSpeed,
      });
      return;
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragState.isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Only update if mouse has moved at least 2 pixels from start
    const distFromStart = distance(mouseX, mouseY, dragState.startX, dragState.startY);
    if (distFromStart < 2) return;

    if (dragState.dragType === 'trueWind') {
      // When dragging true wind tail, calculate the vector
      // True wind head connects to induced wind START (the end away from boat)
      const boatFrontOffset = 40;
      const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
      const boatFrontX = centerX + boatFrontVector.x;
      const boatFrontY = centerY + boatFrontVector.y;

      const inducedVectorDirection = polarToCartesian(boatSpeed * scale, normalizeAngle(boatDirection + 180));
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
    } else if (dragState.dragType === 'inducedWind') {
      // When dragging induced wind start (the draggable end away from boat)
      // Calculate boat front position (where the arrowhead is)
      const boatFrontOffset = 40;
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

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 glass-dark rounded-2xl shadow-2xl overflow-hidden relative"
        style={{ minHeight: '500px' }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair"
        />

        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 glass rounded-lg p-4 max-w-xs">
          <h3 className="text-white font-bold mb-2">Instructions</h3>
          <p className="text-white text-sm">
            Drag the <span className="text-blue-400 font-semibold">blue</span> or{' '}
            <span className="text-green-400 font-semibold">green</span> arrow endpoints to adjust
            wind speed and direction. The <span className="text-red-400 font-semibold">red</span>{' '}
            arrow shows the calculated apparent wind.
          </p>
        </div>
      </div>

      {/* Data Panel */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* True Wind */}
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h3 className="text-blue-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            True Wind
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Speed:</span>
              <span className="text-white font-bold text-2xl">
                {formatSpeed(trueWindSpeed)} <span className="text-lg">knots</span>
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
        <div className="glass rounded-2xl p-6 shadow-xl">
          <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            Boat Speed
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
        <div className="glass rounded-2xl p-6 shadow-xl border-2 border-red-400/50">
          <h3 className="text-red-400 font-bold text-xl mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            Apparent Wind
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Speed:</span>
              <span className="text-white font-bold text-2xl">
                {formatSpeed(apparentWindSpeed)} <span className="text-lg">knots</span>
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
      </div>
    </div>
  );
}
