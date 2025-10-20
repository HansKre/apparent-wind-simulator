type Props = {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: Props) {
  return (
    <div
      className="absolute bottom-4 right-4 flex flex-col gap-2"
      data-testid="zoom-controls"
    >
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= 3}
        className="w-12 h-12 glass rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        title="Zoom In"
        data-testid="zoom-in-button"
      >
        +
      </button>
      <button
        onClick={onZoomReset}
        className="w-12 h-12 glass rounded-lg flex items-center justify-center text-white font-bold text-xs hover:bg-white/20 transition-all shadow-lg"
        title={`Reset Zoom (${Math.round(zoomLevel * 100)}%)`}
        data-testid="zoom-reset-button"
      >
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.5}
        className="w-12 h-12 glass rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        title="Zoom Out"
        data-testid="zoom-out-button"
      >
        −
      </button>
    </div>
  );
}
