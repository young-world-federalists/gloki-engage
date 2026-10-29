import { useSyncExternalStore } from 'react';

// Provider-free connectivity state, mirroring the useDataSaver store shape.
// Backed by navigator.onLine + the browser online/offline events; no <Provider> needed.

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  } catch {
    return true;
  }
}

let value = read();

function emit() {
  value = read();
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', emit);
  window.addEventListener('offline', emit);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** `const online = useOnline();` — true when the browser reports a connection. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => value,
    () => true, // server snapshot — assume online (harmless in this CSR app)
  );
}
