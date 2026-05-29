import React from 'react';
import clsx from 'clsx';
import { getCountryFlag, getCountryName } from '../../utils/countries';
import styles from './CountryFlag.module.scss';

export interface CountryFlagProps {
  code: string;
  /** Render the country name next to the flag. */
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Atomic country flag with accessible label. The flag emoji is announced as the country name. */
const CountryFlag: React.FC<CountryFlagProps> = ({ code, showName, size = 'md', className }) => {
  const name = getCountryName(code);
  return (
    <span className={clsx(styles.flag, styles[size], className)} title={name}>
      <span className={styles.emoji} role="img" aria-label={name}>
        {getCountryFlag(code)}
      </span>
      {showName && <span className={styles.name}>{name}</span>}
    </span>
  );
};

export default CountryFlag;
