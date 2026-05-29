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
}

/** Small pill label for status/metadata. Pass translated text as children. */
const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', size = 'md', dot, children, className }) => {
  return (
    <span className={clsx(styles.badge, styles[tone], styles[size], className)}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
};

export default Badge;
