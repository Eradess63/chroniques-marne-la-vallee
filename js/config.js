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

  /**
   * Proxies CORS publics, essayés après le Worker et l'appel direct.
   * Queue-Times n'envoie aucun en-tête CORS : sans proxy, aucun navigateur ne peut l'appeler.
   * Ces services sont limités en débit — pour un usage fiable, déployez le Worker.
   */
  PUBLIC_PROXIES: [
    {
      url: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      unwrap: (data) => (typeof data?.contents === 'string' ? JSON.parse(data.contents) : data)
    }
  ],

  /** Délai maximal par requête (ms) */
  TIMEOUT_MS: 6000,

  /** Intervalle d'actualisation automatique (ms) */
  REFRESH_MS: 5 * 60 * 1000,

  /** Mettre à false pour désactiver l'appel réseau (aucune donnée affichée) */
  LIVE_ENABLED: true
};
