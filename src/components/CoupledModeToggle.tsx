type Props = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
};

export function CoupledModeToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`w-full py-3 px-4 glass rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
        enabled
          ? "text-white/80 hover:text-white hover:bg-white/10 border border-emerald-500/30"
          : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
      data-testid="coupled-mode-toggle"
      title={
        enabled
          ? "TWS-IWS coupling ON: dragging TWS adjusts IWS proportionally"
          : "TWS-IWS coupling OFF: TWS and IWS are independent"
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {enabled ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        ) : (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4l16 16"
            />
          </>
        )}
      </svg>
      <span className="text-sm">
        {enabled ? "TWS→IWS Coupled" : "TWS→IWS Independent"}
      </span>
    </button>
  );
}
