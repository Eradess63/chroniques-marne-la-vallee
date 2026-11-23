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
