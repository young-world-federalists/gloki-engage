// The app-wide verification contract (GlokiVerification.sol): the single
// source of truth for who is verified. THE ONLY module that talks to it.
//
// Deployed by the first person to get verified (the founder and steward) on
// their own agent and node, and made public. Where it lives is published in
// the application settings contract (applicationSettings.ts): every client
// reads that first, then reads the verification contract's public copy on one
// of its hosts. Everyone else uses it as a guest, joining on their first
// action; every action is the signer's own.
//
// Phases, by how many people are verified (V):
//   not started  founder     the first person deploys it and becomes steward
//   V 1..3       sequential  one candidate at a time, vouched by everyone verified
//   V >= 4       open        four vouches from verified people
import { deploy, myContracts, read, write, type ContractHost } from './ibc';
import { getVerificationLocation, registerVerificationHost } from './applicationSettings';
import { readDigitalAgentProfile } from '../components/identity/agent/digitalAgentContract';
import verificationSol from '../assets/contracts/sol/GlokiVerification.sol?raw';

const VERIFICATION = {
  source: { 'GlokiVerification.sol': verificationSol },
  contractName: 'GlokiVerification',
};
const VERIFICATION_CONTRACT_NAME = 'gloki-verification';
/** V at which the open phase starts (and the vouches it needs). Mirrors the contract. */
const OPEN_THRESHOLD = 4;
const NOBODY = '0x0000000000000000000000000000000000000000';

export type VerificationPhase = 'founder' | 'sequential' | 'open';

/** Where a person's node and profile contract are, so others can show their name. */
export interface RegistryIdentity {
  publicKey: string;
  address: string;
  profile: string;
}

interface VerifiedRecord {
  key: string;
  at: string;
  method: 'founder' | 'sequential' | 'vouches';
  vouchers: string[];
  address: string;
  profile: string;
}

interface RegistryRequest {
  requester: string;
  approver: string;
  address: string;
  profile: string;
  at: string;
  status: 'pending' | 'approved' | 'declined';
}

interface RegistryVouch {
  voucher: string;
  requester: string;
  at: string;
}

export interface RegistryStatus {
  /** null = no verification contract yet (founder phase). */
  contractId: string | null;
  steward: string;
  verified: VerifiedRecord[];
  /** The sequential phase's one candidate, '' when the slot is free. */
  candidate: string;
  requests: RegistryRequest[];
  vouches: RegistryVouch[];
}

export interface PersonSummary {
  publicKey: string;
  name: string;
  country: string;
}

const EMPTY_STATUS: RegistryStatus = {
  contractId: null,
  steward: '',
  verified: [],
  candidate: '',
  requests: [],
  vouches: [],
};

export function phaseOf(status: RegistryStatus): VerificationPhase {
  if (!status.contractId) return 'founder';
  return status.verified.length < OPEN_THRESHOLD ? 'sequential' : 'open';
}

/** Vouches `publicKey` holds from people who are verified. */
export function vouchersFor(status: RegistryStatus, publicKey: string): string[] {
  const verified = new Set(status.verified.map((v) => v.key));
  return status.vouches.filter((v) => v.requester === publicKey && verified.has(v.voucher)).map((v) => v.voucher);
}

/** How many vouches `publicKey` needs right now: everyone verified (sequential) or four (open). */
export function requiredVouches(status: RegistryStatus): number {
  return phaseOf(status) === 'sequential' ? status.verified.length : OPEN_THRESHOLD;
}

/** Mirrors the contract's register() rules, so the app only offers it when it will pass. */
export function canRegister(status: RegistryStatus, publicKey: string): boolean {
  if (!status.contractId || status.verified.some((v) => v.key === publicKey)) return false;
  const vouchers = new Set(vouchersFor(status, publicKey));
  if (phaseOf(status) === 'sequential') {
    return status.candidate === publicKey && status.verified.every((v) => vouchers.has(v.key));
  }
  return vouchers.size >= OPEN_THRESHOLD;
}

// ── Lookup ──────────────────────────────────────────────────────────────────

interface VerificationTarget {
  contractId: string;
  host: ContractHost;
}

let known: VerificationTarget | null = null;

/** The verification contract and the host whose copy is read, or null if verification hasn't started. */
async function findVerification(): Promise<VerificationTarget | null> {
  if (known) return known;
  const location = await getVerificationLocation();
  // Any host holding the contract can serve it; the first listed is used.
  known = location ? { contractId: location.contract, host: location.hosts[0] } : null;
  return known;
}

const iso = (seconds: unknown): string => new Date(Number(seconds ?? 0) * 1000).toISOString();

type Row = Record<string, unknown>;

let statusInFlight: Promise<RegistryStatus> | null = null;

