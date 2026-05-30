// Lane C — deliberation fixtures.
//
// UI-only sample data for the deliberation heart of the flagship "Voices for the
// Climate" community: the threaded discussion + live co-presence (C1), the
// track-changes co-authoring of the problem statement (C2), and the
// merge-similar-proposals + expert-review surface (C3).
//
// Pure data + pure helpers only — no React, no i18n, no backend. The flow
// components import these and hold local optimistic state. Personas come from
// Lane A's identity fixture (read-only import); display copy is themed to the
// "Solar Microgrids for Off-Grid Schools" hero initiative (discussion stage) and
// the "Youth Reforestation Corps" initiative (proposals stage).

import { PERSONAS, type Persona } from './identity';

// ---------------------------------------------------------------------------
// Proposals per flagship initiative (consumed by the seed orchestrator).
// Keyed by initiative `key` (see problems.ts).
// ---------------------------------------------------------------------------
export const PROPOSALS_BY_KEY: Record<string, string[]> = {
  plastic: [
    'Phase out single-use plastic bags at lakeside markets, with refillable alternatives subsidised locally.',
    'Fund youth-run collection points that pay per kilo of recovered lake plastic.',
    'Require beverage producers to fund shoreline clean-up in proportion to packaging sold.',
    'Run school programmes that turn recovered plastic into school furniture.',
  ],
  solar: [
    'Community-owned microgrids: each school co-op owns the panels and sells surplus to neighbours.',
    'A shared maintenance-technician training programme so young people keep the grids running.',
    'Pay-as-you-go metering kept deliberately low-tech for areas with weak connectivity.',
    'A cross-border parts-and-spares pool so a fault in one village is fixed within days.',
  ],
  reforestation: [
    'A paid corps for under-25s: plant, monitor, and protect — funded per surviving tree at year three.',
    'Indigenous-species nurseries co-designed with local elders and farmers.',
    'Satellite + on-the-ground monitoring so restoration claims are independently verifiable.',
    'Agroforestry plots that combine restoration with food crops for participating families.',
    'A diaspora matching fund: every hour volunteered is matched by a sponsoring professional.',
  ],
  floods: [
    'A low-bandwidth SMS + community-radio alert chain triggered by upstream river sensors.',
    'Open river-gauge data shared across borders so downstream towns get earlier warning.',
    'Trained youth "first-alert" volunteers in each riverside ward, with charged power banks.',
    'Pre-agreed evacuation routes and safe-shelter mapping co-produced with residents.',
  ],
  water: [
    'Resilient rainwater-harvesting and filtration at every climate-stressed school.',
    'Local youth water committees trained to govern, monitor, and maintain the systems.',
    'A simple public dashboard tracking water quality and uptime, community-reported.',
  ],
};

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type DeliberationCategory = 'evidence' | 'impact' | 'solutions' | 'concerns';

/** A single threaded comment in the deliberation (C1). */
export interface DeliberationComment {
  id: string;
  author: string; // persona publicKey
  category: DeliberationCategory;
  text: string;
  hearts: number;
  parentId: string | null;
  minutesAgo: number;
}

/** A live-presence ticker event (C1) — who just arrived / is reading / is writing. */
export interface PresenceEvent {
  author: string;
  kind: 'joined' | 'viewing' | 'typing';
}

/** A track-changes edit suggestion on the problem statement (C2). */
export interface EditSuggestion {
  id: string;
  field: 'title' | 'description';
  author: string; // persona publicKey
  /** The text this suggestion was drafted against (for the inline diff). */
  baseText: string;
  /** The proposed replacement text. */
  suggestedText: string;
  rationale: string;
  hearts: number;
  status: 'open' | 'accepted' | 'rejected';
  minutesAgo: number;
}

/** One proposal that can be merged with similar others (C3). */
export interface MergeableProposal {
  id: string;
  text: string;
  author: string; // persona publicKey
}

