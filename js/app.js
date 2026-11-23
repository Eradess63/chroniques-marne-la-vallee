/** Point d'entrée : données, filtres, grille, fiche détaillée, galerie, avis. */
import { CONFIG } from './config.js';
import { loadWaitTimes } from './api.js';
import { posterSVG } from './posters.js';
import { loadReviews, addReview } from './reviews.js';
import { estEpingle, estFait, basculeEpingle, basculeFait, bilan, videParcours } from './parcours.js';
import { initPlan, planSection, geo, autourHTML } from './plan.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  parks: [],
  attractions: [],
  art: {},
  live: new Map(),
  mode: 'loading',
  via: '',
  updatedAt: null,
  failures: [],
  age: null,
  filters: { park: 'all', land: 'all', state: 'all', parcours: 'all', q: '' },
  openId: null
};

const STATE_OPTIONS = [
  { id: 'all', label: 'Toutes' },
  { id: 'open', label: 'Ouvertes' },
  { id: 'closed', label: 'Fermées / En rénovation' }
];

const PARCOURS_OPTIONS = [
  { id: 'all', label: 'Toutes' },
  { id: 'epingles', label: 'Mon parcours' },
  { id: 'reste', label: 'Reste à faire' }
];

/* ---------- Utilitaires ---------- */
const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const parkName = (id) => state.parks.find((p) => p.id === id)?.name || id;
const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Statut affiché : réglage local (localStatus) > données ThemeParks.wiki, sinon indisponible */
function statusOf(a) {
  const local = a.localStatus || {};
  const live = state.live.get(a.id);
  if (local.status === 'refurb') return { kind: 'refurb', label: local.until ? `En rénovation jusqu'au ${fmtDate(local.until)}` : 'En rénovation', wait: null };
  if (local.status === 'closed') return { kind: 'closed', label: 'Fermée', wait: null };
  if (!live) return { kind: 'unknown', label: state.mode === 'loading' ? 'Relevé en cours…' : 'Statut indisponible', wait: null };
  const LIB = { open: 'Ouverte', closed: 'Fermée', refurb: 'En rénovation', down: 'Interrompue', unknown: 'Statut indisponible' };
  return { kind: live.kind, label: LIB[live.kind] || LIB.unknown, wait: live.kind === 'open' ? live.wait : null,
           singleRider: live.singleRider, premier: live.premier };
}

function matches(a) {
  const f = state.filters;
  if (f.park !== 'all' && a.park !== f.park) return false;
  if (f.land !== 'all' && a.land !== f.land) return false;
  const kind = statusOf(a).kind;
  if (f.state === 'open' && kind !== 'open') return false;
  if (f.state === 'closed' && kind !== 'closed' && kind !== 'refurb') return false;
  if (f.parcours === 'epingles' && !estEpingle(a.id)) return false;
  if (f.parcours === 'reste' && (!estEpingle(a.id) || estFait(a.id))) return false;
  if (f.q && !fold(a.name).includes(fold(f.q)) && !fold(a.tagline).includes(fold(f.q))) return false;
  return true;
}

/**
 * Le visuel d'une attraction : son illustration quand elle existe, sa planche
 * gravée sinon. Les deux n'ont pas le même format — l'illustration est un
 * paysage, la planche un portrait — donc le cadre centre la seconde sur fond
 * sombre plutôt que de l'étirer.
 */
function visuel(a) {
  const illu = state.art && state.art[a.id];
  return illu
    ? `<div class="illu">${illu}</div>`
    : `<div class="illu illu--planche">${posterSVG(a.motif, 'poster', {
        label: a.land, lines: a.posterLines, tag: a.tagline, paysage: true,
        alt: `Planche gravée de ${a.name}`
      })}</div>`;
}

const poster = (a, variant = 'poster', fade = false) => posterSVG(a.motif, variant, { label: a.land, lines: a.posterLines, tag: a.tagline, fade, alt: `Planche gravée de ${a.name}` });

/* ---------- Filtres ---------- */
function landsForFilter() {
  const parks = state.filters.park === 'all' ? state.parks : state.parks.filter((p) => p.id === state.filters.park);
  return parks.flatMap((p) => p.lands);
}