/** The contract's state. Concurrent callers share one read. */
export function getRegistryStatus(): Promise<RegistryStatus> {
  statusInFlight ??= readStatus().finally(() => {
    statusInFlight = null;
  });
  return statusInFlight;
}

async function readStatus(): Promise<RegistryStatus> {
  const target = await findVerification();
  if (!target) return EMPTY_STATUS;
  // The user's own copy (or, as a guest, their host's) once they hold it; the public copy before.
  const s = (await read(target.contractId, 'get_status', {}, { host: target.host })) as Row;
  const rows = (value: unknown): Row[] => (Array.isArray(value) ? (value as Row[]) : []);
  return {
    contractId: target.contractId,
    steward: String(s.steward ?? ''),
    verified: rows(s.verified).map((v) => ({
      key: String(v.key),
      at: iso(v.at),
      method: v.method as VerifiedRecord['method'],
      vouchers: (v.vouchers as string[]) ?? [],
      address: String(v.node ?? ''),
      profile: String(v.profile ?? ''),
    })),
    candidate: s.candidate === NOBODY ? '' : String(s.candidate ?? ''),
    requests: rows(s.requests).map((r) => ({
      requester: String(r.requester),
      approver: String(r.approver),
      address: String(r.node ?? ''),
      profile: String(r.profile ?? ''),
      at: iso(r.at),
      status: r.status as RegistryRequest['status'],
    })),
    vouches: rows(s.vouches).map((v) => ({ voucher: String(v.voucher), requester: String(v.requester), at: iso(v.at) })),
  };
}

// ── Writes ──────────────────────────────────────────────────────────────────

async function act(method: string, values: Record<string, unknown>): Promise<void> {
  const target = await findVerification();
  if (!target) throw new Error('Verification has not started');
  await write(target.contractId, method, values, { guest: { host: target.host, ...VERIFICATION } });
}

/**
 * Founder phase: deploys the verification contract on `me`'s own agent and
 * node (they approve it there), which makes `me` its steward and first
 * verified person, then publishes where it lives in the application
 * settings. Throws 'Verification has already started' if someone got there
 * first (their contract wins; ours is left unused).
 */
export async function becomeFounder(me: RegistryIdentity): Promise<void> {
  known = null;
  if (await getVerificationLocation()) throw new Error('Verification has already started');
  // Two approvals: if the browser blocked the second, the next click resumes
  // with the contract already deployed.
  const deployed = (await myContracts(true)).find((c) => c.name === VERIFICATION_CONTRACT_NAME && c.role === 'partner');
  const contractId = deployed?.id ?? (await deploy({
    ...VERIFICATION,
    name: VERIFICATION_CONTRACT_NAME,
    args: { node: me.address, profile: me.profile },
    isPublic: true,
  }));
  await registerVerificationHost(me.address, contractId);
  known = { contractId, host: { server: me.address, agent: me.publicKey } };
}

export function requestVouch(me: RegistryIdentity, approver: string): Promise<void> {
  return act('request_vouch', { approver, node: me.address, profile: me.profile });
}

/** The signed-in person vouches for `requester`. */
export function vouch(requester: string): Promise<void> {
  return act('vouch', { requester });
}

/** The signed-in person declines `requester`'s request. */
export function declineVouch(requester: string): Promise<void> {
  return act('decline_vouch', { requester });
}

/** Adds the signed-in person to the verified list with the vouches collected; the contract re-checks every one. */
export function register(me: RegistryIdentity, vouchers: string[]): Promise<void> {
  return act('register', { vouchers, node: me.address, profile: me.profile });
}

/** The steward frees the sequential phase's candidate slot. */
export function resetCandidate(): Promise<void> {
  return act('reset_candidate', {});
}

// ── Names ───────────────────────────────────────────────────────────────────

const summaryCache = new Map<string, Promise<PersonSummary>>();

/** Name + country from the person's public profile contract; falls back to a short key. */
export function personSummary(person: { key: string; address: string; profile: string }): Promise<PersonSummary> {
  const cached = summaryCache.get(person.key);
  if (cached) return cached;
  const fallback: PersonSummary = { publicKey: person.key, name: person.key.slice(0, 8), country: '' };
  if (!person.address || !person.profile) return Promise.resolve(fallback);
  const promise = (async (): Promise<PersonSummary> => {
    const profile = await readDigitalAgentProfile({ serverUrl: person.address, publicKey: person.key, contractId: person.profile });
    if (!profile?.displayName) return fallback;
    return { publicKey: person.key, name: profile.displayName, country: profile.country };
  })().catch(() => fallback);
  summaryCache.set(person.key, promise);
  // Only a resolved name is kept; a failed lookup is retried on the next read.
  void promise.then((summary) => {
    if (summary === fallback) summaryCache.delete(person.key);
  });
  return promise;
}
