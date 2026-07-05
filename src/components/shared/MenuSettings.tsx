import React from 'react';
import { useT } from '../../i18n';
import { useTheme, type ThemePreference } from '../../hooks/useTheme';
import SegmentedControl from './SegmentedControl';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './MenuSettings.module.scss';

/**
 * Display + language settings hosted in the global menu's footer (S21, D2+M6):
 * the 3-state Auto/Light/Dark theme control and the app language switcher, so
 * both are reachable from every screen — switching language no longer requires
 * logging out. Auto (the default) follows the OS scheme.
 */
const MenuSettings: React.FC = () => {
  const t = useT();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'auto', label: t('menu.themeAuto', 'Auto') },
    { value: 'light', label: t('menu.themeLight', 'Light') },
    { value: 'dark', label: t('menu.themeDark', 'Dark') },
  ];

  return (
    <div className={styles.settings}>
      <div className={styles.row}>
        <span className={styles.caption}>{t('menu.theme', 'Theme')}</span>
        <SegmentedControl
          options={themeOptions}
          value={theme}
          onChange={setTheme}
          ariaLabel={t('menu.theme', 'Theme')}
          fullWidth
        />
      </div>
      <div className={styles.row}>
        {/* Visual caption only — the switcher's own (sr-only) label names the select. */}
        <span className={styles.caption}>{t('menu.language', 'Language')}</span>
        <LanguageSwitcher hideIcon className={styles.language} />
      </div>
    </div>
  );
};

export default MenuSettings;
