import React from 'react';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import {
  COUNTRIES,
  OTHER_COUNTRY,
  getCountryFlag,
  getCountryName,
} from '../../utils/countries';
import SearchableSelect from './SearchableSelect';
import styles from './CountryMultiSelect.module.scss';

export interface CountryMultiSelectProps {
  /** Selected ISO 3166-1 alpha-2 codes (may include the 'OTHER' catch-all). */
  value: string[];
  onChange: (codes: string[]) => void;
  /** Accessible name for the control — each site passes its visible field label. */
  ariaLabel?: string;
  /** Include the 🌐 "Other" catch-all in the searchable list. Default true. */
  includeOther?: boolean;
  disabled?: boolean;
}

/**
 * Multi-country picker: removable selected chips + a search over all 197
 * countries (composing the shared SearchableSelect) + region-grouped quick
 * picks. Replaces the hardcoded 4–5 country-chip rows so a global-democracy
 * app never excludes 190+ countries.
 *
 * Country proper nouns render canonical-English (countries.ts carries no
 * locale form); only the control chrome is t()-wired. "Other" is UI vocab, so
 * it localizes via country.other.
 */
const CountryMultiSelect: React.FC<CountryMultiSelectProps> = ({
  value,
  onChange,
  ariaLabel,
  includeOther = true,
  disabled = false,
}) => {
  const t = useT();

  const add = (code: string) => {
    if (code && !value.includes(code)) onChange([...value, code]);
  };
  const remove = (code: string) => onChange(value.filter((c) => c !== code));

  const label = (code: string) =>
    code === 'OTHER' ? t('country.other', 'Other') : getCountryName(code);

  // Searchable list = all 197 (+ OTHER), minus already-selected.
  const baseOptions = includeOther ? [...COUNTRIES, OTHER_COUNTRY] : COUNTRIES;
  const options = baseOptions
    .filter((c) => !value.includes(c.code))
    .map((c) => ({ value: c.code, label: label(c.code), icon: c.flag }));

  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      {value.length > 0 && (
        <ul className={styles.chips}>
          {value.map((code) => (
            <li key={code}>
              <button
                type="button"
                className={styles.chip}
                onClick={() => remove(code)}
                disabled={disabled}
                aria-label={t('country.remove', 'Remove {country}', { country: label(code) })}
              >
                <span className={styles.flag} role="img" aria-hidden>
                  {getCountryFlag(code)}
                </span>
                <span>{label(code)}</span>
                <X size={16} aria-hidden className={styles.removeIcon} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SearchableSelect
        options={options}
        value=""
        onChange={add}
        placeholder={t('country.add', 'Add a country')}
        disabled={disabled}
      />
    </div>
  );
};

export default CountryMultiSelect;
