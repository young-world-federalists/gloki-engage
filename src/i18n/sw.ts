import type { Dictionary } from './types';

// Swahili overlay. Owned by Lane F. Any key missing here falls back to English.
// `{placeholder}` tokens are preserved verbatim. Language names in the switcher
// stay as endonyms (lang.en/fr/sw are intentionally not overridden).
const sw: Dictionary = {
  'common.close': 'Funga',
  'common.cancel': 'Ghairi',
  'common.save': 'Hifadhi',
  'common.confirm': 'Thibitisha',
  'common.continue': 'Endelea',
  'common.back': 'Rudi',
  'common.next': 'Endelea',
  'common.done': 'Imekamilika',
  'common.retry': 'Jaribu tena',
  'common.loading': 'Inapakia…',
  'common.search': 'Tafuta',
  'common.dismiss': 'Ondoa',
  'common.share': 'Shiriki',
  'common.comingSoon': 'Inakuja hivi karibuni',

  'nav.problem': 'Tatizo',
  'nav.discussion': 'Jadili',
  'nav.proposals': 'Mapendekezo',
  'nav.vote': 'Piga kura',
  'nav.mandate': 'Agizo',

  'lang.switch': 'Lugha',

  // Translation affordances
  'translate.translate': 'Tafsiri',
  'translate.showInMyLanguage': 'Onyesha kwa {language}',
  'translate.showOriginal': 'Onyesha ya awali',
  'translate.translatedAuto': 'Imetafsiriwa',
  'translate.translatingTo': 'Inatafsiri kwa {lang}…',
  'translate.failed': 'Tafsiri imeshindwa. Tafadhali jaribu tena.',
  'translate.keyHintTitle': 'Ongeza ufunguo wa API kwenye wasifu wako ili kuwezesha tafsiri',
  'translate.aiSummary': 'Muhtasari wa AI',
  'translate.hideSummary': 'Ficha muhtasari',
  'translate.generatingSummary': 'Inatengeneza muhtasari…',
  'translate.summaryFailed': 'Kutengeneza muhtasari kumeshindwa. Tafadhali jaribu tena.',

  // Connectivity — low-bandwidth & offline
  'connectivity.dataSaver': 'Kiokoa data',
  'connectivity.dataSaverHint': 'Tumia data kidogo — ficha picha nzito',
  'connectivity.synced': 'Imesawazishwa',
  'connectivity.pending': 'Imehifadhiwa · itasawazishwa baadaye',
  'connectivity.offline': 'Nje ya mtandao',
  'connectivity.viaApp': 'Kwenye app',
  'connectivity.viaWhatsapp': 'kupitia WhatsApp',
  'connectivity.viaSms': 'kupitia SMS',
  'connectivity.viaUssd': 'kupitia USSD',

  // Transnational presence motifs
  'presence.participantsFrom': 'washiriki {people} kutoka nchi {countries}',
  'presence.whereWeAreFrom': 'Tunakotoka',
  'presence.mapAria': 'washiriki {total} kutoka nchi {countries}',
  'presence.spokenHere': 'Lugha hapa',
  'presence.minutesAgo': 'dakika {n} zilizopita',
  'presence.hoursAgo': 'saa {n} zilizopita',
  'presence.showcaseTitle': 'Uwepo na muunganisho',
  'presence.showcaseSubtitle': 'Kuvuka mipaka, kuvuka lugha, kwa muunganisho wowote.',
  'presence.sectionLanguage': 'Lugha',
  'presence.sectionPresence': 'Nani yupo',
  'presence.sectionPosts': 'Tafsiri ya moja kwa moja na madaraja',
  'presence.sectionConnectivity': 'Mtandao hafifu na nje ya mtandao',
  'presence.dataSaverNote': 'Iwashe — avatar hapo juu zitabadilika kuwa nafasi nyepesi.',
};

export default sw;
