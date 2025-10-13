import { formatSpeed } from "../utils/windCalculations";

type Props = {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
};

export function LullSpeedSlider({ value, onChange, disabled }: Props) {
  const gradientProgress = ((value - 5) / 20) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/80">Lull Speed:</span>
        <span className="text-white font-bold text-lg">
          {formatSpeed(value)} <span className="text-sm">knots</span>
        </span>
      </div>
      <input
        type="range"
        min="5"
        max="25"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: disabled
            ? "rgba(255, 255, 255, 0.2)"
            : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${gradientProgress}%, rgba(255, 255, 255, 0.2) ${gradientProgress}%, rgba(255, 255, 255, 0.2) 100%)`,
        }}
      />
    </div>
  );
}
