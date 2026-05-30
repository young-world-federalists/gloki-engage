// Lane A — Identity fixtures.
//
// The youth personas who populate the flagship "Voices for the Climate"
// deliberation, across Kenya, Nigeria, Malawi and DR Congo. Names, countries,
// and the languages each person speaks (used by presence + multilingual UI).

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
  // Kenya
  { publicKey: 'demo-user-ke-amani', firstName: 'Amani', lastName: 'Otieno', country: 'KE', languages: ['en', 'sw'], userBio: 'Climate club organiser, Kisumu', userPhoto: '' },
  { publicKey: 'demo-user-ke-wanjiru', firstName: 'Wanjiru', lastName: 'Kamau', country: 'KE', languages: ['en', 'sw'], userBio: 'Solar technician apprentice, Nairobi', userPhoto: '' },
  { publicKey: 'demo-user-ke-brian', firstName: 'Brian', lastName: 'Mwangi', country: 'KE', languages: ['en', 'sw'], userBio: 'Geography student & community mapper, Nakuru', userPhoto: '' },
  // Nigeria
  { publicKey: 'demo-user-ng-chiamaka', firstName: 'Chiamaka', lastName: 'Okeke', country: 'NG', languages: ['en'], userBio: 'Youth climate advocate, Enugu', userPhoto: '' },
  { publicKey: 'demo-user-ng-emeka', firstName: 'Emeka', lastName: 'Eze', country: 'NG', languages: ['en'], userBio: 'Flood-response volunteer, Lokoja', userPhoto: '' },
  { publicKey: 'demo-user-ng-fatima', firstName: 'Fatima', lastName: 'Bello', country: 'NG', languages: ['en'], userBio: 'Tree-nursery cooperative lead, Kano', userPhoto: '' },
  // Malawi
  { publicKey: 'demo-user-mw-thoko', firstName: 'Thoko', lastName: 'Banda', country: 'MW', languages: ['en', 'ny'], userBio: 'Lake conservation volunteer, Mangochi', userPhoto: '' },
  { publicKey: 'demo-user-mw-limbani', firstName: 'Limbani', lastName: 'Phiri', country: 'MW', languages: ['en', 'ny'], userBio: 'Smallholder farming youth lead, Zomba', userPhoto: '' },
  { publicKey: 'demo-user-mw-chisomo', firstName: 'Chisomo', lastName: 'Gondwe', country: 'MW', languages: ['en', 'ny'], userBio: 'Clean-water campaigner, Mzuzu', userPhoto: '' },
  // DR Congo
  { publicKey: 'demo-user-cd-pascal', firstName: 'Pascal', lastName: 'Mbuyi', country: 'CD', languages: ['fr', 'sw', 'ln'], userBio: 'Renewable energy student, Lubumbashi', userPhoto: '' },
  { publicKey: 'demo-user-cd-esperance', firstName: 'Espérance', lastName: 'Kahindo', country: 'CD', languages: ['fr', 'sw'], userBio: 'Community radio host, Goma', userPhoto: '' },
  { publicKey: 'demo-user-cd-joseph', firstName: 'Joseph', lastName: 'Ilunga', country: 'CD', languages: ['fr', 'ln'], userBio: 'Reforestation organiser, Kinshasa', userPhoto: '' },
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

// ── Onboarding / lightweight trust (Lane A) ──────────────────────────────────
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
  CLIMATE24: 'demo-user-ke-amani',
  NAIROBI: 'demo-user-ke-wanjiru',
  LAGOS: 'demo-user-ng-chiamaka',
  GOMA: 'demo-user-cd-esperance',
};

export const DEFAULT_INVITE_VOUCHER = 'demo-user-ke-amani';

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
  { code: 'fr', defaultLabel: 'Français' },
  { code: 'sw', defaultLabel: 'Kiswahili' },
  { code: 'ny', defaultLabel: 'Chichewa' },
  { code: 'ln', defaultLabel: 'Lingala' },
  { code: 'ha', defaultLabel: 'Hausa' },
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
  { titleKey: 'agent.activity.plasticFree', defaultTitle: 'Plastic-free lakes', stageKey: 'nav.problem', defaultStage: 'Problem', when: '2d ago' },
  { titleKey: 'agent.activity.flooding', defaultTitle: 'Flood early-warning network', stageKey: 'nav.discussion', defaultStage: 'Discuss', when: '5d ago' },
  { titleKey: 'agent.activity.solar', defaultTitle: 'Solar for rural schools', stageKey: 'nav.vote', defaultStage: 'Vote', when: '1w ago' },
];
