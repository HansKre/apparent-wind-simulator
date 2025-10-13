import { GustSimulationPanel } from "./GustSimulationPanel";
import { LullSimulationPanel } from "./LullSimulationPanel";

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
}: Props) {
  return (
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
    </div>
  );
}
