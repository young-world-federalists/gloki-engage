import React from 'react';
import { getCountryByCode, getCountryName } from '../../../../utils/countries';
import { useI18n } from '../../../../i18n';

interface CountryBadgeProps {
  countryCode: string | undefined;
}

/** Renders flag emoji + country code. Returns null if no code provided. */
const CountryBadge: React.FC<CountryBadgeProps> = ({ countryCode }) => {
  const { locale } = useI18n();
  if (!countryCode) return null;
  const country = getCountryByCode(countryCode);
  return (
    <span title={getCountryName(countryCode, locale)} style={{ fontSize: '0.8em', marginLeft: 4 }}>
      {country.flag}
    </span>
  );
};

export default CountryBadge;
