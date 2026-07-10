import { useCallback, useEffect, useRef } from "react";
import { WIND_LIMITS } from "../constants/windSimulator";

type Props = {
  trueWindSpeed: number;
  onIncrease: () => void;
  onDecrease: () => void;
};

function useRepeatAction(action: () => void, interval = 100, delay = 400) {
  const timerRef = useRef<number | null>(null);
  const delayRef = useRef<number | null>(null);

  const start = useCallback(() => {
    action();
    delayRef.current = window.setTimeout(() => {
      timerRef.current = window.setInterval(action, interval);
    }, delay);
  }, [action, interval, delay]);

  const stop = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { start, stop };
}

export function TwsControls({ trueWindSpeed, onIncrease, onDecrease }: Props) {
  const increase = useRepeatAction(onIncrease);
  const decrease = useRepeatAction(onDecrease);

  return (
    <div
      className="absolute bottom-4 right-4 lg:right-4 flex flex-col gap-2"
      data-testid="tws-controls"
    >
      <button
        onMouseDown={increase.start}
        onMouseUp={increase.stop}
        onMouseLeave={increase.stop}
        onTouchStart={increase.start}
        onTouchEnd={increase.stop}
        disabled={trueWindSpeed >= WIND_LIMITS.maxSpeed}
        className="w-12 h-12 glass-dark rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg select-none"
        title="Increase TWS by 0.1 kts"
        data-testid="tws-increase-button"
      >
        +
      </button>
      <div
        className="w-12 h-12 glass-dark rounded-lg flex items-center justify-center text-white font-bold text-[10px] leading-tight text-center"
        title={`TWS: ${trueWindSpeed.toFixed(1)} kts`}
        data-testid="tws-display"
      >
        <span>
          TWS
          <br />
          {trueWindSpeed.toFixed(1)}
        </span>
      </div>
      <button
        onMouseDown={decrease.start}
        onMouseUp={decrease.stop}
        onMouseLeave={decrease.stop}
        onTouchStart={decrease.start}
        onTouchEnd={decrease.stop}
        disabled={trueWindSpeed <= WIND_LIMITS.minSpeed}
        className="w-12 h-12 glass-dark rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg select-none"
        title="Decrease TWS by 0.1 kts"
        data-testid="tws-decrease-button"
      >
        −
      </button>
    </div>
  );
}
