import { useState } from "react";
import { SimulationConfig } from "../types/simulationConfig";
import { GustSimulationPanel } from "./GustSimulationPanel";
import { LullSimulationPanel } from "./LullSimulationPanel";
import { SimulationConfigDialog } from "./SimulationConfigDialog";

type Props = {
  gustSpeed: number;
  isSimulatingGust: boolean;
  autoHeadUpGust: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulateGust: () => void;
  onAutoHeadUpGustChange: (enabled: boolean) => void;
  lullSpeed: number;
  isSimulatingLull: boolean;
  autoHeadUpLull: boolean;
  onLullSpeedChange: (speed: number) => void;
  onSimulateLull: () => void;
  onAutoHeadUpLullChange: (enabled: boolean) => void;
  simulationConfig: SimulationConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
};

export function DataPanel({
  gustSpeed,
  isSimulatingGust,
  autoHeadUpGust,
  onGustSpeedChange,
  onSimulateGust,
  onAutoHeadUpGustChange,
  lullSpeed,
  isSimulatingLull,
  autoHeadUpLull,
  onLullSpeedChange,
  onSimulateLull,
  onAutoHeadUpLullChange,
  simulationConfig,
  onSimulationConfigChange,
}: Props) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  return (
    <>
      <div className="lg:w-80 flex flex-col gap-4" data-testid="data-panel">
        <GustSimulationPanel
          gustSpeed={gustSpeed}
          isSimulating={isSimulatingGust}
          autoHeadUp={autoHeadUpGust}
          onGustSpeedChange={onGustSpeedChange}
          onSimulate={onSimulateGust}
          onAutoHeadUpChange={onAutoHeadUpGustChange}
        />
        <LullSimulationPanel
          lullSpeed={lullSpeed}
          isSimulating={isSimulatingLull}
          autoHeadUp={autoHeadUpLull}
          onLullSpeedChange={onLullSpeedChange}
          onSimulate={onSimulateLull}
          onAutoHeadUpChange={onAutoHeadUpLullChange}
        />
        <button
          onClick={() => setIsConfigDialogOpen(true)}
          className="w-full py-3 px-4 glass rounded-lg text-white/80 hover:text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          data-testid="open-config-dialog-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Configure Simulation Timing
        </button>
      </div>

      <SimulationConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        simulationConfig={simulationConfig}
        onSimulationConfigChange={onSimulationConfigChange}
      />
    </>
  );
}