function chip(group, id, label, pressed, cls = 'chip') {
  return `<button type="button" class="${cls}" data-group="${group}" data-id="${esc(id)}" aria-pressed="${pressed}">${esc(label)}</button>`;
}

function renderFilters() {
  const f = state.filters;
  $('#filter-park').innerHTML = chip('park', 'all', 'Tous', f.park === 'all', 'seg__btn') + state.parks.map((p) => chip('park', p.id, p.name, f.park === p.id, 'seg__btn')).join('');
  const lands = landsForFilter();
  if (f.land !== 'all' && !lands.includes(f.land)) f.land = 'all';
  $('#filter-land').innerHTML = chip('land', 'all', 'Tous', f.land === 'all') + lands.map((l) => chip('land', l, l, f.land === l)).join('');
  $('#filter-state').innerHTML = STATE_OPTIONS.map((o) => chip('state', o.id, o.label, f.state === o.id, 'seg__btn')).join('');
  $('#filter-parcours').innerHTML = PARCOURS_OPTIONS.map((o) => chip('parcours', o.id, o.label, f.parcours === o.id, 'seg__btn')).join('');
  renderBilan();
}

/** Le compteur du carnet, affiché seulement quand il y a quelque chose dedans. */
function renderBilan() {
  const el = $('#parcours-bilan');
  if (!el) return;
  const b = bilan();
  el.hidden = b.epingles === 0;
  if (b.epingles === 0) return;
  // L'accord porte sur toute la locution, pas seulement sur son dernier mot.
  const acc = (v, sing, plur) => `<b>${v}</b> ${v > 1 ? plur : sing}`;
  el.innerHTML = `<span class="bilan__texte">${acc(b.epingles, 'attraction épinglée', 'attractions épinglées')} · ${acc(b.faits, 'faite', 'faites')}</span>
    <button type="button" class="bilan__vider" data-vider-parcours>Vider le carnet</button>`;
}

/* ---------- Grille ---------- */

/** L'épingle, posée sur le visuel. Un seul geste, visible sans ouvrir la fiche. */
function epinglerBtn(a, epingle) {
  return `<button type="button" class="epingle${epingle ? ' epingle--on' : ''}" data-epingler="${esc(a.id)}"
    aria-pressed="${epingle}" title="${epingle ? 'Retirer de mon parcours' : 'Ajouter à mon parcours'}">
    <span class="sr-only">${epingle ? 'Retirer' : 'Ajouter'} ${esc(a.name)} ${epingle ? 'de' : 'à'} mon parcours</span>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>
  </button>`;
}

function faitBtn(a) {
  const fait = estFait(a.id);
  return `<button type="button" class="btn-carnet${fait ? ' btn-carnet--on' : ''}" data-fait="${esc(a.id)}" aria-pressed="${fait}">
    ${fait ? '✓ Déjà faite' : 'Marquer comme faite'}</button>`;
}
function ribbonHTML(st) {
  const files = [];
  if (typeof st.singleRider === 'number') files.push(`<span class="file file--sr">SR<b>${st.singleRider}<small>min</small></b></span>`);
  if (st.premier?.prix) files.push(`<span class="file file--pa">PA<b>${esc(st.premier.prix)}</b></span>`);
  return `<div class="ribbon ribbon--${st.kind}">
    <div class="ribbon__etat"><span class="ribbon__libelle"><i class="lampe" aria-hidden="true"></i>${esc(st.label)}</span>${files.length ? `<div class="ribbon__files">${files.join('')}</div>` : ''}</div>
    ${attenteHTML(st, false)}
  </div>`;
}

let dernieresAttentes = new Map();

