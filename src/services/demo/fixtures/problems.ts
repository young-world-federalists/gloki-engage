// Issue-selection & problem-framing fixtures.
//
// The initiatives that populate the demo communities, spread so that every
// pipeline stage opens populated and several sit at `problem` (so /stage/problem
// reads as a real slate of candidate issues — the moment a crowd becomes a "we").
// Each initiative is tagged with its `community` key (see community.ts); the seed
// orchestrator groups by it. Per-initiative proposals live in deliberation.ts and
// conviction config in mandate.ts, joined by `key`.
//
// The framing extras (`whoWhy`, `sdg`, `voices`) are read by ProblemStage; the
// seed orchestrator ignores them.

import type { PipelineStage } from '../../../types/initiative';

/** A light, optional UN Sustainable Development Goal tag for an issue. */
export interface SdgTag {
  id: number;
  label: string;
}

/** A short illustrative "why this matters to us" voice on a candidate issue. */
export interface SeedVoice {
  country: string; // ISO 3166-1 alpha-2
  name: string;
  text: string;
}

export interface SeedInitiative {
  key: string;
  /** Community this initiative belongs to (see community.ts `key`). */
  community: string;
  title: string;
  description: string;
  stage: PipelineStage;
  countries: string[];
  evidence: string[];
  // --- Framing extras (optional; ignored by seedDemoCommunity) ---
  /** Plain-language "who it affects and why now" — one sentence. */
  whoWhy?: string;
  /** Optional light SDG tag. */
  sdg?: SdgTag;
  /** A few short voices shown in the "why this matters" reveal. */
  voices?: SeedVoice[];
}

/** What ProblemStage consumes to frame a candidate issue. */
export interface ProblemFraming {
  title: string;
  description: string;
  countries: string[];
  evidence: string[];
  whoWhy?: string;
  sdg?: SdgTag;
  voices: SeedVoice[];
}

/**
 * A curated short list of SDGs offered when proposing an issue. Kept light and
 * broadly relevant rather than the full set of 17.
 */
export const SDG_OPTIONS: SdgTag[] = [
  { id: 1, label: 'No Poverty' },
  { id: 3, label: 'Good Health & Well-being' },
  { id: 4, label: 'Quality Education' },
  { id: 6, label: 'Clean Water & Sanitation' },
  { id: 8, label: 'Decent Work & Economic Growth' },
  { id: 11, label: 'Sustainable Cities & Communities' },
  { id: 13, label: 'Climate Action' },
  { id: 14, label: 'Life Below Water' },
  { id: 16, label: 'Peace, Justice & Strong Institutions' },
];

