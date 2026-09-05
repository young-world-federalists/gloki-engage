import type { Comment, CommentVote } from '../components/collaboration/flows/discussion/discussionApi';
import type { ImpactAssessment } from '../components/collaboration/flows/voting/approvalApi';
import { tallyVotes } from './causes';

/**
 * Writer ranking + assessor eligibility ladder (S35, rulings D7/F7/F8/D12). Pure; no I/O.
 *
 * `causeScore` = Σ (up − down) over the writer's ROOT, non-deleted comments (replies don't
 * count — the contract refuses votes on them, same as `rankCauses` in `causes.ts`).
 * `solutionScore` = Σ `approvalCounts[p.id]` over every solution where the writer is author
 * or co-author (each co-author gets the solution's full approval count, not a split share).
 * `firstAt` = the earliest timestamp among the writer's root comments and authored/co-authored
 * proposals. A key with no root comment and no solution never appears — a writer who only
 * replies is not a writer.
 *
 * F7 sort (pinned, all four keys are stored data): `total desc → causeScore desc →
 * firstAt asc → publicKey asc`.
 */
export interface WriterScore {
  publicKey: string;
  causeScore: number;
  solutionScore: number;
  total: number;
  firstAt: number;
}

export type EligibilityRung = 'strict' | 'no-floor' | 'top-25' | 'any-verified';

export const TOP_WRITERS = 10;
export const WIDE_WRITERS = 25;
export const ASSESSORS_PER_SOLUTION = 3;

interface WriterAccumulator {
  causeScore: number;
  solutionScore: number;
  timestamps: number[];
}

export function rankWriters(
  comments: Comment[],
  votes: CommentVote[],
  proposals: Array<{ id: string; author: string; coAuthors?: string[]; timestamp: number | string }>,
  approvalCounts: Record<string, number>,
): WriterScore[] {
  const tally = tallyVotes(votes);
  const byWriter = new Map<string, WriterAccumulator>();

  const get = (key: string): WriterAccumulator => {
    let acc = byWriter.get(key);
    if (!acc) {
      acc = { causeScore: 0, solutionScore: 0, timestamps: [] };
      byWriter.set(key, acc);
    }
    return acc;
  };

  for (const c of comments) {
    if (c.parentId || c.deleted) continue; // only root, non-deleted comments count as causes
    const t = tally[c.id] ?? { up: 0, down: 0 };
    const acc = get(c.author);
    acc.causeScore += t.up - t.down;
    acc.timestamps.push(c.timestamp);
  }

  for (const p of proposals) {
    const ts = Number(p.timestamp);
    const count = approvalCounts[p.id] ?? 0;
    const authors = [p.author, ...(p.coAuthors ?? [])];
    for (const author of authors) {
      const acc = get(author);
      acc.solutionScore += count;
      acc.timestamps.push(ts);
    }
  }

  const scores: WriterScore[] = [];
  for (const [publicKey, acc] of byWriter) {
    scores.push({
      publicKey,
      causeScore: acc.causeScore,
      solutionScore: acc.solutionScore,
      total: acc.causeScore + acc.solutionScore,
      firstAt: Math.min(...acc.timestamps),
    });
  }

  return scores.sort((a, b) =>
    b.total - a.total
    || b.causeScore - a.causeScore
    || a.firstAt - b.firstAt
    || a.publicKey.localeCompare(b.publicKey));
}

function authorsOf(p: { author: string; coAuthors?: string[] }): string[] {
  return [p.author, ...(p.coAuthors ?? [])];
}

/** Order a rung's candidate keys by writer rank (index in `writers`); any key not in
 * `writers` (a verified member who is not a ranked writer, only possible at `any-verified`)
 * sorts after all ranked writers, by `publicKey` asc. */
function orderByRank(keys: string[], writers: WriterScore[]): string[] {
  const rankIndex = new Map(writers.map((w, i) => [w.publicKey, i]));
  const ranked = keys.filter((k) => rankIndex.has(k)).sort((a, b) => rankIndex.get(a)! - rankIndex.get(b)!);
  const unranked = keys.filter((k) => !rankIndex.has(k)).sort((a, b) => a.localeCompare(b));
  return [...ranked, ...unranked];
}

/**
 * F8 eligibility ladder. `never(k)` — the solution's author/co-authors, the author/co-authors
 * of every OTHER solution sharing its `causeId` (only when `causeId` is non-empty), and every
 * existing assessor's author — is NEVER relaxed at any rung. Rungs, in order: `strict` (top 10
 * by `total` ∧ `causeScore > 0`) → `no-floor` (top 10, no floor) → `top-25` (top 25) →
 * `any-verified` (`verifiedKeys`). Returns the first rung whose filtered set has at least
 * `ASSESSORS_PER_SOLUTION − existing.length` members; if none does, returns the last rung
 * (`any-verified`) with whatever it yields. A solution that already has
 * `ASSESSORS_PER_SOLUTION` assessments has no room left, reported at rung `'strict'`.
 */
export function eligibleAssessors(args: {
  proposal: { id: string; author: string; coAuthors?: string[]; causeId?: string };
  allProposals: Array<{ id: string; author: string; coAuthors?: string[]; causeId?: string }>;
  writers: WriterScore[];
  verifiedKeys: string[];
  existing: ImpactAssessment[];
}): { keys: string[]; rung: EligibilityRung } {
  const { proposal, allProposals, writers, verifiedKeys, existing } = args;

  if (existing.length >= ASSESSORS_PER_SOLUTION) return { keys: [], rung: 'strict' };

  const never = new Set<string>(authorsOf(proposal));
  if (proposal.causeId) {
    for (const p of allProposals) {
      if (p.causeId === proposal.causeId) {
        for (const k of authorsOf(p)) never.add(k);
      }
    }
  }
  for (const a of existing) never.add(a.author);

  const needed = ASSESSORS_PER_SOLUTION - existing.length;

  const top10 = writers.slice(0, TOP_WRITERS);
  const top25 = writers.slice(0, WIDE_WRITERS);

  const rungs: Array<{ rung: EligibilityRung; keys: string[] }> = [
    { rung: 'strict', keys: top10.filter((w) => w.causeScore > 0 && !never.has(w.publicKey)).map((w) => w.publicKey) },
    { rung: 'no-floor', keys: top10.filter((w) => !never.has(w.publicKey)).map((w) => w.publicKey) },
    { rung: 'top-25', keys: top25.filter((w) => !never.has(w.publicKey)).map((w) => w.publicKey) },
    { rung: 'any-verified', keys: verifiedKeys.filter((k) => !never.has(k)) },
  ];

  for (const r of rungs) {
    if (r.keys.length >= needed) return { keys: orderByRank(r.keys, writers), rung: r.rung };
  }
  const last = rungs[rungs.length - 1];
  return { keys: orderByRank(last.keys, writers), rung: last.rung };
}

export function canAssess(publicKey: string, args: Parameters<typeof eligibleAssessors>[0]): boolean {
  return eligibleAssessors(args).keys.includes(publicKey);
}
