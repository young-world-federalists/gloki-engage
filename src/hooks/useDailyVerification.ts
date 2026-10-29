import { useCallback, useEffect, useRef, useState } from 'react';
import { useVerification } from './useVerification';
import {
  DAILY_SESSION_RESET_EVENT,
  dailySessionState,
  enterDailyCall,
  finishDailyCall,
  joinDaily,
  joinDailyStream,
  leaveDaily,
  setDailyReminder,
  type DailySnapshot,
  type VerificationCtx,
} from '../services/verification';

export interface UseDailyVerification {
  snapshot: DailySnapshot | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
  join: () => Promise<void>;
  enterCall: () => Promise<void>;
  finishCall: () => Promise<void>;
  setReminder: (enabled: boolean) => Promise<void>;
  retry: () => void;
}

export function useDailyVerification(): UseDailyVerification {
  const { ctx } = useVerification();
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [loading, setLoading] = useState(!!ctx);
  const [error, setError] = useState<string | null>(ctx ? null : 'signIn');
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const snapshotRef = useRef<DailySnapshot | null>(null);
  const busyRef = useRef(false);
  const loadToken = useRef(0);
  const claimedOwner = useRef(new Map<string, number>());

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  // A new identity (or signing out) starts over; the effect below loads for it.
  const [stateFor, setStateFor] = useState(ctx);
  if (ctx !== stateFor) {
    setStateFor(ctx);
    if (!ctx) setSnapshot(null);
    setLoading(!!ctx);
    setError(ctx ? null : 'signIn');
  }

  // A reload (retry, or a reset of the session) starts over too.
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setGeneration((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!ctx) return undefined;

    const capturedCtx = ctx;
    const capturedOwner = `${encodeURIComponent(capturedCtx.serverUrl)}::${capturedCtx.publicKey}`;
    const token = loadToken.current + 1;
    loadToken.current = token;
    claimedOwner.current.set(capturedOwner, token);
    let disposed = false;
    let activeId: string | null = null;
    let unsubscribe: (() => void) | undefined;

    void dailySessionState(capturedCtx)
      .then((next) => {
        if (disposed) {
          // StrictMode may already have started a replacement load for this
          // same owner. That replacement is allowed to claim the shared run;
          // a real unmount/account change disposes the orphan immediately.
          if (claimedOwner.current.get(capturedOwner) === token) {
            void leaveDaily(capturedCtx, next.id);
          }
          return;
        }
        activeId = next.id;
        snapshotRef.current = next;
        setSnapshot(next);
        unsubscribe = joinDailyStream(next.id, (value) => {
          snapshotRef.current = value;
          setSnapshot(value);
        });
      })
      .catch(() => {
        if (!disposed) setError('load');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });

    return () => {
      disposed = true;
      unsubscribe?.();
      if (activeId) void leaveDaily(capturedCtx, activeId);
    };
  }, [ctx, generation]);

  useEffect(() => {
    window.addEventListener(DAILY_SESSION_RESET_EVENT, reload);
    return () => window.removeEventListener(DAILY_SESSION_RESET_EVENT, reload);
  }, [reload]);

  const run = useCallback(
    async (action: (activeCtx: VerificationCtx, id: string) => Promise<DailySnapshot>) => {
      const current = snapshotRef.current;
      if (!ctx || !current || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        const next = await action(ctx, current.id);
        snapshotRef.current = next;
        setSnapshot(next);
      } catch {
        setError('update');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [ctx],
  );

  const join = useCallback(() => run(joinDaily), [run]);
  const enterCall = useCallback(() => run(enterDailyCall), [run]);
  const finishCall = useCallback(() => run(finishDailyCall), [run]);
  const setReminder = useCallback((enabled: boolean) => run((activeCtx, id) => setDailyReminder(activeCtx, id, enabled)), [run]);
  return { snapshot, loading, error, busy, join, enterCall, finishCall, setReminder, retry: reload };
}
