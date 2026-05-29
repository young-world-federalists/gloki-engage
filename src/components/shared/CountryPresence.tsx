import React from 'react';
import clsx from 'clsx';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import styles from './CountryPresence.module.scss';

export interface CountryPresenceProps {
  /** Country codes — pass one per participant (duplicates allowed) or unique codes. */
  countries: string[];
  /** Max flags to show before a "+N" chip. */
  max?: number;
  /** Trailing caption, already translated, e.g. "12 people from 4 countries". */
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * "Who's here, from where" — an overlapping cluster of country flags that makes
 * cross-border participation feel present. Distinct from CountryParticipation,
 * which shows per-country counts.
 */
const CountryPresence: React.FC<CountryPresenceProps> = ({
  countries,
  max = 6,
  label,
  size = 'md',
  className,
}) => {
  const unique = Array.from(new Set(countries));
  if (unique.length === 0) return null;

  const shown = unique.slice(0, max);
  const extra = unique.length - shown.length;

  return (
    <div className={clsx(styles.presence, styles[size], className)}>
      <div className={styles.cluster}>
        {shown.map((code) => (
          <span key={code} className={styles.chip} title={getCountryName(code)}>
            <span role="img" aria-label={getCountryName(code)}>
              {getCountryFlag(code)}
            </span>
          </span>
        ))}
        {extra > 0 && <span className={clsx(styles.chip, styles.more)}>+{extra}</span>}
      </div>
      {label != null && <span className={styles.label}>{label}</span>}
    </div>
  );
};

export default CountryPresence;
