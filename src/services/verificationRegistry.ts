// The app-wide verification contract (gloki_verification_contract.py): the
// single source of truth for who is verified. THE ONLY module that talks to it.
//
// Deployed by the first person to get verified (the founder and steward) on
// their OWN agent and node. Where it lives is published in the application
// settings contract on the central account (applicationSettings.ts): every
// client reads that first, then reads and writes the verification contract
// on one of its hosts. Users never join it, so every method carries the acting
// person's key as an argument, and writes are confirmed on the host agent's
// event stream (openScopedAckStream), not the signed-in user's.
//
// Phases, by how many people are verified (V):
//   not started  founder     the first person deploys it and becomes steward
//   V 1..3       sequential  one candidate at a time, vouched by everyone verified
//   V >= 4       open        four vouches from verified people
import {
  contractReadOnChain,
  contractWriteOnChain,
  deployContractOnChain,
  getContractsOnChain,
} from './api';
import { openScopedAckStream } from './eventStream';
import {
  getVerificationLocation,
  registerVerificationHost,
  type ContractHostAddress,
} from './applicationSettings';
import { findDigitalAgentContract, readDigitalAgentProfile } from '../components/identity/agent/digitalAgentContract';
import verificationContractSrc from '../assets/contracts/gloki_verification_contract.py?raw';

export const VERIFICATION_CONTRACT = 'gloki_verification_contract.py';
export const VERIFICATION_CONTRACT_NAME = 'gloki-verification';
/** V at which the open phase starts (and the vouches it needs). Mirrors the contract. */
export const OPEN_THRESHOLD = 4;

export type VerificationPhase = 'founder' | 'sequential' | 'open';

/** Where a person's node and profile contract are, so others can show their name. */
export interface RegistryIdentity {
  publicKey: string;
  address: string;
  profile: string;
}

export interface VerifiedRecord {
  key: string;
  at: string;
  method: 'founder' | 'sequential' | 'vouches';
  vouchers: string[];
  address: string;
  profile: string;
}

export interface RegistryRequest {
  requester: string;
  approver: string;
  address: string;
  profile: string;
  at: string;
  status: 'pending' | 'approved' | 'declined';
}

export interface RegistryVouch {
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

/** Mirrors the contract's register() rules, so the app only calls it when it will pass. */
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
  host: ContractHostAddress;
}

let known: VerificationTarget | null = null;

/** The verification contract and the host to call it on, or null if verification hasn't started. */
async function findVerification(): Promise<VerificationTarget | null> {
  if (known) return known;
  const location = await getVerificationLocation();
  // Any host holding the contract can serve it; the first listed is used.
  known = location ? { contractId: location.contract, host: location.hosts[0] } : null;
  return known;
}

