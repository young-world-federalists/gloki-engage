// Mock problem_vote_contract.py
import type { IMethod } from '../../interfaces';
import { readState, writeState } from '../demoState';

type VoteDir = 'up' | 'down';
interface VoteState { votes: Record<string, VoteDir> }

function load(contractId: string): VoteState {
  const s = readState<Partial<VoteState>>(contractId);
  return { votes: s.votes ?? {} };
}

export function initProblemVote(contractId: string, seed: Record<string, VoteDir> = {}): void {
  writeState<VoteState>(contractId, { votes: { ...seed } });
}

export function problemVoteRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_votes':
      return s.votes;
    case 'get_my_vote':
      return s.votes[caller] ?? null;
    case 'get_tally': {
      let up = 0;
      let down = 0;
      for (const v of Object.values(s.votes)) {
        if (v === 'up') up += 1;
        else down += 1;
      }
      return { up, down, total: up + down };
    }
    default:
      return null;
  }
}

export function problemVoteWrite(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'upvote':
      s.votes[caller] = 'up';
      writeState(contractId, s);
      return null;
    case 'downvote':
      s.votes[caller] = 'down';
      writeState(contractId, s);
      return null;
    case 'remove_vote':
      delete s.votes[caller];
      writeState(contractId, s);
      return null;
    default:
      return null;
  }
}
