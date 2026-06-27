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
import { seedAllDemoCommunities } from './seedDemoCommunity';

const DEMO_VERSION = 'global-v8';
const DEMO_VERSION_KEY = 'gloki_demo_version';

// Remove all demo-owned localStorage (registry, per-contract state, seed flags)
// so a changed demo-data shape re-seeds cleanly on the next load.
function clearAllDemoState(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('gloki_demo') || k.startsWith('gloki_default_demo'))) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}

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

// First-load auto-seed: deploy the globally diverse demo communities and
// populate each with initiatives across the pipeline so every feed opens full.
// A version gate wipes stale demo data from older builds so the demo refreshes.
export function ensureDefaultDemoCommunity(publicKey: string): void {
  const version = localStorage.getItem(DEMO_VERSION_KEY);
  if (version !== DEMO_VERSION) {
    clearAllDemoState();
    seedAllDemoCommunities(publicKey);
    localStorage.setItem(DEMO_VERSION_KEY, DEMO_VERSION);
    return;
  }
  if (listDemoContracts().some((m) => m.contract === 'community_contract.py')) return;
  seedAllDemoCommunities(publicKey);
  localStorage.setItem(DEMO_VERSION_KEY, DEMO_VERSION);
}
