// The app-wide verification contract (gloki_verification_contract.py): the
// single source of truth for who is verified. THE ONLY module that talks to it.
//
// One deployment, under the application agent on the application server
// (src/services/applicationServer.ts). Users never join it: every read and
// write goes through that agent, so each method carries the acting person's
// key as an argument. Writes are confirmed on the application agent's own
// event stream (openScopedAckStream), not the signed-in user's.
//
// Phases, by how many people are verified (V):
//   no contract  founder     the first person deploys it and becomes steward
//   V 1..3       sequential  one candidate at a time, vouched by everyone verified
//   V >= 4       open        four vouches from verified people
import {
  contractReadOnChain,
  contractWriteOnChain,
  deployContractOnChain,
  getContractsOnChain,
  isExistAgent,
  registerAgent,
} from './api';
import { openScopedAckStream } from './eventStream';
import { APPLICATION_AGENT, APPLICATION_SERVER_URL } from './applicationServer';
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

let knownContractId: string | null = null;

/** The verification contract's id, or null if nobody has started verification yet. */
async function findContractId(): Promise<string | null> {
  if (knownContractId) return knownContractId;
  const exists = await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  if (!exists) return null;
  const contracts = await getContractsOnChain({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  // If two founders raced, the first contract the agent lists wins.
  const found = contracts.find((c) => c.contract === VERIFICATION_CONTRACT);
  knownContractId = found?.id ?? null;
  return knownContractId;
}

export async function getRegistryStatus(): Promise<RegistryStatus> {
  const contractId = await findContractId();
  if (!contractId) return EMPTY_STATUS;
  const raw = await contractReadOnChain({
    serverUrl: APPLICATION_SERVER_URL,
    publicKey: APPLICATION_AGENT,
    contractId,
    method: { name: 'get_status', values: {} },
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<RegistryStatus>;
  return {
    contractId,
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

async function write(name: string, values: Record<string, unknown>): Promise<void> {
  const contractId = await findContractId();
  if (!contractId) throw new Error('Verification has not started');
  const watcher = await openScopedAckStream(APPLICATION_SERVER_URL, APPLICATION_AGENT, contractId);
  try {
    const ackId = await contractWriteOnChain({
      serverUrl: APPLICATION_SERVER_URL,
      publicKey: APPLICATION_AGENT,
      contractId,
      method: { name, values },
    });
    throwIfRefused(await watcher.waitFor(ackId));
  } finally {
    watcher.dispose();
  }
}

/**
 * Founder phase: deploys the verification contract under the application
 * agent (registering that agent on first use) and makes `me` its steward and
 * first verified person. Throws 'Verification has already started' if
 * someone got there first.
 */
export async function becomeFounder(me: RegistryIdentity): Promise<void> {
  knownContractId = null;
  if (await findContractId()) throw new Error('Verification has already started');
  const exists = await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  if (!exists) {
    await registerAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
    // Registration is asynchronous too; deploy only once the agent exists.
    for (let i = 0; i < 20; i++) {
      if (await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT })) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const watcher = await openScopedAckStream(APPLICATION_SERVER_URL, APPLICATION_AGENT, '');
  let contractId: string;
  try {
    const ackId = await deployContractOnChain({
      serverUrl: APPLICATION_SERVER_URL,
      publicKey: APPLICATION_AGENT,
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

  // If another founder raced us, initialize the contract the lookup picks.
  knownContractId = null;
  const winner = await findContractId();
  if (winner && winner !== contractId) throw new Error('Verification has already started');
  await write('initialize', { steward: me.publicKey, address: me.address, profile: me.profile });
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
