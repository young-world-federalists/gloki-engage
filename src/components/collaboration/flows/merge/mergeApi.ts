import { contractRead, contractWrite } from '../../../../services/api';
import type { IMethod } from '../../../../services/interfaces';

export interface MergeProposal {
  id: string;
  sourceInitiativeId: string;
  proposer: string;
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: number;
  decidedAt: number;
  decidedBy: string;
  forCount: number;
  againstCount: number;
}

export async function proposeMerge(
  serverUrl: string, publicKey: string, contractId: string,
  sourceInitiativeId: string, rationale: string,
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'propose_merge', values: { source_initiative_id: sourceInitiativeId, rationale } } as IMethod,
  });
}

export async function voteOnMerge(
  serverUrl: string, publicKey: string, contractId: string,
  mergeId: string, vote: 'for' | 'against',
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'vote_on_merge', values: { merge_id: mergeId, vote } } as IMethod,
  });
}

export async function authorDecideMerge(
  serverUrl: string, publicKey: string, contractId: string,
  mergeId: string, decision: 'accept' | 'reject',
) {
  return await contractWrite({
    serverUrl, publicKey, contractId,
    method: { name: 'author_decide_merge', values: { merge_id: mergeId, decision } } as IMethod,
  });
}

export async function getMergeProposals(
  serverUrl: string, publicKey: string, contractId: string,
): Promise<MergeProposal[]> {
  const result = await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_merge_proposals', values: {} } as IMethod,
  });
  return Array.isArray(result) ? (result as MergeProposal[]) : [];
}

export async function getMyMergeVote(
  serverUrl: string, publicKey: string, contractId: string,
  mergeId: string,
): Promise<string> {
  const result = await contractRead({
    serverUrl, publicKey, contractId,
    method: { name: 'get_my_vote', values: { merge_id: mergeId } } as IMethod,
  });
  return typeof result === 'string' ? result : '';
}
