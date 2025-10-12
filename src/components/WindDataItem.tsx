type Props = {
  label: string;
  value: string;
  unit?: string;
};

export function WindDataItem({ label, value, unit }: Props) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/80">{label}:</span>
      <span className="text-white font-bold text-2xl">
        {value} {unit && <span className="text-lg">{unit}</span>}
      </span>
    </div>
  );
}
