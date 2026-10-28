import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  canRegister,
  getRegistryStatus,
  personSummary,
  phaseOf,
  register,
  requiredVouches,
  vouchersFor,
  type PersonSummary,
  type RegistryIdentity,
  type RegistryStatus,
  type VerificationPhase,
} from '../services/verificationRegistry';

// One shared snapshot of the verification contract for the whole app, so the
// hub, the identity page and every trust check agree. Any mounted reader can
// refresh it; `live` readers also poll while mounted (other people's vouches
// arrive on the application agent's stream, which the app doesn't follow).

interface Snapshot {
  status: RegistryStatus | null;
  error: string | null;
}

const POLL_MS = 15000;

let snapshot: Snapshot = { status: null, error: null };
let inFlight: Promise<void> | null = null;
let registering = false;
let identity: RegistryIdentity | null = null;
const listeners = new Set<() => void>();

function emit(next: Snapshot): void {
  snapshot = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Once the signed-in person holds every vouch their phase needs, the app
 * registers them in the contract with those vouches (the contract re-checks
 * each one). Runs after every refresh, wherever the hook is mounted.
 */
async function registerIfEligible(status: RegistryStatus): Promise<boolean> {
  const me = identity;
  if (!me || registering || !canRegister(status, me.publicKey)) return false;
  registering = true;
  try {
    await register(me, vouchersFor(status, me.publicKey));
    return true;
  } catch (err) {
    console.error('[Verification] register failed:', err);
    return false;
  } finally {
    registering = false;
  }
}

export function refreshVerificationRegistry(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      let status = await getRegistryStatus();
      if (await registerIfEligible(status)) status = await getRegistryStatus();
      emit({ status, error: null });
    } catch (err) {
      emit({ status: snapshot.status, error: err instanceof Error ? err.message : String(err) });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export interface VerificationRegistry {
  /** null until the first read answers. */
  status: RegistryStatus | null;
  error: string | null;
  phase: VerificationPhase | null;
  /** The signed-in person, as the contract needs them. null before the profile loads. */
  me: RegistryIdentity | null;
  isVerified: (publicKey: string) => boolean;
  /** Vouches from verified people that `publicKey` holds. */
  vouchCountOf: (publicKey: string) => number;
  /** Vouches needed now: everyone verified (sequential) or four (open). */
  required: number;
  isSteward: boolean;
  refresh: () => Promise<void>;
}

export function useVerificationRegistry({ live = false }: { live?: boolean } = {}): VerificationRegistry {
  const { serverUrl, publicKey, digitalAgentContractId } = useAppSelector((s) => s.user);
  const { status, error } = useSyncExternalStore(subscribe, () => snapshot);

  const me = useMemo<RegistryIdentity | null>(
    () => (serverUrl && publicKey ? { publicKey, address: serverUrl, profile: digitalAgentContractId ?? '' } : null),
    [serverUrl, publicKey, digitalAgentContractId],
  );

  useEffect(() => {
    identity = me;
  }, [me]);

  useEffect(() => {
    if (!me) return;
    void refreshVerificationRegistry();
    if (!live) return;
    const id = setInterval(() => void refreshVerificationRegistry(), POLL_MS);
    return () => clearInterval(id);
  }, [me, live]);

  const verifiedKeys = useMemo(() => new Set((status?.verified ?? []).map((v) => v.key)), [status]);
  const isVerified = useCallback((pk: string) => verifiedKeys.has(pk), [verifiedKeys]);
  const vouchCountOf = useCallback(
    (pk: string) => {
      if (!status) return 0;
      const record = status.verified.find((v) => v.key === pk);
      return record ? record.vouchers.length : vouchersFor(status, pk).length;
    },
    [status],
  );

  return {
    status,
    error,
    phase: status ? phaseOf(status) : null,
    me,
    isVerified,
    vouchCountOf,
    required: status ? requiredVouches(status) : 0,
    isSteward: !!status && !!publicKey && status.steward === publicKey,
    refresh: refreshVerificationRegistry,
  };
}

/**
 * Names + countries of people who asked for a vouch (not verified yet, so not
 * in the verified list), from the node/profile each request carries.
 */
export function useRequesterSummaries(): Map<string, PersonSummary> {
  const { status } = useSyncExternalStore(subscribe, () => snapshot);
  const [byKey, setByKey] = useState<Map<string, PersonSummary>>(() => new Map());

  useEffect(() => {
    const requests = status?.requests ?? [];
    let cancelled = false;
    Promise.all(
      requests.map((r) => personSummary({ key: r.requester, address: r.address, profile: r.profile })),
    ).then((people) => {
      if (!cancelled) setByKey(new Map(people.map((p) => [p.publicKey, p])));
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return byKey;
}

export default useVerificationRegistry;
