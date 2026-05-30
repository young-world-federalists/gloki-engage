import type { Dictionary } from './types';

// French overlay. Owned by Lane F. Any key missing here falls back to English.
// `{placeholder}` tokens are preserved verbatim. Language names in the switcher
// stay as endonyms (lang.en/fr/sw are intentionally not overridden).
const fr: Dictionary = {
  'common.close': 'Fermer',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.confirm': 'Confirmer',
  'common.continue': 'Continuer',
  'common.back': 'Retour',
  'common.next': 'Suivant',
  'common.done': 'Terminé',
  'common.retry': 'Réessayer',
  'common.loading': 'Chargement…',
  'common.search': 'Rechercher',
  'common.dismiss': 'Ignorer',
  'common.share': 'Partager',
  'common.comingSoon': 'Bientôt disponible',

  'nav.problem': 'Problème',
  'nav.discussion': 'Discuter',
  'nav.proposals': 'Propositions',
  'nav.vote': 'Voter',
  'nav.mandate': 'Mandat',

  'lang.switch': 'Langue',

  // Translation affordances
  'translate.translate': 'Traduire',
  'translate.showInMyLanguage': 'Afficher en {language}',
  'translate.showOriginal': 'Voir l’original',
  'translate.translatedAuto': 'Traduit',
  'translate.translatingTo': 'Traduction en {lang}…',
  'translate.failed': 'Échec de la traduction. Veuillez réessayer.',
  'translate.keyHintTitle': 'Ajoutez une clé API dans votre profil pour activer la traduction',
  'translate.aiSummary': 'Résumé IA',
  'translate.hideSummary': 'Masquer le résumé',
  'translate.generatingSummary': 'Génération du résumé…',
  'translate.summaryFailed': 'Échec de la génération du résumé. Veuillez réessayer.',

  // Connectivity — low-bandwidth & offline
  'connectivity.dataSaver': 'Économiseur de données',
  'connectivity.dataSaverHint': 'Utiliser moins de données — masquer les images lourdes',
  'connectivity.synced': 'Synchronisé',
  'connectivity.pending': 'Enregistré · synchro plus tard',
  'connectivity.offline': 'Hors ligne',
  'connectivity.viaApp': 'Dans l’app',
  'connectivity.viaWhatsapp': 'via WhatsApp',
  'connectivity.viaSms': 'via SMS',
  'connectivity.viaUssd': 'via USSD',

  // Transnational presence motifs
  'presence.participantsFrom': '{people} participants de {countries} pays',
  'presence.whereWeAreFrom': 'D’où nous venons',
  'presence.mapAria': '{total} participants dans {countries} pays',
  'presence.spokenHere': 'Langues ici',
  'presence.minutesAgo': 'il y a {n} min',
  'presence.hoursAgo': 'il y a {n} h',
  'presence.showcaseTitle': 'Présence et connectivité',
  'presence.showcaseSubtitle': 'Au-delà des frontières, des langues, sur toute connexion.',
  'presence.sectionLanguage': 'Langue',
  'presence.sectionPresence': 'Qui est là',
  'presence.sectionPosts': 'Traduction en direct et passerelles',
  'presence.sectionConnectivity': 'Faible bande passante et hors ligne',
  'presence.dataSaverNote': 'Activez-le — les avatars ci-dessus deviennent des espaces réservés légers.',
};

export default fr;
