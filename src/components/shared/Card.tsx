import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hover lift + pointer affordance. Pair with role/tabIndex/onClick for clickable cards. */
  interactive?: boolean;
  /** Internal padding ($spacing-lg). Default true; set false for media/edge-to-edge content. */
  padded?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}

/** Canonical surface container: white / $dark-bg, $radius-lg, $shadow-base. */
const Card: React.FC<CardProps> = ({
  interactive,
  padded = true,
  as = 'div',
  className,
  children,
  ...rest
}) => {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={clsx(styles.card, padded && styles.padded, interactive && styles.interactive, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Card;
