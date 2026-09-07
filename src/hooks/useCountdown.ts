import { useEffect, useRef, useState } from 'react';

export interface UseCountdown {
  /** Whole seconds left, counting down to 0. */
  remaining: number;
  /** True once `remaining` has reached 0. */
  done: boolean;
}

/**
 * The ONLY sanctioned timer in component-land (S37 spec §3.3) — every other
 * timer in this wave (joins, the 5-minute call timeout, staggered in-call
 * verification) lives inside `verificationSim.ts`; components subscribe to
 * that via `joinCallStream` in an effect instead of running their own clock.
 * This hook is the sole exception, for the 5 s completion countdown.
 *
 * One `setInterval` at 1 s. It is cleared both on unmount and the instant
 * `remaining` reaches 0 — it never ticks past zero. `onDone` fires EXACTLY
 * once, guarded by a ref rather than by dependency-array shape, so a
 * re-render that hands in a new `onDone` closure (or React 18 Strict Mode's
 * dev-only double-invoke) can never re-fire it.
 *
 * `seconds` is read ONLY once, as the initial value — changing it on a later
 * render does nothing, by design. **Restarting the countdown requires
 * remounting with a new `key`** (e.g. `<CountdownTimer key={round} .../>`),
 * not a `seconds` prop change. This keeps the hook's internal clock as the
 * single source of truth instead of trying to reconcile a live prop against
 * an in-flight interval.
 */
export function useCountdown(seconds: number, onDone?: () => void): UseCountdown {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor(seconds)));
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);

  // Always call the latest `onDone` without making it an effect dependency —
  // an inline arrow from the caller must not restart the interval below.
  onDoneRef.current = onDone;

  const fireOnceDone = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onDoneRef.current?.();
  };

  useEffect(() => {
    // Nothing to count down from — done immediately, no interval to start.
    if (remaining <= 0) {
      fireOnceDone();
      return;
    }

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          fireOnceDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
    // Mount-only: see the "restart needs a key change" note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { remaining, done: remaining <= 0 };
}

export default useCountdown;
