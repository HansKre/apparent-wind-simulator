import { GustSpeedSlider } from "./GustSpeedSlider";

type Props = {
  gustSpeed: number;
  isSimulating: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulate: () => void;
};

export function GustSimulationPanel({
  gustSpeed,
  isSimulating,
  onGustSpeedChange,
  onSimulate,
}: Props) {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-xl"
      data-testid="gust-simulation-panel"
    >
      <h3 className="text-amber-400 font-bold text-xl mb-4 flex items-center gap-2">
        <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
        Gust Simulation
      </h3>
      <div className="space-y-4">
        <GustSpeedSlider
          value={gustSpeed}
          onChange={onGustSpeedChange}
          disabled={isSimulating}
        />
        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          data-testid="simulate-gust-button"
        >
          {isSimulating ? "Simulating..." : "Simulate Gust"}
        </button>
      </div>
    </div>
  );
}
