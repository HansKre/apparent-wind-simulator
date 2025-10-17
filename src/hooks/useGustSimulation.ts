import { useEffect, useRef, useState } from "react";
import { SimulationConfig } from "../types/simulationConfig";
import {
  cartesianToPolar,
  normalizeAngle,
  polarToCartesian,
} from "../utils/windCalculations";

type UseGustSimulationProps = {
  gustSpeed: number;
  trueWindSpeed: number;
  trueWindAngle: number;
  boatSpeed: number;
  boatDirection: number;
  autoHeadUp: boolean;
  config: SimulationConfig;
  setTrueWindSpeed: (speed: number) => void;
  setTrueWindAngle: (angle: number) => void;
  setBoatSpeed: (speed: number) => void;
  setBoatDirection: (direction: number) => void;
};

type AnimationStep = {
  phase: string;
  elapsed: number;
  duration: number;
};

export function useGustSimulation({
  gustSpeed,
  trueWindSpeed,
  trueWindAngle,
  boatSpeed,
  boatDirection,
  autoHeadUp,
  config,
  setTrueWindSpeed,
  setTrueWindAngle,
  setBoatSpeed,
  setBoatDirection,
}: UseGustSimulationProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [animationStep, setAnimationStep] = useState<AnimationStep | null>(
    null
  );
  const animationRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);
  const speedMultiplierRef = useRef<number>(1);

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
    let previousBoatDirection = capturedBoatDirection;

    setIsSimulating(true);

    let lastFrameTime = Date.now();
    let accumulatedTime = 0;
    const phase1Duration = config.windBuildUpDuration;
    const phase2Duration = config.boatSpeedBuildUpDuration;
    const phase3Duration = config.windDecayDuration;
    const phase4Duration = config.boatSpeedDecayDuration;

    const phase2StartTime = config.boatSpeedDelay;
    const phase3StartTime = phase2StartTime + phase2Duration;
    const phase4StartTime = phase3StartTime + phase3Duration * 0.2;
    const totalDuration = phase4StartTime + phase4Duration;

    const inducedSpeedIncrease = gustSpeed * 0.4;
    const headingChangeDelay = config.autoRotationDelay;

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
      const currentTime = Date.now();

      // Handle pause
      if (isPausedRef.current) {
        if (pauseStartRef.current === null) {
          pauseStartRef.current = currentTime;
        }
        lastFrameTime = currentTime; // Update last frame time to prevent time jump on resume
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Accumulate paused time when resuming
      if (pauseStartRef.current !== null) {
        pausedTimeRef.current += currentTime - pauseStartRef.current;
        pauseStartRef.current = null;
      }

      // Calculate delta time and apply speed multiplier
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      accumulatedTime += deltaTime * speedMultiplierRef.current;

      const elapsed = accumulatedTime;

      if (elapsed >= totalDuration) {
        setTrueWindSpeed(capturedWindSpeed);
        setTrueWindAngle(capturedWindAngle);
        setBoatSpeed(capturedBoatSpeed);
        setBoatDirection(capturedBoatDirection);
        setIsSimulating(false);
        setAnimationStep(null);
        pausedTimeRef.current = 0;
        pauseStartRef.current = null;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }

      // Update animation step
      let currentPhase = "";
      let phaseElapsed = 0;
      let phaseDuration = 0;

      if (elapsed < phase1Duration) {
        currentPhase = "Wind Build-Up";
        phaseElapsed = elapsed;
        phaseDuration = phase1Duration;
      } else if (elapsed < phase2StartTime) {
        currentPhase = "Wind Peak (Delay)";
        phaseElapsed = elapsed - phase1Duration;
        phaseDuration = phase2StartTime - phase1Duration;
      } else if (elapsed < phase2StartTime + phase2Duration) {
        currentPhase = "Boat Speed Build-Up";
        phaseElapsed = elapsed - phase2StartTime;
        phaseDuration = phase2Duration;
      } else if (elapsed < phase3StartTime) {
        currentPhase = "Peak Speed";
        phaseElapsed = elapsed - (phase2StartTime + phase2Duration);
        phaseDuration = phase3StartTime - (phase2StartTime + phase2Duration);
      } else if (elapsed < phase3StartTime + phase3Duration) {
        currentPhase = "Wind Decay";
        phaseElapsed = elapsed - phase3StartTime;
        phaseDuration = phase3Duration;
      } else if (elapsed < phase4StartTime) {
        currentPhase = "Wind Decay (Complete)";
        phaseElapsed = elapsed - (phase3StartTime + phase3Duration);
        phaseDuration = phase4StartTime - (phase3StartTime + phase3Duration);
      } else if (elapsed < phase4StartTime + phase4Duration) {
        currentPhase = "Boat Speed Decay";
        phaseElapsed = elapsed - phase4StartTime;
        phaseDuration = phase4Duration;
      } else {
        currentPhase = "Completing";
        phaseElapsed = elapsed - (phase4StartTime + phase4Duration);
        phaseDuration = totalDuration - (phase4StartTime + phase4Duration);
      }

      setAnimationStep({
        phase: currentPhase,
        elapsed: Math.round(phaseElapsed),
        duration: Math.round(phaseDuration),
      });

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

      const currentTrueWindSpeed =
        capturedWindSpeed + gustSpeed * windMultiplier;
      const currentBoatSpeed =
        capturedBoatSpeed + inducedSpeedIncrease * boatSpeedMultiplier;

      setTrueWindSpeed(currentTrueWindSpeed);
      setBoatSpeed(currentBoatSpeed);
      setTrueWindAngle(capturedWindAngle);

      // Calculate new boat direction if auto head-up is enabled
      if (autoHeadUp) {
        // Calculate the target boat direction (45° angle from apparent wind)
        let targetBoatDir = capturedBoatDirection;

        if (elapsed >= headingChangeDelay) {
          // Find the target boat direction that gives us 45° angle
          let currentBoatDir = previousBoatDirection;

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

            // Target is 45° - adjust boat direction to reach it
            const error = angleDiff - 45;
            if (Math.abs(error) < 0.5) break; // Close enough

            currentBoatDir = normalizeAngle(currentBoatDir + error * 0.4);
          }

          targetBoatDir = currentBoatDir;
        }

        // Smoothly interpolate from previous to target direction
        let rotationProgress = 0;
        if (elapsed >= headingChangeDelay) {
          // Calculate how far into the animation we are after the delay
          const timeSinceDelay = elapsed - headingChangeDelay;
          const rotationDuration =
            config.autoRotationDuration > 0
              ? config.autoRotationDuration
              : totalDuration - headingChangeDelay;
          rotationProgress = Math.min(1, timeSinceDelay / rotationDuration);
        }

        // Interpolate between captured and target direction
        let angleDelta = targetBoatDir - capturedBoatDirection;
        // Normalize to shortest path (-180 to 180)
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;

        const currentDirection = normalizeAngle(
          capturedBoatDirection + angleDelta * rotationProgress
        );

        previousBoatDirection = currentDirection;
        setBoatDirection(currentDirection);
      } else {
        setBoatDirection(capturedBoatDirection);
        previousBoatDirection = capturedBoatDirection;
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();
  }

  function togglePause() {
    setIsPaused((prev) => {
      const newValue = !prev;
      isPausedRef.current = newValue;
      return newValue;
    });
  }

  function toggleSpeed() {
    setSpeedMultiplier((prev) => {
      const newValue = prev === 1 ? 0.5 : 1;
      speedMultiplierRef.current = newValue;
      return newValue;
    });
  }

  return {
    isSimulating,
    isPaused,
    speedMultiplier,
    animationStep,
    simulateGust,
    togglePause,
    toggleSpeed,
  };
}
