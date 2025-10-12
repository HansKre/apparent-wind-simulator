type Props = {
  color: string;
  title: string;
  animate?: boolean;
};

export function WindPanelHeader({ color, title, animate = false }: Props) {
  return (
    <h3
      className={`text-${color}-400 font-bold text-xl mb-4 flex items-center gap-2`}
    >
      <div
        className={`w-4 h-4 bg-${color}-500 rounded-full ${animate ? "animate-pulse" : ""}`}
      ></div>
      {title}
    </h3>
  );
}
