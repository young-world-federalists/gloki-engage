import React from 'react';
import clsx from 'clsx';
import styles from './ProgressBar.module.scss';

export type ProgressBarVariant = 'primary' | 'success' | 'neutral';

export interface ProgressBarProps {
  /** Announced value (aria-valuenow), in [0, max]. */
  value: number;
  /** Denominator for aria-valuemax. Defaults to 100 (percent semantics). */
  max?: number;
  /** Accessible name for the bar — pass a translated string. */
  label: string;
  /**
   * Fill colour. Callers that flip colour on completion pass it conditionally
   * (e.g. `count >= target ? 'success' : 'primary'`) — the fill transition
   * animates the change.
   */
  variant?: ProgressBarVariant;
  /** Track thickness: sm = 6px (default), md = 8px. */
  size?: 'sm' | 'md';
  /**
   * Visual fill percentage override for when the filled share differs from
   * value/max — e.g. QV turnout fills progress toward an interim target while
   * announcing the raw percentage. Clamped to [0, 100].
   */
  fillPct?: number;
  /**
   * Render N discrete cells instead of a continuous fill (S36 — the "{X} of 4
   * approvals" bar). The first round(value / max × segments) cells fill in the
   * variant colour; ARIA is identical to the continuous bar.
   */
  segments?: number;
  /** Layout hook (flex sizing etc.) — visual styling stays in the kit. */
  className?: string;
}

/**
 * Canonical determinate progress bar (m6 kit extraction — replaces the QVFlow
 * track, AdoptionFramework progressFill, and SharedStatement barFill copies).
 * Token colours, dark-mode track, reduced-motion aware.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  variant = 'primary',
  size = 'sm',
  fillPct,
  segments,
  className,
}) => {
  const pct = Math.max(0, Math.min(100, fillPct ?? (max > 0 ? (value / max) * 100 : 0)));

  if (segments && segments > 0) {
    const filled = Math.max(0, Math.min(segments, Math.round((pct / 100) * segments)));
    return (
      <div
        className={clsx(styles.segmented, styles[size], className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={label}
      >
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} className={clsx(styles.segment, i < filled && styles.segmentOn, i < filled && styles[variant])} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={clsx(styles.track, styles[size], className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={label}
    >
      <span className={clsx(styles.fill, styles[variant])} style={{ width: `${pct}%` }} />
    </div>
  );
};

export default ProgressBar;
