import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

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
) {
  return throwIfContractError(await contractWrite({
    serverUrl,
    publicKey,
    contractId,
    method: { name: 'add_proposal', values: { text, co_authors: coAuthors } } as IMethod,
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
