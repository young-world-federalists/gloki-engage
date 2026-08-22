// Local trust-graph cache for the Digital Agent identity: only vouchedBy/
// invitedBy persist here. Profile fields (displayName/photo/country/
// languages) and onboarding completion are NOT cached locally — they live
// in the real profile contract and are read fresh via Redux's
// state.user.digitalAgentProfile (see userSlice.ts's fetchContracts).

const AGENT_KEY_BASE = 'gloki.digitalAgent';

// Scoped by identity (serverUrl+publicKey), mirroring flowContractsSlice's
// buildFlowContractsScope — without this, one identity's vouch data leaked
// into every other identity that ever logged in on the same browser.
let currentScope: string | null = null;

export function setDigitalAgentScope(scopeKey: string | null): void {
  if (scopeKey === currentScope) return;
  currentScope = scopeKey;
  agentCache = undefined;
  notify();
}

function agentKey(): string {
  return currentScope ? `${AGENT_KEY_BASE}:${currentScope}` : AGENT_KEY_BASE;
}

export interface DigitalAgent {
  displayName: string;
  photo: string; // data URL, or '' → render initials
  country: string; // ISO 3166-1 alpha-2, or ''
  languages: string[]; // ISO 639-1 (+ local) codes
  createdAt: number;
  invitedBy?: string; // voucher publicKey
  vouchedBy: string[]; // publicKeys; length = "vouched by N"
}

// In-memory cache so getSnapshot returns a STABLE reference for useSyncExternalStore.
let agentCache: DigitalAgent | null | undefined; // undefined = not yet loaded

const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[DigitalAgent] Failed to persist ${key}:`, err);
  }
}

function baseAgent(): DigitalAgent {
  return { displayName: '', photo: '', country: '', languages: [], createdAt: Date.now(), vouchedBy: [] };
}

// Only the trust-graph fields are persisted; profile fields stay in-memory
// only for the current session (they're sourced from the real contract).
type PersistedAgent = Pick<DigitalAgent, 'createdAt' | 'invitedBy' | 'vouchedBy'>;

function toPersisted(agent: DigitalAgent): PersistedAgent {
  return { createdAt: agent.createdAt, invitedBy: agent.invitedBy, vouchedBy: agent.vouchedBy };
}

export function getAgent(): DigitalAgent | null {
  if (agentCache === undefined) {
    const persisted = readJson<PersistedAgent | null>(agentKey(), null);
    agentCache = persisted ? { ...baseAgent(), ...persisted } : null;
  }
  return agentCache;
}

/** Merge a partial agent into the stored one (creating it if absent). */
export function saveAgent(partial: Partial<DigitalAgent>): DigitalAgent {
  const next: DigitalAgent = { ...(getAgent() ?? baseAgent()), ...partial };
  agentCache = next;
  writeJson(agentKey(), toPersisted(next));
  notify();
  return next;
}

export function clearAgent(): void {
  agentCache = null;
  try {
    localStorage.removeItem(agentKey());
  } catch {
    /* ignore */
  }
  notify();
}

// (getInitials moved to src/utils/initials.ts — S22 consolidation.)

// Cross-tab sync: invalidate cache when another tab writes, then notify.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === agentKey()) {
      agentCache = undefined;
      notify();
    }
  });
}
