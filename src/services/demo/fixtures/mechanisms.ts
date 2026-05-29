// Lane D — mechanism fixtures.
//
// Deterministic pattern generators that fabricate believable participation for
// each voting mechanism (problem upvotes, approval voting, quadratic voting,
// conviction staking). Deterministic so demo state reproduces across reloads.
// Lane D extends this file with delegation sample data.

import type { Persona } from './identity';

export function votePattern(personas: Persona[], seed: number): Record<string, 'up' | 'down'> {
  const votes: Record<string, 'up' | 'down'> = {};
  let s = seed || 1;
  for (const p of personas) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    votes[p.publicKey] = (s % 100) < 78 ? 'up' : 'down'; // ~78% approval baseline
  }
  return votes;
}

export function approvalPattern(
  personas: Persona[],
  proposalIds: string[],
  seed: number,
): Record<string, string[]> {
  const approvals: Record<string, string[]> = {};
  let s = seed || 1;
  for (const p of personas) {
    const approved: string[] = [];
    for (const pid of proposalIds) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if ((s % 100) < 55) approved.push(pid);
    }
    if (approved.length > 0) approvals[p.publicKey] = approved;
  }
  return approvals;
}

export function qvAllocationPattern(
  personas: Persona[],
  proposalIds: string[],
  creditsPerVoter: number,
  seed: number,
): Record<string, Record<string, number>> {
  const alloc: Record<string, Record<string, number>> = {};
  let s = seed || 1;
  for (const p of personas) {
    const perVoter: Record<string, number> = {};
    let remaining = creditsPerVoter;
    const count = proposalIds.length;
    for (let i = 0; i < count; i += 1) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if (i === count - 1) {
        perVoter[proposalIds[i]] = remaining;
      } else {
        const maxHere = Math.floor(remaining / (count - i));
        const amount = s % (maxHere + 1);
        perVoter[proposalIds[i]] = amount;
        remaining -= amount;
      }
    }
    // drop zeros to mirror the mock's behaviour
    const cleaned: Record<string, number> = {};
    for (const [pid, credits] of Object.entries(perVoter)) {
      if (credits > 0) cleaned[pid] = credits;
    }
    alloc[p.publicKey] = cleaned;
  }
  return alloc;
}

const DURATIONS: Array<'1w' | '1m' | '3m' | '6m' | '1y'> = ['1w', '1m', '3m', '6m', '1y'];

export function convictionPattern(
  personas: Persona[],
  participationRate: number,
  maxAmount: number,
  seed: number,
): Array<{ voter: string; amount: number; duration: '1w' | '1m' | '3m' | '6m' | '1y'; country: string; timestamp: number }> {
  const stakes: Array<{ voter: string; amount: number; duration: '1w' | '1m' | '3m' | '6m' | '1y'; country: string; timestamp: number }> = [];
  let s = seed || 1;
  const now = Date.now();
  for (const p of personas) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    if ((s % 100) / 100 >= participationRate) continue;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const amount = Math.max(1, Math.floor(((s % 100) / 100) * maxAmount));
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const duration = DURATIONS[s % DURATIONS.length];
    stakes.push({
      voter: p.publicKey,
      amount,
      duration,
      country: p.country,
      timestamp: now - (s % (7 * 24 * 3600 * 1000)),
    });
  }
  return stakes;
}
