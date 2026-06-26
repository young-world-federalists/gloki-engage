// Mock approval_contract.py
import type { IMethod } from '../../interfaces';
import { readState, writeState } from '../demoState';

interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  coAuthors?: string[];
}

interface ApprovalState {
  proposals: Record<string, Proposal>;
  count: number;
  approvals: Record<string, Record<string, boolean>>;
}

function load(contractId: string): ApprovalState {
  const s = readState<Partial<ApprovalState>>(contractId);
  return {
    proposals: s.proposals ?? {},
    count: s.count ?? 0,
    approvals: s.approvals ?? {},
  };
}

export function initApproval(
  contractId: string,
  proposals: Proposal[] = [],
  approvals: Record<string, string[]> = {},
): void {
  const map: Record<string, Proposal> = {};
  for (const p of proposals) map[p.id] = p;
  const approvalDict: Record<string, Record<string, boolean>> = {};
  for (const [voter, ids] of Object.entries(approvals)) {
    approvalDict[voter] = {};
    for (const id of ids) approvalDict[voter][id] = true;
  }
  writeState<ApprovalState>(contractId, {
    proposals: map,
    count: proposals.length,
    approvals: approvalDict,
  });
}

function cleanText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return null;
  return trimmed;
}

export function approvalRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_proposals':
      return s.proposals;
    case 'get_approvals':
      return s.approvals;
    case 'get_approval_counts': {
      const counts: Record<string, number> = {};
      for (const pid of Object.keys(s.proposals)) counts[pid] = 0;
      for (const votes of Object.values(s.approvals)) {
        for (const [pid, approved] of Object.entries(votes)) {
          if (approved && pid in counts) counts[pid] += 1;
        }
      }
      return counts;
    }
    case 'get_my_approvals':
      return s.approvals[caller] ?? {};
    default:
      return null;
  }
}

export function approvalWrite(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'add_proposal': {
      const text = cleanText(method.values?.text);
      if (!text) return { error: 'Proposal text must be between 1 and 500 characters' };
      const id = 'p' + s.count;
      // coAuthors (Write Together, S3): optional credited co-authors carried from
      // a co-owned draft. FOR OURI: `add_proposal` gains optional `co_authors`.
      const rawCo = method.values?.co_authors;
      const coAuthors = Array.isArray(rawCo) ? rawCo.map((x) => String(x)).filter(Boolean) : [];
      s.proposals[id] = { id, text, author: caller, timestamp: Date.now(), coAuthors };
      s.count += 1;
      writeState(contractId, s);
      return id;
    }
    case 'approve': {
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      if (!s.approvals[caller]) s.approvals[caller] = {};
      s.approvals[caller][pid] = true;
      writeState(contractId, s);
      return null;
    }
    case 'withdraw_approval': {
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      if (s.approvals[caller]) {
        delete s.approvals[caller][pid];
      }
      writeState(contractId, s);
      return null;
    }
    default:
      return null;
  }
}
