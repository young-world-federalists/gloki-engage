import React from 'react';
import clsx from 'clsx';
import styles from './NotificationItem.module.scss';

export interface NotificationItemProps {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  timestamp: string;
  unread: boolean;
  unreadText: string;
  action?: React.ReactNode;
  readControl: React.ReactNode;
  className?: string;
}

/**
 * Semantic notification row. Actions stay separate so the row never becomes a
 * nested-button or nested-link interaction target.
 */
const NotificationItem: React.FC<NotificationItemProps> = ({
  icon,
  title,
  body,
  timestamp,
  unread,
  unreadText,
  action,
  readControl,
  className,
}) => (
  <article className={clsx(styles.item, unread && styles.unread, className)}>
    <div className={styles.icon} aria-hidden>
      {icon}
    </div>
    <div className={styles.content}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.timestamp}>{timestamp}</span>
      </div>
      <div className={styles.body}>{body}</div>
      {unread && (
        <span className={styles.unreadStatus}>
          <span className={styles.unreadMarker} aria-hidden />
          {unreadText}
        </span>
      )}
      <div className={styles.controls}>
        {action && <div className={styles.action}>{action}</div>}
        <div className={styles.readControl}>{readControl}</div>
      </div>
    </div>
  </article>
);

export default NotificationItem;
