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

/** Seed "vouched by N": the inviter plus a couple of other community members. */
export function defaultVouchers(inviterKey: string): string[] {
  const others = PERSONAS.filter((p) => p.publicKey !== inviterKey).slice(0, 2);
  return [inviterKey, ...others.map((p) => p.publicKey)];
}

/** A short, curated language set for the onboarding picker (NOT the full 197). */
export interface OnboardingLanguage {
  code: string;
  defaultLabel: string;
}
export const ONBOARDING_LANGUAGES: OnboardingLanguage[] = [
  { code: 'en', defaultLabel: 'English' },
  { code: 'es', defaultLabel: 'Español' },
  { code: 'fr', defaultLabel: 'Français' },
  { code: 'pt', defaultLabel: 'Português' },
  { code: 'ar', defaultLabel: 'العربية' },
  { code: 'hi', defaultLabel: 'हिन्दी' },
  { code: 'zh', defaultLabel: '中文' },
];

/** Demo participation rows for the Digital Agent card (real activity isn't tracked). */
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
