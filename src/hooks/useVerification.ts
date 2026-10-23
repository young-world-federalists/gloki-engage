import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useDigitalAgent } from '../components/identity/agent/useDigitalAgent';
import { resolveTrustState, type TrustState } from '../services/trustModel';
import {
  getVerificationState,
  listVerifiedMembers,
  type MemberSummary,
  type VerificationCtx,
  type VerificationState,
} from '../services/verification';

export interface UseVerification {
  ctx: VerificationCtx | null;
  state: VerificationState | null;
  refetch: () => Promise<void>;
  /** Vouches the agent holds — platform-wide (D8). */
  vouchCount: number;
  trust: TrustState;
}

/**
 * The user's platform-wide verification state through the seam (S36). The
 * count reads synchronously from the Digital Agent store so the hub never
 * flashes "0 of 4"; the lists arrive from the seam. Re-fetches whenever the
 * agent's vouch list changes (the demo seam emits no write events — every
 * writer also calls `refetch`).
 */
export function useVerification(): UseVerification {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const { agent } = useDigitalAgent();
  const [state, setState] = useState<VerificationState | null>(null);

  const ctx = useMemo<VerificationCtx | null>(
    () => (serverUrl && publicKey ? { serverUrl, publicKey } : null),
    [serverUrl, publicKey],
  );

  const refetch = useCallback(async () => {
    if (!ctx) return;
    setState(await getVerificationState(ctx));
  }, [ctx]);

  const vouchCount = agent?.vouchedBy?.length ?? 0;

  useEffect(() => {
    void refetch();
  }, [refetch, vouchCount]);

  return { ctx, state, refetch, vouchCount, trust: resolveTrustState(vouchCount) };
}

export interface UseVerifiedMembers {
  members: MemberSummary[];
  byKey: Map<string, MemberSummary>;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
}

/** The 30 verified members, filtered by a name query; `byKey` always holds all of them. */
export function useVerifiedMembers(): UseVerifiedMembers {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [all, setAll] = useState<MemberSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    listVerifiedMembers({ serverUrl, publicKey }).then((list) => {
      if (cancelled) return;
      setAll(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey]);

  const byKey = useMemo(() => new Map(all.map((m) => [m.publicKey, m])), [all]);
  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
  }, [all, query]);

  return { members, byKey, query, setQuery, loading };
}

export default useVerification;
