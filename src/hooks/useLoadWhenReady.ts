import { useEffect } from 'react';

/**
 * Runs `load` once `ready` is true, and again whenever `load` changes (its
 * useCallback deps: a new contract, a new signed-in key). With `pollMs` it
 * also re-runs on that interval while ready. `load` sets state only after it
 * awaits, as any read from a contract does.
 */
export function useLoadWhenReady(load: () => unknown, ready = true, pollMs?: number): void {
  useEffect(() => {
    if (!ready) return;
    void load();
    if (!pollMs) return;
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [ready, load, pollMs]);
}
