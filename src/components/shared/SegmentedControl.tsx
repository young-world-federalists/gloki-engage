import React from 'react';
import clsx from 'clsx';
import styles from './SegmentedControl.module.scss';

export interface SegmentOption<T extends string> {
  value: T;
  /** Visible label (string or node). Pass `ariaLabel` too if the label is an icon. */
  label: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Accessible label when the visible content alone isn't descriptive. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the whole control (e.g. "Proposals view"). */
  ariaLabel?: string;
  /** Stretch segments to fill the track in equal widths. */
  fullWidth?: boolean;
  /** Touch-target height: md = 44px (default), sm = 36px. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Canonical segmented control — a single-select toggle between a small set of
 * views (replaces hand-rolled underline tabs). Tokens only, readable active and
 * hover states in light and dark, focus-visible ring, ≥44px touch targets.
 * The selected segment reads like a primary button so it stays consistent with
 * the rest of the button system. Pass translated strings in via `options`.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fullWidth = false,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={clsx(styles.root, styles[size], fullWidth && styles.fullWidth, className)}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={clsx(styles.segment, selected && styles.segmentActive)}
            aria-pressed={selected}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && (
              <span className={styles.icon} aria-hidden>
                {opt.icon}
              </span>
            )}
            {opt.label != null && <span className={styles.label}>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
