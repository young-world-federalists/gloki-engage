// Lane C — deliberation fixtures.
//
// Solution proposals for each flagship initiative, keyed by initiative `key`
// (see problems.ts). Used to populate the approval (proposals) and QV (vote)
// stages. Lane C extends this file with sample discussion threads as needed.

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
