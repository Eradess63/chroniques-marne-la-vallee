/**
 * Plan officiel et « Près de moi ».
 *
 * Le plan interactif (js/park-map.js) et la géolocalisation (js/nearby.js)
 * sont les mêmes que dans le Carnet de parc : ce module leur donne les
 * coordonnées des attractions et fabrique les blocs de la liste et de la fiche.
 */
const escH = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Les coordonnées des attractions, au format attendu par le plan. */
export function initPlan(attractions) {
  window.parkMapPoints = {
    a: Object.fromEntries(attractions.filter((a) => a.coords).map((a) => [a.name, a.coords]))
  };
}

/** Bloc « Localisation » de la fiche : aperçu du plan, qui s'agrandit au toucher. */
export function planSection(a) {
  const apercu = a.coords && window.parkMapPreview ? window.parkMapPreview('a', a.name) : '';
  if (!apercu) return '';
  return `<section class="section" aria-labelledby="h-plan">
      <h3 class="section__title rule" id="h-plan"><span>Localisation</span></h3>
      <div class="plan-apercu">${apercu}</div>
      <p class="plan-note">Plan interactif © Disneyland Paris · touche le plan pour l'agrandir et zoomer.</p>
    </section>`;
}

export const geo = {
  get actif() { return !!window.nearby?.active; },
  basculer() { if (!window.nearby) return; window.nearby.active ? window.nearby.stop() : window.nearby.start(); },
  surChangement(fn) { window.nearby?.onChange(fn); }
};

/**
 * Bloc « Autour de toi » au-dessus de la grille.
 * `statut(a)` rend { kind, wait } (statusOf de app.js) ; `tri` vaut
 * 'distance' ou 'attente'.
 */
export function autourHTML(attractions, statut, tri) {
  const nb = window.nearby;
  if (!nb?.active) return nb?.error ? `<p class="autour__info autour__info--alerte">${escH(nb.error)}</p>` : '';
  if (!nb.position) return '<p class="autour__info">Recherche de ta position…</p>';
  const MARCHE = (m) => (m * 1.3) / 75; // minutes de marche, allées comprises
  let lignes = attractions
    .filter((a) => a.coords)
    .map((a) => ({ a, m: nb.distanceTo('a', a.name), st: statut(a) }))
    .filter((x) => x.m != null);
  if (tri === 'attente') {
    lignes = lignes
      .filter((x) => MARCHE(x.m) <= 10 && x.st.kind === 'open' && typeof x.st.wait === 'number')
      .sort((x, y) => x.st.wait - y.st.wait || x.m - y.m);
  } else {
    lignes = lignes.sort((x, y) => x.m - y.m);
  }
  lignes = lignes.slice(0, 8);
  const etiquette = (st) => {
    if (st.kind === 'open') return typeof st.wait === 'number' ? `${st.wait} min` : 'Ouverte';
    return { closed: 'Fermée', refurb: 'Rénovation', down: 'Interrompue' }[st.kind] || '—';
  };
  const classe = (st) => st.kind === 'open' ? (typeof st.wait === 'number' && st.wait <= 15 ? ' autour__attente--court' : '') : ' autour__attente--ferme';
  const liste = lignes.map(({ a, m, st }) => `<button type="button" class="autour__ligne" data-open="${escH(a.id)}">
      <span><strong>${escH(a.name)}</strong><small>${escH(a.land)} · ${escH(nb.describe(m))}</small></span>
      <b class="autour__attente${classe(st)}">${escH(etiquette(st))}</b></button>`).join('');
  return `<div class="autour__tete">
      <div><span class="autour__kicker">Autour de toi</span>
      <h2 class="autour__titre">${tri === 'attente' ? 'Le moins d’attente à 10 min de marche' : 'Les attractions les plus proches'}</h2></div>
      <div class="seg" role="group" aria-label="Trier">
        <button type="button" class="seg__btn" data-autour-tri="distance" aria-pressed="${tri !== 'attente'}">Plus proches</button>
        <button type="button" class="seg__btn" data-autour-tri="attente" aria-pressed="${tri === 'attente'}">Moins d’attente</button>
      </div></div>
    ${nb.far ? '<p class="autour__info autour__info--alerte">Tu sembles loin des Parcs : distances depuis ta position actuelle.</p>' : ''}
    <div class="autour__liste">${liste || '<p class="autour__info">Aucune attraction ouverte à moins de 10 min de marche pour le moment.</p>'}</div>
    <p class="autour__info">Temps de marche estimés · ta position reste sur ton téléphone.</p>`;
}

