import { GustSimulationPanel } from "./GustSimulationPanel";
import { LullSimulationPanel } from "./LullSimulationPanel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
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
};

function createSimulateHandler(onSimulate: () => void, onClose: () => void) {
  return () => {
    onClose();
    onSimulate();
  };
}

export function SimulationModal({
  isOpen,
  onClose,
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
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      data-testid="simulation-modal-overlay"
    >
      <div
        className="glass-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="simulation-modal-content"
      >
        <ModalHeader onClose={onClose} />
        <ModalBody
          gustSpeed={gustSpeed}
          isSimulatingGust={isSimulatingGust}
          autoHeadUpGust={autoHeadUpGust}
          onGustSpeedChange={onGustSpeedChange}
          onSimulateGust={createSimulateHandler(onSimulateGust, onClose)}
          onAutoHeadUpGustChange={onAutoHeadUpGustChange}
          lullSpeed={lullSpeed}
          isSimulatingLull={isSimulatingLull}
          autoHeadUpLull={autoHeadUpLull}
          onLullSpeedChange={onLullSpeedChange}
          onSimulateLull={createSimulateHandler(onSimulateLull, onClose)}
          onAutoHeadUpLullChange={onAutoHeadUpLullChange}
        />
      </div>
    </div>
  );
}

type ModalHeaderProps = {
  onClose: () => void;
};

function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <div
      className="flex items-center justify-between p-4 border-b border-white/10"
      data-testid="modal-header"
    >
      <h2 className="text-xl font-semibold text-white">Simulations</h2>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
        data-testid="modal-close-button"
        aria-label="Close modal"
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
  );
}

type ModalBodyProps = {
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
};

function ModalBody({
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
}: ModalBodyProps) {
  return (
    <div className="p-4 space-y-4" data-testid="modal-body">
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
    </div>
  );
}
