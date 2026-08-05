// Mock approval_contract.py
import type { IMethod } from '../../interfaces';
import { normalizeSources, type SourceLink } from '../../../utils/sources';
import { readState, writeState } from '../demoState';

interface ExpertReview {
  expert: string;         // public key of the reviewing expert
  metrics: string[];      // "how we'll know it's working" — consumed by S6 as indicators
  note?: string;          // optional short review note
  assessment?: string;    // S12: structured expert assessment (verdict/reasoning)
  credentials?: string;   // S12: self-described affiliation shown on the badge (e.g. "Epidemiologist, WHO")
  sources?: SourceLink[]; // S12: citations backing the review
  timestamp: number;
}

interface MergeSuggestion {
  target: string;     // id of the proposal this one is suggested to merge into
  suggester: string;  // public key of the member who suggested it
  timestamp: number;
  decision?: 'accepted' | 'declined'; // S33: the source author's answer; undefined = still open
}

export interface Proposal {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  coAuthors?: string[];
  // --- S4 commitments/metrics spine (all optional, backward-compatible) ---
  commitments?: string[];           // authored in the add-solution popup (≥1)
  metrics?: string[];               // S12: author-PROPOSED indicators (distinct from expert-validated); NOT fed to useMandate
  sources?: SourceLink[];           // S12: citations the author attached to the solution
  expertReviewRequests?: string[];  // public keys of members who requested review (1p1v)
  expertReviews?: ExpertReview[];   // experts who reviewed, each attaching metrics
  mergeSuggestions?: MergeSuggestion[]; // solution→solution merge suggestions (suggest-only)
  mergedInto?: string;              // S33: set when the author ACCEPTS a merge suggestion
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

// Sanitise a commitments array: trim, drop empties, cap to 3 lines × 280 chars.
// FOR OURI: `add_proposal` gains optional `commitments` (string list) authored
// in the add-solution popup; the winning proposal's commitments become the
// Mandate's "What we commit to" (S6). ≥1 is enforced in the UI, not here.
function cleanStringList(raw: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0 && x.length <= maxLen)
    .slice(0, maxItems);
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
      const commitments = cleanStringList(method.values?.commitments, 3, 280);
      // S12: author may propose indicator metrics + attach citations. Author metrics
      // are kept DISTINCT from expert-validated metrics (useMandate reads only the
      // latter). FOR OURI: `add_proposal` gains optional `metrics` + `sources`.
      const metrics = cleanStringList(method.values?.metrics, 3, 280);
      const sources = normalizeSources(method.values?.sources);
      s.proposals[id] = { id, text, author: caller, timestamp: Date.now(), coAuthors, commitments, metrics, sources };
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
    case 'request_expert_review': {
      // FOR OURI: a 1p1v member signal that a solution should get expert review.
      // Toggles the caller in/out of the proposal's expertReviewRequests. This
      // does NOT mark the solution expert-reviewed — it narratively prompts the
      // Gloki Team to solicit experts (see add_expert_review).
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      const p = s.proposals[pid];
      const reqs = Array.isArray(p.expertReviewRequests) ? p.expertReviewRequests : [];
      p.expertReviewRequests = reqs.includes(caller)
        ? reqs.filter((k) => k !== caller)
        : [...reqs, caller];
      writeState(contractId, s);
      return null;
    }
    case 'add_expert_review': {
      // FOR OURI: an expert attaches metrics ("how we'll know it's working") to a
      // solution. Demo gate is permissive; the real contract MUST gate this on the
      // caller holding the expert role. One review per expert per proposal (replace
      // on re-submit). The winning proposal's metrics become the Mandate's
      // "How we'll know it's working" (S6).
      const pid = method.values?.proposal_id as string | undefined;
      if (!pid || !(pid in s.proposals)) return { error: 'Unknown proposal' };
      const metrics = cleanStringList(method.values?.metrics, 5, 280);
      if (metrics.length === 0) return { error: 'At least one metric is required' };
      const rawNote = method.values?.note;
      const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim().slice(0, 500) : undefined;
      // S12: an expert also attaches a structured assessment, self-described
      // credentials, and citations. FOR OURI: `add_expert_review` gains optional
      // `assessment` + `credentials` + `sources`.
      const rawAssessment = method.values?.assessment;
      const assessment = typeof rawAssessment === 'string' && rawAssessment.trim() ? rawAssessment.trim().slice(0, 700) : undefined;
      const rawCredentials = method.values?.credentials;
      const credentials = typeof rawCredentials === 'string' && rawCredentials.trim() ? rawCredentials.trim().slice(0, 120) : undefined;
      const sources = normalizeSources(method.values?.sources);
      const p = s.proposals[pid];
      const reviews = Array.isArray(p.expertReviews) ? p.expertReviews.filter((r) => r.expert !== caller) : [];
      reviews.push({ expert: caller, metrics, note, assessment, credentials, sources, timestamp: Date.now() });
      p.expertReviews = reviews;
      writeState(contractId, s);
      return null;
    }
    case 'suggest_proposal_merge': {
      // FOR OURI: a suggest-only solution→solution merge (never auto-merges).
      // Records the suggestion on the source proposal pointing at the target.
      const sourceId = method.values?.source_id as string | undefined;
      const targetId = method.values?.target_id as string | undefined;
      if (!sourceId || !(sourceId in s.proposals)) return { error: 'Unknown source proposal' };
      if (!targetId || !(targetId in s.proposals) || targetId === sourceId) return { error: 'Invalid merge target' };
      const p = s.proposals[sourceId];
      const existing = Array.isArray(p.mergeSuggestions) ? p.mergeSuggestions : [];
      if (!existing.some((m) => m.target === targetId && m.suggester === caller)) {
        existing.push({ target: targetId, suggester: caller, timestamp: Date.now() });
      }
      p.mergeSuggestions = existing;
      writeState(contractId, s);
      return null;
    }
    // S33: the other half of `suggest_proposal_merge`. Until now a suggestion was
    // write-only — stored and rendered by nothing, so the author it was addressed
    // to never learned it existed. Only the SOURCE solution's author may decide:
    // the suggestion asks to fold THEIR solution into someone else's.
    case 'decide_merge_suggestion': {
      const sourceId = method.values?.source_id as string | undefined;
      const targetId = method.values?.target_id as string | undefined;
      const decision = method.values?.decision as string | undefined;
      if (!sourceId || !(sourceId in s.proposals)) return { error: 'Unknown source proposal' };
      if (decision !== 'accepted' && decision !== 'declined') return { error: 'Invalid decision' };
      const p = s.proposals[sourceId];
      // FOR OURI: the real contract MUST enforce this — the demo seam is the only
      // thing standing between a stranger and someone else's merge decision.
      if (p.author !== caller) return { error: 'Only the solution’s author can decide' };
      const suggestions = Array.isArray(p.mergeSuggestions) ? p.mergeSuggestions : [];
      // Suggestions are deduped per {target, suggester}, so two members can
      // legitimately suggest the SAME target. Decide every entry for that target
      // — matching only the first left the others permanently undecidable.
      const matches = suggestions.filter((m) => m.target === targetId);
      if (matches.length === 0) return { error: 'Unknown merge suggestion' };
      for (const m of matches) m.decision = decision;
      // Accepting records the outcome on the solution; it deliberately does NOT
      // move approval counts (folding the tallies is a governance change, not a
      // display one).
      p.mergedInto = decision === 'accepted' ? targetId : undefined;
      writeState(contractId, s);
      return null;
    }
    default:
      return null;
  }
}
