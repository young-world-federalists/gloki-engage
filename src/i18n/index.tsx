import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Dictionary, Locale, Vars } from './types';
import en from './en';
import fr from './fr';
import sw from './sw';

export type { Locale, Vars, Dictionary } from './types';

/** Available locales, in switcher order. Labels resolve through `t(labelKey)`. */
export const LOCALES: { code: Locale; labelKey: string }[] = [
  { code: 'en', labelKey: 'lang.en' },
  { code: 'fr', labelKey: 'lang.fr' },
  { code: 'sw', labelKey: 'lang.sw' },
];

const DICTS: Record<Locale, Dictionary> = { en, fr, sw };

const STORAGE_KEY = 'gloki.locale';
const DEFAULT_LOCALE: Locale = 'en';

function isLocale(v: string | null): v is Locale {
  return v === 'en' || v === 'fr' || v === 'sw';
}

/** Replace `{name}` tokens. Unknown tokens are left visible as `{name}`. */
function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/**
 * Framework-agnostic translate. Lookup order:
 *   active locale → English → inline default → the key itself.
 * The key-as-last-resort means a missing string is visible, never a crash.
 */
export function translate(locale: Locale, key: string, defaultValue?: string, vars?: Vars): string {
  const raw = DICTS[locale]?.[key] ?? DICTS.en[key] ?? defaultValue ?? key;
  return interpolate(raw, vars);
}

/** `t('namespace.key', 'English default', { vars })`. */
export type TFunction = (key: string, defaultValue?: string, vars?: Vars) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) return stored;
    } catch {
      /* localStorage unavailable — fall through to default */
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore persistence failure */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback<TFunction>(
    (key, defaultValue, vars) => translate(locale, key, defaultValue, vars),
    [locale],
  );

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

/** Convenience hook returning just the `t` function. */
export function useT(): TFunction {
  return useI18n().t;
}