/** A suggested merge of one proposal into a more-supported sibling (C3). */
export interface MergeSuggestion {
  sourceId: string;
  targetId: string;
  similarity: number; // 0..1, surfaced as a "looks similar" hint
}

/** A domain expert who can review proposals (C3). */
export interface ExpertProfile {
  key: string;
  name: string;
  field: string;
  country: string; // ISO 3166-1 alpha-2
}

/** An expert review attached to a proposal (C3). */
export interface ExpertReview {
  proposalId: string;
  expertKey: string;
  note: string;
}

// ---------------------------------------------------------------------------
// C1 — Threaded discussion + live co-presence
// (themed to the "Solar Microgrids for Off-Grid Schools" hero initiative)
// ---------------------------------------------------------------------------
export const DISCUSSION_COMMENTS: DeliberationComment[] = [
  {
    id: 'c1', author: 'demo-user-ke-amani', category: 'impact', parentId: null, hearts: 14, minutesAgo: 320,
    text: 'In Kisumu our school runs on a diesel generator that fails most afternoons. Lessons just stop when the power does. A community-owned microgrid would change everything for us.',
  },
  {
    id: 'c1a', author: 'demo-user-ke-wanjiru', category: 'solutions', parentId: 'c1', hearts: 6, minutesAgo: 295,
    text: 'If the school co-op owns the panels, who trains the people who fix them? That is the part that always breaks where I work.',
  },
  {
    id: 'c1b', author: 'demo-user-cd-pascal', category: 'solutions', parentId: 'c1a', hearts: 9, minutesAgo: 240,
    text: 'We could share one cross-border technician course — Lubumbashi and Nairobi hit the same faults. No reason to train in isolation.',
  },
  {
    id: 'c2', author: 'demo-user-ke-brian', category: 'evidence', parentId: null, hearts: 11, minutesAgo: 280,
    text: 'IRENA data shows community-owned grids in East Africa stay running far longer than donor-installed ones. Ownership matters more than the hardware.',
  },
  {
    id: 'c3', author: 'demo-user-mw-chisomo', category: 'concerns', parentId: null, hearts: 8, minutesAgo: 210,
    text: 'My worry is the metering. If it is too complicated, families in Mzuzu simply will not use it. Please keep it low-tech.',
  },
  {
    id: 'c3a', author: 'demo-user-mw-thoko', category: 'solutions', parentId: 'c3', hearts: 7, minutesAgo: 180,
    text: 'Agreed — pay-as-you-go with a simple SMS top-up. No smartphone required, works on the cheapest phone.',
  },
  {
    id: 'c4', author: 'demo-user-cd-joseph', category: 'solutions', parentId: null, hearts: 10, minutesAgo: 160,
    text: 'A shared parts-and-spares pool across our four countries, so one broken inverter does not shut a school for months.',
  },
  {
    id: 'c5', author: 'demo-user-ng-fatima', category: 'impact', parentId: null, hearts: 12, minutesAgo: 120,
    text: 'In Kano the bigger gap is clinics, not only schools. The same grid could keep vaccines cold overnight. Can we widen the framing?',
  },
  {
    id: 'c5a', author: 'demo-user-ng-emeka', category: 'impact', parentId: 'c5', hearts: 5, minutesAgo: 95,
    text: 'Yes — if we say schools AND clinics, far more communities will back it. Power for learning and for health.',
  },
  {
    id: 'c6', author: 'demo-user-cd-esperance', category: 'concerns', parentId: null, hearts: 6, minutesAgo: 70,
    text: 'Who covers the lean months when there is no surplus to sell? We need a plan for that, or trust in the co-op collapses.',
  },
  {
    id: 'c7', author: 'demo-user-mw-limbani', category: 'evidence', parentId: null, hearts: 9, minutesAgo: 40,
    text: 'We piloted a two-panel setup at a farm co-op in Zomba last year. Happy to share what worked — and honestly what failed.',
  },
];

