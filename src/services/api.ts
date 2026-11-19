// Seam boundary between the UI and the Gloki backend. contractRead /
// contractWrite / joinContract follow the page's data mode (dataMode.ts, set
// from the URL's `?demo=true`): a demo page goes to the demo layer, a real
// page to the user's own ibc node (ibc.ts) — for any id, so an id from the
// other layer is simply not found. deployContract is the demo layer's only:
// real contracts deploy through their own service modules.
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
import { hostedContract } from "./contractHosts";
import { myContracts, read, write } from "./ibc";

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

/** The signed-in user's contracts on their node, with the seeded demo communities merged in. */
export async function getContracts({ publicKey }: { publicKey: string }): Promise<IContract[]> {
  const real = (await myContracts(true)).map((c) => ({
    id: c.id,
    name: c.name ?? '',
    contract: c.contract ?? '',
    code: '',
    protocol: c.protocol ?? '',
    default_app: String(c.default_app ?? ''),
    pid: c.pid ?? '',
    address: c.address ?? '',
    group: [],
    threshold: 0,
    profile: typeof c.profile === 'string' ? c.profile : null,
    constructor: {},
  }) as IContract);
  ensureDefaultDemoCommunity(publicKey);
  return mergeDemoContracts(real);
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

/** The demo layer's join. Real contracts are joined through their service modules. */
export async function joinContract(): Promise<ContractResult> {
  if (isDemoDataMode()) return mockJoinContract();
  throw new Error('Joining a real contract goes through its service module');
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
    const hosted = hostedContract(contractId);
    return hosted ? hosted.write(method) : write(contractId, method.name, method.values ?? {});
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
    const hosted = hostedContract(contractId);
    return hosted ? hosted.read(method) : read(contractId, method.name, method.values ?? {});
  }
  return mockContractRead({ serverUrl, publicKey, contractId, method });
}
