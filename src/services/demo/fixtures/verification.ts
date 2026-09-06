// Verification fixtures (S36 — Prompt 2 Wave 1).
//
// The 30 "verified members" a newcomer can ask to vouch = the 16 PERSONAS (who
// are members of every demo community, so their vouches unlock community-gated
// stages) + the 14 verification-only members below, who are NOT community
// members (E1: no member-count / turnout / 50%-threshold inflation).
//
// E2 (Eston, 2026-09-06): request outcomes are deterministic — `declines: true`
// members never respond; everyone else approves after the 2–5 s demo delay.
// The four decliners are all among the 14, so every persona approves and the
// community-gate journey (2 → 4 → Vote unlocks) is always completable.
import { PERSONAS } from './identity';
import type { MemberSummary } from '../../verificationModel';

export interface VerificationMember {
  publicKey: string;
  firstName: string;
  lastName: string;
  country: string; // ISO 3166-1 alpha-2
  online: boolean;
  declines?: boolean;
}

export const VERIFICATION_MEMBERS: VerificationMember[] = [
  { publicKey: 'demo-verif-ke-wanjiru', firstName: 'Wanjiru', lastName: 'Kamau', country: 'KE', online: true },
  { publicKey: 'demo-verif-mw-chikondi', firstName: 'Chikondi', lastName: 'Banda', country: 'MW', online: false },
  { publicKey: 'demo-verif-sn-aminata', firstName: 'Aminata', lastName: 'Diop', country: 'SN', online: true },
  { publicKey: 'demo-verif-vn-linh', firstName: 'Linh', lastName: 'Nguyen', country: 'VN', online: true },
  { publicKey: 'demo-verif-bd-rahim', firstName: 'Rahim', lastName: 'Chowdhury', country: 'BD', online: false },
  { publicKey: 'demo-verif-np-sita', firstName: 'Sita', lastName: 'Gurung', country: 'NP', online: false, declines: true },
  { publicKey: 'demo-verif-es-carmen', firstName: 'Carmen', lastName: 'García', country: 'ES', online: true },
  { publicKey: 'demo-verif-ua-oksana', firstName: 'Oksana', lastName: 'Melnyk', country: 'UA', online: false, declines: true },
  { publicKey: 'demo-verif-co-camila', firstName: 'Camila', lastName: 'Rojas', country: 'CO', online: true },
  { publicKey: 'demo-verif-pe-mateo', firstName: 'Mateo', lastName: 'Quispe', country: 'PE', online: false, declines: true },
  { publicKey: 'demo-verif-ar-valentina', firstName: 'Valentina', lastName: 'López', country: 'AR', online: true },
  { publicKey: 'demo-verif-ca-noah', firstName: 'Noah', lastName: 'Tremblay', country: 'CA', online: false },
  { publicKey: 'demo-verif-us-jordan', firstName: 'Jordan', lastName: 'Reyes', country: 'US', online: true, declines: true },
  { publicKey: 'demo-verif-fj-sereana', firstName: 'Sereana', lastName: 'Naidu', country: 'FJ', online: true },
];

/** Deterministic presence for the personas (the identity fixture has no presence field). */
const PERSONA_ONLINE = new Set([
  'demo-user-in-priya', 'demo-user-ng-amina', 'demo-user-gh-kwame', 'demo-user-de-anika',
  'demo-user-kr-jiwoo', 'demo-user-za-thabo', 'demo-user-ph-maria',
]);

/** The 30 members, personas first. */
export function allVerificationMembers(): MemberSummary[] {
  const personas: MemberSummary[] = PERSONAS.map((p) => ({
    publicKey: p.publicKey,
    name: p.displayName ?? `${p.firstName} ${p.lastName}`,
    country: p.country,
    online: PERSONA_ONLINE.has(p.publicKey),
  }));
  const extra: MemberSummary[] = VERIFICATION_MEMBERS.map((m) => ({
    publicKey: m.publicKey,
    name: `${m.firstName} ${m.lastName}`,
    country: m.country,
    online: m.online,
  }));
  return [...personas, ...extra];
}

export function findVerificationMember(publicKey: string): MemberSummary | undefined {
  return allVerificationMembers().find((m) => m.publicKey === publicKey);
}

export function memberDeclines(publicKey: string): boolean {
  return VERIFICATION_MEMBERS.some((m) => m.publicKey === publicKey && m.declines === true);
}

/** Members who asked the demo user to vouch (two personas, two new members). */
export const SEEDED_INCOMING_REQUESTERS = [
  'demo-verif-ke-wanjiru',
  'demo-user-pl-marta',
  'demo-verif-vn-linh',
  'demo-user-ph-maria',
];
