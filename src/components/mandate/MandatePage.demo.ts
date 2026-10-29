// Lane E — MandatePage runtime helpers (owned: `src/components/mandate/**`).
//
// Holds a session-scoped, in-memory adopters store so a viewer's endorsement
// appears immediately and survives navigation within the session.
// Mandate resolution is now handled by `useMandate` (src/hooks/useMandate.ts).
// UI-only mockup — nothing here touches a backend.

import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  type MandateAdopter,
  type AdopterType,
  type AdoptionLevel,
} from '../../services/demo/fixtures/mandate';

// ---------------------------------------------------------------------------
// Optimistic adopters store — seeded from the fixture, extended in-session.
// ---------------------------------------------------------------------------

const sessionAdopters = new Map<string, MandateAdopter[]>();

/** Seeded adopters plus any added this session (newest first). */
export function getAdopters(mandateId: string): MandateAdopter[] {
  const mandate = MANDATES_BY_KEY[mandateId] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];
  const added = sessionAdopters.get(mandate.id) ?? [];
  return [...added, ...mandate.adopters];
}

export interface EndorsementInput {
  name: string;
  type: AdopterType;
  country?: string;
  level: AdoptionLevel;
  /** Optional first progress note (subscribers only). */
  progressNote?: string;
}

/**
 * Record a viewer's endorsement/subscription against a mandate and return the
 * new adopter. In-memory only — persists for the session, resets on reload.
 */
export function addEndorsement(mandateId: string, input: EndorsementInput): MandateAdopter {
  const mandate = MANDATES_BY_KEY[mandateId] ?? MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];
  const adopter: MandateAdopter = {
    id: `endorse-${Date.now()}`,
    name: input.name.trim(),
    type: input.type,
    country: input.country,
    level: input.level,
    progress: input.level === 'subscribed' ? 0 : undefined,
    progressNote: input.level === 'subscribed' ? input.progressNote?.trim() || undefined : undefined,
    since: 'Just now',
    verified: false,
  };
  const list = sessionAdopters.get(mandate.id) ?? [];
  sessionAdopters.set(mandate.id, [adopter, ...list]);
  return adopter;
}
