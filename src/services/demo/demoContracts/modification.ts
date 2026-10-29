// Mock modification_contract.py
import type { IMethod } from '../../interfaces';
import { readState, writeState } from '../demoState';

interface Suggestion {
  id: string;
  field: string;
  suggested_text: string;
  author: string;
  timestamp: number;
  status: 'open' | 'accepted' | 'rejected';
}

interface ModificationState {
  suggestions: Record<string, Suggestion>;
  count: number;
  votes: Record<string, Record<string, 'approve' | 'reject'>>;
  config: { author?: string };
}

function load(contractId: string): ModificationState {
  const s = readState<Partial<ModificationState>>(contractId);
  return {
    suggestions: s.suggestions ?? {},
    count: s.count ?? 0,
    votes: s.votes ?? {},
    config: s.config ?? {},
  };
}

export function initModification(
  contractId: string,
  suggestions: Suggestion[] = [],
  author?: string,
): void {
  const map: Record<string, Suggestion> = {};
  for (const s of suggestions) map[s.id] = s;
  writeState<ModificationState>(contractId, {
    suggestions: map,
    count: suggestions.length,
    votes: {},
    config: author ? { author } : {},
  });
}

export function modificationRead(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'get_suggestions': {
      const result: Array<Suggestion & { votes_for: number; votes_against: number }> = [];
      for (let i = 0; i < s.count; i += 1) {
        const sid = 's' + i;
        if (!(sid in s.suggestions)) continue;
        const suggestion = s.suggestions[sid];
        let approve = 0;
        let reject = 0;
        const votes = s.votes[sid] ?? {};
        for (const v of Object.values(votes)) {
          if (v === 'approve') approve += 1;
          else reject += 1;
        }
        result.push({ ...suggestion, votes_for: approve, votes_against: reject });
      }
      return result;
    }
    case 'get_my_votes': {
      const result: Record<string, 'approve' | 'reject'> = {};
      for (let i = 0; i < s.count; i += 1) {
        const sid = 's' + i;
        if (sid in s.votes && caller in s.votes[sid]) {
          result[sid] = s.votes[sid][caller];
        }
      }
      return result;
    }
    default:
      return null;
  }
}

export function modificationWrite(contractId: string, method: IMethod, caller: string): unknown {
  const s = load(contractId);
  switch (method.name) {
    case 'set_author': {
      const author = method.values?.author as string | undefined;
      if (author && !s.config.author) {
        s.config.author = author;
        writeState(contractId, s);
      }
      return null;
    }
    case 'suggest_modification': {
      const field = method.values?.field as string | undefined;
      const text = method.values?.suggested_text as string | undefined;
      if (!field || typeof text !== 'string') return null;
      const id = 's' + s.count;
      s.suggestions[id] = {
        id,
        field,
        suggested_text: text,
        author: caller,
        timestamp: Date.now(),
        status: 'open',
      };
      s.count += 1;
      writeState(contractId, s);
      return id;
    }
    case 'vote_on_suggestion': {
      const sid = method.values?.suggestion_id as string | undefined;
      const vote = method.values?.vote as 'approve' | 'reject' | undefined;
      if (!sid || !(sid in s.suggestions)) return { error: 'Suggestion not found' };
      if (s.suggestions[sid].status !== 'open') return { error: 'Suggestion is no longer open' };
      if (!vote) return null;
      if (!s.votes[sid]) s.votes[sid] = {};
      s.votes[sid][caller] = vote;
      writeState(contractId, s);
      return null;
    }
    case 'author_decide': {
      if (!s.config.author) return { error: 'Original author not configured' };
      if (s.config.author !== caller) return { error: 'Only the original author can decide' };
      const sid = method.values?.suggestion_id as string | undefined;
      const decision = method.values?.decision as string | undefined;
      if (!sid || !(sid in s.suggestions)) return { error: 'Suggestion not found' };
      if (s.suggestions[sid].status !== 'open') return { error: 'Already decided' };
      s.suggestions[sid] = {
        ...s.suggestions[sid],
        status: decision === 'accept' ? 'accepted' : 'rejected',
      };
      writeState(contractId, s);
      return null;
    }
    default:
      return null;
  }
}
