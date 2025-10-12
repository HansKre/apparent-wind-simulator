import { GustSimulationPanel } from "./GustSimulationPanel";

type Props = {
  gustSpeed: number;
  isSimulating: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulateGust: () => void;
};

export function DataPanel({
  gustSpeed,
  isSimulating,
  onGustSpeedChange,
  onSimulateGust,
}: Props) {
  return (
    <div className="lg:w-80 flex flex-col gap-4" data-testid="data-panel">
      <GustSimulationPanel
        gustSpeed={gustSpeed}
        isSimulating={isSimulating}
        onGustSpeedChange={onGustSpeedChange}
        onSimulate={onSimulateGust}
      />
    </div>
  );
}
