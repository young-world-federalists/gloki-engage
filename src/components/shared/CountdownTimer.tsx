import React from 'react';
import clsx from 'clsx';
import { useCountdown } from '../../hooks/useCountdown';
import styles from './CountdownTimer.module.scss';

export interface CountdownTimerProps {
  seconds: number;
  onDone?: () => void;
  /** Translated caption, already formatted by the caller (e.g. "Returning to verification in 5s"). */
  label: string;
  className?: string;
}

/**
 * Renders the S37 completion countdown via `useCountdown` — the kit's one
 * sanctioned timer (see its doc comment for the "restart needs a `key`
 * change" contract).
 *
 * `role="timer"` with `aria-live="off"` is deliberate: a per-second live
 * region would flood a screen reader with "5… 4… 3…". The surrounding
 * completion overlay (T7) announces the wait once instead; this component
 * only needs to be legible to sighted users as it counts down. The digit
 * uses the S33 tabular-figures mixin so it doesn't jitter sideways as it
 * shortens from "5" to "1", and its pulse is dropped under
 * `prefers-reduced-motion` — the number itself keeps counting either way.
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, onDone, label, className }) => {
  const { remaining } = useCountdown(seconds, onDone);

  return (
    <div className={clsx(styles.timer, className)} role="timer" aria-live="off">
      <span className={styles.value}>{remaining}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default CountdownTimer;
