// The application settings contract (gloki_engage_application_settings.py) on
// the central application account (src/services/applicationServer.ts). THE
// ONLY module that talks to it. Today it answers one question: where does the
// verification contract live — its id and the agents that host it. The
// verification contract itself is deployed on the founder's own agent
// (verificationRegistry.ts); this contract only points to it, so more
// stewards can later host it too.
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
import settingsContractSrc from '../assets/contracts/gloki_engage_application_settings.py?raw';

const SETTINGS_CONTRACT = 'gloki_engage_application_settings.py';
const SETTINGS_CONTRACT_NAME = 'gloki engage application settings';

export interface ContractHostAddress {
  server: string;
  agent: string;
}

export interface VerificationLocation {
  contract: string;
  /** Agents holding the verification contract; any of them can serve it. */
  hosts: ContractHostAddress[];
}

let knownSettingsId: string | null = null;

function throwIfRefused(reply: unknown): void {
  if (reply && typeof reply === 'object' && 'error' in reply && typeof (reply as { error: unknown }).error === 'string') {
    throw new Error((reply as { error: string }).error);
  }
}

/** The settings contract's id on the central account, or null if it isn't deployed yet. */
async function findSettingsId(): Promise<string | null> {
  if (knownSettingsId) return knownSettingsId;
  const exists = await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  if (!exists) return null;
  const contracts = await getContractsOnChain({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  // If two clients raced to deploy it, the first contract the account lists wins.
  knownSettingsId = contracts.find((c) => c.contract === SETTINGS_CONTRACT)?.id ?? null;
  return knownSettingsId;
}

/** Finds the settings contract, deploying it on the central account (registered on first use) if needed. */
async function ensureSettingsId(): Promise<string> {
  const found = await findSettingsId();
  if (found) return found;

  const exists = await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
  if (!exists) {
    await registerAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT });
    // Registration is asynchronous too; deploy only once the account exists.
    for (let i = 0; i < 20; i++) {
      if (await isExistAgent({ serverUrl: APPLICATION_SERVER_URL, publicKey: APPLICATION_AGENT })) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const watcher = await openScopedAckStream(APPLICATION_SERVER_URL, APPLICATION_AGENT, '');
  try {
    const ackId = await deployContractOnChain({
      serverUrl: APPLICATION_SERVER_URL,
      publicKey: APPLICATION_AGENT,
      name: SETTINGS_CONTRACT_NAME,
      contract: SETTINGS_CONTRACT,
      code: settingsContractSrc,
      defaultApp: window.location.origin,
    });
    await watcher.waitFor(ackId);
  } finally {
    watcher.dispose();
  }
  knownSettingsId = null;
  const id = await findSettingsId();
  if (!id) throw new Error('Could not create the application settings.');
  return id;
}

/** Where the verification contract lives, or null if verification hasn't started. */
export async function getVerificationLocation(): Promise<VerificationLocation | null> {
  const settingsId = await findSettingsId();
  if (!settingsId) return null;
  const raw = await contractReadOnChain({
    serverUrl: APPLICATION_SERVER_URL,
    publicKey: APPLICATION_AGENT,
    contractId: settingsId,
    method: { name: 'get_verification', values: {} },
  });
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Partial<VerificationLocation>;
  const hosts = Array.isArray(obj.hosts) ? obj.hosts.filter((h) => h?.server && h?.agent) : [];
  if (!obj.contract || hosts.length === 0) return null;
  return { contract: obj.contract, hosts };
}

/**
 * Records `host` as holding the verification contract `contract`. The first
 * registration fixes the contract id; a different id afterwards is refused
 * with 'Verification has already started'.
 */
export async function registerVerificationHost(host: ContractHostAddress, contract: string): Promise<void> {
  const settingsId = await ensureSettingsId();
  const watcher = await openScopedAckStream(APPLICATION_SERVER_URL, APPLICATION_AGENT, settingsId);
  try {
    const ackId = await contractWriteOnChain({
      serverUrl: APPLICATION_SERVER_URL,
      publicKey: APPLICATION_AGENT,
      contractId: settingsId,
      method: { name: 'register_verification', values: { server: host.server, agent: host.agent, contract } },
    });
    throwIfRefused(await watcher.waitFor(ackId));
  } finally {
    watcher.dispose();
  }
}
