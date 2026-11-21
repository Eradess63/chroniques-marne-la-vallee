# Chroniques de Marne-la-Vallée

Encyclopédie des attractions du Parc Disneyland et de Disney Adventure World.
Site de fans, non officiel, sans lien avec The Walt Disney Company ni Disneyland Paris.

## Lancer en local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000 (le site charge `data/attractions.json` par `fetch`,
il ne fonctionne donc pas en ouvrant le fichier directement).

## Temps d'attente en direct

Les données viennent de l'API publique [Queue-Times](https://queue-times.com/).
`js/api.js` essaie dans l'ordre : un Worker Cloudflare, l'appel direct, puis deux proxies CORS publics.
Sans réponse, le site affiche « Statut indisponible » — aucune donnée n'est inventée.

Pour un temps réel fiable, déployez `worker/queue-times-proxy.js` sur Cloudflare Workers
et renseignez son URL dans `WORKER_URL` (`js/config.js`).

## Structure

| Chemin | Rôle |
|---|---|
| `index.html` | Page, version modulaire |
| `css/style.css` | Styles Art déco |
| `js/config.js` | Réglages (URL du Worker, délais) |
| `js/api.js` | Appels Queue-Times |
| `js/posters.js` | Affiches SVG originales |
| `js/reviews.js` | Avis visiteurs (localStorage) |
| `js/app.js` | Filtres, grille, fiche, galerie |
| `data/attractions.json` | Données des attractions |
| `worker/` | Proxy CORS Cloudflare |
| `build.py` | Génère `dist/index.html`, fichier unique |

## Données

26 attractions sur les 51 du complexe. Six fiches sont complètes, vingt sont en cours
(nom, land et sources seulement). Les champs « À confirmer » restent à vérifier
sur le site officiel de Disneyland Paris.

## Illustrations

Les affiches sont dessinées en SVG et originales : aucun personnage, logo ni visuel
protégé. Le champ `images` de chaque attraction accepte vos propres photos.
