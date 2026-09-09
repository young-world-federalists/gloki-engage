import { useEffect, useRef, useState } from 'react';

export interface UseCountdown {
  /** Whole seconds left, counting down to 0. */
  remaining: number;
  /** True once `remaining` has reached 0. */
  done: boolean;
}

export interface UseCountdownOptions {
  /** Fixed wall-clock deadline. When omitted, one is derived at mount. */
  deadlineMs: number;
}

const remainingAt = (deadline: number, now: number) =>
  Math.max(0, Math.ceil((deadline - now) / 1000));

/**
 * The ONLY sanctioned timer in component-land (S37 spec §3.3) — every other
 * timer in this wave (joins, the 5-minute call timeout, staggered in-call
 * verification) lives inside `verificationSim.ts`; components subscribe to
 * that via `joinCallStream` in an effect instead of running their own clock.
 * This hook is the sole exception, for the 5 s completion countdown.
 *
 * One `setInterval` at 1 s samples the wall clock against a fixed deadline.
 * A visibility listener samples again when the tab returns, so a throttled
 * hidden tab catches up immediately. Both are cleaned up on unmount and once
 * the deadline is reached. `onDone` fires EXACTLY once from its own effect,
 * guarded by a ref so Strict Mode's dev-only effect replay cannot re-fire it.
 *
 * `seconds` is read ONLY once, as the initial value — changing it on a later
 * render does nothing, by design. **Restarting the countdown requires
 * remounting with a new `key`** (e.g. `<CountdownTimer key={round} .../>`),
 * not a `seconds` prop change. This keeps the hook's internal clock as the
 * single source of truth instead of trying to reconcile a live prop against
 * an in-flight interval.
 */
export function useCountdown(
  seconds: number,
  onDone?: () => void,
  options?: UseCountdownOptions,
): UseCountdown {
  const deadlineRef = useRef<number | null>(null);
  if (deadlineRef.current === null) {
    deadlineRef.current = options?.deadlineMs ?? Date.now() + Math.max(0, Math.floor(seconds)) * 1000;
  }

  const [remaining, setRemaining] = useState(() => remainingAt(deadlineRef.current!, Date.now()));
  const onDoneRef = useRef(onDone);
  const firedRef = useRef(false);

  // Always call the latest `onDone` without making it an effect dependency —
  // an inline arrow from the caller must not restart the interval below.
  onDoneRef.current = onDone;

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (intervalId !== undefined) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    const sample = () => {
      const next = remainingAt(deadlineRef.current!, Date.now());
      setRemaining(next);
      if (next === 0) stop();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sample();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    intervalId = setInterval(sample, 1000);
    sample();

    return stop;
    // Mount-only: see the "restart needs a key change" note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    onDoneRef.current?.();
  }, [remaining]);

  return { remaining, done: remaining <= 0 };
}

export default useCountdown;
