// Lane E — MandatePage runtime helpers (owned: `src/components/mandate/**`).
//
// Resolves an initiative to its published Mandate (by title, like
// ProblemStage.demo.ts), and holds a session-scoped, in-memory adopters store so
// a viewer's endorsement appears immediately and survives navigation within the
// session. UI-only mockup — nothing here touches a backend.

import { INITIATIVES } from '../../services/demo/fixtures/problems';
import {
  MANDATES_BY_KEY,
  DEFAULT_MANDATE_KEY,
  type PublishedMandate,
  type MandateAdopter,
  type AdopterType,
  type AdoptionLevel,
} from '../../services/demo/fixtures/mandate';

/** Initiative title → flagship key, built once from the static slate. */
const KEY_BY_TITLE = new Map(INITIATIVES.map((i) => [i.title, i.key]));

/**
 * Resolve the published Mandate for an initiative title. Falls back to the
 * flagship water mandate so any initiative that reaches the mandate stage still
 * shows a credible artifact (mockup behaviour, by design).
 */
export function getPublishedMandate(title?: string): PublishedMandate {
  if (title) {
    const key = KEY_BY_TITLE.get(title);
    if (key && MANDATES_BY_KEY[key]) return MANDATES_BY_KEY[key];
  }
  return MANDATES_BY_KEY[DEFAULT_MANDATE_KEY];
}

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
  };
  const list = sessionAdopters.get(mandate.id) ?? [];
  sessionAdopters.set(mandate.id, [adopter, ...list]);
  return adopter;
}
