// Lane E — mandate fixtures.
//
// Two kinds of data live here, joined to the flagship initiatives by `key`
// (see problems.ts):
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
  plastic: { participationRate: 0.5, maxAmount: 40 },
  solar: { participationRate: 0.7, maxAmount: 60 },
  reforestation: { participationRate: 0.6, maxAmount: 50 },
  floods: { participationRate: 0.75, maxAmount: 70 },
  water: { participationRate: 0.9, maxAmount: 100 },
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
 * The deeply-authored flagship mandate: the youth deliberation on clean water
 * for climate-stressed schools, ratified after the cross-border vote. Its three
 * articles are the three winning proposals (see deliberation.ts `water`).
 */
const WATER_MANDATE: PublishedMandate = {
  id: 'water',
  title: 'Clean Water for Climate-Stressed Schools',
  subtitle: 'A Young Africa Climate Mandate',
  status: 'ratified',
  ratifiedOn: '2026-04-18',
  countries: ['KE', 'MW', 'CD'],
  preamble:
    'We, more than five hundred young people deliberating across Kenya, Nigeria, Malawi and the ' +
    'Democratic Republic of the Congo, having chosen this problem together and refined it over a ' +
    'year of open deliberation, adopt this mandate so that no school in our communities is forced ' +
    'to send its children home for want of safe water as the climate grows harsher.',
  articles: [
    {
      id: 'art-1',
      title: 'Rainwater harvesting and filtration at every climate-stressed school',
      body:
        'Each participating school shall be fitted with resilient rainwater-harvesting and ' +
        'point-of-use filtration sized to its enrolment, prioritising schools that lost reliable ' +
        'water during the last two dry seasons.',
    },
    {
      id: 'art-2',
      title: 'Youth-led water committees govern and maintain the systems',
      body:
        'A trained local youth water committee shall govern, monitor and maintain each system, ' +
        'with at least half of its seats held by young women, supported by a small maintenance ' +
        'stipend drawn from adopting partners.',
    },
    {
      id: 'art-3',
      title: 'Open, community-reported monitoring',
      body:
        'A simple public dashboard shall track water quality and system uptime at every site, ' +
        'updated by the committees over SMS or web, so progress stays visible across borders.',
    },
  ],
  indicators: [
    { label: 'Schools with safe water on-site', target: '250 schools by end of 2027' },
    { label: 'System uptime', target: '≥ 90% monthly, community-reported' },
    { label: 'Youth committee members trained', target: '1,500 (≥ 50% young women)' },
    { label: 'Installed cost per school', target: 'Under US$3,500' },
  ],
  provenance: {
    participants: 512,
    countries: 4,
    deliberationMonths: 12,
    voteWinner: 'Resilient rainwater-harvesting and filtration at every climate-stressed school',
    convictionBackers: 318,
  },
  adopters: [
    {
      id: 'adopt-paycn',
      name: 'Pan-African Youth Climate Network',
      type: 'youth-network',
      level: 'subscribed',
      progress: 0.34,
      progressNote: 'First 12 schools in Kisumu and Mzuzu fitted with harvesting tanks.',
      since: 'Apr 2026',
    },
    {
      id: 'adopt-mw-moe',
      name: 'Malawi Ministry of Education',
      type: 'government',
      country: 'MW',
      level: 'subscribed',
      progress: 0.18,
      progressNote: 'Site surveys completed at 40 lakeshore schools.',
      since: 'Apr 2026',
    },
    {
      id: 'adopt-wateraid',
      name: 'WaterAid International',
      type: 'ngo',
      level: 'subscribed',
      progress: 0.5,
      progressNote: 'Co-funding filtration units for 60 schools across three countries.',
      since: 'May 2026',
    },
    {
      id: 'adopt-cd-wash',
      name: 'DR Congo Schools WASH Coalition',
      type: 'ngo',
      country: 'CD',
      level: 'subscribed',
      progress: 0.12,
      progressNote: 'Committee training curriculum localised to French and Swahili.',
      since: 'May 2026',
    },
    {
      id: 'adopt-uon',
      name: 'University of Nairobi — Water & Climate Lab',
      type: 'academic',
      country: 'KE',
      level: 'endorsed',
      since: 'Apr 2026',
    },
    {
      id: 'adopt-unicef',
      name: 'UNICEF Eastern & Southern Africa',
      type: 'intergov',
      level: 'endorsed',
      since: 'May 2026',
    },
  ],
  specVersion: '1.0',
};

export const MANDATES_BY_KEY: Record<string, PublishedMandate> = {
  water: WATER_MANDATE,
};

/** The flagship mandate used as a graceful fallback for any initiative. */
export const DEFAULT_MANDATE_KEY = 'water';
