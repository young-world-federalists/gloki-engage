import React, { useRef } from 'react';
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
 *
 * Semantics: WAI-ARIA radio-group pattern (exactly one of N) — the group is a
 * single tab stop, arrow keys move selection, `aria-checked` marks the choice.
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
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  // Roving tabindex: the checked segment is the group's one tab stop (first
  // segment when `value` matches no option, e.g. during initial hydration).
  const stopIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = (index - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next === null || next === index) return;
    e.preventDefault();
    onChange(options[next].value);
    segmentRefs.current[next]?.focus();
  };

  return (
    <div
      className={clsx(styles.root, styles[size], fullWidth && styles.fullWidth, className)}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt, index) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              segmentRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            className={clsx(styles.segment, selected && styles.segmentActive)}
            aria-checked={selected}
            aria-label={opt.ariaLabel}
            tabIndex={index === stopIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
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