/** Everyone who has taken part (drives the flag cluster + "N from M countries"). */
export const DELIBERATION_PARTICIPANTS: string[] = PERSONAS.map((p) => p.publicKey);

/** A small subset shown as "here now" for the live co-presence pulse. */
export const PRESENCE_NOW: string[] = [
  'demo-user-cd-esperance',
  'demo-user-ke-brian',
  'demo-user-ng-fatima',
];

/** Rotates through the live ticker (gated behind prefers-reduced-motion). */
export const PRESENCE_TICKER: PresenceEvent[] = [
  { author: 'demo-user-cd-esperance', kind: 'joined' },
  { author: 'demo-user-ke-brian', kind: 'viewing' },
  { author: 'demo-user-mw-thoko', kind: 'typing' },
  { author: 'demo-user-cd-joseph', kind: 'joined' },
  { author: 'demo-user-ng-fatima', kind: 'viewing' },
];

// ---------------------------------------------------------------------------
// C2 — Track-changes co-authoring of the problem statement
// ---------------------------------------------------------------------------
export const PROBLEM_STATEMENT: { title: string; description: string } = {
  title: 'Solar Microgrids for Off-Grid Schools',
  description:
    'Community-owned solar microgrids could power schools across our four countries. Who builds, owns, and maintains them?',
};

export const EDIT_SUGGESTIONS: EditSuggestion[] = [
  {
    id: 's1',
    field: 'description',
    author: 'demo-user-ng-fatima',
    baseText: PROBLEM_STATEMENT.description,
    suggestedText:
      'Community-owned solar microgrids could power schools and clinics across our four countries. Who builds, owns, and maintains them?',
    rationale: 'Clinics need overnight power for vaccines too — widening this brings more communities in.',
    hearts: 9,
    status: 'open',
    minutesAgo: 110,
  },
  {
    id: 's2',
    field: 'title',
    author: 'demo-user-cd-pascal',
    baseText: PROBLEM_STATEMENT.title,
    suggestedText: 'Community-Owned Solar Microgrids for Off-Grid Schools',
    rationale: 'Ownership is the whole point of our discussion — it belongs in the title.',
    hearts: 7,
    status: 'open',
    minutesAgo: 65,
  },
  {
    id: 's3',
    field: 'description',
    author: 'demo-user-mw-chisomo',
    baseText: PROBLEM_STATEMENT.description,
    suggestedText:
      'Community-owned solar microgrids could power schools across our four countries. Who builds, owns, and maintains them — and how do we keep it low-tech enough for everyone?',
    rationale: 'If it is not low-tech, rural families are left out. Make that an explicit question.',
    hearts: 5,
    status: 'open',
    minutesAgo: 30,
  },
];

/** Co-authors already credited on the statement (a prior accepted edit). */
export const CO_AUTHORS: string[] = ['demo-user-ke-wanjiru'];

// ---------------------------------------------------------------------------
// C3 — Merge similar proposals + expert review
// (themed to the "Youth Reforestation Corps" proposals stage)
// ---------------------------------------------------------------------------
export const MERGEABLE_PROPOSALS: MergeableProposal[] = [
  { id: 'm1', author: 'demo-user-ng-fatima', text: 'Pay the youth corps per surviving tree at year three, so the reward is on survival — not just on how many seedlings go in the ground.' },
  { id: 'm2', author: 'demo-user-cd-joseph', text: 'Reward young planters for trees still alive after three years, rather than for the number they originally planted.' },
  { id: 'm3', author: 'demo-user-ke-amani', text: 'Indigenous-species nurseries co-designed with local elders and farmers.' },
  { id: 'm4', author: 'demo-user-ke-brian', text: 'Satellite plus on-the-ground monitoring so restoration claims are independently verifiable.' },
  { id: 'm5', author: 'demo-user-mw-limbani', text: 'Use elders’ knowledge to choose the right native species for each local nursery.' },
];

