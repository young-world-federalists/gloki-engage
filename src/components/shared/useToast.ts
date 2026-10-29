import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss after this many ms. Default 4000. */
  durationMs?: number;
}

interface ToastApi {
  show: (options: ToastOptions) => void;
}

/** Provided by ToastProvider (Toast.tsx). */
export const ToastContext = createContext<ToastApi | null>(null);

const NOOP_API: ToastApi = { show: () => {} };

/** Show a transient message. Safe to call without a provider (no-op). */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP_API;
}
