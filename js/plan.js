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
 * Bloc « Attente selon l'heure » de la fiche : la courbe des attentes
 * relevées aujourd'hui (toutes les 5 min par le Carnet), et en pointillés
 * l'attente habituelle à chaque heure, tirée des jours précédents.
 * Survoler ou toucher la courbe affiche le détail.
 */
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(Math.round(m % 60)).padStart(2, '0')}`;
export function habitudeHTML(a) {
  const h = window.waitHistory;
  if (!a.disney || !h) return '';
  if (!h.ready) return '<p class="habitude__vide">Chargement de l’historique…</p>';
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const typeJour = [0, 6].includes(now.getDay()) ? 'w' : 'j';
  const courbe = h.curve(a.disney, typeJour), jour = h.today(a.disney);
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const t = h.typical(a.disney);
  if (!courbe.length && !jour.length) {
    return `<p class="habitude__date">${esc2(date)}</p><p class="habitude__vide">Pas encore de relevé pour cette attraction aujourd’hui. Le Carnet note les attentes toutes les 5 minutes pendant l’ouverture : la courbe se dessine au fil de la journée.</p>`;
  }
  // Fenêtre : de l'ouverture (ou du premier relevé) à la fin des données.
  // Sans habitude connue, la fenêtre suit les relevés du jour (au moins 2 h).
  const debut = courbe.length ? Math.min(courbe[0].slot * 30, jour[0]?.[0] ?? 24 * 60) : Math.max(8 * 60, Math.floor(((jour[0]?.[0] ?? 9 * 60) - 30) / 30) * 30);
  const fin = Math.max(jour.length ? jour[jour.length - 1][0] + 15 : 0, courbe.length ? courbe[courbe.length - 1].slot * 30 + 30 : 0, debut + 120);
  const W = 360, H = 190, PL = 24, PR = 6, PT = 10, PB = 20;
  const max = Math.ceil(Math.max(30, ...courbe.map((c) => c.wait), ...jour.map((j) => j[1])) / 20) * 20;
  const x = (m) => PL + ((m - debut) / (fin - debut)) * (W - PL - PR);
  const y = (w) => PT + (H - PT - PB) * (1 - w / max);
  const grille = [];
  for (let w = 0; w <= max; w += 20) grille.push(`<line x1="${PL}" x2="${W - PR}" y1="${y(w)}" y2="${y(w)}" class="hb-g"/><text x="${PL - 5}" y="${y(w) + 3}" class="hb-gl">${w}</text>`);
  const pas = fin - debut > 420 ? 120 : 60;
  for (let m = Math.ceil(debut / pas) * pas; m <= fin; m += pas) grille.push(`<text x="${x(m)}" y="${H - 6}" class="hb-h">${String(m / 60).padStart(2, '0')}h</text>`);
  const pts = jour.map(([m, w]) => [x(m), y(w)]);
  const ligne = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const aire = pts.length > 1 ? `<path class="hb-aire" d="${ligne}L${pts[pts.length - 1][0].toFixed(1)},${y(0)}L${pts[0][0].toFixed(1)},${y(0)}Z"/>` : '';
  const habit = courbe.length > 1 ? `<path class="hb-habit" d="${courbe.map((c, i) => `${i ? 'L' : 'M'}${x(c.slot * 30 + 15).toFixed(1)},${y(c.wait).toFixed(1)}`).join('')}"/>` : '';
  const maint = nowMin >= debut && nowMin <= fin ? `<line class="hb-now" x1="${x(nowMin)}" x2="${x(nowMin)}" y1="${PT}" y2="${y(0)}"/>` : '';
  // Données du détail au survol : [minute, réel, habitude] tous les quarts d'heure.
  const det = [];
  for (let m = Math.ceil(debut / 15) * 15; m <= fin; m += 15) {
    const r = jour.reduce((best, j) => (Math.abs(j[0] - m) <= 8 && (!best || Math.abs(j[0] - m) < Math.abs(best[0] - m)) ? j : best), null);
    const c = courbe.find((k) => k.slot === Math.floor(m / 30));
    if (r || c) det.push([m, r ? r[1] : null, c ? c.wait : null]);
  }
  const calme = h.best(a.disney, 0), apres = h.best(a.disney, nowMin);
  const phrases = [];
  if (jour.length) phrases.push(`Maintenant : <b>${jour[jour.length - 1][1]} min</b> (relevé de ${hhmm(jour[jour.length - 1][0])}).`);
  if (t) phrases.push(`D’habitude à cette heure : ~${t.wait} min.`);
  if (apres) phrases.push(`Plus calme d’ici la fermeture : <b>vers ${h.slotLabel(apres.slot)}</b> (~${apres.wait} min).`);
  else if (calme) phrases.push(`En général, le plus calme : vers ${h.slotLabel(calme.slot)} (~${calme.wait} min).`);
  return `<p class="habitude__date">${esc2(date)}</p>
    <p class="habitude__bulle" aria-live="polite">${jour.length ? `<b>${hhmm(jour[jour.length - 1][0])}</b><span><i class="hb-k hb-k--auj"></i>Relevé : <strong>${jour[jour.length - 1][1]} min</strong></span>${t ? `<span><i class="hb-k hb-k--habit"></i>D’habitude : ${t.wait} min</span>` : ''}` : '<span>Touche la courbe pour le détail</span>'}</p>
    <div class="habitude__cadre">
      <svg class="habitude__graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Attente relevée aujourd’hui, heure par heure" data-det="${esc2(JSON.stringify(det))}" data-geo="${[debut, fin, W, PL, PR].join(',')}">
        <defs><linearGradient id="hb-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--laiton)" stop-opacity=".45"/><stop offset="1" stop-color="var(--laiton)" stop-opacity="0"/></linearGradient></defs>
        ${grille.join('')}${maint}${aire}${habit}${pts.length ? `<path class="hb-ligne" d="${ligne}"/>` : ''}
        <line class="hb-curseur" x1="0" x2="0" y1="${PT}" y2="${y(0)}" visibility="hidden"/>
      </svg>
    </div>
    <p class="habitude__legende"><span class="hb-k hb-k--auj"></span> aujourd’hui${courbe.length ? ` <span class="hb-k hb-k--habit"></span> d’habitude ${typeJour === 'w' ? 'le week-end' : 'en semaine'}` : ''}</p>
    ${phrases.length ? `<p class="habitude__texte">${phrases.join(' ')}</p>` : ''}
    <p class="plan-note">Relevés du Carnet toutes les 5 min (source ThemeParks.wiki)${h.days ? ` · ${h.days} jour${h.days > 1 ? 's' : ''} d’historique` : ''} · survole ou touche la courbe pour le détail.</p>`;
}
const esc2 = escH;

/** Détail au survol (ou au toucher) de la courbe : heure, attente relevée, habitude. */
let survolPose = false;
export function bindHabitude() {
  if (survolPose) return;
  survolPose = true;
  const montrer = (e) => {
    const svg = e.target.closest?.('.habitude__graph');
    if (!svg) return;
    const det = JSON.parse(svg.dataset.det || '[]');
    if (!det.length) return;
    const [debut, fin, W, PL, PR] = svg.dataset.geo.split(',').map(Number);
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const m = debut + ((vx - PL) / (W - PL - PR)) * (fin - debut);
    const d = det.reduce((a, b) => (Math.abs(b[0] - m) < Math.abs(a[0] - m) ? b : a));
    const px = PL + ((d[0] - debut) / (fin - debut)) * (W - PL - PR);
    const cur = svg.querySelector('.hb-curseur');
    cur.setAttribute('x1', px); cur.setAttribute('x2', px); cur.setAttribute('visibility', 'visible');
    const bulle = svg.closest('#fiche-habitude')?.querySelector('.habitude__bulle');
    if (!bulle) return;
    bulle.innerHTML = `<b>${hhmm(d[0])}</b>${d[1] != null ? `<span><i class="hb-k hb-k--auj"></i>Relevé : <strong>${d[1]} min</strong></span>` : ''}${d[2] != null ? `<span><i class="hb-k hb-k--habit"></i>D’habitude : ${d[2]} min</span>` : ''}`;
  };
  document.addEventListener('pointermove', montrer);
  document.addEventListener('pointerdown', montrer);
  document.addEventListener('pointerout', (e) => {
    const svg = e.target.closest?.('.habitude__graph');
    if (!svg || svg.contains(e.relatedTarget)) return;
    if (e.pointerType === 'mouse') svg.querySelector('.hb-curseur')?.setAttribute('visibility', 'hidden');
  });
}

export function habitudeSection(a) {
  if (!a.disney) return '';
  return `<section class="section" aria-labelledby="h-habitude">
      <h3 class="section__title rule" id="h-habitude"><span>Historique du temps d’attente</span></h3>
      <div id="fiche-habitude">${habitudeHTML(a)}</div>
    </section>`;
}
