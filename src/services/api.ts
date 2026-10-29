// Seam boundary between the UI and the Gloki backend. isExistAgent /
// registerAgent / getContracts always call the real server (the signed-in
// identity is real on every page). contractRead / contractWrite / joinContract
// follow the page's data mode (dataMode.ts, set from the URL's `?demo=true`):
// a demo page goes to the demo layer, a real page to the IBC network — for any
// id, so an id from the other layer is simply not found. deployContract stays
// mocked: only demo flows use it; real contracts deploy through the *OnChain
// functions in the service modules.
//
// getContracts merges the seeded demo communities into the real list; each
// page lists only its own layer (communitiesForMode in dataMode.ts).

import type { IMethod, IContract } from "./interfaces";
import {
  ensureDefaultDemoCommunity,
  mockContractRead,
  mockContractWrite,
  mockDeployAny,
  mockJoinContract,
  mergeDemoContracts,
} from "./demo/mockApi";
import { isDemoDataMode } from "./dataMode";
import { openScopedAckStream, watchForChainAck } from "./eventStream";
import { hostedContract } from "./contractHosts";

/**
 * A call to a contract used without joining it (contractHosts.ts) goes to its
 * host's node as its host's agent; member-specific methods get the caller's
 * key as `agent`. Any other contract is called as the caller, unchanged.
 */
function routeCall(serverUrl: string, publicKey: string, contractId: string, method: IMethod) {
  const hosted = hostedContract(contractId);
  if (!hosted) return { serverUrl, publicKey, method, viaHost: false };
  const values = hosted.memberMethods.has(method.name)
    ? { ...(method.values ?? {}), agent: publicKey }
    : method.values;
  const viaHost = hosted.host.server !== serverUrl || hosted.host.agent !== publicKey;
  return { serverUrl: hosted.host.server, publicKey: hosted.host.agent, method: { ...method, values }, viaHost };
}

/**
 * What a contract call returns: the method's untyped JSON. Callers know the
 * shape of the method they called and narrow it there.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContractResult = any;

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
      throw new Error('The server took too long to respond and may be unreachable.', { cause: error });
    }
    throw new Error('Could not connect to the server — it may be unreachable.', { cause: error });
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

// GET_CONTRACTS without the demo merge — for looking up another identity's
// real contracts (e.g. the application agent's, verificationRegistry.ts).
export async function getContractsOnChain({
  serverUrl,
  publicKey,
}: {
  serverUrl: string;
  publicKey: string;
}): Promise<IContract[]> {
  const result = (await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=get_contracts`,
    { method: 'GET' }
  )) as IContract[];
  return Array.isArray(result) ? result : [];
}

// REAL deploy/write/read, bypassing the mock layer entirely — currently used
// by the digital-agent profile, gloki-engage community, and gloki-engage
// initiative contracts (src/components/identity/agent/digitalAgentContract.ts,
// src/services/contracts/glokiEngage{Community,Initiative}.ts).
// deployContract/contractWrite/contractRead below stay on the mock layer for
// every other flow, which isn't ready for a real backend yet; migrating
// those wholesale would break them. Writes only return an ack id — pair with
// watchForChainAck from services/eventStream.ts (start it BEFORE issuing the
// call, not after — see its docs) to get the real result once it arrives on
// the SSE stream.
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
}): Promise<ContractResult> {
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
}): Promise<ContractResult> {
  const result = mockDeployAny({ publicKey, name, contract });
  return delay(FAKE_DEPLOY_DELAY, result);
}

// JOIN_CONTRACT. A real contract is joined for real: the joiner's own node
// connects to the partner named in the invitation (`address` + `agent`).
// Returns the ack id, or null when this agent has already joined. The join
// completes asynchronously — the joiner's stream gets `a2a_connect` with
// `reply: true` (JoinCommunity.tsx waits for it), after which the contract is
// in the joiner's get_contracts and the joiner is in its get_partners, which
// is what membership of a gloki-engage community is today. Demo pages
// stay on the mock.
export async function joinContract({
  serverUrl,
  publicKey,
  address,
  agent,
  contract,
  profile = '',
}: {
  serverUrl: string;
  publicKey: string;
  address: string;
  agent: string;
  contract: string;
  profile?: string;
}): Promise<ContractResult> {
  if (isDemoDataMode()) return mockJoinContract();
  return await fetchWithTimeout(
    `${serverUrl}/ibc/app/${publicKey}?action=join_contract`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contract, address, agent, profile }),
    }
  );
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
}): Promise<ContractResult> {
  if (!isDemoDataMode()) {
    const route = routeCall(serverUrl, publicKey, contractId, method);
    // A write through another agent is confirmed on THAT agent's stream.
    const watcher = route.viaHost
      ? await openScopedAckStream(route.serverUrl, route.publicKey, contractId)
      : watchForChainAck('contract_write');
    try {
      const ackId = await contractWriteOnChain({ serverUrl: route.serverUrl, publicKey: route.publicKey, contractId, method: route.method });
      return await watcher.waitFor(ackId);
    } finally {
      watcher.dispose();
    }
  }
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
}): Promise<ContractResult> {
  if (!isDemoDataMode()) {
    const route = routeCall(serverUrl, publicKey, contractId, method);
    return contractReadOnChain({ serverUrl: route.serverUrl, publicKey: route.publicKey, contractId, method: route.method });
  }
  return mockContractRead({ serverUrl, publicKey, contractId, method });
}
