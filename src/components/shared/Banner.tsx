import React from 'react';
import clsx from 'clsx';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import styles from './Banner.module.scss';

export type BannerTone = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps {
  tone?: BannerTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Override the default tone icon. Pass `null` to hide it. */
  icon?: React.ReactNode;
  /** Show a dismiss button; called when clicked. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button — pass a translated string. */
  dismissLabel?: string;
  /** Optional trailing action (e.g. a <Button size="sm">). */
  action?: React.ReactNode;
  className?: string;
}

const TONE_ICON: Record<BannerTone, React.ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  warning: <AlertTriangle size={18} aria-hidden />,
  error: <AlertCircle size={18} aria-hidden />,
};

/** Inline status banner using semantic surface tokens. Pass translated content. */
const Banner: React.FC<BannerProps> = ({
  tone = 'info',
  title,
  children,
  icon,
  onDismiss,
  dismissLabel = 'Dismiss',
  action,
  className,
}) => {
  const resolvedIcon = icon === undefined ? TONE_ICON[tone] : icon;
  return (
    <div
      className={clsx(styles.banner, styles[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {resolvedIcon && <span className={styles.icon}>{resolvedIcon}</span>}
      <div className={styles.content}>
        {title != null && <p className={styles.title}>{title}</p>}
        {children != null && <div className={styles.body}>{children}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label={dismissLabel}>
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Banner;
