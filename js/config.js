/**
 * Configuration centrale.
 */
export const CONFIG = {
  /** Données éditoriales des attractions */
  DATA_URL: 'data/attractions.json',

  /**
   * API ThemeParks.wiki — publique, sans authentification, et surtout
   * ouverte au CORS : la page l'appelle directement depuis n'importe quel
   * hébergement, sans proxy ni relevé intermédiaire.
   */
  API: 'https://api.themeparks.wiki/v1',

  /** Identifiants des deux parcs chez ThemeParks.wiki */
  PARKS: {
    dlp: 'dae968d5-630d-4719-8b06-3d107e944401',
    daw: 'ca888437-ebb4-4d50-aed2-d227f7096968'
  },

  /** Délai maximal par requête (ms) */
  TIMEOUT_MS: 12000,

  /** Intervalle d'actualisation automatique (ms) */
  REFRESH_MS: 5 * 60 * 1000,

  /** Mettre à false pour couper tout appel réseau */
  LIVE_ENABLED: true
};
