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
}

export default function WindSimulator() {
  // Wind state
  const [trueWindSpeed, setTrueWindSpeed] = useState(10);
  const [trueWindAngle, setTrueWindAngle] = useState(90); // 90° = East (horizontal right)
  const [boatSpeed, setBoatSpeed] = useState(10);
  const [boatDirection, setBoatDirection] = useState(180); // 180° = South (down)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
  });

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

    // Draw vectors
    drawBoat(ctx, centerX, centerY, boatDirection);
    drawTrueWind(ctx, centerX, centerY, trueWindSpeed, trueWindAngle);
    drawInducedWind(ctx, centerX, centerY, boatSpeed, boatDirection);
    drawApparentWind(ctx, centerX, centerY, apparentWindSpeed, apparentWindAngle);

    // Draw angle arc if dragging
    if (dragState.isDragging) {
      if (dragState.dragType === 'trueWind') {
        drawAngleArc(ctx, centerX, centerY, trueWindAngle, '#3b82f6');
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
  ]);

  // Draw boat
  function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    // Draw a simple sailboat shape
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

    ctx.restore();
  }

  // Draw arrow with label
  function drawArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speed: number,
    angle: number,
    color: string,
    label: string,
    isDragging: boolean = false
  ) {
    const vector = polarToCartesian(speed * scale, angle);
    const endX = x + vector.x;
    const endY = y + vector.y;

    ctx.save();

    // Draw line with glow if dragging
    if (isDragging) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = isDragging ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const arrowLength = 15;
    const arrowWidth = 8;
    const angleRad = (angle * Math.PI) / 180;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.sin(angleRad) - arrowWidth * Math.cos(angleRad),
      endY + arrowLength * Math.cos(angleRad) - arrowWidth * Math.sin(angleRad)
    );
    ctx.lineTo(
      endX - arrowLength * Math.sin(angleRad) + arrowWidth * Math.cos(angleRad),
      endY + arrowLength * Math.cos(angleRad) + arrowWidth * Math.sin(angleRad)
    );
    ctx.closePath();
    ctx.fill();

    // Draw drag handle (circle at end)
    if (label !== 'Apparent Wind') {
      ctx.fillStyle = isDragging ? '#ffffff' : color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endX, endY, isDragging ? 12 : 8, 0, Math.PI * 2);
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

    const labelOffset = 30;
    const labelX = endX + labelOffset * Math.sin(angleRad);
    const labelY = endY - labelOffset * Math.cos(angleRad);

    ctx.fillText(label, labelX, labelY);
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`${formatSpeed(speed)} knot`, labelX, labelY + 20);

    ctx.restore();
  }

  function drawTrueWind(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speed: number,
    angle: number
  ) {
    drawArrow(
      ctx,
      x,
      y,
      speed,
      angle,
      '#3b82f6',
      'True Wind',
      dragState.isDragging && dragState.dragType === 'trueWind'
    );
  }

  function drawInducedWind(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speed: number,
    boatDir: number
  ) {
    // Induced wind is opposite to boat direction
    const inducedAngle = normalizeAngle(boatDir + 180);
    drawArrow(
      ctx,
      x,
      y,
      speed,
      inducedAngle,
      '#10b981',
      'Induced Wind',
      dragState.isDragging && dragState.dragType === 'inducedWind'
    );
  }

  function drawApparentWind(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speed: number,
    angle: number
  ) {
    drawArrow(ctx, x, y, speed, angle, '#ef4444', 'Apparent Wind', false);
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

    // Check if clicking on true wind arrow end
    const trueWindVector = polarToCartesian(trueWindSpeed * scale, trueWindAngle);
    const trueWindEndX = centerX + trueWindVector.x;
    const trueWindEndY = centerY + trueWindVector.y;

    if (distance(mouseX, mouseY, trueWindEndX, trueWindEndY) < 20) {
      setDragState({
        isDragging: true,
        dragType: 'trueWind',
        startX: mouseX,
        startY: mouseY,
      });
      return;
    }

    // Check if clicking on induced wind arrow end
    const inducedAngle = normalizeAngle(boatDirection + 180);
    const inducedVector = polarToCartesian(boatSpeed * scale, inducedAngle);
    const inducedEndX = centerX + inducedVector.x;
    const inducedEndY = centerY + inducedVector.y;

    if (distance(mouseX, mouseY, inducedEndX, inducedEndY) < 20) {
      setDragState({
        isDragging: true,
        dragType: 'inducedWind',
        startX: mouseX,
        startY: mouseY,
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

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    const { speed, angle } = cartesianToPolar(dx, dy);
    const newSpeed = Math.max(0.1, Math.min(30, speed / scale));

    if (dragState.dragType === 'trueWind') {
      setTrueWindSpeed(newSpeed);
      setTrueWindAngle(angle);
    } else if (dragState.dragType === 'inducedWind') {
      setBoatSpeed(newSpeed);
      // Boat direction is opposite to induced wind
      setBoatDirection(normalizeAngle(angle + 180));
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
