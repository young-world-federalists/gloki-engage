// Deliberation fixtures.
//
// UI-only sample data for the deliberation heart of the demo: the threaded
// discussion + live co-presence (C1), the track-changes co-authoring of a
// problem statement (C2), and the merge-similar-proposals + expert-review
// surface (C3).
//
// Pure data + pure helpers only — no React, no i18n, no backend. The flow
// components import these and hold local optimistic state. Personas come from
// the identity fixture (read-only import). Display copy is themed to the
// "Algorithmic Misinformation & Election Integrity" hero (discussion stage) and
// the "Youth Employment & the Skills Gap" initiative (proposals stage).

import { PERSONAS, type Persona } from './identity';

// ---------------------------------------------------------------------------
// Proposals per initiative (consumed by the seed orchestrator).
// Keyed by initiative `key` (see problems.ts).
// ---------------------------------------------------------------------------
export const PROPOSALS_BY_KEY: Record<string, string[]> = {
  water: [
    'Fund community-managed water points with local committees accountable for upkeep.',
    'Low-cost household filtration distributed through schools and clinics.',
    'Open, community-reported water-quality monitoring so problems surface fast.',
  ],
  amr: [
    'Make antibiotics prescription-only everywhere, with trained pharmacist gatekeeping.',
    'Fund rapid point-of-care tests so clinicians stop prescribing antibiotics "just in case".',
    'A public stewardship dashboard tracking prescribing rates by region.',
    'Invest in clean water and vaccination — the cheapest way to cut infections that drive resistance.',
  ],
  misinfo: [
    'Require platforms to label disputed content within minutes, with an independent appeals path.',
    'Mandate "why am I seeing this?" transparency on every recommended post.',
    'Fund media-literacy "pre-bunking" in schools and over messaging apps.',
  ],
  privacy: [
    'A baseline right to know what data is collected and to delete it, enforceable anywhere.',
    'Privacy by default: opt-in, not opt-out, for any non-essential data use.',
    'Ban the sale of precise location data outright.',
    'Independent audits of high-risk algorithms, with public summaries.',
  ],
  ocean: [
    'Hold producers responsible for packaging through fees that fund cleanup.',
    'Fund youth-run collection points paid per kilo of recovered coastal plastic.',
    'Phase out the worst single-use items where refillable alternatives exist.',
  ],
  adaptation: [
    'A community-governed adaptation fund frontline towns can apply to directly.',
    'Prioritise low-cost, locally-maintainable resilience: drainage, mangroves, early warning.',
    'Open, community-reported tracking of every funded project.',
  ],
  jobs: [
    'Paid apprenticeships placing young people with local employers, with a stipend so the poorest can take part.',
    'Rebuild vocational training around the skills employers in each region actually list as missing.',
    'A public, real-time dashboard matching training to the jobs being posted locally.',
    'Wage subsidies for small businesses that hire and mentor a first-time worker.',
  ],
  housing: [
    'Protect renters with transparent rent caps tied to local incomes.',
    'Unlock idle public land for non-profit, permanently-affordable housing.',
    'Fund community land trusts that keep homes affordable for good.',
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
// (themed to the "Algorithmic Misinformation & Election Integrity" hero)
// ---------------------------------------------------------------------------
export const DISCUSSION_COMMENTS: DeliberationComment[] = [
  {
    id: 'c1', author: 'demo-user-br-lucas', category: 'impact', parentId: null, hearts: 14, minutesAgo: 320,
    text: 'In São Paulo a deepfake of a candidate reached millions before anyone could debunk it. By the time the correction came, the vote was days away.',
  },
  {
    id: 'c1a', author: 'demo-user-kr-jiwoo', category: 'solutions', parentId: 'c1', hearts: 6, minutesAgo: 295,
    text: 'Speed is everything. Even a neutral "being checked" tag within minutes slows the spread far more than a takedown days later.',
  },
  {
    id: 'c1b', author: 'demo-user-it-sofia', category: 'concerns', parentId: 'c1a', hearts: 9, minutesAgo: 240,
    text: 'Careful who holds that power, though. A state-run "disputed" flag is a censorship tool waiting to happen — we need independent oversight.',
  },
  {
    id: 'c2', author: 'demo-user-pl-marta', category: 'evidence', parentId: null, hearts: 11, minutesAgo: 280,
    text: 'Our newsroom data is stark: a false post gets roughly six times the shares of its correction. The asymmetry is the whole problem.',
  },
  {
    id: 'c3', author: 'demo-user-de-anika', category: 'solutions', parentId: null, hearts: 12, minutesAgo: 210,
    text: 'Make platforms show *why* you were shown a post. Transparency on the recommendation does more than any single takedown.',
  },
  {
    id: 'c3a', author: 'demo-user-cn-mei', category: 'solutions', parentId: 'c3', hearts: 7, minutesAgo: 180,
    text: 'And let people see a post’s origin and edit history with one tap before they share it.',
  },
  {
    id: 'c4', author: 'demo-user-ph-maria', category: 'impact', parentId: null, hearts: 10, minutesAgo: 160,
    text: 'During typhoon season here, false "safe zone" maps circulated. Misinformation is not abstract — it puts people directly in harm’s way.',
  },
  {
    id: 'c5', author: 'demo-user-ng-amina', category: 'concerns', parentId: null, hearts: 12, minutesAgo: 120,
    text: 'Whatever we build has to work on a basic phone over WhatsApp. That is where most of this actually spreads in my community.',
  },
  {
    id: 'c5a', author: 'demo-user-br-lucas', category: 'solutions', parentId: 'c5', hearts: 5, minutesAgo: 95,
    text: 'Agreed — a forward-this-to-check number that replies with context, no app required.',
  },
  {
    id: 'c6', author: 'demo-user-kr-jiwoo', category: 'evidence', parentId: null, hearts: 9, minutesAgo: 40,
    text: 'Pre-bunking works: short clips that teach the manipulation tactic beat after-the-fact fact-checks in every trial we ran.',
  },
];

/** Everyone who has taken part (drives the flag cluster + "N from M countries"). */
export const DELIBERATION_PARTICIPANTS: string[] = PERSONAS.map((p) => p.publicKey);

/** A small subset shown as "here now" for the live co-presence pulse. */
export const PRESENCE_NOW: string[] = [
  'demo-user-ph-maria',
  'demo-user-pl-marta',
  'demo-user-de-anika',
];

/** Rotates through the live ticker (gated behind prefers-reduced-motion). */
export const PRESENCE_TICKER: PresenceEvent[] = [
  { author: 'demo-user-ph-maria', kind: 'joined' },
  { author: 'demo-user-pl-marta', kind: 'viewing' },
  { author: 'demo-user-br-lucas', kind: 'typing' },
  { author: 'demo-user-kr-jiwoo', kind: 'joined' },
  { author: 'demo-user-de-anika', kind: 'viewing' },
];

// ---------------------------------------------------------------------------
// C2 — Track-changes co-authoring of the problem statement
// ---------------------------------------------------------------------------
export const PROBLEM_STATEMENT: { title: string; description: string } = {
  title: 'Algorithmic Misinformation & Election Integrity',
  description:
    'AI-generated misinformation spreads faster than fact-checkers can respond, eroding trust in shared facts. How should communities and platforms respond?',
};

export const EDIT_SUGGESTIONS: EditSuggestion[] = [
  {
    id: 's1',
    field: 'description',
    author: 'demo-user-it-sofia',
    baseText: PROBLEM_STATEMENT.description,
    suggestedText:
      'AI-generated misinformation spreads faster than fact-checkers can respond, eroding trust in shared facts. How should communities and platforms respond — without harming free expression?',
    rationale: 'Any response has to name the free-expression safeguard up front, or we invite censorship.',
    hearts: 11,
    status: 'open',
    minutesAgo: 110,
  },
  {
    id: 's2',
    field: 'title',
    author: 'demo-user-de-anika',
    baseText: PROBLEM_STATEMENT.title,
    suggestedText: 'Algorithmic Misinformation & Democratic Integrity',
    rationale: 'This goes beyond elections — it is about trust in shared facts year-round.',
    hearts: 8,
    status: 'open',
    minutesAgo: 65,
  },
  {
    id: 's3',
    field: 'description',
    author: 'demo-user-ng-amina',
    baseText: PROBLEM_STATEMENT.description,
    suggestedText:
      'AI-generated misinformation spreads faster than fact-checkers can respond, eroding trust in shared facts — especially over messaging apps on basic phones. How should communities and platforms respond?',
    rationale: 'If the answer ignores WhatsApp on a basic phone, it ignores where most people actually are.',
    hearts: 6,
    status: 'open',
    minutesAgo: 30,
  },
];

/** Co-authors already credited on the statement (a prior accepted edit). */
export const CO_AUTHORS: string[] = ['demo-user-kr-jiwoo'];

// ---------------------------------------------------------------------------
// Co-authoring seed (Redesign A — Batch 5)
//
// The discussion contract self-seeds from this so any discussion sub-contract
// opens with the rich demo. RECAST — no new copy — from the data above:
//   • statement ← PROBLEM_STATEMENT (description→body) + CO_AUTHORS
//   • edits     ← EDIT_SUGGESTIONS (field description→body, suggestedText→text)
//   • positions ← root DISCUSSION_COMMENTS (each top-level comment is a position)
//   • anchored  ← reply DISCUSSION_COMMENTS, re-keyed under their root position
//
// 1p1v supporters are drawn ONLY from the eight people who took part in the
// thread, so the participation snapshot stays a stable 8 and the hero edit (s1)
// sits exactly one supporter short of the fold-in target (max(3, ceil(8/2))=4)
// — a single live "Support" click folds it into the statement. See the Batch 5
// plan (docs/superpowers/plans/2026-06-04-batch5-stage-ux-redesigns.md).

export interface SeedStatement {
  title: string;
  body: string;
  coAuthors: string[]; // persona publicKeys
}
export interface SeedEdit {
  id: string;
  field: 'title' | 'body';
  author: string;
  baseText: string;
  text: string;
  rationale: string;
  supporters: string[]; // pks — 1p1v
  status: 'open' | 'accepted' | 'stale';
  createdAgo: number; // minutes (feeds relativeTimeKey); 0 = just now
}
export interface SeedPosition {
  id: string;
  type: DeliberationCategory;
  author: string;
  text: string;
  supporters: string[]; // pks — 1p1v (includes the author)
  createdAgo: number;
}
export interface SeedAnchored {
  id: string;
  anchor: string; // 'statement' | positionId
  author: string;
  text: string;
  parentId: string | null;
  createdAgo: number;
}
export interface DiscussionSeed {
  statement: SeedStatement;
  edits: SeedEdit[];
  positions: SeedPosition[];
  anchored: SeedAnchored[];
}

// Supporter lists — every pk is one of the eight thread participants
// (lucas, marta, anika, maria, amina, jiwoo, sofia, mei) so the distinct
// participation snapshot stays exactly 8.
const POSITION_SUPPORTERS: Record<string, string[]> = {
  'pos-c1': ['demo-user-br-lucas', 'demo-user-pl-marta', 'demo-user-de-anika', 'demo-user-ph-maria', 'demo-user-ng-amina', 'demo-user-kr-jiwoo'],
  'pos-c5': ['demo-user-ng-amina', 'demo-user-br-lucas', 'demo-user-pl-marta', 'demo-user-it-sofia', 'demo-user-cn-mei'],
  'pos-c3': ['demo-user-de-anika', 'demo-user-kr-jiwoo', 'demo-user-cn-mei', 'demo-user-ph-maria'],
  'pos-c2': ['demo-user-pl-marta', 'demo-user-it-sofia', 'demo-user-de-anika'],
  'pos-c4': ['demo-user-ph-maria', 'demo-user-ng-amina'],
  'pos-c6': ['demo-user-kr-jiwoo', 'demo-user-it-sofia'],
};
const EDIT_SUPPORTERS: Record<string, string[]> = {
  s1: ['demo-user-it-sofia', 'demo-user-pl-marta', 'demo-user-ph-maria'], // 3 = target(4) - 1 → one click folds in
  s2: ['demo-user-de-anika', 'demo-user-kr-jiwoo'],
  s3: ['demo-user-ng-amina', 'demo-user-br-lucas'],
};
// reply comment id → the root position it anchors under
const ANCHOR_OF: Record<string, string> = { c1a: 'pos-c1', c1b: 'pos-c1', c3a: 'pos-c3', c5a: 'pos-c5' };

function buildDiscussionSeed(): DiscussionSeed {
  const roots = DISCUSSION_COMMENTS.filter((c) => c.parentId === null);
  const replies = DISCUSSION_COMMENTS.filter((c) => c.parentId !== null);
  const positions: SeedPosition[] = roots.map((c) => ({
    id: `pos-${c.id}`,
    type: c.category,
    author: c.author,
    text: c.text,
    supporters: POSITION_SUPPORTERS[`pos-${c.id}`] ?? [c.author],
    createdAgo: c.minutesAgo,
  }));
  const anchored: SeedAnchored[] = replies.map((c) => ({
    id: c.id,
    anchor: ANCHOR_OF[c.id] ?? 'statement',
    author: c.author,
    text: c.text,
    // Keep the thread: a reply whose parent is itself a reply stays nested;
    // a reply on a root comment anchors directly on that comment's position.
    parentId: replies.some((r) => r.id === c.parentId) ? c.parentId : null,
    createdAgo: c.minutesAgo,
  }));
  const edits: SeedEdit[] = EDIT_SUGGESTIONS.map((e) => ({
    id: e.id,
    field: e.field === 'description' ? 'body' : 'title',
    author: e.author,
    baseText: e.baseText,
    text: e.suggestedText,
    rationale: e.rationale,
    supporters: EDIT_SUPPORTERS[e.id] ?? [e.author],
    status: 'open',
    createdAgo: e.minutesAgo,
  }));
  return {
    statement: {
      title: PROBLEM_STATEMENT.title,
      body: PROBLEM_STATEMENT.description,
      coAuthors: [...CO_AUTHORS],
    },
    edits,
    positions,
    anchored,
  };
}

/** The co-authoring seed — consumed by `demoContracts/discussion.ts`. */
export const DISCUSSION_SEED: DiscussionSeed = buildDiscussionSeed();

/**
 * A glanceable summary of the seed for the Stage 2 feed/dashboard previews.
 * List/summary contexts read this (no contract deploy); the full co-authoring
 * space reads the live contract. Documented simplification.
 */
export const DISCUSSION_SEED_SUMMARY = {
  statementTitle: DISCUSSION_SEED.statement.title,
  positions: DISCUSSION_SEED.positions.length,
  openEdits: DISCUSSION_SEED.edits.filter((e) => e.status === 'open').length,
  participants: (() => {
    const s = new Set<string>();
    DISCUSSION_SEED.statement.coAuthors.forEach((k) => s.add(k));
    DISCUSSION_SEED.edits.forEach((e) => {
      s.add(e.author);
      e.supporters.forEach((x) => s.add(x));
    });
    DISCUSSION_SEED.positions.forEach((p) => {
      s.add(p.author);
      p.supporters.forEach((x) => s.add(x));
    });
    DISCUSSION_SEED.anchored.forEach((a) => s.add(a.author));
    s.delete('');
    return s.size;
  })(),
};

// ---------------------------------------------------------------------------
// C3 — Merge similar proposals + expert review
// (themed to the "Youth Employment & the Skills Gap" proposals stage)
// ---------------------------------------------------------------------------
export const MERGEABLE_PROPOSALS: MergeableProposal[] = [
  { id: 'm1', author: 'demo-user-eg-fatima', text: 'Fund paid apprenticeships that place young people directly with local employers, with a stipend so the poorest can take part.' },
  { id: 'm2', author: 'demo-user-za-thabo', text: 'Subsidise on-the-job apprenticeships at small businesses, paid so that low-income youth are not priced out of taking them.' },
  { id: 'm3', author: 'demo-user-pk-aisha', text: 'Rebuild vocational training around the skills employers in each region actually list as missing.' },
  { id: 'm4', author: 'demo-user-in-priya', text: 'A public, real-time skills dashboard matching training to the jobs actually being posted locally.' },
  { id: 'm5', author: 'demo-user-mx-diego', text: 'Align technical courses to the gaps employers report each quarter, region by region.' },
];

export const MERGE_SUGGESTIONS: MergeSuggestion[] = [
  { sourceId: 'm2', targetId: 'm1', similarity: 0.86 },
  { sourceId: 'm5', targetId: 'm3', similarity: 0.78 },
];

export const EXPERTS: ExpertProfile[] = [
  { key: 'demo-expert-renata', name: 'Renata Costa', field: 'Labour economics · ILO', country: 'BR' },
  { key: 'demo-expert-lena', name: 'Dr. Lena Fischer', field: 'Vocational education & skills', country: 'DE' },
];

export const EXPERT_REVIEWS: ExpertReview[] = [
  {
    proposalId: 'm3',
    expertKey: 'demo-expert-lena',
    note: 'Demand-led training works, but the skills lists go stale fast — pair this with the live dashboard idea so curricula update quarterly, not once a decade.',
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
