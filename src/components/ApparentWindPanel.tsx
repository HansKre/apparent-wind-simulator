import { formatAngle, formatSpeed } from "../utils/windCalculations";
import { WindDataItem } from "./WindDataItem";
import { WindPanelHeader } from "./WindPanelHeader";

type Props = {
  speed: number;
  angle: number;
};

export function ApparentWindPanel({ speed, angle }: Props) {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-xl flex-1 border-2 border-red-400/50"
      data-testid="apparent-wind-panel"
    >
      <WindPanelHeader color="red" title="Apparent Wind (AWS)" animate />
      <div className="space-y-3">
        <WindDataItem label="Speed" value={formatSpeed(speed)} unit="knots" />
        <WindDataItem label="Angle" value={`${formatAngle(angle)}°`} />
      </div>
    </div>
  );
}
