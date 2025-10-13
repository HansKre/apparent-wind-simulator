import { useState } from "react";
import {
  cartesianToPolar,
  distance,
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

type UseDragInteractionProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  centerX: number;
  centerY: number;
  scale: number;
  zoomLevel: number;
  boatDirection: number;
  boatSpeed: number;
  trueWindSpeed: number;
  trueWindAngle: number;
  setTrueWindSpeed: (speed: number) => void;
  setTrueWindAngle: (angle: number) => void;
  setBoatSpeed: (speed: number) => void;
  setBoatDirection: (direction: number) => void;
};

export function useDragInteraction({
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
}: UseDragInteractionProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
  });

  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  function calculateVectorPositions() {
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

    return {
      boatFrontX,
      boatFrontY,
      inducedStartX,
      inducedStartY,
      trueWindTailX,
      trueWindTailY,
    };
  }

  function handlePointerDown(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const positions = calculateVectorPositions();

    // Check if clicking on true wind arrow tail (drag handle)
    if (
      distance(pointerX, pointerY, positions.trueWindTailX, positions.trueWindTailY) < 20
    ) {
      setDragState({
        isDragging: true,
        dragType: "trueWind",
        startX: pointerX,
        startY: pointerY,
      });
      return;
    }

    // Check if clicking on induced wind arrow start (drag handle - the end away from boat)
    if (
      distance(pointerX, pointerY, positions.inducedStartX, positions.inducedStartY) < 20
    ) {
      setDragState({
        isDragging: true,
        dragType: "inducedWind",
        startX: pointerX,
        startY: pointerY,
        startBoatDirection: boatDirection,
        startBoatSpeed: boatSpeed,
      });
      return;
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    handlePointerDown(e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    // Prevent default to avoid scrolling while dragging
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  }

  function handlePointerMove(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    // Check if hovering over any drag handle (only when not dragging)
    if (!dragState.isDragging) {
      const positions = calculateVectorPositions();

      // Check if hovering over any drag handle
      const hoveringTrueWind =
        distance(pointerX, pointerY, positions.trueWindTailX, positions.trueWindTailY) < 20;
      const hoveringInducedWind =
        distance(pointerX, pointerY, positions.inducedStartX, positions.inducedStartY) < 20;

      setIsHoveringHandle(hoveringTrueWind || hoveringInducedWind);
      return;
    }

    // Only update if pointer has moved at least 2 pixels from start
    const distFromStart = distance(
      pointerX,
      pointerY,
      dragState.startX,
      dragState.startY
    );
    if (distFromStart < 2) return;

    if (dragState.dragType === "trueWind") {
      // When dragging true wind tail, calculate the vector
      const positions = calculateVectorPositions();

      // True wind vector is from pointer (tail) to induced wind start
      const trueWindX = positions.inducedStartX - pointerX;
      const trueWindY = positions.inducedStartY - pointerY;
      const { speed: newTrueSpeed, angle: newTrueAngle } = cartesianToPolar(
        trueWindX,
        trueWindY
      );
      const clampedSpeed = Math.max(0.1, Math.min(30, newTrueSpeed / scale));

      setTrueWindSpeed(clampedSpeed);
      setTrueWindAngle(newTrueAngle);
    } else if (dragState.dragType === "inducedWind") {
      // When dragging induced wind start (the draggable end away from boat)
      const boatFrontOffset = 40 * zoomLevel;
      const boatFrontVector = polarToCartesian(boatFrontOffset, boatDirection);
      const boatFrontX = centerX + boatFrontVector.x;
      const boatFrontY = centerY + boatFrontVector.y;

      // Vector from pointer (start/drag point) to boat front (end/arrowhead)
      const dx = boatFrontX - pointerX;
      const dy = boatFrontY - pointerY;
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

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    handlePointerMove(e.clientX, e.clientY);
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    // Prevent default to avoid scrolling while dragging
    e.preventDefault();
    if (e.touches.length === 1 && dragState.isDragging) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }

  function handlePointerUp() {
    setDragState({
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
    });
  }

  function handleMouseUp() {
    handlePointerUp();
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    handlePointerUp();
  }

  function handleMouseLeave() {
    handlePointerUp();
    setIsHoveringHandle(false);
  }

  return {
    dragState,
    isHoveringHandle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
