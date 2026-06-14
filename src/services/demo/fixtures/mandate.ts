// Mandate fixtures.
//
// Two kinds of data live here, joined to the initiatives by `key` (problems.ts):
//   1. CONVICTION_BY_KEY — conviction-staking configuration for the mandate
//      stage (fraction of members who stake, max per staker).
//   2. MANDATES_BY_KEY — the *published* Mandate artifact + its adoption
//      framework: the readable collective output a community can point to, and
//      the organizations endorsing / subscribing / reporting progress on it.
//
// All hardcoded UI data — read through the demo layer, never a backend.

export interface ConvictionConfig {
  participationRate: number; // 0..1 fraction of members who stake
  maxAmount: number; // max stake per member
}

export const CONVICTION_BY_KEY: Record<string, ConvictionConfig> = {
  water: { participationRate: 0.5, maxAmount: 40 },
  amr: { participationRate: 0.6, maxAmount: 50 },
  misinfo: { participationRate: 0.55, maxAmount: 45 },
  privacy: { participationRate: 0.7, maxAmount: 60 },
  ocean: { participationRate: 0.5, maxAmount: 40 },
  adaptation: { participationRate: 0.9, maxAmount: 100 },
  jobs: { participationRate: 0.6, maxAmount: 50 },
  housing: { participationRate: 0.55, maxAmount: 45 },
};

// ---------------------------------------------------------------------------
// Published Mandate artifact (E1) + Adoption framework (E2)
// ---------------------------------------------------------------------------

/** One binding commitment of the mandate (rendered as a numbered article). */
export interface MandateArticle {
  /** Stable id, e.g. "art-1" — also used as the spec key. */
  id: string;
  /** Short heading. */
  title: string;
  /** Plain-language commitment, one or two sentences. */
  body: string;
}

/** A measurable success indicator ("how we'll know it's working"). */
export interface MandateIndicator {
  label: string;
  target: string;
}

/** The type of organization that can adopt a mandate. */
export type AdopterType = 'youth-network' | 'government' | 'ngo' | 'academic' | 'intergov';

/** How an organization has engaged with the mandate. */
export type AdoptionLevel = 'endorsed' | 'subscribed';

/** An organization that has endorsed or subscribed to the mandate. */
export interface MandateAdopter {
  id: string;
  name: string;
  type: AdopterType;
  /** ISO 3166-1 alpha-2 code, or omitted for a regional / international body. */
  country?: string;
  level: AdoptionLevel;
  /** 0..1 — only meaningful for subscribers reporting progress. */
  progress?: number;
  /** Latest community-reported progress note (subscribers). */
  progressNote?: string;
  /** Human "since" label, e.g. "Apr 2026". */
  since: string;
}

/** Where the mandate's legitimacy comes from — shown as a provenance strip. */
export interface MandateProvenance {
  participants: number;
  countries: number;
  deliberationMonths: number;
  /** Text of the proposal that won the vote. */
  voteWinner: string;
  /** People who backed the mandate with conviction staking. */
  convictionBackers: number;
}

/** A published, ratified Mandate — the collective output of an initiative. */
export interface PublishedMandate {
  /** Matches the initiative `key`. */
  id: string;
  title: string;
  subtitle: string;
  status: 'ratified' | 'published';
  /** ISO date the mandate was ratified, e.g. "2026-04-18". */
  ratifiedOn: string;
  /** Jurisdictions the mandate directly addresses (ISO alpha-2). */
  countries: string[];
  preamble: string;
  articles: MandateArticle[];
  indicators: MandateIndicator[];
  provenance: MandateProvenance;
  adopters: MandateAdopter[];
  /** Machine-readable spec version. */
  specVersion: string;
}

/**
 * The deeply-authored flagship mandate: a global deliberation on a community
 * climate-adaptation fund, ratified after the cross-border vote. Its three
 * articles are the three winning proposals (see deliberation.ts `adaptation`).
 */
