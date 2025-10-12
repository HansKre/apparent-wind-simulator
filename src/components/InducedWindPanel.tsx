import { formatAngle, formatSpeed } from "../utils/windCalculations";
import { WindDataItem } from "./WindDataItem";
import { WindPanelHeader } from "./WindPanelHeader";

type Props = {
  speed: number;
  direction: number;
};

export function InducedWindPanel({ speed, direction }: Props) {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-xl flex-1"
      data-testid="induced-wind-panel"
    >
      <WindPanelHeader color="green" title="Induced Wind (IWS)" />
      <div className="space-y-3">
        <WindDataItem label="Speed" value={formatSpeed(speed)} unit="knots" />
        <WindDataItem label="Direction" value={`${formatAngle(direction)}°`} />
      </div>
    </div>
  );
}