function renderGrid() {
  const list = state.attractions.filter(matches);
  $('#count').textContent = `${list.length} attraction${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''} sur ${state.attractions.length}`;
  const avant = dernieresAttentes;
  dernieresAttentes = new Map(list.map((a) => [a.id, statusOf(a).wait]));
  $('#grid').innerHTML = list.length
    ? list.map((a, i) => {
        const st = statusOf(a);
        const epingle = estEpingle(a.id), fait = estFait(a.id);
        return `<article class="card${fait ? ' card--fait' : ''}" style="--i:${i}" data-etat="${st.kind}">
          <div class="card__art${st.kind === 'closed' || st.kind === 'refurb' ? ' card__art--fanee' : ''}" aria-hidden="true">${visuel(a)}</div>
          ${epinglerBtn(a, epingle)}
          ${fait ? '<span class="card__fait" aria-hidden="true">Fait</span>' : ''}
          <div class="card__body">
            <h2 class="card__title"><button type="button" class="card__btn" data-open="${esc(a.id)}">${esc(a.name)}</button></h2>
            <p class="card__park">${esc(parkName(a.park))}</p>
            ${a.stub ? '<span class="card__encours">Fiche en cours</span>' : ''}
          </div>
          ${ribbonHTML(st)}
        </article>`;
      }).join('')
    : '<p class="empty">Aucune attraction ne correspond à ces critères. Modifiez les filtres ou la recherche.</p>';
  signalerChangements(avant);
}

/** Souligne brièvement les durées qui viennent de bouger */
function signalerChangements(avant) {
  if (!avant.size) return;
  document.querySelectorAll('.card').forEach((carte) => {
    const id = carte.querySelector('[data-open]')?.dataset.open;
    const t = carte.querySelector('.ribbon__wait');
    if (!t || !id || !avant.has(id)) return;
    if (avant.get(id) !== dernieresAttentes.get(id)) {
      t.classList.add('vient-de-changer');
      t.addEventListener('animationend', () => t.classList.remove('vient-de-changer'), { once: true });
    }
  });
}

function renderLivebar() {
  const bar = $('#livebar');
  bar.dataset.mode = state.mode;
  const time = state.updatedAt ? state.updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const detail = (state.failures || []).length
    ? ` Routes essayées — ${state.failures.join(' | ')}`
    : '';
  const horodatage = state.age
    ? `relevé ${ageLabel(state.age)}`
    : `à l'instant`;
  const text = {
    loading: `Chargement des temps d'attente…`,
    live: `Temps d'attente ${horodatage} · source : ${state.via || 'ThemeParks.wiki'}`,
    partial: `Temps d'attente pour une partie des attractions seulement · ${horodatage}`,
    unavailable: `Temps d'attente indisponibles.${detail}`
  }[state.mode];
  bar.innerHTML = `<span>${esc(text)}</span><button type="button" id="refresh">Actualiser</button>`;
}

/**
 * Afficheur d'attente. Le chiffre prime : c'est la seule chose qu'on lit
 * vraiment dans une file. L'échelle graduée dessous ne fait que situer ce
 * chiffre — un coup d'œil suffit pour voir si 50 min, ici, c'est beaucoup.
 */
