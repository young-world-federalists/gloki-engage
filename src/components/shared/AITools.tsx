import React, { useState } from 'react';
import clsx from 'clsx';
import { Languages, Sparkles, ChevronDown, X, Key, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useT, useI18n } from '../../i18n';
import { translateText, summarizeDiscussion, AI_LANGUAGES } from '../../services/ai';
import type { DiscussionContent } from '../../services/ai';
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

// ── Translate button (API-backed, arbitrary text) ─────────────────────────────

interface TranslateButtonProps {
  text: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({ text }) => {
  const apiKey = useAppSelector((s) => s.user.profile?.openaiApiKey);
  const navigate = useNavigate();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const handleTranslate = async (_langCode: string, langLabel: string) => {
    if (!apiKey) return;
    setSelectedLang(langLabel);
    setOpen(false);
    setLoading(true);
    try {
      const result = await translateText(apiKey, text, langLabel);
      setTranslated(result);
    } catch {
      setTranslated(t('translate.failed', 'Translation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setTranslated(null);
    setSelectedLang(null);
  };

  if (!apiKey) {
    return (
      <button
        className={styles.toolButton}
        onClick={() => navigate('/identity/profile')}
        title={t('translate.keyHintTitle', 'Add an API key in your profile to enable translation')}
      >
        <Languages size={16} />
        <span>{t('translate.translate', 'Translate')}</span>
        <Key size={10} className={styles.keyHint} />
      </button>
    );
  }

  return (
    <div className={styles.translateWrapper}>
      <button className={styles.toolButton} onClick={() => setOpen(!open)}>
        <Languages size={16} />
        <span>{t('translate.translate', 'Translate')}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className={styles.langMenu}>
          {AI_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={styles.langItem}
              onClick={() => handleTranslate(lang.code, lang.label)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className={styles.aiResult}>
          <div className={styles.aiLoading}>
            {t('translate.translatingTo', 'Translating to {lang}…', { lang: selectedLang ?? '' })}
          </div>
        </div>
      )}

      {translated && !loading && (
        <div className={styles.aiResult}>
          <div className={styles.aiResultHeader}>
            <span className={styles.aiResultLabel}>
              <Languages size={12} /> {selectedLang}
            </span>
            <button className={styles.aiDismiss} onClick={handleDismiss}>
              <X size={16} />
            </button>
          </div>
          <p className={styles.aiResultText}>{translated}</p>
        </div>
      )}
    </div>
  );
};

// ── Summary button ──────────────────────────────────────────────────────────

interface SummaryButtonProps {
  content: DiscussionContent;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ content }) => {
  const apiKey = useAppSelector((s) => s.user.profile?.openaiApiKey);
  const navigate = useNavigate();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!apiKey) {
      navigate('/identity/profile');
      return;
    }
    if (summary) {
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const result = await summarizeDiscussion(apiKey, content);
      setSummary(result);
    } catch {
      setSummary(t('translate.summaryFailed', 'Summary generation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.summaryWrapper}>
      <button className={styles.toolButton} onClick={handleSummarize}>
        <Sparkles size={16} />
        <span>
          {summary ? t('translate.hideSummary', 'Hide Summary') : t('translate.aiSummary', 'AI Summary')}
        </span>
        {!apiKey && <Key size={10} className={styles.keyHint} />}
      </button>

      {loading && (
        <div className={styles.aiResult}>
          <div className={styles.aiLoading}>{t('translate.generatingSummary', 'Generating summary…')}</div>
        </div>
      )}

      {summary && !loading && (
        <div className={styles.aiResult}>
          <div className={styles.aiResultHeader}>
            <span className={styles.aiResultLabel}>
              <Sparkles size={12} /> {t('translate.aiSummary', 'AI Summary')}
            </span>
            <button className={styles.aiDismiss} onClick={() => setSummary(null)}>
              <X size={16} />
            </button>
          </div>
          <p className={styles.aiResultText}>{summary}</p>
        </div>
      )}
    </div>
  );
};

// ── Combined toolbar ────────────────────────────────────────────────────────

interface AIToolbarProps {
  text?: string;
  discussionContent?: DiscussionContent;
}

const AIToolbar: React.FC<AIToolbarProps> = ({ text, discussionContent }) => {
  return (
    <div className={styles.toolbar}>
      {text && <TranslateButton text={text} />}
      {discussionContent && <SummaryButton content={discussionContent} />}
    </div>
  );
};

export default AIToolbar;
