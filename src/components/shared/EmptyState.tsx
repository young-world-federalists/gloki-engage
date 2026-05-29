import React from 'react';
import clsx from 'clsx';
import styles from './EmptyState.module.scss';

export interface EmptyStateProps {
  /** A lucide icon node, e.g. <Inbox size={48} />. Rendered muted and centered. */
  icon?: React.ReactNode;
  title: string;
  message?: string;
  /** CTA, usually a <Button>. */
  action?: React.ReactNode;
  /** Tighter vertical padding for use inside cards/cards rows. */
  compact?: boolean;
  className?: string;
}

/** Centered empty/zero-data placeholder. Pass translated strings for title/message. */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action, compact, className }) => {
  return (
    <div className={clsx(styles.empty, compact && styles.compact, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default EmptyState;