function attenteHTML(st, grand) {
  const w = st.kind === 'open' && typeof st.wait === 'number' ? st.wait : null;

  // Curseur sur une règle de deux heures ; au-delà, il bute en fin de course.
  const pos = w === null ? null : Math.min(w, 120) / 120 * 100;
  let grads = '';
  for (let m = 15; m < 120; m += 15) {
    const x = m / 120 * 100, gros = m % 30 === 0;
    grads += `<line x1="${x}" y1="${gros ? 1 : 2.5}" x2="${x}" y2="6" stroke="var(--laiton)" stroke-width=".8" opacity="${gros ? .8 : .4}"/>`;
  }
  const echelle = pos === null ? '' : `<svg class="attente__regle" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" y1="6" x2="100" y2="6" stroke="var(--cuivre)" stroke-width="1.4"/>
    <line x1="0" y1="6" x2="${pos.toFixed(1)}" y2="6" stroke="currentColor" stroke-width="2.6"/>
    ${grads}
    <polygon class="curseur" points="-4,0 4,0 0,6" transform="translate(${pos.toFixed(1)} 0)" fill="currentColor"/>
  </svg>`;

  const corps = w !== null
    ? `<span class="attente__val">${w}<small>min</small></span>`
    : `<span class="attente__val attente__val--nul">—</span>`;

  return `<div class="attente${grand ? ' attente--grand' : ''} ribbon--${st.kind}">
    ${corps}${echelle}
    ${!grand && w !== null ? `<span class="attente__legende">d'attente</span>` : ''}
  </div>`;
}

/** « il y a 4 minutes », « il y a 2 heures » */
function ageLabel(iso) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "à l'instant";
  if (min === 1) return 'il y a 1 minute';
  if (min < 60) return `il y a ${min} minutes`;
  const h = Math.round(min / 60);
  return h === 1 ? 'il y a 1 heure' : `il y a ${h} heures`;
}

/* ---------- Données en direct ---------- */
async function refreshLive() {
  const btn = $('#refresh');
  if (btn) { btn.disabled = true; btn.textContent = 'Actualisation…'; }
  const res = await loadWaitTimes(state.parks, state.attractions)
    .catch((err) => ({ entries: new Map(), mode: 'unavailable', via: '', age: null, failures: [err.message] }));
  state.live = res.entries;
  state.mode = res.mode;
  state.via = res.via;
  state.failures = res.failures || [];
  state.age = res.age || null;
  state.updatedAt = new Date();
  renderLivebar();
  renderGrid();
  renderAutour();
  if (state.openId) renderFicheStatus();
}

/* ---------- Près de moi ---------- */
let autourTri = 'distance';
function renderAutour() {
  const el = $('#autour'), btn = $('#btn-pres');
  if (btn) btn.setAttribute('aria-pressed', String(geo.actif));
  if (!el) return;
  const html = autourHTML(state.attractions, statusOf, autourTri);
  el.hidden = !html;
  el.innerHTML = html;
}
document.addEventListener('click', (e) => {
  if (e.target.closest('#btn-pres')) { geo.basculer(); return; }
  const tri = e.target.closest('[data-autour-tri]');
  if (tri) { autourTri = tri.dataset.autourTri; renderAutour(); }
});
geo.surChangement(renderAutour);

/* ---------- Fiche détaillée ---------- */
const ICONS = {
  premierAccess: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  singleRider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-5 4-8 8-8s8 3 8 8"/></svg>',
  photoPass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/></svg>',
  pmr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="4" r="2"/><path d="M10 7v7h6l3 6M10 11h6M7 14a5 5 0 1 0 7 6"/></svg>'
};

function serviceBadge(key, label, value) {
  let cls = 'svc svc--unknown', text = `${label} : à confirmer`;
  if (value === true) { cls = 'svc'; text = label; }
  else if (value === false) { cls = 'svc svc--no'; text = label; }
  else if (value === 'transfer') { cls = 'svc svc--partial'; text = 'Accessible PMR avec transfert'; }
  return `<span class="${cls}">${ICONS[key]}${esc(text)}</span>`;
}

function liveBlock(a) {
  const st = statusOf(a);
  const h = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const cadrans = [];
  if (typeof st.singleRider === 'number') {
    cadrans.push(`<div class="file2"><span class="file2__nom">Single Rider</span><span class="file2__val">${st.singleRider}<small> min</small></span>
      <span class="file2__note">File isolée, un siège à la fois</span></div>`);
  } else if (st.kind === 'open') {
    cadrans.push(`<div class="file2 file2--vide"><span class="file2__nom">Single Rider</span><span class="file2__val">—</span>
      <span class="file2__note">Non relevée en ce moment</span></div>`);
  }
  if (st.premier?.prix) {
    cadrans.push(`<div class="file2"><span class="file2__nom">Premier Access</span><span class="file2__val">${esc(st.premier.prix)}</span>
      <span class="file2__note">${st.premier.debut ? `Retour entre ${h(st.premier.debut)} et ${h(st.premier.fin)}` : 'Créneau de retour non communiqué'}</span></div>`);
  } else if (st.kind === 'open') {
    cadrans.push(`<div class="file2 file2--vide"><span class="file2__nom">Premier Access</span><span class="file2__val">—</span>
      <span class="file2__note">Épuisé ou non proposé aujourd'hui</span></div>`);
  }
  return `<div class="live">
    <div class="live__principal">${attenteHTML(st, true)}<div class="live__status ribbon--${st.kind}"><span class="ribbon__libelle"><i class="lampe" aria-hidden="true"></i>${esc(st.label)}</span></div></div>
    ${cadrans.length ? `<div class="live__files">${cadrans.join('')}</div>` : ''}
  </div>`;
}

function renderFicheStatus() {
  const a = state.attractions.find((x) => x.id === state.openId);
  const holder = $('#fiche-live');
  if (a && holder) holder.innerHTML = liveBlock(a);
  const meta = $('#fiche-meta');
  if (meta) {
    meta.textContent = state.mode === 'unavailable'
      ? "Temps d'attente non disponibles."
      : state.mode === 'loading'
        ? ''
        : `ThemeParks.wiki · ${state.age ? `relevé ${ageLabel(state.age)}` : 'en direct'}`;
  }
}

