// The web-of-trust model — pure, dependency-free so any layer (incl. the demo
// contract) can import it without an import cycle. Confirmed with Eston 2026-06-03:
// Verified = vouched by >= 4 community members; onboarding seeds 2 (pending).
//
// ONE PERSON, ONE VOTE: permission rules gate ELIGIBILITY to act, never the
// WEIGHT of a vote. An eligible member's vote always counts exactly the same as
// any other eligible member's. Never make participation plutocratic.

export type TrustState = 'verified' | 'vouched' | 'unverified';
export type StageRule = 'anyone' | 'members' | 'verified';
export type PipelineStage = 'problem' | 'discussion' | 'proposals' | 'vote' | 'mandate';

export const VERIFIED_THRESHOLD = 4;
export const ONBOARDING_SEED = 2;

export const PIPELINE_STAGES: PipelineStage[] = ['problem', 'discussion', 'proposals', 'vote', 'mandate'];
export const STAGE_RULES: StageRule[] = ['anyone', 'members', 'verified'];

export const DEFAULT_STAGE_PERMISSIONS: Record<PipelineStage, StageRule> = {
  problem: 'members',
  discussion: 'members',
  proposals: 'members',
  vote: 'verified',
  mandate: 'verified',
};

/** Vouch count -> trust state. */
export function resolveTrustState(vouchCount: number): TrustState {
  if (vouchCount >= VERIFIED_THRESHOLD) return 'verified';
  if (vouchCount >= 1) return 'vouched';
  return 'unverified';
}

/** Whether the current user may ACT at a stage (not whether they may view it). */
export function canParticipate(rule: StageRule, trust: TrustState, isMember: boolean): boolean {
  if (rule === 'anyone') return true;
  if (rule === 'members') return isMember;
  return isMember && trust === 'verified'; // rule === 'verified'
}
