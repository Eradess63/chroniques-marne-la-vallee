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
/**
 * Tracé adouci qui passe par chaque relevé sans dépasser (spline cubique
 * monotone, Fritsch-Carlson) : pas de bosse inventée entre deux relevés.
 */
function courbeDouce(pts) {
  const n = pts.length;
  if (n < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const dx = [], pente = [], tg = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; pente[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
  tg[0] = pente[0]; tg[n - 1] = pente[n - 2];
  for (let i = 1; i < n - 1; i++) tg[i] = pente[i - 1] * pente[i] <= 0 ? 0 : (pente[i - 1] + pente[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (pente[i] === 0) { tg[i] = tg[i + 1] = 0; continue; }
    const a = tg[i] / pente[i], b = tg[i + 1] / pente[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); tg[i] = k * a * pente[i]; tg[i + 1] = k * b * pente[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], t = dx[i] / 3;
    d += `C${(x0 + t).toFixed(1)},${(y0 + tg[i] * t).toFixed(1)} ${(x1 - t).toFixed(1)},${(y1 - tg[i + 1] * t).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(Math.round(m % 60)).padStart(2, '0')}`;
export function habitudeHTML(a) {
  const h = window.waitHistory;
  if (!a.disney || !h) return '';
  if (!h.ready) return '<p class="habitude__vide">Chargement de l’historique…</p>';
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  const typeJour = [0, 6].includes(now.getDay()) ? 'w' : 'j';
  const courbe = h.curve(a.disney, typeJour), jour = h.today(a.disney);
  // File Single Rider, relevée à part (« identifiant:SR ») quand Disney l'affiche.
  const srJour = h.today(a.disney + ':SR'), srCourbe = h.curve(a.disney + ':SR', typeJour), srT = h.typical(a.disney + ':SR');
  const avecSR = srJour.length > 0 || srCourbe.length > 1;
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const t = h.typical(a.disney);
  if (!courbe.length && !jour.length) {
    return `<p class="habitude__date">${esc2(date)}</p><p class="habitude__vide">Pas encore de relevé pour cette attraction aujourd’hui. Le Carnet note les attentes toutes les 5 minutes pendant l’ouverture : la courbe se dessine au fil de la journée.</p>`;
  }
  // Fenêtre : de l'ouverture (ou du premier relevé) à la fin des données.
  // Sans habitude connue, la fenêtre suit les relevés du jour (au moins 2 h).
  const debut = courbe.length ? Math.min(courbe[0].slot * 30, jour[0]?.[0] ?? 24 * 60) : Math.max(8 * 60, Math.floor(((jour[0]?.[0] ?? 9 * 60) - 30) / 30) * 30);
  // Ma journée s'arrête à mon départ (TGV de 18h13 : je quitte le parc à 17h43).
  const DEPART = 17 * 60 + 43;
  const fin = Math.max(Math.min(18 * 60, Math.max(jour.length ? jour[jour.length - 1][0] + 15 : 0, courbe.length ? courbe[courbe.length - 1].slot * 30 + 30 : 0)), debut + 120);
  const W = 360, H = 190, PL = 24, PR = 6, PT = 10, PB = 20;
  const max = Math.ceil(Math.max(30, ...courbe.map((c) => c.wait), ...jour.map((j) => j[1]), ...srJour.map((j) => j[1])) / 20) * 20;
  const x = (m) => PL + ((m - debut) / (fin - debut)) * (W - PL - PR);
  const y = (w) => PT + (H - PT - PB) * (1 - w / max);
  const grille = [];
  for (let w = 0; w <= max; w += 20) grille.push(`<line x1="${PL}" x2="${W - PR}" y1="${y(w)}" y2="${y(w)}" class="hb-g"/><text x="${PL - 5}" y="${y(w) + 3}" class="hb-gl">${w}</text>`);
  const pas = fin - debut > 420 ? 120 : 60;
  for (let m = Math.ceil(debut / pas) * pas; m <= fin; m += pas) grille.push(`<text x="${x(m)}" y="${H - 6}" class="hb-h">${String(m / 60).padStart(2, '0')}h</text>`);
  // Courbe lissée : chaque point est une moyenne pondérée (noyau gaussien,
  // ~10 min) des relevés voisins, recalculée toutes les 3 minutes. Les paliers
  // de 5 en 5 min d'attente affichés par Disney deviennent une vraie courbe.
  const lisser = (rel) => {
    const out = [];
    if (rel.length <= 2) return out;
    const m0 = rel[0][0], m1 = rel[rel.length - 1][0];
    for (let m = m0; m <= m1 + 0.1; m += 3) {
      // Lissage plus serré près des bords : la courbe finit bien sur le dernier relevé.
      const sig = Math.min(10, 1.5 + Math.min(m - m0, m1 - m) * 0.8), s2 = 2 * sig * sig;
      let sw = 0, sv = 0;
      for (const [mj, wj] of rel) { const k = Math.exp(-((mj - m) ** 2) / s2); sw += k; sv += k * wj; }
      out.push([m, sv / sw]);
    }
    return out;
  };
  const lisse = lisser(jour);
  const pts = (lisse.length ? lisse : jour).map(([m, w]) => [x(m), y(w)]);
  const ligne = courbeDouce(pts);
  const aire = pts.length > 1 ? `<path class="hb-aire" mask="url(#hb-fondu)" d="${ligne}L${pts[pts.length - 1][0].toFixed(1)},${y(0)}L${pts[0][0].toFixed(1)},${y(0)}Z"/>` : '';
  // Le dégradé s'efface doucement sur le bord gauche, au lieu d'un mur.
  const x0 = pts[0]?.[0] ?? 0, x1 = pts[pts.length - 1]?.[0] ?? W;
  const fondu = `<linearGradient id="hb-fondu-g" gradientUnits="userSpaceOnUse" x1="${x0.toFixed(1)}" x2="${x1.toFixed(1)}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${Math.min(0.5, 24 / Math.max(1, x1 - x0)).toFixed(3)}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="hb-fondu"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#hb-fondu-g)"/></mask>`;
  // Single Rider : la journée en bleu, ou l'habitude en pointillés bleus s'il n'y a pas encore de relevé.
  const srPts = (lisser(srJour).length ? lisser(srJour) : srJour).map(([m, w]) => [x(m), y(w)]);
  const srTrace = srPts.length > 1 ? `<path class="hb-sr" d="${courbeDouce(srPts)}"/>` : srCourbe.length > 1 ? `<path class="hb-sr hb-sr--habit" d="${courbeDouce(srCourbe.map((c) => [x(c.slot * 30 + 15), y(c.wait)]))}"/>` : '';
  const habit = courbe.length > 1 ? `<path class="hb-habit" d="${courbeDouce(courbe.map((c) => [x(c.slot * 30 + 15), y(c.wait)]))}"/>` : '';
  const maint = nowMin >= debut && nowMin <= fin ? `<line class="hb-now" x1="${x(nowMin)}" x2="${x(nowMin)}" y1="${PT}" y2="${y(0)}"/>` : '';
  // Données du détail au survol : [minute, réel, habitude] tous les quarts d'heure.
  const det = [];
  for (let m = Math.ceil(debut / 15) * 15; m <= fin; m += 15) {
    const r = jour.reduce((best, j) => (Math.abs(j[0] - m) <= 8 && (!best || Math.abs(j[0] - m) < Math.abs(best[0] - m)) ? j : best), null);
    const c = courbe.find((k) => k.slot === Math.floor(m / 30));
    if (r || c) det.push([m, r ? r[1] : null, c ? c.wait : null]);
  }
  const maJournee = courbe.filter((c) => c.slot * 30 + 30 <= DEPART + 15);
  const plusCalme = (l) => (l.length ? l.reduce((m, c) => (c.wait < m.wait ? c : m)) : null);
  const calme = plusCalme(maJournee), apres = plusCalme(maJournee.filter((c) => c.slot * 30 + 30 > nowMin));
  const repere = calme ? `<circle class="hb-best" cx="${x(calme.slot * 30 + 15).toFixed(1)}" cy="${y(calme.wait).toFixed(1)}" r="8"/><text class="hb-bestl" x="${x(calme.slot * 30 + 15).toFixed(1)}" y="${(y(calme.wait) - 12).toFixed(1)}">le + calme</text>` : '';
  const ligneDepart = DEPART > debut && DEPART < fin ? `<line class="hb-dep" x1="${x(DEPART)}" x2="${x(DEPART)}" y1="${PT}" y2="${y(0)}"/><text class="hb-depl" x="${x(DEPART) - 3}" y="${PT + 9}">🚄</text>` : '';
  const phrases = [];
  if (jour.length) phrases.push(`Maintenant : <b>${jour[jour.length - 1][1]} min</b> (relevé de ${hhmm(jour[jour.length - 1][0])}).`);
  if (t) phrases.push(`D’habitude à cette heure : ~${t.wait} min.`);
  const phraseSR = avecSR ? `👤 Single Rider : ${srJour.length ? `<b>${srJour[srJour.length - 1][1]} min</b> maintenant` : 'pas encore de relevé aujourd’hui'}${srT ? `, ~${srT.wait} min d’habitude à cette heure` : ''}.` : '';
  // Le conseil, en une phrase et en tête : quand y aller.
  const actuel = jour.length ? jour[jour.length - 1][1] : t?.wait;
  let conseil = '';
  if (apres) {
    const maintenant = apres.slot === Math.floor(nowMin / 30);
    conseil = maintenant || (typeof actuel === 'number' && actuel <= apres.wait + 3)
      ? `🎯 <b>C’est le bon moment</b> : ${typeof actuel === 'number' ? `~${actuel} min` : `~${apres.wait} min`}, le plus calme d’ici ton départ (17h43).`
      : `🎯 Vise <b>${h.slotLabel(apres.slot)}</b> : ~${apres.wait} min d’habitude${typeof actuel === 'number' ? `, contre ${actuel} min maintenant` : ''}.`;
  } else if (calme) conseil = `🎯 En général, le plus calme : <b>${h.slotLabel(calme.slot)}</b> (~${calme.wait} min).`;
  return `<p class="habitude__date">${esc2(date)}</p>
    ${conseil ? `<p class="habitude__conseil">${conseil}</p>` : ''}
    <p class="habitude__bulle" aria-live="polite">${jour.length ? `<b>${hhmm(jour[jour.length - 1][0])}</b><span><i class="hb-k hb-k--auj"></i>Relevé : <strong>${jour[jour.length - 1][1]} min</strong></span>${t ? `<span><i class="hb-k hb-k--habit"></i>D’habitude : ${t.wait} min</span>` : ''}${srJour.length ? `<span><i class="hb-k hb-k--sr"></i>Single Rider : ${srJour[srJour.length - 1][1]} min</span>` : ''}` : '<span>Touche la courbe pour le détail</span>'}</p>
    <div class="habitude__cadre">
      <svg class="habitude__graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="Attente relevée aujourd’hui, heure par heure" data-det="${esc2(JSON.stringify(det))}" data-geo="${[debut, fin, W, PL, PR].join(',')}">
        <defs><linearGradient id="hb-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--laiton)" stop-opacity=".38"/><stop offset=".7" stop-color="var(--laiton)" stop-opacity=".08"/><stop offset="1" stop-color="var(--laiton)" stop-opacity="0"/></linearGradient>${fondu}</defs>
        ${grille.join('')}${ligneDepart}${maint}${aire}${habit}${srTrace}${repere}${pts.length ? `<path class="hb-ligne" d="${ligne}"/><circle class="hb-dernier" cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="3.6"/>` : ''}
        <line class="hb-curseur" x1="0" x2="0" y1="${PT}" y2="${y(0)}" visibility="hidden"/>
      </svg>
    </div>
    <p class="habitude__legende"><span class="hb-k hb-k--auj"></span> aujourd’hui${courbe.length ? ` <span class="hb-k hb-k--habit"></span> d’habitude ${typeJour === 'w' ? 'le week-end' : 'en semaine'}` : ''}${avecSR ? ' <span style="white-space:nowrap"><span class="hb-k hb-k--sr"></span> Single Rider</span>' : ''}</p>
    ${phrases.length ? `<p class="habitude__texte">${phrases.join(' ')}</p>` : ''}
    ${phraseSR ? `<p class="habitude__texte">${phraseSR}</p>` : ''}
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
