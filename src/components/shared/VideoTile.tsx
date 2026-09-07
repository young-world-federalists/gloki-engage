import React from 'react';
import clsx from 'clsx';
import { MicOff, VideoOff, Check } from 'lucide-react';
import { initialsOf } from '../../utils/initials';
import CountryFlag from './CountryFlag';
import styles from './VideoTile.module.scss';

export interface VideoTileProps {
  name: string;
  countryCode?: string;
  size?: 'lg' | 'sm';
  muted?: boolean;
  cameraOff?: boolean;
  verified?: boolean;
  /** Translated status labels for the icons — never icon-only. */
  mutedLabel?: string;
  cameraOffLabel?: string;
  verifiedLabel?: string;
  className?: string;
}

/**
 * Placeholder video-call tile (S37). No `<video>` element and never will be
 * — nothing streams, real media capture stays out of scope permanently
 * (spec §8). Centred initials stand in for a camera feed; `size="lg"` is the
 * candidate tile, `size="sm"` is a verifier-grid cell. `aspect-ratio` (not a
 * fixed height) keeps every tile a consistent rectangle however narrow its
 * grid column gets, down to the 360px floor.
 *
 * Every status icon (muted, camera off, verified) is `aria-hidden` with its
 * meaning carried in a paired visually-hidden span built from the caller's
 * label prop — never icon- or colour-only.
 */
const VideoTile: React.FC<VideoTileProps> = ({
  name,
  countryCode,
  size = 'lg',
  muted,
  cameraOff,
  verified,
  mutedLabel,
  cameraOffLabel,
  verifiedLabel,
  className,
}) => {
  return (
    <div className={clsx(styles.tile, styles[size], className)}>
      <span className={styles.initials} aria-hidden>
        {initialsOf(name)}
      </span>

      {verified && (
        <span className={styles.verifiedBadge}>
          <Check size={size === 'lg' ? 16 : 12} aria-hidden />
          <span className={styles.srOnly}>{verifiedLabel}</span>
        </span>
      )}

      <div className={styles.overlay}>
        <span className={styles.identity}>
          {countryCode && <CountryFlag code={countryCode} size="sm" className={styles.flag} />}
          <span className={styles.name}>{name}</span>
        </span>

        {(muted || cameraOff) && (
          <span className={styles.status}>
            {muted && (
              <span className={styles.statusIcon}>
                <MicOff size={12} aria-hidden />
                <span className={styles.srOnly}>{mutedLabel}</span>
              </span>
            )}
            {cameraOff && (
              <span className={styles.statusIcon}>
                <VideoOff size={12} aria-hidden />
                <span className={styles.srOnly}>{cameraOffLabel}</span>
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default VideoTile;
