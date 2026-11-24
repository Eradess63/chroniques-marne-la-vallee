/**
 * Service worker : rend le site consultable hors connexion.
 *
 * Le parc est un endroit où le réseau lâche — sous-sol de Space Mountain, file
 * couverte, forfait saturé un samedi. Les 51 fiches et leurs illustrations sont
 * donc gardées en local dès la première visite. Seuls les temps d'attente ont
 * besoin du réseau : ils ne passent jamais par ce cache, et l'application
 * affiche d'elle-même la date du dernier relevé quand elle ne peut pas joindre
 * l'API.
 */
const VERSION = '202611241353';
const CACHE = `chroniques-${VERSION}`;

/** Ressources mises de côté dès l'installation, chemins relatifs à la portée. */
const SOCLE = [
  './', './app/icone-180.png', './app/icone-192.png', './app/icone-512.png',
  './app/manifeste.webmanifest',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&family=Cinzel:wght@400;600;700&family=Spectral:ital,wght@0,300;0,400;0,600;1,400&display=swap'
];

self.addEventListener('install', (e) => {
  // addAll échoue en bloc si une seule ressource manque : on les prend une par
  // une, pour qu'une icône absente n'empêche pas la page d'être gardée.
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SOCLE.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await gardePolices(cache);
    self.skipWaiting();
  })());
});

/**
 * Garder la feuille de style des polices ne suffit pas : elle ne fait que
 * pointer vers des fichiers .woff2 dont l'adresse change à chaque révision.
 * On la lit donc pour aller chercher les fichiers eux-mêmes, sans quoi
 * l'application hors connexion retomberait sur une police système.
 */
async function gardePolices(cache) {
  try {
    const css = SOCLE.find((u) => u.includes('fonts.googleapis.com'));
    if (!css) return;
    const rep = await cache.match(css) || await fetch(css);
    const texte = await rep.clone().text();
    const urls = [...new Set([...texte.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
    await Promise.allSettled(urls.map((u) => cache.add(new Request(u, { mode: 'cors' }))));
  } catch { /* sans les polices le site reste lisible : on n'échoue pas pour ça */ }
}

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter((n) => n.startsWith('chroniques-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Les temps d'attente ne sont jamais gardés : une attente d'hier affichée
  // comme celle de maintenant serait pire que pas d'attente du tout.
  if (url.hostname.endsWith('themeparks.wiki')) return;

  // La page elle-même : le réseau d'abord, pour voir les publications ; le
  // cache si le réseau manque.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const rep = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./', rep.clone());
        return rep;
      } catch {
        return (await caches.match('./')) || (await caches.match(req)) || Response.error();
      }
    })());
    return;
  }

  // Le reste — styles, scripts, données, illustrations, polices : on sert la
  // copie gardée tout de suite et on la rafraîchit en arrière-plan.
  if (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const garde = await cache.match(req);
      const reseau = fetch(req).then((rep) => {
        // Une feuille de style ou une police tierce revient en réponse opaque :
        // son statut est 0, jamais « ok ». La refuser pour autant priverait
        // l'application de ses trois polices dès qu'elle est hors connexion.
        if (rep && (rep.ok || rep.type === 'opaque')) cache.put(req, rep.clone());
        return rep;
      }).catch(() => null);
      return garde || (await reseau) || Response.error();
    })());
  }
});