function reviewsHTML(a) {
  const mine = loadReviews(a.id);
  const v = a.visitors;

  // Synthèse rédigée à partir des avis publics en ligne : aucun avis n'est recopié.
  const visiteurs = v ? `
    <div class="chronicle">
      <h3>Ce qu'en disent les visiteurs</h3>
      <p>${esc(v.summary)}</p>
      <div class="pros-cons">
        <div class="pros"><h4>Ce qui revient en bien</h4><ul>${v.praise.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cons"><h4>Ce qui revient en mal</h4><ul>${v.gripes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      ${v.tip ? `<p class="tip"><strong>À retenir</strong> ${esc(v.tip)}</p>` : ''}
      <p class="note">Synthèse des avis publics en ligne, rédigée pour ce site. Aucun avis n'est reproduit.</p>
    </div>` : '';

  const chroniqueur = a.review ? `
    <div class="chronicle">
      <h3>L'avis du chroniqueur</h3>
      <p>${esc(a.review.text)}</p>
      <div class="pros-cons">
        <div class="pros"><h4>Points forts</h4><ul>${a.review.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="cons"><h4>Points faibles</h4><ul>${a.review.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div>` : '';

  return `
    ${visiteurs}
    ${chroniqueur}
    <div class="visitors">
      <h3>Votre commentaire</h3>
      <form class="form" id="review-form" data-id="${esc(a.id)}">
        <div><label for="rv-name">Votre prénom</label><input type="text" id="rv-name" name="name" maxlength="40" required></div>
        <div><label for="rv-text">Votre commentaire</label><textarea id="rv-text" name="text" maxlength="600" required></textarea></div>
        <button type="submit" class="btn">Publier</button>
        <p class="form__msg" id="rv-msg" role="status"></p>
      </form>
      ${mine.length ? `<ul class="review-list">
        ${mine.map((r) => `<li><strong>${esc(r.name)}</strong> <small>${new Date(r.date).toLocaleDateString('fr-FR')}</small><p>${esc(r.text)}</p></li>`).join('')}
      </ul>` : '<p class="note">Aucun commentaire enregistré dans ce navigateur.</p>'}
    </div>`;
}

/** Éléments de la galerie : photos fournies (si présentes) puis planches originales */
function galleryItems(a) {
  const photos = (a.images || []).map((i) => ({ type: 'img', src: i.src, caption: i.caption || a.name, credit: i.credit }));
  const posters = (a.gallery || []).map((g) => ({ type: 'poster', variant: g.variant, caption: g.caption }));
  const illu = state.art && state.art[a.id] ? [{ type: 'illu', caption: 'Illustration' }] : [];
  return [...illu, ...photos, ...posters];
}

function itemHTML(a, it) {
  if (it.type === 'img') return `<img src="${esc(it.src)}" alt="${esc(it.caption)}" data-fallback="1">`;
  if (it.type === 'illu') return `<div class="illu">${state.art[a.id]}</div>`;
  return poster(a, it.variant);
}

