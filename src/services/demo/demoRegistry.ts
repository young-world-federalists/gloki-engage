// Demo contract registry — tracks which contract IDs are part of demo mode.
// Demo IDs always start with `demo-` so detection is O(1), no lookup needed.
// Per-ID metadata (contract file name, parent, display name) lives in localStorage.

const REGISTRY_KEY = 'gloki_demo_contracts';

export interface DemoContractMeta {
  id: string;
  name: string;          // human-readable name (e.g. "Demo Climate Action")
  contract: string;      // contract .py file name (e.g. "community_contract.py")
  parentId?: string;     // parent contract ID, if this is a child
  createdAt: number;
}

type Registry = Record<string, DemoContractMeta>;

function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as Registry) : {};
  } catch {
    return {};
  }
}

function saveRegistry(reg: Registry): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch (err) {
    console.error('[DemoRegistry] Failed to persist:', err);
  }
}

export function isDemoContract(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('demo-');
}

export function registerDemoContract(meta: DemoContractMeta): void {
  const reg = loadRegistry();
  reg[meta.id] = meta;
  saveRegistry(reg);
}

export function getDemoContract(id: string): DemoContractMeta | null {
  const reg = loadRegistry();
  return reg[id] ?? null;
}

export function listDemoContracts(): DemoContractMeta[] {
  return Object.values(loadRegistry());
}

export function listDemoContractsByType(contractFile: string): DemoContractMeta[] {
  return listDemoContracts().filter((m) => m.contract === contractFile);
}

export function removeDemoSubtree(rootId: string): string[] {
  const removed: string[] = [];
  const reg = loadRegistry();
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    if (!reg[id]) continue;
    const children = Object.values(reg).filter((m) => m.parentId === id).map((m) => m.id);
    queue.push(...children);
    delete reg[id];
    removed.push(id);
  }
  saveRegistry(reg);
  return removed;
}

export function newDemoId(kind: 'comm' | 'init' | 'stage' | 'mod'): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `demo-${kind}-${Date.now().toString(36)}-${rnd}`;
}

export function dumpRegistry(): Registry {
  return loadRegistry();
}

export function restoreRegistry(reg: Registry): void {
  saveRegistry(reg);
}