export const INITIATIVES: SeedInitiative[] = [
  // ── Global Health Network ────────────────────────────────────────────────
  {
    key: 'water',
    community: 'health',
    title: 'Universal Access to Clean Drinking Water',
    description:
      'Two billion people still lack safely managed drinking water. Should a coordinated push for universal clean-water access be a problem we take up together?',
    stage: 'problem',
    countries: ['IN', 'NG', 'BD', 'BR'],
    evidence: ['https://www.who.int/health-topics/water-sanitation-and-hygiene-wash'],
    whoWhy:
      'It falls hardest on rural families and the women and children who walk hours for water that still makes them sick.',
    sdg: { id: 6, label: 'Clean Water & Sanitation' },
    voices: [
      { country: 'IN', name: 'Priya', text: 'In too many villages the nearest safe tap is still a half-day away.' },
      { country: 'NG', name: 'Amina', text: 'Half the cases at our clinic trace back to dirty water. It is preventable.' },
    ],
  },
  {
    key: 'amr',
    community: 'health',
    title: 'Coordinated Action on Antibiotic Resistance',
    description:
      'Drug-resistant infections already kill over a million people a year. Without coordinated action, routine surgery and minor infections grow deadly again. Propose how communities and clinics should respond.',
    stage: 'proposals',
    countries: ['IN', 'US', 'BR', 'ZA'],
    evidence: ['https://www.who.int/health-topics/antimicrobial-resistance'],
  },

  // ── Digital Rights Coalition ──────────────────────────────────────────────
  {
    key: 'misinfo',
    community: 'digital',
    title: 'Algorithmic Misinformation & Election Integrity',
    description:
      'AI-generated misinformation is spreading faster than anyone can fact-check, and trust in shared facts is eroding. How should communities and platforms respond without harming free expression? Share how this looks where you are.',
    stage: 'discussion',
    countries: ['US', 'BR', 'PH', 'NG', 'DE'],
    evidence: ['https://www.un.org/en/countering-disinformation'],
  },
  {
    key: 'privacy',
    community: 'digital',
    title: 'A Global Baseline for Digital Privacy',
    description:
      'Personal data is harvested at vast scale with little protection in most countries. A shared baseline of digital rights is overdue. Vote on the proposals that should lead.',
    stage: 'vote',
    countries: ['DE', 'FR', 'US', 'JP', 'BR', 'IN'],
    evidence: ['https://www.ohchr.org/en/topic/digital-space-and-human-rights'],
  },

  // ── Climate Resilience Assembly ───────────────────────────────────────────
  {
    key: 'ocean',
    community: 'climate',
    title: 'Ocean Plastic Pollution',
    description:
      'Over eight million tonnes of plastic enter the ocean every year, breaking into microplastics that reach our food and water. Is coordinated action on ocean plastic a problem worth taking up together?',
    stage: 'problem',
    countries: ['ID', 'PH', 'JP', 'NL'],
    evidence: ['https://www.unep.org/interactives/beat-plastic-pollution/'],
    whoWhy:
      'It hits coastal and fishing communities first — their catch, their beaches, and the water they depend on.',
    sdg: { id: 14, label: 'Life Below Water' },
    voices: [
      { country: 'ID', name: 'Putri', text: 'Our cleanup crews fill a truck a day and the tide brings more by morning.' },
      { country: 'PH', name: 'Maria', text: 'The fishers pull up more plastic than fish some weeks.' },
    ],
  },
  {
    key: 'adaptation',
    community: 'climate',
    title: 'A Universal Climate Adaptation Fund',
    description:
      'After a year of cross-border deliberation, this initiative reached a mandate: a community-governed adaptation fund that frontline towns and islands can apply to directly for resilience infrastructure.',
    stage: 'mandate',
    countries: ['BD', 'PH', 'MX', 'KE', 'FJ'],
    evidence: ['https://www.adaptation-fund.org/'],
  },

  // ── Fair Futures Forum ────────────────────────────────────────────────────
  {
    key: 'jobs',
    community: 'economy',
    title: 'Youth Employment & the Skills Gap',
    description:
      'Youth unemployment tops 30% in many countries even as employers say they cannot find the skills they need. Propose how communities can close the gap between school and decent work.',
    stage: 'proposals',
    countries: ['ES', 'ZA', 'EG', 'GR', 'IN'],
    evidence: ['https://www.ilo.org/topics/youth-employment'],
  },
  {
    key: 'housing',
    community: 'economy',
    title: 'Affordable Housing in Growing Cities',
    description:
      'Rents are rising far faster than wages, pushing young people and key workers out of the cities they keep running. Is the affordability crisis a problem we should take on together?',
    stage: 'problem',
    countries: ['BR', 'ZA', 'MX', 'DE'],
    evidence: ['https://unhabitat.org/topics/housing'],
    whoWhy:
      'Young people, renters, and essential workers are being priced out of the neighbourhoods they grew up in.',
    sdg: { id: 11, label: 'Sustainable Cities & Communities' },
    voices: [
      { country: 'MX', name: 'Diego', text: 'Three families now share what used to be one apartment near the centre.' },
      { country: 'ZA', name: 'Thabo', text: 'Nurses and teachers commute two hours because nothing near work is affordable.' },
    ],
  },
];

/** Build the framing record ProblemStage renders from a seed entry. */
export function toProblemFraming(seed: SeedInitiative): ProblemFraming {
  return {
    title: seed.title,
    description: seed.description,
    countries: seed.countries,
    evidence: seed.evidence,
    whoWhy: seed.whoWhy,
    sdg: seed.sdg,
    voices: seed.voices ?? [],
  };
}