/**
 * Bloc « Attente selon l'heure » de la fiche : moyennes par demi-heure tirées
 * des relevés du Carnet (toutes les 15 min), et les relevés d'aujourd'hui.
 */
export function habitudeHTML(a) {
  const h = window.waitHistory;
  if (!a.disney || !h) return '';
  if (!h.ready) return '<p class="habitude__vide">Chargement de l’historique…</p>';
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const typeJour = [0, 6].includes(now.getDay()) ? 'w' : 'j';
  const courbe = h.curve(a.disney, typeJour), jour = h.today(a.disney);
  if (!courbe.length && !jour.length) {
    return `<p class="habitude__vide">Pas encore assez de relevés pour cette attraction${h.days ? ` (${h.days} jour${h.days > 1 ? 's' : ''} d’historique)` : ''}. Le Carnet note les attentes toutes les 15 minutes : la courbe se dessinera au fil des jours.</p>`;
  }
  const S0 = 16, S1 = 47, W = 620, H = 170, PB = 22, PT = 10;
  const max = Math.max(30, ...courbe.map((c) => c.wait), ...jour.map((j) => j[1]));
  const x = (slot) => ((slot - S0) / (S1 - S0)) * W;
  const y = (w) => PT + (H - PT - PB) * (1 - w / max);
  const bw = W / (S1 - S0) - 3;
  const cur = Math.floor(nowMin / 30);
  const barres = courbe.filter((c) => c.slot >= S0 && c.slot < S1).map((c) =>
    `<rect x="${x(c.slot) + 1.5}" y="${y(c.wait)}" width="${bw}" height="${H - PB - y(c.wait)}" rx="2" class="${c.slot === cur ? 'hb-cur' : 'hb-bar'}"><title>${h.slotLabel(c.slot)} : ~${c.wait} min (${c.n} relevés)</title></rect>`).join('');
  const ligne = jour.length > 1 ? `<polyline class="hb-auj" points="${jour.filter((j) => j[0] >= S0 * 30).map((j) => `${x(j[0] / 30).toFixed(1)},${y(j[1]).toFixed(1)}`).join(' ')}"/>` : '';
  const points = jour.map((j) => `<circle cx="${x(j[0] / 30).toFixed(1)}" cy="${y(j[1]).toFixed(1)}" r="2.6" class="hb-pt"/>`).join('');
  const heures = [9, 11, 13, 15, 17, 19, 21, 23].map((hh) => `<text x="${x(hh * 2)}" y="${H - 6}" class="hb-h">${hh} h</text>`).join('');
  const grille = [15, 30, 45, 60, 90].filter((w) => w < max).map((w) => `<line x1="0" x2="${W}" y1="${y(w)}" y2="${y(w)}" class="hb-g"/><text x="${W - 2}" y="${y(w) - 3}" class="hb-gl">${w}</text>`).join('');
  const calme = h.best(a.disney, 0), apres = h.best(a.disney, nowMin), t = h.typical(a.disney);
  const phrases = [];
  if (calme) phrases.push(`En général, le plus calme : <b>vers ${h.slotLabel(calme.slot)}</b> (~${calme.wait} min).`);
  if (t) phrases.push(`À cette heure-ci : ~${t.wait} min d’habitude.`);
  if (apres && calme && apres.slot !== calme.slot) phrases.push(`D’ici la fermeture : vers ${h.slotLabel(apres.slot)} (~${apres.wait} min).`);
  return `<svg class="habitude__graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Attente moyenne par demi-heure">${grille}${barres}${ligne}${points}${heures}</svg>
    <p class="habitude__legende"><span class="hb-k hb-k--bar"></span> moyenne ${typeJour === 'w' ? 'le week-end' : 'en semaine'} <span class="hb-k hb-k--auj"></span> aujourd’hui</p>
    ${phrases.length ? `<p class="habitude__texte">${phrases.join(' ')}</p>` : ''}
    <p class="plan-note">Relevés du Carnet toutes les 15 min depuis le ${h.since ? new Date(h.since + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'} · ${h.days} jour${h.days > 1 ? 's' : ''} · source ThemeParks.wiki</p>`;
}

export function habitudeSection(a) {
  if (!a.disney) return '';
  return `<section class="section" aria-labelledby="h-habitude">
      <h3 class="section__title rule" id="h-habitude"><span>Attente selon l’heure</span></h3>
      <div id="fiche-habitude">${habitudeHTML(a)}</div>
    </section>`;
}
