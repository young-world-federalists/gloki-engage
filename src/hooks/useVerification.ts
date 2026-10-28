import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { type TrustState } from '../services/trustModel';
import { useVerificationRegistry } from './useVerificationRegistry';
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
  /** Vouches from verified people the user holds, per the verification contract. */
  vouchCount: number;
  trust: TrustState;
}

/**
 * The user's app-wide verification state through the seam. Verified means
 * "on the verification contract's list" (useVerificationRegistry), the single
 * source of truth; the request lists arrive from the seam. `refetch` refreshes
 * both, so every writer stays in step with the contract.
 */
export function useVerification(): UseVerification {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const registry = useVerificationRegistry();
  const [state, setState] = useState<VerificationState | null>(null);

  const ctx = useMemo<VerificationCtx | null>(
    () => (serverUrl && publicKey ? { serverUrl, publicKey } : null),
    [serverUrl, publicKey],
  );

  const { refresh: refreshRegistry, status: registryStatus } = registry;
  const refetch = useCallback(async () => {
    if (!ctx) return;
    await refreshRegistry();
    setState(await getVerificationState(ctx));
  }, [ctx, refreshRegistry]);

  const vouchCount = publicKey ? registry.vouchCountOf(publicKey) : 0;
  const verified = !!publicKey && registry.isVerified(publicKey);
  const trust: TrustState = verified ? 'verified' : vouchCount > 0 ? 'vouched' : 'unverified';

  useEffect(() => {
    if (!ctx) return;
    let cancelled = false;
    getVerificationState(ctx).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [ctx, registryStatus]);

  return { ctx, state, refetch, vouchCount, trust };
}

export interface UseVerifiedMembers {
  members: MemberSummary[];
  byKey: Map<string, MemberSummary>;
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
}

/** Everyone verified app-wide (except the user), filtered by a name query; `byKey` always holds all of them. */
export function useVerifiedMembers(): UseVerifiedMembers {
  const { serverUrl, publicKey } = useAppSelector((s) => s.user);
  const [all, setAll] = useState<MemberSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { status } = useVerificationRegistry();

  useEffect(() => {
    if (!serverUrl || !publicKey) return;
    let cancelled = false;
    listVerifiedMembers({ serverUrl, publicKey })
      .then((list) => {
        if (!cancelled) setAll(list);
      })
      .catch(() => {
        if (!cancelled) setAll([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverUrl, publicKey, status]);

  const byKey = useMemo(() => new Map(all.map((m) => [m.publicKey, m])), [all]);
  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((m) => m.name.toLowerCase().includes(q)) : all;
  }, [all, query]);

  return { members, byKey, query, setQuery, loading };
}

export default useVerification;
