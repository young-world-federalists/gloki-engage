import React, { useState } from 'react';
import clsx from 'clsx';
import { Globe } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LANGUAGES } from '../../services/demo/fixtures/presence';
import type { TranslatedText, PostLang } from '../../services/demo/fixtures/presence';
import styles from './AITools.module.scss';

// ── Show in my language ───────────────────────────────────────────────────────
//
// Fixture-driven live-translation affordance: instant, offline, no API key.
// "My language" is the active UI locale, so the global LanguageSwitcher doubles
// as the per-post translation control. Only renders a toggle when a translation
// in the reader's language exists and differs from the source.

export interface ShowInMyLanguageProps {
  body: TranslatedText;
  /** Language the body was written in. */
  sourceLang: PostLang;
  className?: string;
}

export const ShowInMyLanguage: React.FC<ShowInMyLanguageProps> = ({ body, sourceLang, className }) => {
  const { locale, t } = useI18n();
  const [showTranslated, setShowTranslated] = useState(false);

  const translation = locale !== sourceLang ? body[locale] : undefined;
  const source = body[sourceLang] ?? body.en;

  if (!translation) {
    // Already in the reader's language (or no translation available) — no toggle.
    return <p className={clsx(styles.postBody, className)}>{source}</p>;
  }

  const langName = LANGUAGES[locale].native;

  return (
    <div className={className}>
      <p className={styles.postBody}>{showTranslated ? translation : source}</p>
      <button
        type="button"
        className={styles.translateToggle}
        onClick={() => setShowTranslated((v) => !v)}
        aria-pressed={showTranslated}
      >
        <Globe size={12} aria-hidden />
        {showTranslated
          ? t('translate.showOriginal', 'Show original')
          : t('translate.showInMyLanguage', 'Show in {language}', { language: langName })}
      </button>
      {showTranslated && (
        <span className={styles.translatedNote}>{t('translate.translatedAuto', 'Translated')}</span>
      )}
    </div>
  );
};
