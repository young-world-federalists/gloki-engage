// Lane F — transnational presence & multilingual fixtures.
//
// Plain reference data (no mock-API round-trip — consumed like the country
// list). The flagship spans four countries on mixed connectivity; these drive
// the flag clusters, the "participants from N countries" motif, the live
// "show in my language" toggle, and the WhatsApp/SMS-bridge + offline motifs.

/** Countries taking part in the flagship deliberation (ISO 3166-1 alpha-2). */
export const VFTC_COUNTRIES = ['KE', 'NG', 'MW', 'CD'];

/** Languages present across the flagship (ISO 639-1 + local codes). */
export const VFTC_LANGUAGES: LangCode[] = ['en', 'fr', 'sw', 'ny', 'ln'];

// ── Types ─────────────────────────────────────────────────────────────────

/** Languages spoken in the community. Only en/fr/sw switch the UI (see i18n). */
export type LangCode = 'en' | 'fr' | 'sw' | 'ny' | 'ln';

/** How a participant reaches the deliberation. */
export type ChannelKind = 'app' | 'whatsapp' | 'sms' | 'ussd';

/** Sync state of a contribution made on an intermittent connection. */
export type SyncStatus = 'synced' | 'pending' | 'offline';

export interface LanguageInfo {
  code: LangCode;
  /** Endonym (native name). */
  native: string;
  /** English name. */
  english: string;
}

/** A string with optional translations; `en` is the source of truth. */
export interface TranslatedText {
  en: string;
  fr?: string;
  sw?: string;
}

/** Languages a translated body can be authored in (the keys of TranslatedText). */
export type PostLang = 'en' | 'fr' | 'sw';

export interface PresenceParticipant {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  language: LangCode;
  channel: ChannelKind;
}

export interface PresencePost {
  id: string;
  author: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Language the body was written in. */
  language: PostLang;
  channel: ChannelKind;
  body: TranslatedText;
  /** Present when the post was made on an intermittent connection. */
  sync?: SyncStatus;
  /** Relative age in minutes — formatted through t() so it stays translatable. */
  minutesAgo: number;
}

// ── Data ────────────────────────────────────────────────────────────────────

export const LANGUAGES: Record<LangCode, LanguageInfo> = {
  en: { code: 'en', native: 'English', english: 'English' },
  fr: { code: 'fr', native: 'Français', english: 'French' },
  sw: { code: 'sw', native: 'Kiswahili', english: 'Swahili' },
  ny: { code: 'ny', native: 'Chichewa', english: 'Chichewa' },
  ln: { code: 'ln', native: 'Lingála', english: 'Lingala' },
};

/** Per-country participant counts for the flagship — drives the presence motifs. */
export const VFTC_PARTICIPATION: { code: string; participants: number }[] = [
  { code: 'KE', participants: 184 },
  { code: 'NG', participants: 156 },
  { code: 'MW', participants: 92 },
  { code: 'CD', participants: 71 },
];

/**
 * Sample translated posts. Reusable demo content for the live-translation
 * toggle and the bridge/offline motifs — includes a WhatsApp-bridge post, an
 * SMS-bridge post that is still syncing, and posts authored in EN and FR.
 */
export const PRESENCE_POSTS: PresencePost[] = [
  {
    id: 'pp1',
    author: 'Amara',
    country: 'KE',
    language: 'en',
    channel: 'app',
    minutesAgo: 12,
    body: {
      en: 'Drought is hitting our farms hardest. We need a shared fund that reaches rural chapters fast.',
      fr: 'La sécheresse frappe le plus durement nos fermes. Il nous faut un fonds commun qui atteigne vite les sections rurales.',
      sw: 'Ukame unaathiri mashamba yetu zaidi. Tunahitaji mfuko wa pamoja unaofika vijijini haraka.',
    },
  },
  {
    id: 'pp2',
    author: 'Pascal',
    country: 'CD',
    language: 'fr',
    channel: 'app',
    minutesAgo: 34,
    body: {
      fr: 'Nous devrions exiger un suivi public des engagements climatiques de chaque institution.',
      en: 'We should demand public tracking of every institution’s climate commitments.',
      sw: 'Tunapaswa kudai ufuatiliaji wa wazi wa ahadi za hali ya hewa za kila taasisi.',
    },
  },
  {
    id: 'pp3',
    author: 'Thandiwe',
    country: 'MW',
    language: 'en',
    channel: 'whatsapp',
    minutesAgo: 58,
    body: {
      en: 'Sent from my phone: our village wells dried up in March. Please count Malawi voices in.',
      fr: 'Envoyé depuis mon téléphone : les puits de notre village se sont taris en mars. Comptez les voix du Malawi.',
      sw: 'Imetumwa kwa simu yangu: visima vya kijiji chetu vilikauka Machi. Tafadhali hesabu sauti za Malawi.',
    },
  },
  {
    id: 'pp4',
    author: 'Chidi',
    country: 'NG',
    language: 'en',
    channel: 'sms',
    sync: 'pending',
    minutesAgo: 73,
    body: {
      en: 'Flooding in Lagos again. Backing the rapid-response proposal.',
      fr: 'Encore des inondations à Lagos. Je soutiens la proposition d’intervention rapide.',
      sw: 'Mafuriko Lagos tena. Naunga mkono pendekezo la hatua za haraka.',
    },
  },
];
