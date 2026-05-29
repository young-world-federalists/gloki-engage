// Lane E — mandate fixtures.
//
// Conviction-staking configuration per flagship initiative, keyed by initiative
// `key` (see problems.ts): the fraction of members who stake and the max amount
// per staker. Lane E extends this file with published-mandate artifact data.

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
