import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  seconds: number;
  onComplete: () => void;
}

/**
 * Runs a countdown (e.g. 3-2-1) and fires onComplete when it hits zero.
 * `start()` (re)triggers the countdown from `seconds`.
 */
export function useCountdown({ seconds, onComplete }: UseCountdownOptions) {
  const [count, setCount] = useState<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      const t = setTimeout(() => {
        onCompleteRef.current();
        setCount(null);
      }, 150);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const start = useCallback(() => setCount(seconds), [seconds]);
  const cancel = useCallback(() => setCount(null), []);

  return { count, isRunning: count !== null, start, cancel };
}