const ADAPTATION_MANDATE: PublishedMandate = {
  id: 'adaptation',
  title: 'A Universal Climate Adaptation Fund',
  subtitle: 'A global community mandate',
  status: 'ratified',
  ratifiedOn: '2026-04-18',
  countries: ['BD', 'PH', 'MX', 'KE', 'FJ'],
  preamble:
    'We, communities on the front line of a changing climate — across river deltas, low-lying ' +
    'coasts and island nations — having chosen this problem together and refined it over a year ' +
    'of open deliberation, adopt this mandate so that no community is left to face the climate ' +
    'alone for want of the resources to adapt.',
  articles: [
    {
      id: 'art-1',
      title: 'A community-governed adaptation fund, reachable directly',
      body:
        'A standing adaptation fund shall accept applications directly from frontline towns, ' +
        'islands and neighbourhoods — not only national governments — with a simple application ' +
        'and a community-majority voice on the allocation board.',
    },
    {
      id: 'art-2',
      title: 'Fund what communities can build and maintain',
      body:
        'Priority goes to low-cost, locally-maintainable resilience — drainage, mangrove and ' +
        'wetland restoration, water storage, and early-warning systems — over large contracts ' +
        'that leave nothing local behind.',
    },
    {
      id: 'art-3',
      title: 'Open, community-reported monitoring',
      body:
        'Every funded project shall publish progress on a simple public dashboard, updated by the ' +
        'community over SMS or web, so the money is seen to reach the ground.',
    },
  ],
  indicators: [
    { label: 'Frontline communities funded', target: '500 by end of 2028' },
    { label: 'Funds reaching local control', target: '≥ 70% of every grant' },
    { label: 'Projects with open progress reporting', target: '100%' },
    { label: 'Application to first disbursement', target: 'Under 90 days' },
  ],
  provenance: {
    participants: 1240,
    countries: 18,
    deliberationMonths: 12,
    voteWinner: 'A community-governed adaptation fund frontline towns can apply to directly',
    convictionBackers: 760,
  },
  adopters: [
    {
      id: 'adopt-gra',
      name: 'Global Resilience Alliance',
      type: 'youth-network',
      level: 'subscribed',
      progress: 0.32,
      progressNote: 'First 40 community projects funded across 9 countries.',
      since: '2026-04',
    },
    {
      id: 'adopt-bd-dm',
      name: 'Bangladesh Ministry of Disaster Management',
      type: 'government',
      country: 'BD',
      level: 'subscribed',
      progress: 0.21,
      progressNote: 'Co-funding drainage and shelters in 25 delta wards.',
      since: '2026-04',
    },
    {
      id: 'adopt-pif',
      name: 'Pacific Islands Forum',
      type: 'intergov',
      level: 'subscribed',
      progress: 0.44,
      progressNote: 'Channeling direct grants to 12 island communities.',
      since: '2026-05',
    },
    {
      id: 'adopt-mercycorps',
      name: 'Mercy Corps',
      type: 'ngo',
      level: 'subscribed',
      progress: 0.5,
      progressNote: 'Mangrove restoration and early-warning pilots in three regions.',
      since: '2026-05',
    },
    {
      id: 'adopt-c40',
      name: 'C40 Cities',
      type: 'ngo',
      level: 'endorsed',
      since: '2026-04',
    },
    {
      id: 'adopt-undrr',
      name: 'UN Office for Disaster Risk Reduction (UNDRR)',
      type: 'intergov',
      level: 'endorsed',
      since: '2026-05',
    },
  ],
  specVersion: '1.0',
};

export const MANDATES_BY_KEY: Record<string, PublishedMandate> = {
  adaptation: ADAPTATION_MANDATE,
};

/** The flagship mandate used as a graceful fallback for any initiative. */
export const DEFAULT_MANDATE_KEY = 'adaptation';
