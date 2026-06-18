// Identity fixtures.
//
// A globally diverse set of personas who populate the demo communities — across
// six continents, many languages. Names, countries, and the languages each
// person speaks (used by presence + multilingual UI).

export interface Persona {
  publicKey: string;
  firstName: string;
  lastName: string;
  country: string; // ISO 3166-1 alpha-2
  languages: string[]; // ISO 639-1 (+ local) codes the person speaks
  userBio: string;
  userPhoto: string; // empty → UI renders initials
}

export const PERSONAS: Persona[] = [
  { publicKey: 'demo-user-in-priya', firstName: 'Priya', lastName: 'Nair', country: 'IN', languages: ['en', 'hi'], userBio: 'Public-health researcher, Bengaluru', userPhoto: '' },
  { publicKey: 'demo-user-br-lucas', firstName: 'Lucas', lastName: 'Oliveira', country: 'BR', languages: ['pt', 'en'], userBio: 'Civic-tech organiser, São Paulo', userPhoto: '' },
  { publicKey: 'demo-user-ng-amina', firstName: 'Amina', lastName: 'Suleiman', country: 'NG', languages: ['en', 'ha'], userBio: 'Community health worker, Kano', userPhoto: '' },
  { publicKey: 'demo-user-cn-mei', firstName: 'Mei', lastName: 'Chen', country: 'CN', languages: ['zh', 'en'], userBio: 'Urban planner, Chengdu', userPhoto: '' },
  { publicKey: 'demo-user-it-sofia', firstName: 'Sofia', lastName: 'Rossi', country: 'IT', languages: ['it', 'en'], userBio: 'Digital-rights lawyer, Bologna', userPhoto: '' },
  { publicKey: 'demo-user-gh-kwame', firstName: 'Kwame', lastName: 'Mensah', country: 'GH', languages: ['en', 'tw'], userBio: 'Renewable-energy engineer, Accra', userPhoto: '' },
  { publicKey: 'demo-user-jp-yuki', firstName: 'Yuki', lastName: 'Tanaka', country: 'JP', languages: ['ja', 'en'], userBio: 'Ocean-conservation volunteer, Fukuoka', userPhoto: '' },
  { publicKey: 'demo-user-de-anika', firstName: 'Anika', lastName: 'Bauer', country: 'DE', languages: ['de', 'en'], userBio: 'Privacy advocate, Leipzig', userPhoto: '' },
  { publicKey: 'demo-user-mx-diego', firstName: 'Diego', lastName: 'Hernández', country: 'MX', languages: ['es', 'en'], userBio: 'Housing-cooperative organiser, Guadalajara', userPhoto: '' },
  { publicKey: 'demo-user-eg-fatima', firstName: 'Fatima', lastName: 'Hassan', country: 'EG', languages: ['ar', 'en'], userBio: 'Youth-employment trainer, Cairo', userPhoto: '' },
  { publicKey: 'demo-user-kr-jiwoo', firstName: 'Ji-woo', lastName: 'Park', country: 'KR', languages: ['ko', 'en'], userBio: 'Misinformation researcher, Seoul', userPhoto: '' },
  { publicKey: 'demo-user-pk-aisha', firstName: 'Aisha', lastName: 'Khan', country: 'PK', languages: ['ur', 'en'], userBio: 'Teacher & union rep, Lahore', userPhoto: '' },
  { publicKey: 'demo-user-za-thabo', firstName: 'Thabo', lastName: 'Nkosi', country: 'ZA', languages: ['en', 'zu'], userBio: 'Small-business mentor, Johannesburg', userPhoto: '' },
  { publicKey: 'demo-user-pl-marta', firstName: 'Marta', lastName: 'Nowak', country: 'PL', languages: ['pl', 'en'], userBio: 'Open-data journalist, Kraków', userPhoto: '' },
  { publicKey: 'demo-user-id-putri', firstName: 'Putri', lastName: 'Wijaya', country: 'ID', languages: ['id', 'en'], userBio: 'Coastal-cleanup coordinator, Surabaya', userPhoto: '' },
  { publicKey: 'demo-user-ph-maria', firstName: 'Maria', lastName: 'Santos', country: 'PH', languages: ['en', 'tl'], userBio: 'Disaster-resilience organiser, Cebu', userPhoto: '' },
];

