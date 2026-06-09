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

export async function resolveInitiativeStageContract(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  stageKey: string,
): Promise<InitiativeStageContract | null> {
  try {
    const stageContract = await contractRead({
      serverUrl,
      publicKey,
      contractId,
      method: { name: 'get_stage_contract', values: { stage_key: stageKey } } as IMethod,
    });
    const normalized = normalizeStageContract(stageContract);
    if (normalized) return normalized;
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

    return normalizeStageContract((details as Record<string, unknown>)[stageKey]);
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
