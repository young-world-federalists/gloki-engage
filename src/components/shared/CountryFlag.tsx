import React from 'react';
import clsx from 'clsx';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import { useI18n } from '../../i18n';
import styles from './CountryFlag.module.scss';

export interface CountryFlagProps {
  code: string;
  /** Render the country name next to the flag. */
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Atomic country flag with accessible label. Flag-only renders announce the
 * country name on the emoji; with `showName` the visible name carries the
 * accessible content and the emoji goes decorative (no double announcement).
 */
const CountryFlag: React.FC<CountryFlagProps> = ({ code, showName, size = 'md', className }) => {
  const { locale } = useI18n();
  const name = getCountryName(code, locale);
  return (
    <span className={clsx(styles.flag, styles[size], className)} title={name}>
      {showName ? (
        <span className={styles.emoji} aria-hidden="true">
          {getCountryFlag(code)}
        </span>
      ) : (
        <span className={styles.emoji} role="img" aria-label={name}>
          {getCountryFlag(code)}
        </span>
      )}
      {showName && <span className={styles.name}>{name}</span>}
    </span>
  );
};

export default CountryFlag;
