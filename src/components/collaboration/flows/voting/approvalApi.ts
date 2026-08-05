import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';
import type { SourceLink } from '../../../../utils/sources';

function throwIfContractError(response: unknown) {
  if (
    response &&
    typeof response === 'object' &&
    'error' in response &&
    typeof (response as { error?: unknown }).error === 'string'
  ) {
    throw new Error((response as { error: string }).error);
  }
  return response;
}

export async function addProposal(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  text: string,
  coAuthors: string[] = [],
  commitments: string[] = [],
  sources: SourceLink[] = [],
  metrics: string[] = [],
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_proposal', values: { text, co_authors: coAuthors, commitments, sources, metrics } } as IMethod,
  }));
}

export async function approve(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'approve', values: { proposal_id: proposalId } } as IMethod,
  }));
}

export async function withdrawApproval(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'withdraw_approval', values: { proposal_id: proposalId } } as IMethod,
  }));
}

export async function getProposals(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_proposals', values: {} } as IMethod,
  });
}

export async function getApprovals(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_approvals', values: {} } as IMethod,
  });
}

export async function getApprovalCounts(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_approval_counts', values: {} } as IMethod,
  });
}

export async function getMyApprovals(
  serverUrl: string,
  publicKey: string,
  contractId: string,
) {
  return await contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'get_my_approvals', values: {} } as IMethod,
  });
}

// Fetch proposals and approval counts together. Warns on size mismatch so
// partial-response data loss is loggable — the contract guarantees the two
// maps cover the same proposal set, so any mismatch implies truncation
// somewhere between server and client.
export async function getProposalsAndCounts(
  serverUrl: string,
  publicKey: string,
  contractId: string,
): Promise<{ proposals: Record<string, unknown>; counts: Record<string, number> }> {
  const [proposalsRaw, countsRaw] = await Promise.all([
    getProposals(serverUrl, publicKey, contractId),
    getApprovalCounts(serverUrl, publicKey, contractId),
  ]);
  const proposals = (proposalsRaw && typeof proposalsRaw === 'object' && !Array.isArray(proposalsRaw)
    ? proposalsRaw
    : {}) as Record<string, unknown>;
  const counts = (countsRaw && typeof countsRaw === 'object' && !Array.isArray(countsRaw)
    ? countsRaw
    : {}) as Record<string, number>;
  const pCount = Object.keys(proposals).length;
  const cCount = Object.keys(counts).length;
  if (pCount !== cCount) {
    console.warn('[approvalApi] Proposals/counts size mismatch — partial response?', {
      proposals: pCount,
      counts: cCount,
      contractId,
    });
  }
  return { proposals, counts };
}

export async function requestExpertReview(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'request_expert_review', values: { proposal_id: proposalId } } as IMethod,
  }));
}

export async function addExpertReview(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  proposalId: string,
  metrics: string[],
  note?: string,
  assessment?: string,
  sources: SourceLink[] = [],
  credentials?: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_expert_review', values: { proposal_id: proposalId, metrics, note, assessment, sources, credentials } } as IMethod,
  }));
}

export async function suggestProposalMerge(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  sourceId: string,
  targetId: string,
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'suggest_proposal_merge', values: { source_id: sourceId, target_id: targetId } } as IMethod,
  }));
}

/**
 * S33 — the source solution's author accepts or declines a merge suggestion.
 * `decision` is 'accepted' | 'declined'. Author-gated in the demo contract; the
 * real contract must enforce it too.
 */
export async function decideMergeSuggestion(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  sourceId: string,
  targetId: string,
  decision: 'accepted' | 'declined',
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: {
      name: 'decide_merge_suggestion',
      values: { source_id: sourceId, target_id: targetId, decision },
    } as IMethod,
  }));
}
