// Lane B — problem-framing fixtures.
//
// The climate initiatives the flagship community is deliberating, one frozen at
// each pipeline stage so every stage feed opens populated. The discussion-stage
// initiative ('solar') is the mid-deliberation hero. Per-initiative proposals
// live in deliberation.ts and conviction config in mandate.ts, joined by `key`.

import type { PipelineStage } from '../../../types/initiative';

export interface SeedInitiative {
  key: string;
  title: string;
  description: string;
  stage: PipelineStage;
  countries: string[];
  evidence: string[];
}

export const INITIATIVES: SeedInitiative[] = [
  {
    key: 'plastic',
    title: 'Single-Use Plastics around Our Lakes',
    description:
      'Plastic waste is choking Lake Victoria and Lake Malawi shorelines, harming fisheries that young people depend on. Is a coordinated ban on single-use plastics in lake communities a problem worth taking up together?',
    stage: 'problem',
    countries: ['KE', 'MW'],
    evidence: ['https://www.unep.org/interactives/beat-plastic-pollution/'],
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
    evidence: [],
  },
  {
    key: 'floods',
    title: 'A Shared Early Flood-Warning Network',
    description:
      'Flash floods devastate riverside communities with little warning. A shared, low-bandwidth early-warning network — SMS and radio — could save lives across borders. Vote on the proposals that should lead.',
    stage: 'vote',
    countries: ['NG', 'CD', 'MW'],
    evidence: [],
  },
  {
    key: 'water',
    title: 'Clean Water for Climate-Stressed Schools',
    description:
      'After deliberation across four countries, this initiative reached a mandate: bring resilient clean-water infrastructure to climate-stressed schools, governed and maintained by local youth committees.',
    stage: 'mandate',
    countries: ['KE', 'MW', 'CD'],
    evidence: [],
  },
];
