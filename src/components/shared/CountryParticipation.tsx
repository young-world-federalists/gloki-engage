import React from 'react';
import { getCountryName, getCountryColor, getCountryFlag } from '../../utils/countries';
import { useI18n } from '../../i18n';
import styles from './CountryParticipation.module.scss';

interface CountryParticipationProps {
  /** Map of country code → participation count */
  data: Record<string, number>;
  /** Max countries to show before "+N more" */
  maxDisplay?: number;
}

const CountryParticipation: React.FC<CountryParticipationProps> = ({ data, maxDisplay = 5 }) => {
  const { locale } = useI18n();
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return null;

  const shown = sorted.slice(0, maxDisplay);
  const remaining = sorted.length - shown.length;

  return (
    <div className={styles.container}>
      {shown.map(([code, count]) => (
        <span
          key={code}
          className={styles.flag}
          title={`${getCountryName(code, locale)}: ${count}`}
          style={{ borderColor: getCountryColor(code) }}
        >
          {getCountryFlag(code)} {count}
        </span>
      ))}
      {remaining > 0 && (
        <span className={styles.more}>+{remaining} more</span>
      )}
    </div>
  );
};

export default CountryParticipation;
