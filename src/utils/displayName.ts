import type { IProfile } from '../services/interfaces';

/**
 * The single source of truth for a member's byline name. Prefers an opt-in
 * public display name / pseudonym; falls back to first+last, then a truncated
 * key. Keep bylines going through this so pseudonymity is honoured everywhere.
 */
export function displayNameFor(profile: Partial<IProfile> | null | undefined, fallbackKey?: string): string {
  const pseudonym = profile?.displayName?.trim();
  if (pseudonym) return pseudonym;
  const full = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
  if (full) return full;
  return fallbackKey ? `${fallbackKey.slice(0, 8)}…` : '';
}
