import { useCallback, useSyncExternalStore } from 'react';

/**
 * Theme preference (S21, D2): 'auto' follows the OS scheme, 'light'/'dark'
 * force one. State lives in TWO places kept in sync here:
 *  - localStorage `gloki.theme` — persisted; absent means 'auto' (so pre-S21
 *    visitors stay on Auto without a migration).
 *  - `data-theme` on <html> — what the SCSS `dark` mixin reads; absent = Auto.
 * The index.html head snippet applies the attribute before first paint (no
 * flash); this hook owns every change after that.
 */
export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'gloki.theme';

function isForcedTheme(v: string | null): v is 'light' | 'dark' {
  return v === 'light' || v === 'dark';
}

/**
 * The APPLIED preference — read from the data-theme attribute, not storage, so
 * the hook stays truthful even when localStorage is blocked (setTheme still
 * applies the attribute; persistence is best-effort). Absent/invalid → 'auto'.
 */
function getAppliedTheme(): ThemePreference {
  const attr = document.documentElement.getAttribute('data-theme');
  return isForcedTheme(attr) ? attr : 'auto';
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Persist + apply a preference. 'auto' removes both the key and the attribute. */
export function setTheme(pref: ThemePreference): void {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore persistence failure — the attribute still applies this session */
  }
  if (pref === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', pref);
  listeners.forEach((l) => l());
}

/**
 * Current preference + setter, re-rendering on change from any caller in this
 * tab. (Deliberately single-tab: no `storage`-event listener — another tab's
 * change applies there immediately and here on the next load via the snippet.)
 */
export function useTheme(): { theme: ThemePreference; setTheme: (pref: ThemePreference) => void } {
  const theme = useSyncExternalStore(subscribe, getAppliedTheme);
  const set = useCallback((pref: ThemePreference) => setTheme(pref), []);
  return { theme, setTheme: set };
}
