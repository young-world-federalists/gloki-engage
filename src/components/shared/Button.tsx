import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the full width of the container (use for bottom-anchored mobile actions). */
  fullWidth?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Canonical button. Prefer this over hand-rolled <button> + className.
 * All user-facing text is passed in as children — never hardcode copy here.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className={styles.spinner} size={16} aria-hidden />}
      {!loading && leftIcon && (
        <span className={styles.icon} aria-hidden>
          {leftIcon}
        </span>
      )}
      {children != null && <span className={styles.label}>{children}</span>}
      {!loading && rightIcon && (
        <span className={styles.icon} aria-hidden>
          {rightIcon}
        </span>
      )}
    </button>
  );
});

export default Button;
