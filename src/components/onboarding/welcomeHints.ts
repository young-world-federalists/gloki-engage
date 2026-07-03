// Lane A — one-time onboarding hints (UI-only mockup).
//
// localStorage-backed flags for gentle, dismiss-once pointers (e.g. the
// stage-feed intro that reinforces the 5-stage pipeline after onboarding).
// Mirrors digitalAgentStore's try/catch persistence. No backend.

const KEY = 'gloki.welcomeHints';

export type WelcomeHintId = 'stageFeedIntro' | 'qvGuide';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Whether a one-time hint has already been seen/dismissed. */
export function getHintSeen(id: WelcomeHintId): boolean {
  return read().includes(id);
}

/** Mark a one-time hint as seen so it never shows again. */
export function markHintSeen(id: WelcomeHintId): void {
  try {
    const seen = read();
    if (!seen.includes(id)) {
      localStorage.setItem(KEY, JSON.stringify([...seen, id]));
    }
  } catch {
    /* ignore persistence failure (private mode) */
  }
}
