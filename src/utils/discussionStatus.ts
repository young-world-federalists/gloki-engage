import type { BadgeTone } from '../components/shared/Badge';
import type { Comment, CommentVote } from '../components/collaboration/flows/discussion/discussionApi';
import { tallyVotes } from './causes';

/**
 * Five-band discussion status (S35, rulings D6/F3). Computed over ROOT comments only —
 * do not "fix" this to include replies: replies cannot be voted on (D4) and the pill
 * claims to measure agreement about causes. Sample = the ≤10 root comments with the most
 * total votes. agreement = Σ|up−down| / Σ(up+down) over the sample.
 */
export type DiscussionStatusKey = 'open' | 'contested' | 'divided' | 'converging' | 'consensus';
export interface DiscussionStatus { key: DiscussionStatusKey; agreement: number; votes: number; votedComments: number; participants: number }
export const STATUS_VOTE_FLOOR = 10;
export const MIN_VOTED_COMMENTS = 3;
export const MIN_PARTICIPANTS = 3;   // beside STATUS_VOTE_FLOOR / MIN_VOTED_COMMENTS
export const STATUS_SAMPLE = 10;
export const STATUS_THRESHOLDS = { contested: 0.25, divided: 0.5, converging: 0.75 } as const;
export const STATUS_META: Record<DiscussionStatusKey, { labelKey: string; labelDefault: string; tone: BadgeTone }> = {
  open:       { labelKey: 'causes.status.open',       labelDefault: 'New',        tone: 'neutral' },
  contested:  { labelKey: 'causes.status.contested',  labelDefault: 'Contested',  tone: 'warning' },
  divided:    { labelKey: 'causes.status.divided',    labelDefault: 'Divided',    tone: 'info' },
  converging: { labelKey: 'causes.status.converging', labelDefault: 'Converging', tone: 'primary' },
  consensus:  { labelKey: 'causes.status.consensus',  labelDefault: 'Consensus',  tone: 'success' },
};

export function computeDiscussionStatus(comments: Comment[], votes: CommentVote[]): DiscussionStatus {
  const tally = tallyVotes(votes);
  const roots = comments.filter((c) => !c.parentId && !c.deleted);
  const voted = roots
    .map((c) => ({ id: c.id, ...(tally[c.id] ?? { up: 0, down: 0 }) }))
    .filter((r) => r.up + r.down > 0)
    .sort((a, b) => (b.up + b.down) - (a.up + a.down))
    .slice(0, STATUS_SAMPLE);
  const totalVotes = roots.reduce((n, c) => n + ((tally[c.id]?.up ?? 0) + (tally[c.id]?.down ?? 0)), 0);
  // F12: count unique voters over votes on ROOT non-deleted comments only — a
  // vote left on a reply (never possible via the UI, D4) or on a since-deleted
  // root must not inflate the "N Gloki participants" sentence.
  const rootIds = new Set(roots.map((c) => c.id));
  const participants = new Set(votes.filter((v) => rootIds.has(v.commentId)).map((v) => v.voter)).size;
  const base = { votes: totalVotes, votedComments: voted.length, participants };
  // F3 + S35 R3 guard 1: three floors, all counted before the formula runs. MIN_PARTICIPANTS is
  // what makes `status.participants >= 3`, which is why causes.status.scoped needs no singular form.
  if (totalVotes < STATUS_VOTE_FLOOR || voted.length < MIN_VOTED_COMMENTS || participants < MIN_PARTICIPANTS) {
    return { key: 'open', agreement: 0, ...base };
  }
  const num = voted.reduce((s, r) => s + Math.abs(r.up - r.down), 0);
  const den = voted.reduce((s, r) => s + r.up + r.down, 0);
  const agreement = den === 0 ? 0 : num / den;
  const band: DiscussionStatusKey =
    agreement < STATUS_THRESHOLDS.contested ? 'contested'
    : agreement < STATUS_THRESHOLDS.divided ? 'divided'
    : agreement < STATUS_THRESHOLDS.converging ? 'converging'
    : 'consensus';
  // S35 R3 guard 2 (F4): `agreement` is D6's ruled formula and is sign-blind — a sample the
  // community unanimously REJECTED scores 1.0. The formula and its thresholds are untouched; a
  // non-positive net score simply cannot reach the two bands that make an external claim.
  const net = voted.reduce((s, r) => s + r.up - r.down, 0);
  const key: DiscussionStatusKey =
    net > 0 || (band !== 'converging' && band !== 'consensus') ? band : 'divided';
  return { key, agreement, ...base };
}
