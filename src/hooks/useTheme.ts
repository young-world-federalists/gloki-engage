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

/** Read the persisted preference outside React. Absent/invalid → 'auto'. */
export function getStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isForcedTheme(stored)) return stored;
  } catch {
    /* localStorage unavailable — fall through to auto */
  }
  return 'auto';
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

/** Current preference + setter, re-rendering on change from any caller. */
export function useTheme(): { theme: ThemePreference; setTheme: (pref: ThemePreference) => void } {
  const theme = useSyncExternalStore(subscribe, getStoredTheme);
  const set = useCallback((pref: ThemePreference) => setTheme(pref), []);
  return { theme, setTheme: set };
}
