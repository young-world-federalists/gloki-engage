// Lane G — community fixtures: the flagship community shell.

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
  name: string;
  description: string;
  /** One-line tagline framing the shared mission. */
  mission: string;
  /** Participating countries (ISO 3166-1 alpha-2) — presence-strip fallback. */
  countries: string[];
  /** Deliberation phases for the journey line. */
  journey: JourneyPhase[];
}

export const VFTC_COMMUNITY: CommunityFixture = {
  name: 'Voices for the Climate',
  description:
    'A transnational youth deliberation on climate action across Kenya, Nigeria, Malawi, and DR Congo — framing shared problems, co-writing proposals, and committing to a collective mandate.',
  mission: 'A youth-led mandate for climate action, built across borders.',
  countries: ['KE', 'NG', 'MW', 'CD'],
  journey: [
    { key: 'codesign',     labelKey: 'journey.codesign',     labelDefault: 'Co-Design',                 status: 'done' },
    { key: 'deliberation', labelKey: 'journey.deliberation', labelDefault: 'Open Deliberation',         status: 'active' },
    { key: 'voting',       labelKey: 'journey.voting',       labelDefault: 'Consolidation & Voting',    status: 'upcoming' },
    { key: 'distribution', labelKey: 'journey.distribution', labelDefault: 'Distribution & Evaluation', status: 'upcoming' },
  ],
};
