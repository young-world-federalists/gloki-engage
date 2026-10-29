import { useEffect, useEffectEvent, useRef, useState } from 'react';

export interface UseCountdown {
  /** Whole seconds left, counting down to 0. */
  remaining: number;
  /** True once `remaining` has reached 0. */
  done: boolean;
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
export function useCountdown(seconds: number, onDone?: () => void): UseCountdown {
  // Fixed at mount: see the "restart needs a key change" note above.
  const [deadline] = useState(() => Date.now() + Math.max(0, seconds) * 1000);
  const [remaining, setRemaining] = useState(() => remainingAt(deadline, Date.now()));
  const firedRef = useRef(false);

  // Always calls the latest `onDone` without making it an effect dependency —
  // an inline arrow from the caller must not re-fire it.
  const fireDone = useEffectEvent(() => onDone?.());

  useEffect(() => {
    const sample = () => {
      const next = remainingAt(deadline, Date.now());
      setRemaining(next);
      if (next === 0) stop();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sample();
    };
    const intervalId = setInterval(sample, 1000);
    const stop = () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    sample();
    return stop;
  }, [deadline]);

  useEffect(() => {
    if (remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    fireDone();
  }, [remaining]);

  return { remaining, done: remaining <= 0 };
}
