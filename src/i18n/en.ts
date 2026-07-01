import type { Dictionary } from './types';

// English seed dictionary — the source of truth.
//
// This holds foundation/shared strings (the kit, the shell, navigation). Feature
// copy does NOT all need to live here: a lane may call
//   t('onboarding.welcome', 'Welcome to Gloki')
// passing the English default inline, so lanes never edit this file. Lane F owns
// `src/i18n/**` and backfills the fr/sw overlays (and may promote common inline
// defaults into this dictionary over time).
const en: Dictionary = {
  // Common actions / status
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.confirm': 'Confirm',
  'common.ok': 'OK',
  'common.errorTitle': 'Something went wrong',
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'common.dismiss': 'Dismiss',
  'common.share': 'Share',
  'common.submit': 'Submit',
  'common.submitting': 'Submitting…',

  // App shell — session loader, error boundary, 404 (rendered by App.tsx /
  // ErrorBoundary). Title + retry reuse common.errorTitle / common.retry.
  'app.title': 'Gloki — Decentralized Self-Governance',
  'app.validatingSession': 'Validating session…',
  'errorBoundary.message': 'This section encountered an error. Your other work is safe.',
  'errorBoundary.appMessage': 'Gloki encountered an unexpected error. Please refresh the page.',
  'notFound.title': 'Page not found',
  'notFound.body': 'We couldn’t find that page. It may have moved, or the link may be wrong.',
  'notFound.home': 'Back to home',

  // Global stage navigation (StageFooter) — SHORT stage forms
  'nav.problem': 'Problem',
  'nav.discussion': 'Discuss',
  'nav.proposals': 'Solutions',
  'nav.vote': 'Vote',
  'nav.mandate': 'Mandate',
  'nav.skipToContent': 'Skip to content',
  // Reframes the global StageFooter as cross-community discovery (P1) — distinct
  // from the per-initiative stage strip's next-step nav.
  'nav.browseByStage': 'Browse by stage',

  // AppHeader section eyebrows (Wave 1)
  'header.section.discussion': 'Discussion',
  'header.section.collaboration': 'Collaboration',

  // Canonical FULL stage labels (CommunityHome badges, InitiativeDashboard
  // cards, CreateInitiativePage stepper). Two families only: nav.* = short,
  // stage.* = full. The old dashboard.stage.{id}.label aliases are collapsed
  // into this family; dashboard.stage.{id}.desc remains dashboard copy.
  'stage.problem': 'Problem',
  'stage.discussion': 'Discussion',
  'stage.proposals': 'Solutions',
  'stage.vote': 'Vote',
  'stage.mandate': 'Mandate',
  // Per-initiative stage strip (the follow-this-initiative control, P1).
  'stage.initiativeStripLabel': 'Stages of this initiative',
  'stage.goTo': 'Go to {stage}',

  // Language switcher (language names stay as endonyms across all locales)
  'lang.switch': 'Language',
  'lang.en': 'English',
  'lang.fr': 'Français',
  'lang.sw': 'Kiswahili',

  // Translation affordances (Lane F · AITools)
  'translate.translate': 'Translate',
  'translate.showInMyLanguage': 'Show in {language}',
  'translate.showOriginal': 'Show original',
  'translate.translatedAuto': 'Translated',
  'translate.translatingTo': 'Translating to {lang}…',
  'translate.failed': 'Translation failed. Please try again.',
  'translate.keyHintTitle': 'Add an API key in your profile to enable translation',
  'translate.aiSummary': 'AI Summary',
  'translate.hideSummary': 'Hide Summary',
  'translate.generatingSummary': 'Generating summary…',
  'translate.summaryFailed': 'Summary generation failed. Please try again.',

  // Profile
  'profile.prefs': 'Preferences',

  // Connectivity — low-bandwidth & offline (Lane F)
  'connectivity.dataSaver': 'Data saver',
  'connectivity.dataSaverHint': 'Use less data — hide heavy images',
  'connectivity.synced': 'Synced',
  'connectivity.pending': 'Saved · syncs later',
  'connectivity.offline': 'Offline',
  'connectivity.viaApp': 'In app',
  'connectivity.viaWhatsapp': 'via WhatsApp',
  'connectivity.viaSms': 'via SMS',
  'connectivity.viaUssd': 'via USSD',
  'connectivity.offlineBanner.title': "You're offline",
  'connectivity.offlineBanner.body': 'Some content may not load until you reconnect.',

  // Transnational presence motifs (Lane F)
  'presence.participantsFrom': '{people} participants from {countries} countries',
  'presence.whereWeAreFrom': 'Where we’re from',
  'presence.mapAria': '{total} participants across {countries} countries',
  'presence.spokenHere': 'Spoken here',
  'presence.minutesAgo': '{n}m ago',
  'presence.hoursAgo': '{n}h ago',
  'presence.showcaseTitle': 'Presence & connectivity',
  'presence.showcaseSubtitle': 'Across borders, across languages, on any connection.',
  'presence.sectionLanguage': 'Language',
  'presence.sectionPresence': 'Who’s here',
  'presence.sectionPosts': 'Live translation & bridges',
  'presence.sectionConnectivity': 'Low-bandwidth & offline',
  'presence.dataSaverNote': 'Turn it on — the avatars above become light placeholders.',
};

export default en;
