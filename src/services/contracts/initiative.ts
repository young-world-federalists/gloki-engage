import { contractRead, joinContract } from '../api';
import type { IMethod } from '../interfaces';

/**
 * Initiative contract interface
 * Client builds JSON structures; contract stores and retrieves only
 *
 * NOTE (W1/W2 cleanup): the Roadmap/Gaps/Steps + contributions wrapper family
 * (getRoadmap, addSegment, createEditProposal, voteOnProposal, applyProposal,
 * getGaps/addGap, getSteps/addStep, add/getContributions) was removed with the
 * dead Roadmap UI — zero importers remained. The contract methods themselves
 * still exist on deployed initiative contracts; recover the wrappers from git
 * history if a future surface needs them.
 */

export async function getInitiative(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  const result = await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_initiative', values: {} } as IMethod,
  });
  const r = result as { details?: Record<string, unknown>; contributions?: unknown[] };
  return { ...(r?.details ?? {}), contributions: r?.contributions ?? [] };
}

export interface InitiativeStageContract {
  contractId: string;
  address?: string;
  agent?: string;
}

export function normalizeStageContract(
  value: unknown,
): InitiativeStageContract | null {
  if (typeof value === 'string' && value) {
    return { contractId: value };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const stageContract = value as {
    contractId?: unknown;
    address?: unknown;
    agent?: unknown;
  };

  if (typeof stageContract.contractId !== 'string' || !stageContract.contractId) {
    return null;
  }

  return {
    contractId: stageContract.contractId,
    address: typeof stageContract.address === 'string' ? stageContract.address : undefined,
    agent: typeof stageContract.agent === 'string' ? stageContract.agent : undefined,
  };
}

// Perf (S35 fix-round): a stage contract, once registered on the initiative,
// never changes — so a resolved (non-null) result can be cached forever. A
// `null` result (not yet registered) must NEVER be cached: the stage contract
// can be deployed later by a completely different code path (first write
// wins), and a cached null would then be permanently stale. Keyed by
// `${contractId}:${stageKey}` so distinct initiatives/stages don't collide.
const stageContractCache = new Map<string, InitiativeStageContract>();

/** Clears the memoised stage-contract cache. Call this from any path that
 *  wipes/reseeds demo state (e.g. a DEMO_VERSION bump) so a resolved
 *  reference from a prior demo generation can't leak into the new one. */
export function clearStageContractCache(): void {
  stageContractCache.clear();
}

export async function resolveInitiativeStageContract(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  stageKey: string,
): Promise<InitiativeStageContract | null> {
  const cacheKey = `${contractId}:${stageKey}`;
  const cached = stageContractCache.get(cacheKey);
  if (cached) return cached;

  try {
    const stageContract = await contractRead({
      serverUrl,
      publicKey,
      contractId,
      method: { name: 'get_stage_contract', values: { stage_key: stageKey } } as IMethod,
    });
    const normalized = normalizeStageContract(stageContract);
    if (normalized) {
      stageContractCache.set(cacheKey, normalized);
      return normalized;
    }
  } catch {
    // Older immutable initiative contracts may only expose these references via get_details.
  }

  try {
    const details = await contractRead({
      serverUrl,
      publicKey,
      contractId,
      method: { name: 'get_details', values: {} } as IMethod,
    });
    if (!details || typeof details !== 'object') return null;

    const normalized = normalizeStageContract((details as Record<string, unknown>)[stageKey]);
    if (normalized) stageContractCache.set(cacheKey, normalized);
    return normalized;
  } catch {
    return null;
  }
}

export async function resolveAndJoinInitiativeStageContract(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  stageKey: string,
): Promise<InitiativeStageContract | null> {
  const stageContract = await resolveInitiativeStageContract(
    serverUrl,
    publicKey,
    contractId,
    stageKey,
  );

  if (!stageContract) return null;

  if (stageContract.address && stageContract.agent) {
    try {
      await joinContract({
        serverUrl,
        publicKey,
        address: stageContract.address,
        agent: stageContract.agent,
        contract: stageContract.contractId,
      });
    } catch {
      // Joining may fail if the user already has the contract locally.
    }
  }

  return stageContract;
}
