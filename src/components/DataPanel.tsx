import { ApparentWindPanel } from "./ApparentWindPanel";
import { GustSimulationPanel } from "./GustSimulationPanel";
import { InducedWindPanel } from "./InducedWindPanel";
import { TrueWindPanel } from "./TrueWindPanel";

type Props = {
  trueWindSpeed: number;
  trueWindAngle: number;
  boatSpeed: number;
  boatDirection: number;
  apparentWindSpeed: number;
  apparentWindAngle: number;
  gustSpeed: number;
  isSimulating: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulateGust: () => void;
};

export function DataPanel({
  trueWindSpeed,
  trueWindAngle,
  boatSpeed,
  boatDirection,
  apparentWindSpeed,
  apparentWindAngle,
  gustSpeed,
  isSimulating,
  onGustSpeedChange,
  onSimulateGust,
}: Props) {
  return (
    <div className="lg:w-80 flex flex-col gap-4" data-testid="data-panel">
      <TrueWindPanel speed={trueWindSpeed} angle={trueWindAngle} />
      <InducedWindPanel speed={boatSpeed} direction={boatDirection} />
      <ApparentWindPanel speed={apparentWindSpeed} angle={apparentWindAngle} />
      <GustSimulationPanel
        gustSpeed={gustSpeed}
        isSimulating={isSimulating}
        onGustSpeedChange={onGustSpeedChange}
        onSimulate={onSimulateGust}
      />
    </div>
  );
}
