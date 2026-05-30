import React from 'react';
import clsx from 'clsx';
import LanguageSwitcher from '../LanguageSwitcher';
import { useT } from '../../../i18n';
import { LANGUAGES, type LangCode } from '../../../services/demo/fixtures/presence';
import styles from './LanguageBar.module.scss';

export interface LanguageBarProps {
  /** Languages spoken in this space (native names shown). EN/FR/SW are switchable. */
  languages: LangCode[];
  className?: string;
}

/**
 * "Spoken here" strip that puts the language switcher in context: it shows the
 * languages this community actually uses, then lets the reader switch the UI
 * (EN/FR/SW) right beside that evidence. ny/ln appear as informational chips.
 */
const LanguageBar: React.FC<LanguageBarProps> = ({ languages, className }) => {
  const t = useT();

  return (
    <div className={clsx(styles.bar, className)}>
      <span className={styles.label}>{t('presence.spokenHere', 'Spoken here')}</span>
      <ul className={styles.langs}>
        {languages.map((code) => (
          <li key={code} className={styles.lang}>
            {LANGUAGES[code]?.native ?? code}
          </li>
        ))}
      </ul>
      <LanguageSwitcher className={styles.switcher} />
    </div>
  );
};

export default LanguageBar;
