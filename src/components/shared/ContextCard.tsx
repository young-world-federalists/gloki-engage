import React from 'react';
import styles from './ContextCard.module.scss';

export interface ContextCardProps {
  /** Item heading. Omit on pages whose header (h1) already carries the title. */
  title?: string;
  /** The item's summary/description. Line-clamped — the full text lives on the item's own page. */
  body?: string;
  /** Accessible name for the region (e.g. "The problem under discussion"). */
  ariaLabel?: string;
  className?: string;
}

/**
 * The item a sub-page acts ON — discussion, suggest-to-author — kept visible so
 * it never disappears (DESIGN_SYSTEM §5 rule 11). Purely presentational: no
 * interactivity, no data fetching. `title` is optional so a page whose header
 * already shows the title can pass body-only and avoid a double-title. Renders
 * nothing when it would be empty.
 */
const ContextCard: React.FC<ContextCardProps> = ({ title, body, ariaLabel, className }) => {
  if (!title && !body) return null;
  return (
    <section className={`${styles.card}${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
      {title && <h2 className={styles.title}>{title}</h2>}
      {body && <p className={styles.body}>{body}</p>}
    </section>
  );
};

export default ContextCard;
