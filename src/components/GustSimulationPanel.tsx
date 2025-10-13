import { GustSpeedSlider } from "./GustSpeedSlider";

type Props = {
  gustSpeed: number;
  isSimulating: boolean;
  autoHeadUp: boolean;
  onGustSpeedChange: (speed: number) => void;
  onSimulate: () => void;
  onAutoHeadUpChange: (enabled: boolean) => void;
};

export function GustSimulationPanel({
  gustSpeed,
  isSimulating,
  autoHeadUp,
  onGustSpeedChange,
  onSimulate,
  onAutoHeadUpChange,
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
        <label
          className="flex items-center gap-3 cursor-pointer"
          data-testid="auto-head-up-label"
        >
          <input
            type="checkbox"
            checked={autoHeadUp}
            onChange={(e) => onAutoHeadUpChange(e.target.checked)}
            disabled={isSimulating}
            className="w-5 h-5 text-amber-500 bg-white/10 border-2 border-amber-500/30 rounded focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            data-testid="auto-head-up-checkbox"
          />
          <span className="text-white font-medium select-none">
            Auto head-up (45°)
          </span>
        </label>
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
