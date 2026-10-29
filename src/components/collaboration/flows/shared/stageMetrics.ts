import { contractRead } from '../../../../services/api';
import { resolveInitiativeStageContract } from '../../../../services/contracts/initiative';
import { getProposalsAndCounts } from '../voting/approvalApi';
import type { IMethod } from '../../../../services/interfaces';
export interface DiscussionSummary { participants: number; comments: number; }
export interface ProposalsSummary { proposals: number; topApprovedText: string | null; topApprovedCount: number; }
export interface VoteSummary { winnerText: string | null; winnerCredits: number; voters: number; }

async function readMethod(
  serverUrl: string,
  publicKey: string,
  contractId: string,
  method: string,
  values: Record<string, unknown> = {},
): Promise<unknown> {
  return contractRead({
    serverUrl,
    publicKey,
    contractId,
    method: { name: method, values } as IMethod,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function fetchDiscussionSummary(
  serverUrl: string,
  publicKey: string,
  initiativeId: string,
): Promise<DiscussionSummary | null> {
  try {
    const stage = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'discussionContractId');
    if (!stage?.contractId) return null;

    // Fresh contracts: get_summary is O(1) server-side.
    const summaryRaw = await readMethod(serverUrl, publicKey, stage.contractId, 'get_summary').catch(() => null);
    if (isPlainObject(summaryRaw) && 'participants' in summaryRaw && 'comments' in summaryRaw) {
      return {
        participants: Number(summaryRaw.participants ?? 0),
        comments: Number(summaryRaw.comments ?? 0),
      };
    }

    // Old contracts: scan all comments locally.
    const raw = await readMethod(serverUrl, publicKey, stage.contractId, 'get_comments');
    if (!isPlainObject(raw)) return null;
    const authors = new Set<string>();
    let liveCount = 0;
    for (const c of Object.values(raw)) {
      if (!isPlainObject(c)) continue;
      if (c.deleted) continue;
      liveCount += 1;
      if (typeof c.author === 'string' && c.author) authors.add(c.author);
    }
    return { participants: authors.size, comments: liveCount };
  } catch {
    return null;
  }
}

export async function fetchProposalsSummary(
  serverUrl: string,
  publicKey: string,
  initiativeId: string,
): Promise<ProposalsSummary | null> {
  try {
    const stage = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'proposalsContractId');
    if (!stage?.contractId) return null;

    // Fresh contracts: single call.
    const summaryRaw = await readMethod(serverUrl, publicKey, stage.contractId, 'get_summary').catch(() => null);
    if (isPlainObject(summaryRaw) && 'proposals' in summaryRaw) {
      const topText = summaryRaw.top_text;
      return {
        proposals: Number(summaryRaw.proposals ?? 0),
        topApprovedText: typeof topText === 'string' && topText ? topText : null,
        topApprovedCount: Number(summaryRaw.top_count ?? 0),
      };
    }

    // Old contracts: fetch proposals + counts (with size-mismatch warn),
    // rank client-side.
    const { proposals, counts } = await getProposalsAndCounts(serverUrl, publicKey, stage.contractId);
    const entries = Object.entries(proposals as Record<string, { text?: string }>)
      .map(([pid, p]) => ({ pid, text: String(p?.text ?? ''), count: Number((counts as Record<string, number>)[pid] ?? 0) }))
      .filter((e) => e.text);
    if (entries.length === 0) {
      return { proposals: 0, topApprovedText: null, topApprovedCount: 0 };
    }
    entries.sort((a, b) => b.count - a.count);
    const top = entries[0];
    return {
      proposals: entries.length,
      topApprovedText: top.text,
      topApprovedCount: top.count,
    };
  } catch {
    return null;
  }
}

export async function fetchVoteSummary(
  serverUrl: string,
  publicKey: string,
  initiativeId: string,
): Promise<VoteSummary | null> {
  try {
    const stage = await resolveInitiativeStageContract(serverUrl, publicKey, initiativeId, 'voteContractId');
    if (!stage?.contractId) return null;

    // Fresh contracts: single call.
    const summaryRaw = await readMethod(serverUrl, publicKey, stage.contractId, 'get_summary').catch(() => null);
    if (isPlainObject(summaryRaw) && 'voters' in summaryRaw) {
      const winnerText = summaryRaw.winner_text;
      return {
        winnerText: typeof winnerText === 'string' && winnerText ? winnerText : null,
        winnerCredits: Number(summaryRaw.winner_credits ?? 0),
        voters: Number(summaryRaw.voters ?? 0),
      };
    }

    // Old contracts: scan allocations/results/proposals.
    const [proposalsRaw, resultsRaw, allocationsRaw] = await Promise.all([
      readMethod(serverUrl, publicKey, stage.contractId, 'get_proposals'),
      readMethod(serverUrl, publicKey, stage.contractId, 'get_results'),
      readMethod(serverUrl, publicKey, stage.contractId, 'get_allocations'),
    ]);
    const proposals = (isPlainObject(proposalsRaw) ? proposalsRaw : {}) as Record<string, { text?: string }>;
    const results = (isPlainObject(resultsRaw) ? resultsRaw : {}) as Record<string, number>;
    const allocations = (isPlainObject(allocationsRaw) ? allocationsRaw : {}) as Record<string, unknown>;
    const voters = Object.keys(allocations).length;
    let winnerId: string | null = null;
    let winnerCredits = 0;
    for (const [pid, votes] of Object.entries(results)) {
      const v = Number(votes ?? 0);
      if (v > winnerCredits) {
        winnerCredits = v;
        winnerId = pid;
      }
    }
    const winnerText = winnerId && proposals[winnerId] ? String(proposals[winnerId]?.text ?? '') : null;
    return { winnerText, winnerCredits, voters };
  } catch {
    return null;
  }
}
