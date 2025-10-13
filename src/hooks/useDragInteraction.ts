import { useState } from "react";
import {
  cartesianToPolar,
  distance,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";

type DragState = {
  isDragging: boolean;
  dragType: "trueWind" | "inducedWind" | "boat" | null;
  startX: number;
  startY: number;
  startBoatDirection?: number;
  startBoatSpeed?: number;
  startBoatOffsetX?: number;
  startBoatOffsetY?: number;
};

type UseDragInteractionProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  centerX: number;
  centerY: number;
  boatX: number;
  boatY: number;
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
  setBoatOffsetX: (offset: number) => void;
  setBoatOffsetY: (offset: number) => void;
};

export function useDragInteraction({
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
    const boatFrontX = boatX + boatFrontVector.x;
    const boatFrontY = boatY + boatFrontVector.y;

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

  function handlePointerDown(clientX: number, clientY: number): boolean {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const rect = canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;

    const positions = calculateVectorPositions();

    // Check if clicking on true wind arrow tail (drag handle) - highest priority
    if (
      distance(pointerX, pointerY, positions.trueWindTailX, positions.trueWindTailY) < 20
    ) {
      setDragState({
        isDragging: true,
        dragType: "trueWind",
        startX: pointerX,
        startY: pointerY,
      });
      return true;
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
      return true;
    }

    // If not clicking on any handle, treat it as dragging the boat
    // This allows clicking anywhere on the canvas to drag the boat
    setDragState({
      isDragging: true,
      dragType: "boat",
      startX: pointerX,
      startY: pointerY,
      startBoatOffsetX: boatX - centerX,
      startBoatOffsetY: boatY - centerY,
    });
    return true;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    handlePointerDown(e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const hitHandle = handlePointerDown(touch.clientX, touch.clientY);
      // Only prevent default if we hit a drag handle
      if (hitHandle) {
        e.preventDefault();
      }
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

      // Always show grab cursor since we can drag from anywhere
      // (handles take priority and will show grab cursor too)
      setIsHoveringHandle(hoveringTrueWind || hoveringInducedWind || true);
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
      const boatFrontX = boatX + boatFrontVector.x;
      const boatFrontY = boatY + boatFrontVector.y;

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
    } else if (dragState.dragType === "boat") {
      // When dragging the boat, move it by the delta from the start position
      const deltaX = pointerX - dragState.startX;
      const deltaY = pointerY - dragState.startY;

      const newOffsetX = (dragState.startBoatOffsetX ?? 0) + deltaX;
      const newOffsetY = (dragState.startBoatOffsetY ?? 0) + deltaY;

      setBoatOffsetX(newOffsetX);
      setBoatOffsetY(newOffsetY);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    handlePointerMove(e.clientX, e.clientY);
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 1 && dragState.isDragging) {
      // Only prevent default if we're actually dragging
      e.preventDefault();
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
    // Only prevent default if we were dragging
    if (dragState.isDragging) {
      e.preventDefault();
    }
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
