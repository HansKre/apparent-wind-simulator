import { SimulationConfig, DEFAULT_SIMULATION_CONFIG } from "../types/simulationConfig";
import { SimulationConfigPanel } from "./SimulationConfigPanel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  simulationConfig: SimulationConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
};

export function SimulationConfigDialog({
  isOpen,
  onClose,
  simulationConfig,
  onSimulationConfigChange,
}: Props) {
  if (!isOpen) return null;

  function handleReset() {
    onSimulationConfigChange(DEFAULT_SIMULATION_CONFIG);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      data-testid="config-dialog-overlay"
    >
      <div
        className="glass-dark rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="config-dialog-content"
      >
        <DialogHeader onClose={onClose} onReset={handleReset} />
        <DialogBody
          simulationConfig={simulationConfig}
          onSimulationConfigChange={onSimulationConfigChange}
        />
      </div>
    </div>
  );
}

type DialogHeaderProps = {
  onClose: () => void;
  onReset: () => void;
};

function DialogHeader({ onClose, onReset }: DialogHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-4 border-b border-white/10"
      data-testid="config-dialog-header"
    >
      <h2 className="text-xl font-semibold text-white">Simulation Timing</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          data-testid="reset-button"
        >
          Reset to Defaults
        </button>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          data-testid="config-dialog-close-button"
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

type DialogBodyProps = {
  simulationConfig: SimulationConfig;
  onSimulationConfigChange: (config: SimulationConfig) => void;
};

function DialogBody({
  simulationConfig,
  onSimulationConfigChange,
}: DialogBodyProps) {
  return (
    <div className="p-6" data-testid="config-dialog-body">
      <p className="text-white/70 text-sm mb-6">
        These timing settings apply to both gust and lull simulations.
      </p>
      <SimulationConfigPanel
        config={simulationConfig}
        onChange={onSimulationConfigChange}
        title="Simulation Timing"
        color="amber"
      />
    </div>
  );
}
