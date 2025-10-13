import { LullSpeedSlider } from "./LullSpeedSlider";

type Props = {
  lullSpeed: number;
  isSimulating: boolean;
  autoHeadUp: boolean;
  onLullSpeedChange: (speed: number) => void;
  onSimulate: () => void;
  onAutoHeadUpChange: (enabled: boolean) => void;
};

export function LullSimulationPanel({
  lullSpeed,
  isSimulating,
  autoHeadUp,
  onLullSpeedChange,
  onSimulate,
  onAutoHeadUpChange,
}: Props) {
  return (
    <div
      className="glass rounded-2xl p-6 shadow-xl"
      data-testid="lull-simulation-panel"
    >
      <h3 className="text-cyan-400 font-bold text-xl mb-4 flex items-center gap-2">
        <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
        Lull Simulation
      </h3>
      <div className="space-y-4">
        <LullSpeedSlider
          value={lullSpeed}
          onChange={onLullSpeedChange}
          disabled={isSimulating}
        />
        <label
          className="flex items-center gap-3 cursor-pointer"
          data-testid="auto-head-up-label-lull"
        >
          <input
            type="checkbox"
            checked={autoHeadUp}
            onChange={(e) => onAutoHeadUpChange(e.target.checked)}
            disabled={isSimulating}
            className="w-5 h-5 text-cyan-500 bg-white/10 border-2 border-cyan-500/30 rounded focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            data-testid="auto-head-up-checkbox-lull"
          />
          <span className="text-white font-medium select-none">
            Auto head-up/bear-away (45°)
          </span>
        </label>
        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          data-testid="simulate-lull-button"
        >
          {isSimulating ? "Simulating..." : "Simulate Lull"}
        </button>
      </div>
    </div>
  );
}
