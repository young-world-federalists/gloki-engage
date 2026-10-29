// Mock qv_contract.py (Quadratic Voting)
import type { IMethod } from '../../interfaces';
import { readState, writeState } from '../demoState';

interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

interface QVState {
  proposals: Record<string, Proposal>;
  count: number;
  config: { credits_per_voter: number; status: 'open' | 'closed'; owner: string };
  allocations: Record<string, Record<string, number>>;
}

function load(contractId: string): QVState {
  const s = readState<Partial<QVState>>(contractId);
  return {
    proposals: s.proposals ?? {},
    count: s.count ?? 0,
    config: s.config ?? { credits_per_voter: 100, status: 'open', owner: '' },
    allocations: s.allocations ?? {},
  };
}

export function initQV(
  contractId: string,
  owner: string,
  proposals: Proposal[] = [],
  allocations: Record<string, Record<string, number>> = {},
  credits: number = 100,
): void {
  const map: Record<string, Proposal> = {};
  for (const p of proposals) map[p.id] = p;
  writeState<QVState>(contractId, {
    proposals: map,
    count: proposals.length,
    config: { credits_per_voter: credits, status: 'open', owner },
    allocations,
  });
}

function cleanText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return null;
  return trimmed;
}

export function qvRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_config':
      return { credits_per_voter: s.config.credits_per_voter, status: s.config.status };
    case 'get_proposals':
      return s.proposals;
    case 'get_allocations':
      return s.allocations;
    case 'get_my_allocation':
      return s.allocations[caller] ?? {};
    case 'get_results': {
      const totals: Record<string, number> = {};
      for (const alloc of Object.values(s.allocations)) {
        for (const [pid, credits] of Object.entries(alloc)) {
          const votes = Math.sqrt(credits);
          totals[pid] = (totals[pid] ?? 0) + votes;
        }
      }
      return totals;
    }
    default:
      return null;
  }
}

export function qvWrite(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'add_proposal': {
      const text = cleanText(method.values?.text);
      if (!text) return { error: 'Proposal text must be between 1 and 500 characters' };
      const id = 'p' + s.count;
      s.proposals[id] = { id, text, author: caller, timestamp: Date.now() };
      s.count += 1;
      writeState(contractId, s);
      return id;
    }
    case 'set_credits': {
      if (s.config.owner && s.config.owner !== caller) {
        return { error: 'Only the contract owner can update voting settings' };
      }
      const credits = method.values?.credits as number | undefined;
      if (typeof credits !== 'number' || credits <= 0 || !Number.isInteger(credits)) {
        return { error: 'Credits per voter must be a positive whole number' };
      }
      s.config.credits_per_voter = credits;
      writeState(contractId, s);
      return null;
    }
    case 'set_status': {
      if (s.config.owner && s.config.owner !== caller) {
        return { error: 'Only the contract owner can update voting settings' };
      }
      const status = method.values?.status as string | undefined;
      if (status !== 'open' && status !== 'closed') return { error: 'Invalid voting status' };
      s.config.status = status;
      writeState(contractId, s);
      return null;
    }
    case 'allocate': {
      if (s.config.status !== 'open') return { error: 'Voting is not open' };
      const raw = method.values?.allocations;
      if (!raw || typeof raw !== 'object') return { error: 'Allocations must be an object' };
      const cleaned: Record<string, number> = {};
      let total = 0;
      for (const [pid, credits] of Object.entries(raw as Record<string, unknown>)) {
        if (!(pid in s.proposals)) return { error: 'Unknown proposal' };
        if (typeof credits !== 'number' || !Number.isInteger(credits) || credits < 0) {
          return { error: 'Credits must be whole numbers' };
        }
        if (credits === 0) continue;
        cleaned[pid] = credits;
        total += credits;
      }
      if (total > s.config.credits_per_voter) return { error: 'Exceeds credit budget' };
      s.allocations[caller] = cleaned;
      writeState(contractId, s);
      return null;
    }
    default:
      return null;
  }
}
