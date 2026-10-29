import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useT } from '../../i18n';
import { ToastContext, type ToastOptions, type ToastTone } from './useToast';
import styles from './Toast.module.scss';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const MAX_STACK = 3;
const DEFAULT_DURATION = 4000;

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  error: <AlertCircle size={18} aria-hidden />,
};

/**
 * The app's ONE transient-message live region (S36, spec §3.2). Mount once in
 * App.tsx. Polite `role="status"` region that is always in the DOM (so a new
 * toast is announced), a stack of at most three, 4 s auto-dismiss, a ≥44px
 * dismiss control per toast, Escape inside the region dismisses all. Sits
 * above the StageFooter and below the modal layer.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback(
    ({ message, tone = 'info', durationMs = DEFAULT_DURATION }: ToastOptions) => {
      const id = nextId.current++;
      setItems((prev) => {
        const next = [...prev, { id, message, tone }];
        // Oldest falls off the stack; its timer is cleared to avoid a stray removal.
        while (next.length > MAX_STACK) {
          const dropped = next.shift();
          if (dropped) {
            const timer = timers.current.get(dropped.id);
            if (timer) clearTimeout(timer);
            timers.current.delete(dropped.id);
          }
        }
        return next;
      });
      timers.current.set(id, setTimeout(() => dismiss(id), durationMs));
    },
    [dismiss],
  );

  // Clear every pending timer on unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') items.forEach((i) => dismiss(i.id));
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" onKeyDown={handleKeyDown}>
        {items.map((item) => (
          <div key={item.id} className={clsx(styles.toast, styles[item.tone])}>
            <span className={styles.icon}>{TONE_ICON[item.tone]}</span>
            <span className={styles.message}>{item.message}</span>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => dismiss(item.id)}
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
