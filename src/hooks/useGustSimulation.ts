import { useEffect, useRef, useState } from "react";

type GustSimulationParams = {
  trueWindSpeed: number;
  trueWindAngle: number;
  boatSpeed: number;
  boatDirection: number;
  gustSpeed: number;
};

export function useGustSimulation({
  trueWindSpeed,
  boatSpeed,
  gustSpeed,
}: Omit<GustSimulationParams, "trueWindAngle" | "boatDirection">) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [baseWindSpeed, setBaseWindSpeed] = useState(trueWindSpeed);
  const [baseBoatSpeed, setBaseBoatSpeed] = useState(boatSpeed);
  const animationRef = useRef<number | null>(null);

  const [currentTrueWindSpeed, setCurrentTrueWindSpeed] =
    useState(trueWindSpeed);
  const [currentBoatSpeed, setCurrentBoatSpeed] = useState(boatSpeed);

  useEffect(() => {
    if (!isSimulating) {
      setCurrentTrueWindSpeed(trueWindSpeed);
      setCurrentBoatSpeed(boatSpeed);
    }
  }, [trueWindSpeed, boatSpeed, isSimulating]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const simulateGust = () => {
    if (isSimulating) return;

    setBaseWindSpeed(trueWindSpeed);
    setBaseBoatSpeed(boatSpeed);
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

    const easeOutExpo = (x: number): number =>
      x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    const easeInExpo = (x: number): number =>
      x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
    const easeInCubic = (x: number): number => x * x * x;

    function animate() {
      const elapsed = Date.now() - startTime;

      if (elapsed >= totalDuration) {
        setCurrentTrueWindSpeed(baseWindSpeed);
        setCurrentBoatSpeed(baseBoatSpeed);
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

      setCurrentTrueWindSpeed(baseWindSpeed + gustSpeed * windMultiplier);
      setCurrentBoatSpeed(
        baseBoatSpeed + inducedSpeedIncrease * boatSpeedMultiplier
      );

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  };

  return {
    isSimulating,
    currentTrueWindSpeed,
    currentBoatSpeed,
    simulateGust,
  };
}