export function pick<T>(arr: T[], n: number, seed = 0): T[] {
  // Deterministic pseudo-random selection so demo state is reproducible.
  const result: T[] = [];
  let s = seed || 1;
  const pool = [...arr];
  const take = Math.min(n, pool.length);
  for (let i = 0; i < take; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

// ── Onboarding / lightweight trust ───────────────────────────────────────────
// A friend's invite resolves to the voucher who brought the newcomer in.
// UI-only — no backend, no contract writes.

const personaByKey: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p): [string, Persona] => [p.publicKey, p]),
);

/** Look up a seeded persona by public key (used to render vouchers). */
export function getPersona(publicKey: string): Persona | undefined {
  return personaByKey[publicKey];
}

/** Invite code → voucher publicKey. Unknown/missing codes fall back to the default. */
export const INVITE_CODES: Record<string, string> = {
  GLOKI: 'demo-user-in-priya',
  WELCOME: 'demo-user-br-lucas',
  JOIN: 'demo-user-de-anika',
  FRIEND: 'demo-user-ph-maria',
};

export const DEFAULT_INVITE_VOUCHER = 'demo-user-in-priya';

/** Resolve an invite code to the voucher persona (defaults to a friendly persona). */
export function getVoucher(code?: string | null): Persona {
  const key = (code && INVITE_CODES[code.toUpperCase()]) || DEFAULT_INVITE_VOUCHER;
  return personaByKey[key] ?? PERSONAS[0];
}

// ── Web-of-trust vouch graph (demo) ──────────────────────────────────────────
// Maps a member to the members who vouch for them. Hand-tuned counts so the
// Members list shows all three trust states on first load: most Verified (>=4),
// a few Vouched (1-3), one Unverified (0). Deterministic (uses `pick`).
const VOUCH_COUNTS: Record<string, number> = {
  'demo-user-in-priya': 6, 'demo-user-br-lucas': 5, 'demo-user-ng-amina': 4,
  'demo-user-cn-mei': 5, 'demo-user-it-sofia': 4, 'demo-user-gh-kwame': 4,
  'demo-user-jp-yuki': 7, 'demo-user-de-anika': 5, 'demo-user-mx-diego': 4,
  'demo-user-eg-fatima': 3, 'demo-user-kr-jiwoo': 2, 'demo-user-pk-aisha': 4,
  'demo-user-za-thabo': 4, 'demo-user-pl-marta': 1, 'demo-user-id-putri': 5,
  'demo-user-ph-maria': 0,
};

function seedFromKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
  return h || 1;
}

/**
 * Build the vouch graph for a given member set (members vouch for members).
 * Caller passes the community's member keys so vouchers are always members.
 */
export function getVouchGraph(memberKeys: string[]): Record<string, string[]> {
  const memberSet = new Set(memberKeys);
  const graph: Record<string, string[]> = {};
  for (const p of PERSONAS) {
    if (!memberSet.has(p.publicKey)) continue;
    const count = VOUCH_COUNTS[p.publicKey] ?? 0;
    const others = PERSONAS.filter((o) => o.publicKey !== p.publicKey && memberSet.has(o.publicKey));
    graph[p.publicKey] = pick(others, count, seedFromKey(p.publicKey)).map((o) => o.publicKey);
  }
  return graph;
}

/** Seed "vouched by 2": the inviter plus one other community member (pending). */
export function defaultVouchers(inviterKey: string): string[] {
  const other = PERSONAS.find((p) => p.publicKey !== inviterKey);
  return other ? [inviterKey, other.publicKey] : [inviterKey];
}

/** Demo participation rows for the profile card (real activity isn't tracked). */
export interface ParticipationEntry {
  titleKey: string;
  defaultTitle: string;
  stageKey: string;
  defaultStage: string;
  when: string;
}
export const DEMO_PARTICIPATION: ParticipationEntry[] = [
  { titleKey: 'agent.activity.water', defaultTitle: 'Clean drinking water for all', stageKey: 'nav.problem', defaultStage: 'Problem', when: '2d ago' },
  { titleKey: 'agent.activity.privacy', defaultTitle: 'A global baseline for digital privacy', stageKey: 'nav.vote', defaultStage: 'Vote', when: '5d ago' },
  { titleKey: 'agent.activity.housing', defaultTitle: 'Affordable housing in growing cities', stageKey: 'nav.discussion', defaultStage: 'Discuss', when: '1w ago' },
];