export const MERGE_SUGGESTIONS: MergeSuggestion[] = [
  { sourceId: 'm2', targetId: 'm1', similarity: 0.86 },
  { sourceId: 'm5', targetId: 'm3', similarity: 0.78 },
];

export const EXPERTS: ExpertProfile[] = [
  { key: 'demo-expert-marie', name: 'Marie Laurent', field: 'Marine biology · EU NGO', country: 'FR' },
  { key: 'demo-expert-koffi', name: 'Dr. Koffi Mensah', field: 'Forestry & land restoration', country: 'GH' },
];

export const EXPERT_REVIEWS: ExpertReview[] = [
  {
    proposalId: 'm4',
    expertKey: 'demo-expert-koffi',
    note: 'Satellite verification is sound, but pair it with community ground-truthing — canopy imagery alone over-counts survival in dryland mosaics.',
  },
];

// ---------------------------------------------------------------------------
// Pure helpers (no React / no i18n)
// ---------------------------------------------------------------------------
const PERSONA_BY_KEY: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.publicKey, p]),
);
const EXPERT_BY_KEY: Record<string, ExpertProfile> = Object.fromEntries(
  EXPERTS.map((e) => [e.key, e]),
);

export interface ParticipantInfo {
  name: string;
  country: string; // '' when unknown
  initials: string;
  isExpert: boolean;
}

/** Resolve a publicKey to display info, across personas and experts. */
export function deliberationParticipant(key: string): ParticipantInfo {
  const persona = PERSONA_BY_KEY[key];
  if (persona) {
    const name = `${persona.firstName} ${persona.lastName}`.trim();
    return {
      name,
      country: persona.country,
      initials: initialsOf(persona.firstName, persona.lastName),
      isExpert: false,
    };
  }
  const expert = EXPERT_BY_KEY[key];
  if (expert) {
    const [first, ...rest] = expert.name.split(' ');
    return {
      name: expert.name,
      country: expert.country,
      initials: initialsOf(first, rest[rest.length - 1] ?? ''),
      isExpert: true,
    };
  }
  return { name: key.slice(0, 8), country: '', initials: (key[0] ?? '?').toUpperCase(), isExpert: false };
}

export function expertProfile(key: string): ExpertProfile | undefined {
  return EXPERT_BY_KEY[key];
}

function initialsOf(first: string, last: string): string {
  const a = first?.[0] ?? '';
  const b = last?.[0] ?? '';
  return (a + b || first.slice(0, 2)).toUpperCase();
}

/**
 * i18n descriptor for a "minutes ago" timestamp. Returns the key + English
 * default + vars so the component owns the actual `t()` call (data stays
 * i18n-free).
 */
export function relativeTimeKey(minutesAgo: number): { key: string; def: string; vars: Record<string, number> } {
  if (minutesAgo < 1) return { key: 'deliberation.time.now', def: 'just now', vars: {} };
  if (minutesAgo < 60) return { key: 'deliberation.time.minutes', def: '{n}m ago', vars: { n: minutesAgo } };
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return { key: 'deliberation.time.hours', def: '{n}h ago', vars: { n: hours } };
  const days = Math.floor(hours / 24);
  return { key: 'deliberation.time.days', def: '{n}d ago', vars: { n: days } };
}

export type DiffToken = { value: string; type: 'same' | 'add' | 'del' };

/**
 * A minimal whitespace-token diff (LCS) for the track-changes view. Good enough
 * for a UI mockup: deletions and additions are highlighted inline.
 */
export function diffWords(before: string, after: string): DiffToken[] {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const n = a.length;
  const m = b.length;
  // LCS length table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffToken[] = [];
  const push = (type: DiffToken['type'], value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (prev && prev.type === type) prev.value += value;
    else out.push({ type, value });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i += 1; j += 1; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push('del', a[i]); i += 1; }
    else { push('add', b[j]); j += 1; }
  }
  while (i < n) { push('del', a[i]); i += 1; }
  while (j < m) { push('add', b[j]); j += 1; }
  return out;
}
