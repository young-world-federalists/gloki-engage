import React from 'react';
import clsx from 'clsx';
import UserIdentity from './UserIdentity';
import type { TrustState } from '../../services/trustModel';
import styles from './MemberCard.module.scss';

export interface MemberCardProps {
  /** Display name, already composed. */
  name: string;
  /** ISO 3166-1 alpha-2. */
  countryCode?: string;
  online?: boolean;
  /** Translated accessible labels for the presence dot — never colour alone. */
  onlineLabel: string;
  offlineLabel: string;
  trustState?: TrustState;
  /** Small caption under the identity (e.g. "asked you to vouch · 2h ago"). */
  meta?: string;
  /** Trailing action slot — a <Button size="sm"> or a <Badge>. */
  action?: React.ReactNode;
  as?: 'li' | 'div';
  className?: string;
}

/**
 * Canonical member row for verification lists (S36): presence dot ·
 * UserIdentity (flag + name + verified shield) · optional caption · action slot.
 * 44px minimum height; the row itself is not interactive — the action is.
 */
const MemberCard: React.FC<MemberCardProps> = ({
  name,
  countryCode,
  online = false,
  onlineLabel,
  offlineLabel,
  trustState,
  meta,
  action,
  as = 'div',
  className,
}) => {
  const Tag = as as React.ElementType;
  return (
    <Tag className={clsx(styles.row, className)}>
      <span
        className={clsx(styles.dot, online ? styles.online : styles.offline)}
        role="img"
        aria-label={online ? onlineLabel : offlineLabel}
      />
      <div className={styles.body}>
        <UserIdentity name={name} countryCode={countryCode} trustState={trustState} size="md" />
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </Tag>
  );
};

export default MemberCard;
