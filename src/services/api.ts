// Seam boundary between the UI and the Gloki backend, migrating one method at
// a time from the UI-only mock to real IBC calls. isExistAgent/registerAgent/
// getContracts call the real server; deployContract/joinContract/contractRead/
// contractWrite are still answered locally by the demo mock layer.
//
// getContracts merges real results with the seeded demo communities so the
// mockup content keeps showing until the remaining methods are migrated too.
//
// All public function signatures are unchanged so callers (slices, flow APIs,
// contract wrappers) keep working without edits.

import type { IMethod, IContract } from "./interfaces";
import {
  ensureDefaultDemoCommunity,
  mockContractRead,
  mockContractWrite,
  mockDeployAny,
  mockJoinContract,
  mergeDemoContracts,
} from "./demo/mockApi";

const FAKE_DEPLOY_DELAY = 200;

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    // fetch() itself rejects for network/DNS/CORS failures or our own abort
    // — neither has an HTTP status, so give it wording LoginPage recognizes
    // as a connection error rather than letting it fall through as generic.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The server took too long to respond and may be unreachable.');
    }
    throw new Error('Could not connect to the server — it may be unreachable.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status} ${response.statusText}`;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      if (json.message || json.error) message = json.message ?? json.error ?? message;
    } catch {
      if (text.trim() && !text.trim().startsWith('<')) message = text.trim();
    }
    throw new Error(message);
  }
  return await response.json();
}

// IS_EXIST_AGENT
// The server responds with a bare JSON boolean (e.g. `false`), not an
// object — don't destructure it.
export async function isExistAgent({
  serverUrl,
  publicKey,
}: {
  serverUrl: string;
  publicKey: string;
}): Promise<boolean> {
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=is_exist_agent`,
    { method: 'GET' }
  );
}

// REGISTER_AGENT
export async function registerAgent({
  serverUrl,
  publicKey,
}: {
  serverUrl: string;
  publicKey: string;
}) {
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=register_agent`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: serverUrl }),
    }
  );
}

// GET_CONTRACTS
export async function getContracts({
  serverUrl,
  publicKey,
}: {
  serverUrl: string;
  publicKey: string;
}): Promise<IContract[]> {
  const realContracts = (await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=get_contracts`,
    { method: 'GET' }
  )) as IContract[];
  // Demo content still needs to show up until deployContract/contractRead/contractWrite
  // are migrated off the mock layer too — seed once, then merge alongside real data.
  ensureDefaultDemoCommunity(publicKey);
  return mergeDemoContracts(realContracts ?? []);
}

// REAL deploy/write/read, bypassing the mock layer entirely — currently used
// only by the digital-agent profile contract (src/components/identity/agent/
// digitalAgentContract.ts). deployContract/contractWrite/contractRead below
// stay on the mock layer for every other flow, which isn't ready for a real
// backend yet; migrating those wholesale would break them. Writes only
// return an ack id — pair with waitForChainAck from services/eventStream.ts
// to get the real result once it arrives on the SSE stream.
export async function deployContractOnChain({
  serverUrl,
  publicKey,
  name,
  contract,
  code,
  constructorArgs = {},
  defaultApp = '',
  profile = '',
}: {
  serverUrl: string;
  publicKey: string;
  name: string;
  contract: string;
  code: string;
  constructorArgs?: Record<string, unknown>;
  defaultApp?: string;
  profile?: string;
}): Promise<string> {
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=deploy_contract`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        contract,
        code,
        constructor: constructorArgs,
        protocol: 'BFT',
        default_app: defaultApp,
        pid: publicKey,
        address: serverUrl,
        profile,
      }),
    }
  );
}

export async function contractWriteOnChain({
  serverUrl,
  publicKey,
  contractId,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<string> {
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}/${contractId}/${method.name}?action=contract_write`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: method.values ?? {},
        ...(method.parameters ? { parameters: method.parameters } : {}),
      }),
    }
  );
}

export async function contractReadOnChain({
  serverUrl,
  publicKey,
  contractId,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<any> {
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}/${contractId}/${method.name}?action=contract_read`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: method.values ?? {} }),
    }
  );
}

export async function deployContract({
  publicKey,
  name,
  contract,
}: {
  serverUrl: string;
  publicKey: string;
  name: string;
  contract: string;
  code: string;
  profile?: string;
}): Promise<any> {
  const result = mockDeployAny({ publicKey, name, contract });
  return delay(FAKE_DEPLOY_DELAY, result);
}

export async function joinContract({
  publicKey,
}: {
  serverUrl: string;
  publicKey: string;
  address: string;
  agent: string;
  contract: string;
  profile?: string;
}): Promise<any> {
  void publicKey;
  return mockJoinContract();
}

export async function contractWrite({
  serverUrl,
  publicKey,
  contractId,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<any> {
  return mockContractWrite({ serverUrl, publicKey, contractId, method });
}

export async function contractRead({
  serverUrl,
  publicKey,
  contractId,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<any> {
  return mockContractRead({ serverUrl, publicKey, contractId, method });
}
