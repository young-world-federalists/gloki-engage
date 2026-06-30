// Community fixtures: the demo communities seeded on first load.
//
// Globally diverse, multi-topic communities so the app opens onto a worldwide
// "town square" rather than a single region or issue. Each community's
// initiatives live in problems.ts, tagged by `community` key.

export type JourneyStatus = 'done' | 'active' | 'upcoming';

export interface JourneyPhase {
  key: string;
  /** i18n key for the phase label. */
  labelKey: string;
  /** Inline English default for the label. */
  labelDefault: string;
  status: JourneyStatus;
}

export interface CommunityFixture {
  /** Stable key; matches `SeedInitiative.community` (see problems.ts). */
  key: string;
  name: string;
  description: string;
  /** One-line tagline framing the shared mission. */
  mission: string;
  /** Participating countries (ISO 3166-1 alpha-2) — presence-strip fallback. */
  countries: string[];
  /** Deliberation phases for the journey line. */
  journey: JourneyPhase[];
  /**
   * Stages opened to 'anyone' (bypasses the web-of-trust gate for this
   * community). Used for honest "open pilot" demos — the gate stays in place
   * for communities without this field. Set on seeding via set_stage_permissions.
   */
  openStages?: import('../../trustModel').PipelineStage[];
}

function journey(active: 'codesign' | 'deliberation' | 'voting' | 'distribution'): JourneyPhase[] {
  const order = ['codesign', 'deliberation', 'voting', 'distribution'] as const;
  const labels: Record<string, string> = {
    codesign: 'Co-Design',
    deliberation: 'Open Deliberation',
    voting: 'Consolidation & Voting',
    distribution: 'Distribution & Evaluation',
  };
  const activeIdx = order.indexOf(active);
  return order.map((key, i) => ({
    key,
    labelKey: `journey.${key}`,
    labelDefault: labels[key],
    status: i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'upcoming',
  }));
}

export const DEMO_COMMUNITIES: CommunityFixture[] = [
  {
    key: 'health',
    name: 'Global Health Network',
    description:
      'People across continents working on the health challenges that cross every border — from clean water to the medicines we all rely on.',
    mission: 'Health decisions made together, wherever you live.',
    countries: ['IN', 'NG', 'BR', 'US', 'ID'],
    journey: journey('deliberation'),
  },
  {
    key: 'digital',
    name: 'Digital Rights Coalition',
    description:
      'A worldwide community shaping the rules of our online lives — privacy, platform accountability, and trustworthy information.',
    mission: 'A fair, open internet, governed by the people who use it.',
    countries: ['DE', 'US', 'BR', 'JP', 'KR', 'IN'],
    journey: journey('voting'),
    // Open the proposals + vote stages so a fresh (vouched-but-not-verified)
    // user can reach the SolutionsBoard and QV ballot for a hands-on demo.
    // Other communities stay gated (web-of-trust intact).
    openStages: ['proposals', 'vote'],
  },
  {
    key: 'climate',
    name: 'Climate Resilience Assembly',
    description:
      'Coastal cities, river deltas, and island nations deliberating together on how communities adapt to a changing climate.',
    mission: 'Adapting together, so no community faces the climate alone.',
    countries: ['BD', 'PH', 'MX', 'NL', 'KE', 'FJ'],
    journey: journey('distribution'),
  },
  {
    key: 'economy',
    name: 'Fair Futures Forum',
    description:
      'A cross-border community on the economics of everyday life — decent work, affordable homes, and good schools for the next generation.',
    mission: 'An economy that works for everyone, decided by everyone.',
    countries: ['ES', 'ZA', 'EG', 'GR', 'BR', 'PH'],
    journey: journey('deliberation'),
  },
];

/** Default community used as a graceful fallback (e.g. demo reset). */
export const DEFAULT_COMMUNITY = DEMO_COMMUNITIES[0];
