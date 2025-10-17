import { useEffect, useState } from "react";
import {
  SimulationConfig,
  DEFAULT_SIMULATION_CONFIG,
} from "../types/simulationConfig";

const SIMULATION_CONFIG_KEY = "apparent-wind-simulator:simulation-config";

export function useSimulationConfig() {
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>(() => {
    const saved = localStorage.getItem(SIMULATION_CONFIG_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SIMULATION_CONFIG;
      }
    }
    return DEFAULT_SIMULATION_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem(SIMULATION_CONFIG_KEY, JSON.stringify(simulationConfig));
  }, [simulationConfig]);

  return {
    simulationConfig,
    setSimulationConfig,
  };
}
