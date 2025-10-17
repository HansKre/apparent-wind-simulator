import { SimulationConfig } from "../types/simulationConfig";

type Props = {
  config: SimulationConfig;
  onChange: (config: SimulationConfig) => void;
  title: string;
  color: "amber" | "cyan";
};

export function SimulationConfigPanel({
  config,
  onChange,
  title,
  color,
}: Props) {
  const colorClasses = {
    amber: {
      bg: "bg-amber-500",
      text: "text-amber-400",
      border: "border-amber-500/30",
      focus: "focus:ring-amber-500",
    },
    cyan: {
      bg: "bg-cyan-500",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
      focus: "focus:ring-cyan-500",
    },
  };

  const colors = colorClasses[color];

  function handleChange(field: keyof SimulationConfig, value: number) {
    onChange({ ...config, [field]: value });
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-xl" data-testid={`${color}-config-panel`}>
      <h3 className={`${colors.text} font-bold text-xl mb-4 flex items-center gap-2`}>
        <div className={`w-4 h-4 ${colors.bg} rounded-full`}></div>
        {title}
      </h3>
      <div className="space-y-4 text-sm">
        <div>
          <label className="block text-white/80 mb-1">
            Wind Build-Up Duration (ms)
          </label>
          <input
            type="number"
            value={config.windBuildUpDuration}
            onChange={(e) =>
              handleChange("windBuildUpDuration", parseInt(e.target.value))
            }
            min="100"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-wind-buildup-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Wind Decay Duration (ms)
          </label>
          <input
            type="number"
            value={config.windDecayDuration}
            onChange={(e) =>
              handleChange("windDecayDuration", parseInt(e.target.value))
            }
            min="100"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-wind-decay-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Boat Speed Delay (ms)
          </label>
          <input
            type="number"
            value={config.boatSpeedDelay}
            onChange={(e) =>
              handleChange("boatSpeedDelay", parseInt(e.target.value))
            }
            min="0"
            max="5000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-boat-speed-delay-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Boat Speed Build-Up Duration (ms)
          </label>
          <input
            type="number"
            value={config.boatSpeedBuildUpDuration}
            onChange={(e) =>
              handleChange("boatSpeedBuildUpDuration", parseInt(e.target.value))
            }
            min="100"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-boat-speed-buildup-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Boat Speed Decay Duration (ms)
          </label>
          <input
            type="number"
            value={config.boatSpeedDecayDuration}
            onChange={(e) =>
              handleChange("boatSpeedDecayDuration", parseInt(e.target.value))
            }
            min="100"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-boat-speed-decay-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Auto-Rotation Delay (ms)
          </label>
          <input
            type="number"
            value={config.autoRotationDelay}
            onChange={(e) =>
              handleChange("autoRotationDelay", parseInt(e.target.value))
            }
            min="0"
            max="5000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-auto-rotation-delay-input`}
          />
        </div>

        <div>
          <label className="block text-white/80 mb-1">
            Auto-Rotation Duration (ms, 0 = until end)
          </label>
          <input
            type="number"
            value={config.autoRotationDuration}
            onChange={(e) =>
              handleChange("autoRotationDuration", parseInt(e.target.value))
            }
            min="0"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            data-testid={`${color}-auto-rotation-duration-input`}
          />
        </div>
      </div>
    </div>
  );
}
