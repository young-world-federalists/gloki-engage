import React from 'react';
import clsx from 'clsx';
import { useCountdown } from '../../hooks/useCountdown';
import styles from './CountdownTimer.module.scss';

export interface CountdownTimerProps {
  seconds: number;
  onDone?: () => void;
  /**
   * Translated caption, given the live `remaining` count on every tick so it
   * can interpolate the number into a full, correctly-ordered sentence, e.g.
   * `(n) => t('verification.call.returningIn', 'Returning to verification in
   * {n}s', { n })`. The caller owns the whole formatted string — splitting
   * the sentence around the number in JSX would break languages (French,
   * Swahili, ...) where the count isn't in the same place mid-sentence.
   */
  label: (remaining: number) => string;
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
 *
 * `label` is a formatter, not a static string — it's called with the live
 * `remaining` value every render so the caption can count down too (e.g.
 * "Returning to verification in 5s" → "...4s"). Only the visible text
 * updates; `aria-live="off"` above still suppresses the per-tick announcement.
 */
const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, onDone, label, className }) => {
  const { remaining } = useCountdown(seconds, onDone);

  return (
    <div className={clsx(styles.timer, className)} role="timer" aria-live="off">
      <span className={styles.value}>{remaining}</span>
      <span className={styles.label}>{label(remaining)}</span>
    </div>
  );
};

export default CountdownTimer;
