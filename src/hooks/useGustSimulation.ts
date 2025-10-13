import { useEffect, useRef, useState } from "react";

type UseGustSimulationProps = {
  gustSpeed: number;
  trueWindSpeed: number;
  trueWindAngle: number;
  boatSpeed: number;
  boatDirection: number;
  setTrueWindSpeed: (speed: number) => void;
  setTrueWindAngle: (angle: number) => void;
  setBoatSpeed: (speed: number) => void;
  setBoatDirection: (direction: number) => void;
};

export function useGustSimulation({
  gustSpeed,
  trueWindSpeed,
  trueWindAngle,
  boatSpeed,
  boatDirection,
  setTrueWindSpeed,
  setTrueWindAngle,
  setBoatSpeed,
  setBoatDirection,
}: UseGustSimulationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  function simulateGust() {
    if (isSimulating) return;

    const capturedWindSpeed = trueWindSpeed;
    const capturedWindAngle = trueWindAngle;
    const capturedBoatSpeed = boatSpeed;
    const capturedBoatDirection = boatDirection;

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

    const inducedSpeedIncrease = gustSpeed * 0.4;

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

      setTrueWindSpeed(capturedWindSpeed + gustSpeed * windMultiplier);
      setBoatSpeed(
        capturedBoatSpeed + inducedSpeedIncrease * boatSpeedMultiplier
      );
      setBoatDirection(capturedBoatDirection);
      setTrueWindAngle(capturedWindAngle);

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  return {
    isSimulating,
    simulateGust,
  };
}
