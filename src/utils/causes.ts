import type { Comment, CommentVote } from '../components/collaboration/flows/discussion/discussionApi';

/**
 * Causes ranking (S35, rulings D4/D5). ROOT comments only — replies are conversation,
 * not candidate causes, and the contract refuses votes on them. Pure; no I/O.
 */
export const TOP_CAUSES_CARRIED = 15; // carried into the Solutions board
export const TOP_CAUSES_ALIGN = 5;    // a new solution must align to one of these

export interface VoteTally { up: number; down: number }
export interface CauseRank { comment: Comment; up: number; down: number; score: number; rank: number }

export function tallyVotes(votes: CommentVote[]): Record<string, VoteTally> {
  const out: Record<string, VoteTally> = {};
  for (const v of votes) {
    const t = (out[v.commentId] ||= { up: 0, down: 0 });
    if (v.direction === 'up') t.up += 1; else t.down += 1;
  }
  return out;
}

export function myVote(votes: CommentVote[], publicKey: string, commentId: string): 'up' | 'down' | null {
  const v = votes.find((x) => x.voter === publicKey && x.commentId === commentId);
  return v ? v.direction : null;
}

/** score = up − down; ties → older first; deleted roots excluded. rank is 1-based. */
export function rankCauses(comments: Comment[], votes: CommentVote[]): CauseRank[] {
  const tally = tallyVotes(votes);
  return comments
    .filter((c) => !c.parentId && !c.deleted)
    .map((c) => { const t = tally[c.id] ?? { up: 0, down: 0 }; return { comment: c, up: t.up, down: t.down, score: t.up - t.down, rank: 0 }; })
    .sort((a, b) => b.score - a.score || a.comment.timestamp - b.comment.timestamp)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
