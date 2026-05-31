// Lane B — issue-selection & problem-framing fixtures.
//
// The climate issues the flagship community is weighing. Several sit at the
// `problem` stage so /stage/problem opens as a real *slate of candidate issues*
// to choose among — the moment a crowd becomes a "we" with a shared subject.
// One issue is frozen at each later stage so every stage feed opens populated.
// The discussion-stage initiative ('solar') is the mid-deliberation hero.
//
// The framing extras (`whoWhy`, `sdg`, `voices`) are Lane B's and are read by
// ProblemStage; the seed orchestrator ignores them. Per-initiative proposals
// live in deliberation.ts and conviction config in mandate.ts, joined by `key`.

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
  title: string;
  description: string;
  stage: PipelineStage;
  countries: string[];
  evidence: string[];
  // --- Lane B framing extras (optional; ignored by seedDemoCommunity) ---
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
 * relevant to youth climate work rather than the full set of 17.
 */
export const SDG_OPTIONS: SdgTag[] = [
  { id: 2, label: 'Zero Hunger' },
  { id: 3, label: 'Good Health & Well-being' },
  { id: 4, label: 'Quality Education' },
  { id: 6, label: 'Clean Water & Sanitation' },
  { id: 7, label: 'Affordable & Clean Energy' },
  { id: 11, label: 'Sustainable Cities & Communities' },
  { id: 13, label: 'Climate Action' },
  { id: 14, label: 'Life Below Water' },
  { id: 15, label: 'Life on Land' },
];

export const INITIATIVES: SeedInitiative[] = [
  {
    key: 'plastic',
    title: 'Single-Use Plastics around Our Lakes',
    description:
      'Plastic waste is choking Lake Victoria and Lake Malawi shorelines, harming fisheries that young people depend on. Is a coordinated ban on single-use plastics in lake communities a problem worth taking up together?',
    stage: 'problem',
    countries: ['KE', 'MW'],
    evidence: ['https://www.unep.org/interactives/beat-plastic-pollution/'],
    whoWhy:
      'It hits the fishing families and lakeside youth who depend on these waters — and the plastic tide grows every season.',
    sdg: { id: 14, label: 'Life Below Water' },
    voices: [
      { country: 'MW', name: 'Thoko', text: 'Our nets come up full of plastic, not fish.' },
      { country: 'KE', name: 'Amani', text: 'Walk the Kisumu shoreline — it is buried in bottles and bags.' },
    ],
  },
  {
    key: 'solar',
    title: 'Solar Microgrids for Off-Grid Schools',
    description:
      'Across our four countries, millions of students study without reliable electricity. Community-owned solar microgrids could power schools and clinics — but who builds, owns, and maintains them? Share how this looks in your community.',
    stage: 'discussion',
    countries: ['KE', 'NG', 'MW', 'CD'],
    evidence: ['https://www.irena.org/'],
  },
  {
    key: 'reforestation',
    title: 'A Youth Reforestation Corps',
    description:
      'Deforestation drives floods, drought, and lost livelihoods. A cross-border youth reforestation corps could restore degraded land while creating green jobs. Propose how it should work.',
    stage: 'proposals',
    countries: ['KE', 'NG', 'MW', 'CD'],
    evidence: ['https://www.ipcc.ch/srccl/'],
  },
  {
    key: 'floods',
    title: 'A Shared Early Flood-Warning Network',
    description:
      'Flash floods devastate riverside communities with little warning. A shared, low-bandwidth early-warning network — SMS and radio — could save lives across borders. Vote on the proposals that should lead.',
    stage: 'vote',
    countries: ['NG', 'CD', 'MW'],
    evidence: ['https://www.who.int/health-topics/floods'],
  },
  {
    key: 'water',
    title: 'Clean Water for Climate-Stressed Schools',
    description:
      'After deliberation across four countries, this initiative reached a mandate: bring resilient clean-water infrastructure to climate-stressed schools, governed and maintained by local youth committees.',
    stage: 'mandate',
    countries: ['KE', 'MW', 'CD'],
    evidence: ['https://www.who.int/health-topics/water-sanitation-and-hygiene-wash'],
  },

  // --- Additional candidate issues at the `problem` stage, so issue selection
  //     reads as a real shared choice (climate/plastics above is the seeded
  //     leader, not the only option). Appended last so the deterministic seed
  //     indices of the entries above stay unchanged. ---
  {
    key: 'heat',
    title: 'Extreme Heat Is Closing Our Schools',
    description:
      'Classrooms without ventilation now reach unbearable temperatures, and schools shut for days during heatwaves — costing students weeks of learning each year. Is rising classroom heat a problem we should take up together?',
    stage: 'problem',
    countries: ['NG', 'CD'],
    evidence: ['https://www.who.int/health-topics/heatwaves'],
    whoWhy:
      'Students in poorly ventilated schools lose days of learning every heatwave — and the hot season keeps getting longer.',
    sdg: { id: 13, label: 'Climate Action' },
    voices: [
      { country: 'NG', name: 'Chiamaka', text: 'By midday the classroom is an oven. We cannot think.' },
      { country: 'CD', name: 'Joseph', text: 'Last term we lost a full week to the heat.' },
    ],
  },
  {
    key: 'air',
    title: 'Charcoal Smoke Is Making Us Sick',
    description:
      'Most homes still cook over charcoal and wood, filling kitchens with smoke that harms women and children most. Is indoor cooking smoke a shared problem worth tackling across our communities?',
    stage: 'problem',
    countries: ['MW', 'CD'],
    evidence: ['https://www.who.int/health-topics/air-pollution'],
    whoWhy:
      'The women and young children who spend hours by the cooking fire breathe the worst of it, every single day.',
    sdg: { id: 7, label: 'Affordable & Clean Energy' },
    voices: [
      { country: 'MW', name: 'Chisomo', text: 'My little sister coughs every evening from the kitchen smoke.' },
      { country: 'CD', name: 'Espérance', text: 'Clean cookstoves exist — we just cannot reach them yet.' },
    ],
  },
  {
    key: 'soil',
    title: 'Our Farmland Is Washing Away',
    description:
      'Heavier rains are stripping topsoil from the slopes our families farm, cutting harvests and pushing youth off the land. Is soil erosion a problem we should take on together?',
    stage: 'problem',
    countries: ['KE', 'NG'],
    evidence: ['https://www.fao.org/soils-portal/en/'],
    whoWhy:
      'Smallholder youth watch each storm carry off the soil their harvests — and their futures — depend on.',
    sdg: { id: 15, label: 'Life on Land' },
    voices: [
      { country: 'KE', name: 'Brian', text: 'After every big rain the gullies are deeper and the maize is thinner.' },
      { country: 'NG', name: 'Fatima', text: 'Our tree-nursery seedlings could hold the soil — if we scale them up.' },
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
