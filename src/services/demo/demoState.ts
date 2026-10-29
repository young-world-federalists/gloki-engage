// Per-contract state storage for demo contracts.
// Each demo contract gets its own localStorage blob, mirroring the Python
// contract's internal state dicts.

const STATE_PREFIX = 'gloki_demo_state_';

export function readState<T>(contractId: string): T {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + contractId);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function writeState<T>(contractId: string, state: T): void {
  try {
    localStorage.setItem(STATE_PREFIX + contractId, JSON.stringify(state));
  } catch (err) {
    console.error(`[DemoState] Failed to persist ${contractId}:`, err);
  }
}

function readStateAny(contractId: string): unknown {
  try {
    const raw = localStorage.getItem(STATE_PREFIX + contractId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateState<T>(
  contractId: string,
  updater: (current: T) => T,
): T {
  const current = readState<T>(contractId);
  const next = updater(current);
  writeState(contractId, next);
  return next;
}

function listStateKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STATE_PREFIX)) keys.push(k.slice(STATE_PREFIX.length));
  }
  return keys;
}

export function dumpAllState(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const id of listStateKeys()) {
    out[id] = readStateAny(id);
  }
  return out;
}

export function restoreAllState(states: Record<string, unknown>): void {
  for (const [id, state] of Object.entries(states)) {
    writeState(id, state as Record<string, unknown>);
  }
}
