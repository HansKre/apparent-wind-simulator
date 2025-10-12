import { formatAngle, formatSpeed } from "../utils/windCalculations";
import { WindDataItem } from "./WindDataItem";
import { WindPanelHeader } from "./WindPanelHeader";

type Props = {
  speed: number;
  angle: number;
};

export function TrueWindPanel({ speed, angle }: Props) {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-xl flex-1"
      data-testid="true-wind-panel"
    >
      <WindPanelHeader color="blue" title="True Wind (TWS)" />
      <div className="space-y-3">
        <WindDataItem label="Speed" value={formatSpeed(speed)} unit="knots" />
        <WindDataItem label="Angle" value={`${formatAngle(angle)}°`} />
      </div>
    </div>
  );
}