function openFiche(id) {
  const a = state.attractions.find((x) => x.id === id);
  if (!a) return;
  state.openId = id;
  const f = a.fiche;
  const dlg = $('#fiche');
  const items = galleryItems(a);
  dlg.innerHTML = `
    <div class="fiche__bar">
      <button type="button" class="fiche__back" data-close>
        <span aria-hidden="true">←</span> Toutes les attractions
      </button>
      <span class="fiche__bar-nom">${esc(a.name)}</span>
    </div>
    <div class="fiche__head">
      <div class="fiche__art${['closed', 'refurb'].includes(statusOf(a).kind) ? ' card__art--fanee' : ''}" role="img" aria-label="Illustration de ${esc(a.name)}">${visuel(a)}</div>
      <div>
        <p class="fiche__kicker"><span class="tag tag--land">${esc(a.land)}</span><span class="tag tag--park">${esc(parkName(a.park))}</span></p>
        <h2 class="fiche__title" id="fiche-title">${esc(a.name)}</h2>
        <p class="fiche__tagline">${esc(a.tagline)}</p>
        <div id="fiche-live">${liveBlock(a)}</div>
        <div class="carnet">${epinglerBtn(a, estEpingle(a.id))
          .replace('class="epingle', 'class="epingle epingle--plat')}${faitBtn(a)}</div>
        <p class="live__meta" id="fiche-meta"></p>
      </div>
    </div>

    <section class="section" aria-labelledby="h-tech">
      <h3 class="section__title rule" id="h-tech"><span>Fiche technique</span></h3>
      <div class="ticket">
       <div class="ticket__main">
        <div class="ticket__head"><span>Programme de l'attraction</span><b>E-Ticket</b></div>
        <dl class="ticket__rows">
          <div class="ticket__row"><dt>Date d'ouverture</dt><dd>${esc(f.opening.label)}</dd></div>
          <div class="ticket__row"><dt>Constructeur</dt><dd>${esc(f.builder)}</dd></div>
          <div class="ticket__row"><dt>Type d'attraction</dt><dd>${esc(f.type)}</dd></div>
          <div class="ticket__row"><dt>Système de transport</dt><dd>${esc(f.transport)}</dd></div>
          <div class="ticket__row"><dt>Durée du tour</dt><dd>${esc(f.duration)}</dd></div>
          <div class="ticket__row"><dt>Taille minimale</dt><dd>${esc(f.minHeight.label)}</dd></div>
          <div class="ticket__row ticket__row--wide"><dt>Capacité</dt><dd>${esc(f.capacity)}</dd></div>
          ${Object.entries(f.extra || {}).map(([k, val]) =>
            `<div class="ticket__row"><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('')}
          <div class="ticket__row ticket__row--wide"><dt>Services</dt><dd><div class="services">
            ${serviceBadge('premierAccess', 'Disney Premier Access', f.services.premierAccess)}
            ${serviceBadge('singleRider', 'Single Rider', f.services.singleRider)}
            ${serviceBadge('photoPass', 'PhotoPass', f.services.photoPass)}
            ${serviceBadge('pmr', 'Accessibilité PMR', f.services.pmr)}
          </div></dd></div>
        </dl>
        <p class="ticket__foot">Les mentions « à confirmer » sont à vérifier sur le site officiel avant votre visite.</p>
       </div>
       <aside class="ticket__stub" aria-hidden="true"><span class="stub__admit">Admit one</span><span class="stub__letter"><span>E</span></span><span class="stub__no">N° ${String(state.attractions.indexOf(a) + 1).padStart(4, '0')}</span></aside>
      </div>
    </section>

    ${planSection(a)}

    ${a.history || a.synopsis ? `<section class="section" aria-labelledby="h-story">
      <h3 class="section__title rule" id="h-story"><span>L'histoire et le synopsis</span></h3>
      <div class="prose">${a.history ? `<p>${esc(a.history)}</p>` : ''}${a.synopsis ? `<p>${esc(a.synopsis)}</p>` : ''}</div>
    </section>` : `<section class="section"><p class="empty">Fiche en cours de rédaction : l'histoire, le synopsis et les anecdotes seront ajoutés.</p></section>`}

    ${a.secrets && a.secrets.length ? `<section class="section" aria-labelledby="h-secrets">
      <h3 class="section__title rule" id="h-secrets"><span>Les secrets des Imagineers</span></h3>
      <div class="parchment"><ol>${a.secrets.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
    </section>` : ''}

    ${items.length ? `<section class="section" aria-labelledby="h-gal">
      <h3 class="section__title rule" id="h-gal"><span>Galerie</span></h3>
      <div class="gallery">
        ${items.map((it, i) => `<button type="button" class="thumb" data-lightbox="${i}"><div class="thumb__art">${itemHTML(a, it)}</div><span class="cap">${esc(it.caption)}</span></button>`).join('')}
      </div>
    </section>` : ''}

    <section class="section" aria-labelledby="h-rev">
      <h3 class="section__title rule" id="h-rev"><span>Avis et notation</span></h3>
      <div class="reviews" id="reviews">${reviewsHTML(a)}</div>
    </section>

    ${(a.sources || []).length ? `<div class="sources"><strong>Sources</strong><ul>${(a.sources || []).map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`).join('')}</ul></div>` : ''}`;

  fixBrokenImages(dlg, a);
  renderFicheStatus();
  montrerVue('fiche');
  try { if (location.hash !== '#' + id) location.hash = id; } catch {}
}

