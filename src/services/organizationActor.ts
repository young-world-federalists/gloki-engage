import type { AdopterType } from './demo/fixtures/mandate';

/**
 * S33 — the organization actor.
 *
 * Organizations are deliberately NOT platform users. They do not join
 * communities, deliberate, propose, or vote — the whole point of one-person-one-
 * vote is that an institution cannot outweigh a person. What they *can* do is
 * respond to a finished mandate: endorse it, or subscribe and report progress
 * against it. That is a real role, and it is the only one.
 *
 * So this is a parallel actor sitting beside the member identity, not a
 * privilege level within it. It persists locally, exactly like `DigitalAgent`
 * (`components/identity/agent/digitalAgentStore.ts`) — no contract, no wire
 * method, nothing for the backend to implement yet.
 *
 * FOR OURI: when organizations become real, this record is what needs a verified
 * counterpart — `MandateAdopter.verified` is the existing attestation hook.
 * Until then every organization-added endorsement is "claimed", never "verified".
 */

const ORG_KEY = 'gloki.organization';

export interface OrganizationActor {
  name: string;
  type: AdopterType;
  /** ISO 3166-1 alpha-2, or omitted for international/regional bodies. */
  country?: string;
  createdAt: number;
}

function isOrganizationActor(value: unknown): value is OrganizationActor {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<OrganizationActor>;
  return typeof v.name === 'string' && v.name.trim().length > 0 && typeof v.type === 'string';
}

// Cached so `useSyncExternalStore`-style consumers get a stable reference and
// don't re-render forever (the digitalAgentStore lesson).
let cached: OrganizationActor | null | undefined;

export function getOrganization(): OrganizationActor | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(ORG_KEY);
    if (!raw) {
      cached = null;
      return cached;
    }
    const parsed: unknown = JSON.parse(raw);
    cached = isOrganizationActor(parsed) ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function saveOrganization(org: Omit<OrganizationActor, 'createdAt'>): OrganizationActor {
  const record: OrganizationActor = { ...org, createdAt: Date.now() };
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(record));
  } catch {
    /* storage blocked — the session still works, it just won't survive reload */
  }
  cached = record;
  return record;
}

/**
 * Drop the memoised value so the next `getOrganization()` re-reads storage.
 * Needed by the cross-tab `storage` listener: without it the listener fires but
 * `getSnapshot` returns the same cached reference and React bails out.
 */
export function invalidateOrganizationCache(): void {
  cached = undefined;
}

export function clearOrganization(): void {
  try {
    localStorage.removeItem(ORG_KEY);
  } catch {
    /* nothing to clear */
  }
  cached = null;
}

/** True when the current session is acting as an organization, not a person. */
export function isOrganizationSession(): boolean {
  return getOrganization() !== null;
}
