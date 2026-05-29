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
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.done': 'Done',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'common.search': 'Search',
  'common.dismiss': 'Dismiss',
  'common.share': 'Share',
  'common.comingSoon': 'Coming soon',

  // Global stage navigation (StageFooter)
  'nav.problem': 'Problem',
  'nav.discussion': 'Discuss',
  'nav.proposals': 'Proposals',
  'nav.vote': 'Vote',
  'nav.mandate': 'Mandate',

  // Language switcher
  'lang.switch': 'Language',
  'lang.en': 'English',
  'lang.fr': 'Français',
  'lang.sw': 'Kiswahili',
};

export default en;
