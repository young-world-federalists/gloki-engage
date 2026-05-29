// Mock implementations of the api.ts functions.
// All return the same shape as the real backend so the rest of the app works
// without edits.
import type { IMethod, IContract } from '../interfaces';
import {
  isDemoContract,
  registerDemoContract,
  getDemoContract,
  listDemoContracts,
  listDemoContractsByType,
  newDemoId,
} from './demoRegistry';
import { routeRead, routeWrite } from './demoRouter';
import { initCommunity } from './demoContracts/community';
import { seedDemoCommunity } from './seedDemoCommunity';
import { VFTC_COMMUNITY } from './fixtures/community';

const DEFAULT_COMMUNITY_FLAG = 'gloki_default_demo_community_seeded';

export async function mockContractRead({
  contractId,
  publicKey,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<unknown> {
  return routeRead(contractId, method, publicKey);
}

export async function mockContractWrite({
  contractId,
  publicKey,
  method,
}: {
  serverUrl: string;
  publicKey: string;
  contractId: string;
  method: IMethod;
}): Promise<unknown> {
  return routeWrite(contractId, method, publicKey);
}

function kindFor(contractFile: string): 'comm' | 'init' | 'stage' | 'mod' {
  if (contractFile === 'community_contract.py') return 'comm';
  if (contractFile === 'initiative_contract.py') return 'init';
  if (contractFile === 'modification_contract.py') return 'mod';
  return 'stage';
}

// Always-handle deploy. Generates an ID, registers in the demo registry, and
// returns the same shape the real backend returns. Initialises per-contract
// state when the contract type has a known `init*` helper.
export function mockDeployAny({
  publicKey,
  name,
  contract,
  properties,
  parentId,
}: {
  publicKey: string;
  name: string;
  contract: string;
  properties?: Record<string, unknown>;
  parentId?: string;
}): { id: string } {
  const id = newDemoId(kindFor(contract));
  registerDemoContract({ id, name, contract, parentId, createdAt: Date.now() });
  if (contract === 'community_contract.py') {
    initCommunity(id, publicKey, properties ?? { name, description: '' });
  }
  return { id };
}

// Direct deploy helper used by the seeder (bypasses any handling logic).
export function mockDeployDirect({
  name,
  contract,
  parentId,
  kind = 'stage',
  publicKey,
  properties,
}: {
  name: string;
  contract: string;
  parentId?: string;
  kind?: 'comm' | 'init' | 'stage' | 'mod';
  publicKey?: string;
  properties?: Record<string, unknown>;
}): { id: string } {
  const id = newDemoId(kind);
  registerDemoContract({ id, name, contract, parentId, createdAt: Date.now() });
  if (contract === 'community_contract.py' && publicKey) {
    initCommunity(id, publicKey, properties ?? { name, description: '' });
  }
  return { id };
}

export async function mockJoinContract(): Promise<unknown> {
  return { ok: true };
}

export { isDemoContract, getDemoContract };

// Merge demo communities into the (always empty in UI-only mode) real list.
export function mergeDemoContracts(realContracts: IContract[]): IContract[] {
  const demoCommunities = listDemoContractsByType('community_contract.py');
  const existingIds = new Set(realContracts.map((c) => c.id));
  const synthetic: IContract[] = demoCommunities
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      id: m.id,
      name: m.name,
      contract: m.contract,
      code: '',
      protocol: 'BFT',
      default_app: '',
      pid: '',
      address: '',
      group: [],
      threshold: 0,
      profile: null,
      constructor: {},
    }));
  return [...realContracts, ...synthetic];
}

// First-load auto-seed: if no demo community has been created yet for this
// browser, deploy the "Voices for the Climate" flagship and populate it with a
// climate initiative at each pipeline stage so every stage feed opens populated.
export function ensureDefaultDemoCommunity(publicKey: string): void {
  const seeded = localStorage.getItem(DEFAULT_COMMUNITY_FLAG);
  if (seeded === 'true') return;
  if (listDemoContracts().some((m) => m.contract === 'community_contract.py')) {
    localStorage.setItem(DEFAULT_COMMUNITY_FLAG, 'true');
    return;
  }
  const { id } = mockDeployDirect({
    name: VFTC_COMMUNITY.name,
    contract: 'community_contract.py',
    kind: 'comm',
    publicKey,
    properties: {
      name: VFTC_COMMUNITY.name,
      description: VFTC_COMMUNITY.description,
    },
  });
  seedDemoCommunity(id, publicKey);
  localStorage.setItem(DEFAULT_COMMUNITY_FLAG, 'true');
}
