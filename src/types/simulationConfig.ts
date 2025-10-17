export type SimulationConfig = {
  // Wind speed change timing
  windBuildUpDuration: number; // Time for wind to reach peak change (ms)
  windDecayDuration: number; // Time for wind to return to normal (ms)

  // Boat speed change timing
  boatSpeedDelay: number; // Delay before boat speed starts changing (ms)
  boatSpeedBuildUpDuration: number; // Time for boat speed to reach peak change (ms)
  boatSpeedDecayDuration: number; // Time for boat speed to return to normal (ms)

  // Auto-rotation timing
  autoRotationDelay: number; // Delay before rotation starts (ms)
  autoRotationDuration: number; // Duration of rotation (ms, 0 = until end)
};

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  windBuildUpDuration: 2000,
  windDecayDuration: 6000,
  boatSpeedDelay: 500,
  boatSpeedBuildUpDuration: 4000,
  boatSpeedDecayDuration: 8000,
  autoRotationDelay: 800,
  autoRotationDuration: 0, // 0 means until end of simulation
};
