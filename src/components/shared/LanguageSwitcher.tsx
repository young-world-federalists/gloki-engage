import React from 'react';
import { Globe } from 'lucide-react';
import { useI18n, LOCALES, type Locale } from '../../i18n';
import styles from './LanguageSwitcher.module.scss';

export interface LanguageSwitcherProps {
  /** Hide the globe icon (e.g. when used inline in a dense menu). */
  hideIcon?: boolean;
  className?: string;
}

/**
 * Functional EN/FR/SW switcher. Persists the choice (localStorage) and updates
 * every string rendered through `t()`. Lane F places/styles this in the real UI.
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ hideIcon, className }) => {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={[styles.switcher, className].filter(Boolean).join(' ')}>
      {!hideIcon && <Globe size={16} className={styles.icon} aria-hidden />}
      <label className={styles.srOnly} htmlFor="gloki-lang-select">
        {t('lang.switch', 'Language')}
      </label>
      <select
        id="gloki-lang-select"
        className={styles.select}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {t(l.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
