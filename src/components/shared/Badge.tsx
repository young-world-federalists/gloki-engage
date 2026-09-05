import React from 'react';
import clsx from 'clsx';
import styles from './Badge.module.scss';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  /** Show a leading status dot. */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Native tooltip — e.g. the scoped Causes-status sentence (S35 F4). */
  title?: string;
  /** Overrides the accessible name when it must differ from the visible text
   *  (e.g. the dot-only overflow degradation, S35 F5). */
  'aria-label'?: string;
}

/** Small pill label for status/metadata. Pass translated text as children. */
const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', size = 'md', dot, children, className, title, 'aria-label': ariaLabel }) => {
  return (
    <span className={clsx(styles.badge, styles[tone], styles[size], className)} title={title} aria-label={ariaLabel}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
};

export default Badge;
