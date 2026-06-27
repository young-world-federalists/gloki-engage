// Maps ISO 3166-1 alpha-2 country codes to 6 world regions for the vote-results
// colour scheme (replaces the 197-colour per-country rainbow on the ballot).
// 'other' is the fallback for unmapped/missing codes (incl. the demo 'OTHER'
// sentinel); it is NOT in REGIONS (the visible key shows the 6) but renders as a
// neutral grey segment when present. Region names stay English (not i18n).

export type RegionId =
  | 'africa' | 'asiaPacific' | 'europe' | 'latam' | 'northAmerica' | 'mena' | 'other';

export interface Region { id: RegionId; label: string }

export const REGIONS: Region[] = [
  { id: 'africa', label: 'Africa' },
  { id: 'asiaPacific', label: 'Asia & Pacific' },
  { id: 'europe', label: 'Europe' },
  { id: 'latam', label: 'Latin America & Caribbean' },
  { id: 'northAmerica', label: 'North America' },
  { id: 'mena', label: 'Middle East & North Africa' },
];

// Disjoint code sets. Checked in order; first hit wins. Unmatched → 'other'.
const MENA = new Set([
  'DZ','EG','LY','MA','TN','SD','BH','IR','IQ','IL','JO','KW','LB','OM','PS','QA','SA','SY','AE','YE','TR',
]);
const EUROPE = new Set([
  'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK',
  'LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE',
  'CH','UA','GB','VA',
]);
const NORTH_AMERICA = new Set(['US','CA','GL','BM']);
const LATAM = new Set([
  'MX','GT','BZ','SV','HN','NI','CR','PA','CO','VE','GY','SR','EC','PE','BR','BO','PY','UY','AR','CL','CU',
  'JM','HT','DO','BS','BB','AG','DM','GD','KN','LC','VC','TT','PR',
]);
const ASIA_PACIFIC = new Set([
  'AF','AM','AZ','GE','BD','BT','BN','KH','CN','IN','ID','JP','KZ','KP','KR','KG','LA','MY','MV','MN','MM',
  'NP','PK','PH','SG','LK','TW','TJ','TH','TL','TM','UZ','VN','HK','MO',
  'AU','NZ','FJ','PG','SB','VU','WS','TO','KI','TV','NR','FM','MH','PW','CK','NU',
]);
const AFRICA = new Set([
  'AO','BJ','BW','BF','BI','CV','CM','CF','CD','CG','CI','DJ','EQ','ER','SZ','ET','GA','GM','GH',
  'GN','GW','KE','LS','LR','MG','MW','ML','MR','MU','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','SS',
  'TZ','TG','UG','ZM','ZW',
]);

export function regionOf(countryCode: string | undefined): RegionId {
  if (!countryCode) return 'other';
  const c = countryCode.toUpperCase();
  if (MENA.has(c)) return 'mena';
  if (EUROPE.has(c)) return 'europe';
  if (NORTH_AMERICA.has(c)) return 'northAmerica';
  if (LATAM.has(c)) return 'latam';
  if (ASIA_PACIFIC.has(c)) return 'asiaPacific';
  if (AFRICA.has(c)) return 'africa';
  return 'other';
}

const COLOR_VARS: Record<RegionId, string> = {
  africa: 'var(--region-africa)',
  asiaPacific: 'var(--region-asia-pacific)',
  europe: 'var(--region-europe)',
  latam: 'var(--region-latam)',
  northAmerica: 'var(--region-north-america)',
  mena: 'var(--region-mena)',
  other: 'var(--region-other)',
};

export function regionColorVar(id: RegionId): string {
  return COLOR_VARS[id];
}
