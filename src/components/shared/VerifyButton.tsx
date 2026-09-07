import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import styles from './VerifyButton.module.scss';

export type VerifyButtonState = 'idle' | 'loading' | 'confirmed';

export interface VerifyButtonProps {
  state: VerifyButtonState;
  onVerify: () => void;
  /** Translated labels, one per state — the accessible name IS the announcement. */
  idleLabel: string;
  loadingLabel: string;
  confirmedLabel: string;
  className?: string;
}

/**
 * The one sanctioned green action in the kit (S37): the DS rule "if it's not
 * interactive it's not blue" bans blue on non-interactive elements, it does
 * not mandate blue on interactive ones — verification success is a
 * `$success` semantic. `confirmed` is terminal: the button disables itself
 * and stays disabled, one vouch per verifier per call.
 *
 * The label text alone carries the state change — wrapped in its own
 * `aria-live="polite"` span so only the changed word is announced, not the
 * whole button. The `confirmed` check glyph is purely decorative
 * (`aria-hidden`); the label text already says "confirmed" for anyone not
 * seeing the icon.
 */
const VerifyButton: React.FC<VerifyButtonProps> = ({
  state,
  onVerify,
  idleLabel,
  loadingLabel,
  confirmedLabel,
  className,
}) => {
  const label = state === 'idle' ? idleLabel : state === 'loading' ? loadingLabel : confirmedLabel;

  return (
    <button
      type="button"
      className={clsx(styles.button, className)}
      onClick={onVerify}
      disabled={state !== 'idle'}
    >
      {state === 'confirmed' && <Check className={styles.icon} size={18} aria-hidden />}
      <span aria-live="polite">{label}</span>
    </button>
  );
};

export default VerifyButton;
