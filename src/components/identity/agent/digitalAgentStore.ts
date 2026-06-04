// Lane A — local Digital Agent store (UI-only mockup).
//
// The agent a newcomer builds during onboarding + their onboarding progress.
// localStorage-backed and refresh-surviving, mirroring services/demo/demoState.ts.
// Lives inside the Lane A owned tree because the demo plumbing isn't ours to edit.
// No backend, no contract writes.

const AGENT_KEY = 'gloki.digitalAgent';
const ONBOARDING_KEY = 'gloki.onboarding';

export interface DigitalAgent {
  displayName: string;
  photo: string; // data URL, or '' → render initials
  country: string; // ISO 3166-1 alpha-2, or ''
  languages: string[]; // ISO 639-1 (+ local) codes
  createdAt: number;
  invitedBy?: string; // voucher publicKey
  vouchedBy: string[]; // publicKeys; length = "vouched by N"
  consentedAt?: number; // set when the user accepts the deliberation rules
}

export interface OnboardingProgress {
  step: number;
  completed: boolean;
}

export const ONBOARDING_STEP_COUNT = 6;

const DEFAULT_PROGRESS: OnboardingProgress = { step: 0, completed: false };

// In-memory caches so getSnapshot returns a STABLE reference for useSyncExternalStore.
let agentCache: DigitalAgent | null | undefined; // undefined = not yet loaded
let progressCache: OnboardingProgress | undefined;

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

export function getAgent(): DigitalAgent | null {
  if (agentCache === undefined) agentCache = readJson<DigitalAgent | null>(AGENT_KEY, null);
  return agentCache;
}

export function getProgress(): OnboardingProgress {
  if (progressCache === undefined) progressCache = readJson<OnboardingProgress>(ONBOARDING_KEY, DEFAULT_PROGRESS);
  return progressCache;
}

function baseAgent(): DigitalAgent {
  return { displayName: '', photo: '', country: '', languages: [], createdAt: Date.now(), vouchedBy: [] };
}

/** Merge a partial agent into the stored one (creating it if absent). */
export function saveAgent(partial: Partial<DigitalAgent>): DigitalAgent {
  const next: DigitalAgent = { ...(getAgent() ?? baseAgent()), ...partial };
  agentCache = next;
  writeJson(AGENT_KEY, next);
  notify();
  return next;
}

export function saveProgress(partial: Partial<OnboardingProgress>): OnboardingProgress {
  const next: OnboardingProgress = { ...getProgress(), ...partial };
  progressCache = next;
  writeJson(ONBOARDING_KEY, next);
  notify();
  return next;
}

export function clearAgent(): void {
  agentCache = null;
  try {
    localStorage.removeItem(AGENT_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function resetOnboarding(): void {
  progressCache = { ...DEFAULT_PROGRESS };
  writeJson(ONBOARDING_KEY, progressCache);
  notify();
}

/** Genuine fresh start: clears the created agent AND onboarding progress. */
export function startOver(): void {
  agentCache = null;
  progressCache = { ...DEFAULT_PROGRESS };
  try {
    localStorage.removeItem(AGENT_KEY);
  } catch {
    /* ignore */
  }
  writeJson(ONBOARDING_KEY, progressCache);
  notify();
}

/** Derive initials from a name, e.g. "Amani Otieno" → "AO". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Cross-tab sync: invalidate caches when another tab writes, then notify.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === AGENT_KEY) {
      agentCache = undefined;
      notify();
    } else if (e.key === ONBOARDING_KEY) {
      progressCache = undefined;
      notify();
    }
  });
}
