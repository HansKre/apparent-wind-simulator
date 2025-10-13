import { useEffect, useRef, useState } from "react";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";

type UseLullSimulationProps = {
  lullSpeed: number;
  trueWindSpeed: number;
  trueWindAngle: number;
  boatSpeed: number;
  boatDirection: number;
  autoHeadUp: boolean;
  setTrueWindSpeed: (speed: number) => void;
  setTrueWindAngle: (angle: number) => void;
  setBoatSpeed: (speed: number) => void;
  setBoatDirection: (direction: number) => void;
};

export function useLullSimulation({
  lullSpeed,
  trueWindSpeed,
  trueWindAngle,
  boatSpeed,
  boatDirection,
  autoHeadUp,
  setTrueWindSpeed,
  setTrueWindAngle,
  setBoatSpeed,
  setBoatDirection,
}: UseLullSimulationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function simulateLull() {
    if (isSimulating) return;

    const capturedWindSpeed = trueWindSpeed;
    const capturedWindAngle = trueWindAngle;
    const capturedBoatSpeed = boatSpeed;
    const capturedBoatDirection = boatDirection;
    let previousBoatDirection = capturedBoatDirection;

    setIsSimulating(true);

    const startTime = Date.now();
    const phase1Duration = 2000;
    const phase2Duration = 4000;
    const phase3Duration = 2500;
    const phase4Duration = 4000;

    const phase2StartTime = phase1Duration * 0.25;
    const phase3StartTime = phase2StartTime + phase2Duration;
    const phase4StartTime = phase3StartTime + phase3Duration * 0.2;
    const totalDuration = phase4StartTime + phase4Duration;

    const inducedSpeedDecrease = lullSpeed * 0.4;

    function easeOutExpo(x: number): number {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    function easeInExpo(x: number): number {
      return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }

    function easeOutCubic(x: number): number {
      return 1 - Math.pow(1 - x, 3);
    }

    function easeInCubic(x: number): number {
      return x * x * x;
    }

    function animate() {
      const elapsed = Date.now() - startTime;

      if (elapsed >= totalDuration) {
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

      let windMultiplier = 0;
      if (elapsed < phase1Duration) {
        const phaseProgress = elapsed / phase1Duration;
        windMultiplier = easeOutExpo(phaseProgress);
      } else if (elapsed < phase3StartTime) {
        windMultiplier = 1;
      } else if (elapsed < phase3StartTime + phase3Duration) {
        const phaseProgress = (elapsed - phase3StartTime) / phase3Duration;
        windMultiplier = 1 - easeInExpo(phaseProgress);
      } else {
        windMultiplier = 0;
      }

      let boatSpeedMultiplier = 0;
      if (elapsed < phase2StartTime) {
        boatSpeedMultiplier = 0;
      } else if (elapsed < phase2StartTime + phase2Duration) {
        const phaseProgress = (elapsed - phase2StartTime) / phase2Duration;
        boatSpeedMultiplier = easeOutCubic(phaseProgress);
      } else if (elapsed < phase4StartTime) {
        boatSpeedMultiplier = 1;
      } else if (elapsed < phase4StartTime + phase4Duration) {
        const phaseProgress = (elapsed - phase4StartTime) / phase4Duration;
        boatSpeedMultiplier = 1 - easeInCubic(phaseProgress);
      } else {
        boatSpeedMultiplier = 0;
      }

      // Lulls REDUCE wind speed (opposite of gusts)
      const currentTrueWindSpeed = Math.max(
        0.1,
        capturedWindSpeed - lullSpeed * windMultiplier
      );
      const currentBoatSpeed = Math.max(
        0.1,
        capturedBoatSpeed - inducedSpeedDecrease * boatSpeedMultiplier
      );

      setTrueWindSpeed(currentTrueWindSpeed);
      setBoatSpeed(currentBoatSpeed);
      setTrueWindAngle(capturedWindAngle);

      // Calculate new boat direction if auto head-up is enabled
      if (autoHeadUp) {
        // To maintain 45° between apparent wind and induced wind (boat direction)
        // We need to adjust the boat direction so that:
        // angle(apparent wind) - angle(induced wind) = 45°
        // Since induced wind is opposite to boat direction:
        // induced wind angle = boat direction + 180°

        // Start from the previous boat direction for smoother transitions
        let currentBoatDir = previousBoatDirection;
        let bestBoatDir = currentBoatDir;
        let bestAngleDiff = 999;

        // Iterate to find the boat direction that gives us 45° angle (or higher)
        for (let i = 0; i < 20; i++) {
          const trueWindVector = polarToCartesian(
            currentTrueWindSpeed,
            capturedWindAngle
          );
          const inducedWindVector = polarToCartesian(
            currentBoatSpeed,
            normalizeAngle(currentBoatDir + 180)
          );

          const apparentWindX = trueWindVector.x + inducedWindVector.x;
          const apparentWindY = trueWindVector.y + inducedWindVector.y;
          const apparentPolar = cartesianToPolar(apparentWindX, apparentWindY);
          const apparentWindAngle = apparentPolar.angle;

          // Calculate current angle between apparent wind and induced wind
          const inducedWindAngle = normalizeAngle(currentBoatDir + 180);
          let angleDiff = apparentWindAngle - inducedWindAngle;

          // Normalize angle difference to -180 to 180 range
          if (angleDiff > 180) angleDiff -= 360;
          if (angleDiff < -180) angleDiff += 360;

          // Keep track of the best solution (closest to 45° but prefer staying at or above 45°)
          const distanceFrom45 = Math.abs(angleDiff - 45);
          if (distanceFrom45 < Math.abs(bestAngleDiff - 45)) {
            // Prefer solutions that are at or above 45°
            if (angleDiff >= 44 || distanceFrom45 < Math.abs(bestAngleDiff - 45) * 0.8) {
              bestBoatDir = currentBoatDir;
              bestAngleDiff = angleDiff;
            }
          }

          // Target is 45° - adjust boat direction to reach it
          // If angle is below 45°, turn away from wind (decrease boat direction)
          // If angle is above 45°, turn toward wind (increase boat direction)
          const error = angleDiff - 45;
          if (Math.abs(error) < 0.5) break; // Close enough

          currentBoatDir = normalizeAngle(currentBoatDir + error * 0.4);
        }

        // Use the best solution found
        previousBoatDirection = bestBoatDir;
        setBoatDirection(bestBoatDir);
      } else {
        setBoatDirection(capturedBoatDirection);
        previousBoatDirection = capturedBoatDirection;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  return {
    isSimulating,
    simulateLull,
  };
}
