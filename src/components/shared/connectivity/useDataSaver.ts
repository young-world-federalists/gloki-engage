import { useSyncExternalStore, useCallback } from 'react';

// Provider-free data-saver state. Backed by localStorage and shared across every
// consumer via a module-level store — no <Provider> needed, so any lane can read
// it without a change to App.tsx / main.tsx. Off by default.

const KEY = 'gloki.dataSaver';
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

let value = read();

function emit() {
  listeners.forEach((l) => l());
}

// Cross-tab sync: a single global listener keeps `value` in step with other tabs.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      value = read();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Set data-saver on/off. Exported so non-component code can flip it too. */
export function setDataSaver(next: boolean) {
  if (value === next) return;
  value = next;
  try {
    localStorage.setItem(KEY, String(next));
  } catch {
    /* ignore persistence failure */
  }
  emit();
}

/** `const { dataSaver, toggle, setDataSaver } = useDataSaver()`. */
export function useDataSaver() {
  const dataSaver = useSyncExternalStore(
    subscribe,
    () => value,
    () => false, // server snapshot — harmless in this CSR app
  );
  const toggle = useCallback(() => setDataSaver(!value), []);
  return { dataSaver, toggle, setDataSaver };
}
