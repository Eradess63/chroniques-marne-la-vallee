/**
 * Configuration centrale.
 * Modifiez WORKER_URL après avoir déployé worker/queue-times-proxy.js.
 */
export const CONFIG = {
  /** Fichier de données des attractions */
  DATA_URL: 'data/attractions.json',

  /** Endpoint officiel Queue-Times (id 4 = Parc Disneyland, id 28 = Disney Adventure World) */
  QUEUE_TIMES_URL: (id) => `https://queue-times.com/parks/${id}/queue_times.json`,

  /** URL de votre Cloudflare Worker (laisser vide pour ne pas l'utiliser). Ex : 'https://qt-proxy.moncompte.workers.dev' */
  WORKER_URL: '',

  /** Proxies CORS publics, essayés dans l'ordre si l'appel direct échoue (utiles pour tester, déconseillés en production) */
  PUBLIC_PROXIES: [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`
  ],

  /** Délai maximal par requête (ms) */
  TIMEOUT_MS: 6000,

  /** Intervalle d'actualisation automatique (ms) */
  REFRESH_MS: 5 * 60 * 1000,

  /** Mettre à false pour désactiver l'appel réseau (aucune donnée affichée) */
  LIVE_ENABLED: true
};
