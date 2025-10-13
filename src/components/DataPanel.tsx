import { GustSimulationPanel } from "./GustSimulationPanel";

type Props = {
  gustSpeed: number;
  isSimulating: boolean;
  autoHeadUp: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulateGust: () => void;
  onAutoHeadUpChange: (enabled: boolean) => void;
};

export function DataPanel({
  gustSpeed,
  isSimulating,
  autoHeadUp,
  onGustSpeedChange,
  onSimulateGust,
  onAutoHeadUpChange,
}: Props) {
  return (
    <div className="lg:w-80 flex flex-col gap-4" data-testid="data-panel">
      <GustSimulationPanel
        gustSpeed={gustSpeed}
        isSimulating={isSimulating}
        autoHeadUp={autoHeadUp}
        onGustSpeedChange={onGustSpeedChange}
        onSimulate={onSimulateGust}
        onAutoHeadUpChange={onAutoHeadUpChange}
      />
    </div>
  );
}
