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
