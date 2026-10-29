import { useEffect, useEffectEvent } from 'react';
import { eventStreamService } from '../../../../services/eventStream';
import type { BlockchainEvent } from '../../../../services/eventStream';

/**
 * Keeps a flow's data fresh WITHOUT ever refetching directly after the
 * flow's own write — data is only ever read from the server on initial
 * mount (the caller's own fetch effect) and here, in reaction to a real
 * `contract_write` SSE event for this exact contract. That's the only way
 * a flow correctly reflects a write from ANOTHER client too, not just its
 * own: a "write, then refetch" call only ever refreshes the person who
 * wrote it.
 *
 * This also covers your OWN write with no special-casing: `contractWrite`
 * (services/api.ts) already waits on this exact same `contract_write` event
 * to resolve its own promise (via watchForChainAck) — the event is a normal
 * pub/sub broadcast, so this hook's listener receives it too, just fired
 * with everyone else's instead of a direct call.
 *
 * Real contracts only — the demo/mock layer has no server and emits no
 * events at all, so demo flows must keep refetching directly after their
 * own writes (their only reconciliation mechanism); gate that on
 * `isDemoDataMode()` at the call site instead of here.
 */
export function useContractSync(contractId: string | null | undefined, onChange: () => void): void {
  const onWrite = useEffectEvent(onChange);

  useEffect(() => {
    if (!contractId) return;
    const handler = (event: BlockchainEvent) => {
      if (event.contract === contractId) onWrite();
    };
    eventStreamService.addEventListener('contract_write', handler);
    return () => eventStreamService.removeEventListener('contract_write', handler);
  }, [contractId]);
}

/**
 * Same idea as {@link useContractSync}, for a list-level view watching many
 * contracts at once (e.g. every initiative currently shown in a feed) rather
 * than one flow's own single contract. Registers exactly one listener, which
 * always sees the latest ids, so passing a new array each render doesn't churn
 * the subscription. `onChange` receives the specific contract id that changed —
 * callers dispatch a per-id refetch (e.g. fetchInitiativeStage) with it.
 */
export function useContractSyncMany(
  contractIds: readonly string[],
  onChange: (contractId: string) => void,
): void {
  const onWrite = useEffectEvent((contractId: string) => {
    if (contractIds.includes(contractId)) onChange(contractId);
  });

  useEffect(() => {
    const handler = (event: BlockchainEvent) => {
      if (event.contract) onWrite(event.contract);
    };
    eventStreamService.addEventListener('contract_write', handler);
    return () => eventStreamService.removeEventListener('contract_write', handler);
  }, []);
}