/**
 * Place la page sans animation. `scrollTo` passerait par le défilement doux
 * déclaré sur html, qu'une bascule de vue interrompt à mi-course — on écrit
 * donc la position directement.
 */
function positionner(y) {
  document.documentElement.scrollTop = y;
  document.body.scrollTop = y;
}

/* Position dans la liste, pour y revenir là où on l'avait quittée. */
let defilementListe = 0;

/**
 * Bascule entre la liste et la fiche. Ce n'est pas une fenêtre qui s'ouvre :
 * la fiche prend toute la page, le bouton Retour du téléphone la referme, et
 * la liste se retrouve à l'endroit exact où on l'avait laissée.
 */
function montrerVue(vue) {
  const liste = $('#vue-liste'), fiche = $('#fiche');
  if (vue === 'fiche' && fiche.hidden) defilementListe = window.scrollY;

  const versFiche = vue === 'fiche';
  const cible = versFiche ? 0 : defilementListe;
  const bascule = () => {
    liste.hidden = versFiche;
    fiche.hidden = !versFiche;
    document.body.classList.toggle('vue-fiche', versFiche);
    positionner(cible);
  };

  // Transition native là où le navigateur la propose, bascule nette ailleurs.
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const t = document.startViewTransition(bascule);
    // Le navigateur repositionne parfois la page après la bascule : on repasse
    // derrière lui une fois la transition jouée.
    t.updateCallbackDone.then(() => positionner(cible)).catch(() => {});
  } else {
    bascule();
  }
}

/** Si une photo ne charge pas, on la remplace par l'affiche originale */
function fixBrokenImages(root, a) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => { img.replaceWith(Object.assign(document.createElement('div'), { innerHTML: poster(a) }).firstElementChild); }, { once: true });
  });
}

function closeFiche() {
  if ($('#fiche').hidden) return;
  state.openId = null;
  montrerVue('liste');
}

/** Fermer, c'est revenir en arrière : le bouton Retour et la croix font un. */
function quitterFiche() {
  if (location.hash) history.back();
  else closeFiche();
}

/* ---------- Lightbox ---------- */
let lb = { id: null, i: 0 };
function showLightbox(id, index) {
  const a = state.attractions.find((x) => x.id === id);
  const items = galleryItems(a);
  lb = { id, i: (index + items.length) % items.length };
  const it = items[lb.i];
  const box = $('#lightbox');
  box.innerHTML = `
    <div class="lightbox__top"><strong>${esc(a.name)} · ${lb.i + 1}/${items.length}</strong><button type="button" class="fiche__close" style="float:none;position:static;margin:0" data-lb-close>Fermer ✕</button></div>
    <div class="lightbox__stage">
      <button type="button" class="lightbox__btn" data-lb="-1" aria-label="Image précédente">‹</button>
      <div class="lightbox__img">${itemHTML(a, it)}</div>
      <button type="button" class="lightbox__btn" data-lb="1" aria-label="Image suivante">›</button>
    </div>
    <p class="lightbox__cap">${esc(it.caption)}${it.credit ? ` · ${esc(it.credit)}` : ''}</p>`;
  fixBrokenImages(box, a);
  if (!box.open) box.showModal();
}

/** La fiche ouverte doit refléter le carnet sans être reconstruite entièrement. */
function rafraichirCarnetFiche() {
  const a = state.attractions.find((x) => x.id === state.openId);
  const zone = $('#fiche .carnet');
  if (!a || !zone) return;
  zone.innerHTML = epinglerBtn(a, estEpingle(a.id)).replace('class="epingle', 'class="epingle epingle--plat') + faitBtn(a);
}