export async function getRegistryStatus(): Promise<RegistryStatus> {
  const target = await findVerification();
  if (!target) return EMPTY_STATUS;
  const raw = await contractReadOnChain({
    serverUrl: target.host.server,
    publicKey: target.host.agent,
    contractId: target.contractId,
    method: { name: 'get_status', values: {} },
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<RegistryStatus>;
  return {
    contractId: target.contractId,
    steward: obj.steward ?? '',
    verified: Array.isArray(obj.verified) ? obj.verified : [],
    candidate: obj.candidate ?? '',
    requests: Array.isArray(obj.requests) ? obj.requests : [],
    vouches: Array.isArray(obj.vouches) ? obj.vouches : [],
  };
}

// ── Writes ──────────────────────────────────────────────────────────────────

function throwIfRefused(reply: unknown): void {
  if (reply && typeof reply === 'object' && 'error' in reply && typeof (reply as { error: unknown }).error === 'string') {
    throw new Error((reply as { error: string }).error);
  }
}

async function writeOn(target: VerificationTarget, name: string, values: Record<string, unknown>): Promise<void> {
  const watcher = await openScopedAckStream(target.host.server, target.host.agent, target.contractId);
  try {
    const ackId = await contractWriteOnChain({
      serverUrl: target.host.server,
      publicKey: target.host.agent,
      contractId: target.contractId,
      method: { name, values },
    });
    throwIfRefused(await watcher.waitFor(ackId));
  } finally {
    watcher.dispose();
  }
}

async function write(name: string, values: Record<string, unknown>): Promise<void> {
  const target = await findVerification();
  if (!target) throw new Error('Verification has not started');
  await writeOn(target, name, values);
}

/**
 * Founder phase: deploys the verification contract on `me`'s own agent and
 * node, makes `me` its steward and first verified person, then publishes
 * where it lives in the application settings. Throws 'Verification has
 * already started' if someone got there first (their contract wins; ours is
 * left unused).
 */
export async function becomeFounder(me: RegistryIdentity): Promise<void> {
  known = null;
  if (await getVerificationLocation()) throw new Error('Verification has already started');

  const host: ContractHostAddress = { server: me.address, agent: me.publicKey };
  const watcher = await openScopedAckStream(host.server, host.agent, '');
  let contractId: string;
  try {
    const ackId = await deployContractOnChain({
      serverUrl: host.server,
      publicKey: host.agent,
      name: VERIFICATION_CONTRACT_NAME,
      contract: VERIFICATION_CONTRACT,
      code: verificationContractSrc,
      defaultApp: window.location.origin,
    });
    // The ack id doubles as the contract id; it's safe to write once the
    // deploy event confirms it (as in digitalAgentContract.ts).
    await watcher.waitFor(ackId);
    contractId = ackId;
  } finally {
    watcher.dispose();
  }

  // Initialize before publishing, so nobody ever finds an empty contract.
  const target: VerificationTarget = { contractId, host };
  await writeOn(target, 'initialize', { steward: me.publicKey, address: me.address, profile: me.profile });
  await registerVerificationHost(host, contractId);
  known = target;
}

export function requestVouch(me: RegistryIdentity, approver: string): Promise<void> {
  return write('request_vouch', { requester: me.publicKey, approver, address: me.address, profile: me.profile });
}

export function vouch(voucher: string, requester: string): Promise<void> {
  return write('vouch', { voucher, requester });
}

export function declineVouch(approver: string, requester: string): Promise<void> {
  return write('decline_vouch', { approver, requester });
}

/** Adds `me` to the verified list with the vouches collected; the contract re-checks every one. */
export function register(me: RegistryIdentity, vouchers: string[]): Promise<void> {
  return write('register', { newcomer: me.publicKey, vouchers, address: me.address, profile: me.profile });
}

export function resetCandidate(steward: string): Promise<void> {
  return write('reset_candidate', { steward });
}

// ── Names ───────────────────────────────────────────────────────────────────

const summaryCache = new Map<string, Promise<PersonSummary>>();

/**
 * The person's CURRENT Digital Agent profile id, found by name on their own
 * node (as login does). The id stored in the contract is only a fallback: it
 * goes stale when the person re-onboards (e.g. after a node reset).
 */
async function currentProfileId(address: string, key: string, stored: string): Promise<string> {
  try {
    const contracts = await getContractsOnChain({ serverUrl: address, publicKey: key });
    return findDigitalAgentContract(contracts)?.id ?? stored;
  } catch {
    return stored;
  }
}

/** Name + country from the person's own profile contract; falls back to a short key. */
export function personSummary(person: { key: string; address: string; profile: string }): Promise<PersonSummary> {
  const cached = summaryCache.get(person.key);
  if (cached) return cached;
  const fallback: PersonSummary = { publicKey: person.key, name: person.key.slice(0, 8), country: '' };
  if (!person.address) return Promise.resolve(fallback);
  const promise = (async (): Promise<PersonSummary> => {
    const profileId = await currentProfileId(person.address, person.key, person.profile);
    if (!profileId) return fallback;
    const profile = await readDigitalAgentProfile({ serverUrl: person.address, publicKey: person.key, contractId: profileId });
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
