import React from 'react';
import clsx from 'clsx';
import { ImageOff } from 'lucide-react';
import { useDataSaver } from './useDataSaver';
import styles from './SmartImage.module.scss';

export interface SmartImageProps {
  src: string;
  /** Required — used as the accessible label and to derive placeholder initials. */
  alt: string;
  /** Text to derive initials from when in data-saver mode (defaults to `alt`). */
  fallbackLabel?: string;
  /** Square edge length in px (default 40). */
  size?: number;
  /** Circular crop (avatars). */
  rounded?: boolean;
  className?: string;
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Image that respects data-saver mode: when on, it renders a lightweight
 * initials/icon placeholder instead of fetching the real image. This is how the
 * data-saver toggle actually reduces bytes on the wire.
 */
const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  fallbackLabel,
  size = 40,
  rounded,
  className,
}) => {
  const { dataSaver } = useDataSaver();

  if (dataSaver) {
    const text = initials(fallbackLabel ?? alt);
    return (
      <span
        className={clsx(styles.placeholder, rounded && styles.rounded, className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={alt}
        title={alt}
      >
        {text ? (
          <span className={styles.initials}>{text}</span>
        ) : (
          <ImageOff size={Math.round(size * 0.4)} aria-hidden />
        )}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={clsx(styles.img, rounded && styles.rounded, className)}
    />
  );
};

export default SmartImage;