/* ---------- Événements ---------- */
function bindEvents() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    const chipEl = t.closest('[data-group]');
    if (chipEl) {
      state.filters[chipEl.dataset.group] = chipEl.dataset.id;
      renderFilters();
      renderGrid();
      return;
    }
    const ep = t.closest('[data-epingler]');
    if (ep) { basculeEpingle(ep.dataset.epingler); renderFilters(); renderGrid(); if (state.openId) rafraichirCarnetFiche(); return; }
    const fa = t.closest('[data-fait]');
    if (fa) { basculeFait(fa.dataset.fait); renderFilters(); renderGrid(); rafraichirCarnetFiche(); return; }
    if (t.closest('[data-vider-parcours]')) { videParcours(); renderFilters(); renderGrid(); return; }
    const card = t.closest('[data-open]');
    if (card) return openFiche(card.dataset.open);
    if (t.closest('#refresh')) return refreshLive();
    if (t.closest('[data-close]')) return quitterFiche();
    const th = t.closest('[data-lightbox]');
    if (th) return showLightbox(state.openId, Number(th.dataset.lightbox));
    if (t.closest('[data-lb-close]')) return $('#lightbox').close();
    const nav = t.closest('[data-lb]');
    if (nav) return showLightbox(lb.id, lb.i + Number(nav.dataset.lb));
    // clic sur le fond d'une boîte de dialogue
    if (t.tagName === 'DIALOG') t.close();
  });

  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').open) {
      if (e.key === 'ArrowRight') showLightbox(lb.id, lb.i + 1);
      if (e.key === 'ArrowLeft') showLightbox(lb.id, lb.i - 1);
      return;
    }
    // La fiche n'étant plus une fenêtre, Échap ne la ferme plus tout seul.
    if (e.key === 'Escape' && !$('#fiche').hidden) quitterFiche();
  });

  $('#search').addEventListener('input', (e) => {
    state.filters.q = e.target.value.trim();
    renderGrid();
  });

  $('#fiche').addEventListener('close', () => {
    state.openId = null;
    try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch { try { location.hash = ''; } catch {} }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('#review-form');
    if (!form) return;
    e.preventDefault();
    const data = new FormData(form);
    const review = { name: String(data.get('name')).trim(), text: String(data.get('text')).trim(), date: new Date().toISOString() };
    if (!review.name || !review.text) return;
    const saved = addReview(form.dataset.id, review);
    const a = state.attractions.find((x) => x.id === form.dataset.id);
    $('#reviews').innerHTML = reviewsHTML(a);
    const msg = $('#rv-msg');
    msg.textContent = saved ? 'Merci, votre avis est enregistré dans ce navigateur.' : 'Avis affiché, mais le stockage local est indisponible : il sera perdu à la fermeture.';
    if (!saved) msg.classList.add('form__msg--err');
  });

  window.addEventListener('hashchange', routeFromHash);
}

function routeFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && state.attractions.some((a) => a.id === id)) { if (state.openId !== id) openFiche(id); }
  else if (!id) closeFiche();
}

/* ---------- Démarrage ---------- */
async function init() {
  try {
    // données intégrées à la page si présentes, sinon fichier JSON
    const inline = document.getElementById('app-data');
    let data;
    if (inline) data = JSON.parse(inline.textContent);
    else {
      const res = await fetch(CONFIG.DATA_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    }
    state.parks = data.parks;
    state.attractions = data.attractions;
    initPlan(state.attractions);

    // Illustrations : intégrées à la page par la construction. Celles qui
    // manquent ne cassent rien — l'attraction garde sa planche gravée.
    const art = document.getElementById('app-art');
    if (art) { try { state.art = JSON.parse(art.textContent); } catch { state.art = {}; } }
    else {
      const res = await fetch('illustrations/index.json', { cache: 'no-cache' }).catch(() => null);
      state.art = res && res.ok ? await res.json() : {};
    }
  } catch (err) {
    $('#grid').innerHTML = `<p class="empty">Impossible de charger les attractions (${esc(err.message)}). Servez le site via un serveur web local plutôt qu'en ouvrant le fichier directement.</p>`;
    return;
  }
  // Sans cela le navigateur restaure lui-même une position qui n'est plus la
  // bonne, puisque la liste et la fiche partagent la même page.
  try { history.scrollRestoration = 'manual'; } catch {}

  renderFilters();
  bindEvents();
  // rendu immédiat (statuts « Chargement… »), puis mise à jour en direct sans bloquer l'affichage
  renderLivebar();
  renderGrid();
  routeFromHash();
  refreshLive();
  setInterval(refreshLive, CONFIG.REFRESH_MS);
}

init();
