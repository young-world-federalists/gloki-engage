import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

export type CardVariant = 'raised' | 'flat' | 'inset';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hover lift + pointer affordance. Pair with role/tabIndex/onClick for clickable cards. */
  interactive?: boolean;
  /** Internal padding ($spacing-lg). Default true; set false for media/edge-to-edge content. */
  padded?: boolean;
  /**
   * Surface treatment (S33). Elevation should MEAN something:
   * - `raised` (default) — a top-level card sitting on the page background.
   * - `flat` — same surface, no shadow. For a card nested inside another card,
   *   where a second shadow only says "another box".
   * - `inset` — recessed tone, no shadow. For content that belongs *to* its
   *   parent (a quoted item, a nested list row) rather than sitting beside it.
   *
   * Before this every surface was `raised`, so hierarchy was carried by size
   * alone and nested content had to hand-roll a distinct tone each time.
   */
  variant?: CardVariant;
  as?: 'div' | 'section' | 'article' | 'li';
}

/** Canonical surface container: white / $dark-bg, $radius-lg, $shadow-base. */
const Card: React.FC<CardProps> = ({
  interactive,
  padded = true,
  variant = 'raised',
  as = 'div',
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={clsx(
        styles.card,
        styles[variant],
        padded && styles.padded,
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;
