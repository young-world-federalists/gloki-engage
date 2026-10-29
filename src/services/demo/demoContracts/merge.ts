// Mock merge_contract.py — cross-initiative merge proposals + voting.
import type { IMethod } from '../../interfaces';
import { readState, updateState } from '../demoState';

// Internal state vocab. Votes are stored verbatim from the caller; the React
// card sends 'for'/'against', the deployed contract uses 'support'/'oppose' —
// accept both so counting and "my vote" work regardless of which arrives.
type Vote = 'for' | 'against' | 'support' | 'oppose';

interface MergeProposal {
  id: string;
  sourceInitiativeId: string;
  rationale: string;
  proposer: string;
  decision: 'pending' | 'accepted' | 'rejected';
  votes: Record<string, Vote>;
  createdAt: number;
}

interface MergeState {
  proposals: MergeProposal[];
}

function defaultState(): MergeState {
  return { proposals: [] };
}

function load(contractId: string): MergeState {
  return { ...defaultState(), ...readState<Partial<MergeState>>(contractId) };
}

function newId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

export function mergeRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_merge_proposals':
      // Map internal state → the shape the React card/list consume (the
      // deployed contract returns this richer shape): `decision` → `status`,
      // and the per-caller `votes` map → for/against tallies.
      return s.proposals.map((p) => ({
        ...p,
        status: p.decision,
        forCount: Object.values(p.votes).filter((v) => v === 'for' || v === 'support').length,
        againstCount: Object.values(p.votes).filter((v) => v === 'against' || v === 'oppose').length,
      }));
    case 'get_my_vote': {
      const mergeId = method.values?.merge_id as string | undefined;
      const proposal = s.proposals.find((p) => p.id === mergeId);
      return proposal ? proposal.votes[caller] ?? null : null;
    }
    default:
      return null;
  }
}

export function mergeWrite(contractId: string, method: IMethod, caller: string): unknown {
  switch (method.name) {
    case 'propose_merge': {
      const sourceInitiativeId = method.values?.source_initiative_id as string | undefined;
      const rationale = method.values?.rationale as string | undefined;
      if (!sourceInitiativeId || !rationale) return { error: 'Missing source or rationale' };
      const proposal: MergeProposal = {
        id: newId(),
        sourceInitiativeId,
        rationale,
        proposer: caller,
        decision: 'pending',
        votes: {},
        createdAt: Date.now(),
      };
      updateState<MergeState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        proposals: [...(s.proposals ?? []), proposal],
      }));
      return proposal;
    }
    case 'vote_on_merge': {
      const mergeId = method.values?.merge_id as string | undefined;
      const vote = method.values?.vote as Vote | undefined;
      if (!mergeId || !vote) return { error: 'Missing merge_id or vote' };
      let result: unknown = null;
      updateState<MergeState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        proposals: (s.proposals ?? []).map((p) => {
          if (p.id !== mergeId) return p;
          if (p.decision !== 'pending') {
            result = { error: 'Already decided' };
            return p;
          }
          return { ...p, votes: { ...p.votes, [caller]: vote } };
        }),
      }));
      return result;
    }
    case 'author_decide_merge': {
      const mergeId = method.values?.merge_id as string | undefined;
      // Card sends 'accept'/'reject'; the deployed contract also accepts the
      // past-tense form. Normalize to the stored 'accepted'/'rejected' status.
      const raw = method.values?.decision as string | undefined;
      const decision: 'accepted' | 'rejected' | undefined =
        raw === 'accept' || raw === 'accepted' ? 'accepted'
        : raw === 'reject' || raw === 'rejected' ? 'rejected'
        : undefined;
      if (!mergeId || !decision) return { error: 'Missing merge_id or decision' };
      updateState<MergeState>(contractId, (s) => ({
        ...defaultState(),
        ...s,
        proposals: (s.proposals ?? []).map((p) =>
          p.id === mergeId && p.decision === 'pending' ? { ...p, decision } : p,
        ),
      }));
      return null;
    }
    default:
      return null;
  }
}
