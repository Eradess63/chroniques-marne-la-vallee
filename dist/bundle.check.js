(function(){
/**
 * Configuration centrale.
 * Modifiez WORKER_URL après avoir déployé worker/queue-times-proxy.js.
 */
const CONFIG = {
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

/**
 * Temps d'attente Queue-Times, sans données simulées.
 * Ordre d'essai : Worker personnalisé, appel direct, puis proxies publics.
 * Une attraction sans donnée reste « indisponible » : rien n'est inventé.
 */

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function fetchJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), CONFIG.TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPark(queueTimesId) {
  const target = CONFIG.QUEUE_TIMES_URL(queueTimesId);
  const routes = [];
  if (CONFIG.WORKER_URL) routes.push(['worker', `${CONFIG.WORKER_URL}?park=${queueTimesId}`]);
  routes.push(['direct', target]);
  CONFIG.PUBLIC_PROXIES.forEach((make, i) => routes.push(['proxy ' + (i + 1), make(target)]));

  let lastError = new Error('Aucune route disponible');
  for (const [via, url] of routes) {
    try {
      const json = await fetchJson(url);
      if (!json || (!json.lands && !json.rides)) throw new Error('Format inattendu');
      return { json, via };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function flattenRides(json) {
  const out = [];
  (json.lands || []).forEach((land) => (land.rides || []).forEach((r) => out.push(r)));
  (json.rides || []).forEach((r) => out.push(r));
  return out;
}

function findRide(rides, aliases) {
  const wanted = aliases.map(norm);
  const named = rides.map((r) => ({ r, n: norm(r.name) }));
  return (
    named.find((x) => wanted.includes(x.n))?.r ||
    named.find((x) => wanted.some((w) => x.n.includes(w) || w.includes(x.n)))?.r ||
    null
  );
}

/**
 * Retourne { entries: Map(id → état), mode: 'live' | 'partial' | 'unavailable', via }
 * Une entrée n'existe que si Queue-Times a répondu pour cette attraction.
 */
async function loadWaitTimes(parks, attractions) {
  const entries = new Map();
  let livePark = 0;
  let via = '';

  const results = CONFIG.LIVE_ENABLED === false ? [] : await Promise.allSettled(parks.map((p) => fetchPark(p.queueTimesId)));
  results.forEach((res, i) => {
    if (res.status !== 'fulfilled') return;
    livePark++;
    via = res.value.via;
    const rides = flattenRides(res.value.json);
    attractions
      .filter((a) => a.park === parks[i].id)
      .forEach((a) => {
        const ride = findRide(rides, a.queueTimes?.aliases || [a.name]);
        if (ride) {
          entries.set(a.id, {
            open: !!ride.is_open,
            wait: ride.is_open ? Number(ride.wait_time) || 0 : null,
            updated: ride.last_updated || null,
            refurbUntil: null,
            source: 'live'
          });
        }
      });
  });

  const mode = livePark === 0 ? 'unavailable' : livePark < parks.length ? 'partial' : 'live';
  return { entries, mode, via };
}

/**
 * Affiches Art déco originales, dessinées en SVG.
 * Aucun personnage, logo ni visuel protégé : géométrie, filets dorés, symétrie stricte.
 * posterSVG(motif, variant, { label, lines, alt }) → chaîne SVG (viewBox 300 × 420)
 */

/* Fonds par motif : chaque attraction garde sa teinte, dans un vocabulaire commun. */
const GROUND = {
  mesa:    { a: '#2A1A22', b: '#5A2A28', accent: '#C4552F' },
  manor:   { a: '#101D2B', b: '#27384E', accent: '#7E6CA8' },
  rocket:  { a: '#0A1E2E', b: '#15455E', accent: '#3E97B5' },
  tower:   { a: '#1A1A24', b: '#3B3547', accent: '#9B7BA6' },
  kitchen: { a: '#2B1D14', b: '#5C3A1F', accent: '#D08A33' },
  frost:   { a: '#0D2430', b: '#1E5464', accent: '#6FB7C4' }
};

/* Variantes : la planche change de registre, pas de style. */
const VARIANT = {
  poster:    { gold: '#E3C77E', rule: '#C9A227', ink: '#F3ECDC', rays: .16, grid: 0 },
  night:     { gold: '#F0DFA8', rule: '#D4AF37', ink: '#F7F1E2', rays: .05, grid: 0, dim: .55 },
  blueprint: { gold: '#BFD9E4', rule: '#9FC3D2', ink: '#E8F2F6', rays: 0, grid: .18, mono: '#0C2A38' },
  ticket:    { gold: '#E3C77E', rule: '#C9A227', ink: '#F3ECDC', rays: .1, grid: 0, stub: true }
};

const escSvg = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Losange, terminaison classique des filets Art déco */
const diamond = (x, y, r, fill) => `<path d="M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z" fill="${fill}"/>`;

/** Éventail de rayons centré, motif déco par excellence */
function fan(cx, cy, r, count, fill, opacity) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a1 = -Math.PI + (i * Math.PI) / count;
    const a2 = a1 + Math.PI / (count * 2.1);
    out += `<path d="M${cx} ${cy}L${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}L${(cx + Math.cos(a2) * r).toFixed(1)} ${(cy + Math.sin(a2) * r).toFixed(1)}Z" fill="${fill}" opacity="${opacity}"/>`;
  }
  return out;
}

/** Gradins symétriques (ziggourat), vocabulaire déco de base */
function steps(cx, baseY, width, height, tiers, fill) {
  let d = `M${cx - width / 2} ${baseY}`;
  for (let i = 0; i < tiers; i++) {
    const w = width / 2 - (i * width) / (2 * tiers);
    const y = baseY - ((i + 1) * height) / tiers;
    d += `L${cx - w} ${y + height / tiers}L${cx - w + width / (2.6 * tiers)} ${y + height / tiers}`;
  }
  d += `L${cx} ${baseY - height}`;
  for (let i = tiers - 1; i >= 0; i--) {
    const w = width / 2 - (i * width) / (2 * tiers);
    const y = baseY - ((i + 1) * height) / tiers;
    d += `L${cx + w - width / (2.6 * tiers)} ${y + height / tiers}L${cx + w} ${y + height / tiers}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
}

/* ---------- Motifs, repère 300 × 240, centrés sur x = 150 ---------- */
const MOTIFS = {
  /** Frontierland : mesa en gradins, soleil en éventail, rails en chevrons */
  mesa: (g, v) => `
    <circle cx="150" cy="86" r="44" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="86" r="30" fill="${g.accent}"/>
    ${fan(150, 86, 72, 14, v.gold, .5)}
    ${steps(150, 206, 190, 96, 4, g.accent)}
    ${steps(150, 206, 104, 58, 3, v.gold)}
    <rect x="30" y="206" width="240" height="3" fill="${v.gold}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${54 + i * 34} 222 L${68 + i * 34} 214 L${82 + i * 34} 222" fill="none" stroke="${v.gold}" stroke-width="2.5" stroke-linejoin="miter"/>`).join('')}`,

  /** Frontierland : manoir symétrique à toit en gradins, lune en disque */
  manor: (g, v) => `
    <circle cx="150" cy="74" r="38" fill="${v.gold}" opacity=".9"/>
    <circle cx="150" cy="74" r="38" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <path d="M150 36 A38 38 0 0 0 150 112 Z" fill="${g.b}"/>
    ${steps(150, 224, 150, 110, 4, g.accent)}
    <rect x="112" y="166" width="76" height="58" fill="${g.a}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M150 224 L150 184 A12 12 0 0 1 150 184 Z" fill="none"/>
    <path d="M138 224 L138 192 A12 12 0 0 1 162 192 L162 224Z" fill="${v.gold}"/>
    ${[124, 170].map((x) => `<rect x="${x}" y="176" width="14" height="20" fill="${v.gold}"/>`).join('')}
    <rect x="30" y="224" width="240" height="3" fill="${v.gold}"/>
    ${[52, 70, 88, 212, 230, 248].map((x) => `<path d="M${x} 224 L${x} 208" stroke="${v.gold}" stroke-width="2"/>`).join('')}`,

  /** Discoveryland : cercles concentriques, fusée en chevrons, rayons */
  rocket: (g, v) => `
    ${fan(150, 120, 130, 18, v.gold, .32)}
    <circle cx="150" cy="120" r="74" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="120" r="58" fill="none" stroke="${v.gold}" stroke-width="1"/>
    <ellipse cx="150" cy="120" rx="96" ry="26" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M150 48 L172 120 L150 164 L128 120 Z" fill="${g.accent}"/>
    <path d="M150 48 L172 120 L150 164 L128 120 Z" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <path d="M150 72 L160 120 L150 142 L140 120 Z" fill="${v.gold}"/>
    <path d="M128 132 L112 170 L140 154 Z M172 132 L188 170 L160 154 Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/>
    <path d="M150 170 L142 212 L150 226 L158 212 Z" fill="${v.gold}" opacity=".75"/>
    ${diamond(60, 56, 6, v.gold)}${diamond(240, 56, 6, v.gold)}${diamond(44, 180, 5, v.gold)}${diamond(256, 180, 5, v.gold)}`,

  /** World Premiere Plaza : gratte-ciel en gradins, éclair en zigzag */
  tower: (g, v) => {
    const win = (y, cols, w) => {
      let s = '';
      const total = cols * (w + 7) - 7;
      for (let i = 0; i < cols; i++) s += `<rect x="${150 - total / 2 + i * (w + 7)}" y="${y}" width="${w}" height="13" fill="${v.gold}"/>`;
      return s;
    };
    return `
    ${fan(150, 232, 150, 12, v.gold, .22)}
    <rect x="92" y="170" width="116" height="60" fill="${g.accent}"/>
    <rect x="108" y="124" width="84" height="46" fill="${g.accent}"/>
    <rect x="122" y="82" width="56" height="42" fill="${g.accent}"/>
    <rect x="136" y="54" width="28" height="28" fill="${g.accent}"/>
    <path d="M150 20 L158 54 L142 54 Z" fill="${v.gold}"/>
    ${win(182, 6, 11)}${win(136, 5, 11)}${win(94, 4, 11)}${win(62, 2, 9)}
    <rect x="92" y="170" width="116" height="60" fill="none" stroke="${v.gold}" stroke-width="1.5"/>
    <rect x="108" y="124" width="84" height="46" fill="none" stroke="${v.gold}" stroke-width="1.5"/>
    <rect x="122" y="82" width="56" height="42" fill="none" stroke="${v.gold}" stroke-width="1.5"/>
    <path d="M238 46 L210 110 L228 110 L206 166 L252 98 L232 98 L252 46 Z" fill="${v.gold}"/>
    <rect x="30" y="230" width="240" height="3" fill="${v.gold}"/>`;
  },

  /** Worlds of Pixar : toque en arcs empilés, éventail de vapeur */
  kitchen: (g, v) => `
    ${fan(150, 118, 118, 16, v.gold, .26)}
    <path d="M104 150 A30 30 0 1 1 126 100 A32 32 0 1 1 174 100 A30 30 0 1 1 196 150 Z" fill="${v.gold}"/>
    <rect x="104" y="150" width="92" height="12" fill="${g.accent}"/>
    <rect x="98" y="162" width="104" height="16" fill="${v.gold}"/>
    <path d="M150 150 L150 106" stroke="${g.b}" stroke-width="2" opacity=".5"/>
    <path d="M90 214 A60 24 0 0 0 210 214 Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="80" y="206" width="140" height="10" rx="5" fill="${v.gold}"/>
    ${[118, 150, 182].map((x) => `<path d="M${x} 200 q-9 -13 0 -26 q9 -13 0 -24" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".65"/>`).join('')}
    ${diamond(56, 120, 6, v.gold)}${diamond(244, 120, 6, v.gold)}`,

  /** World of Frozen : flocon géométrique, sommets en gradins */
  frost: (g, v) => {
    let flake = '';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 - Math.PI / 2;
      const x = 150 + Math.cos(a) * 62, y = 108 + Math.sin(a) * 62;
      flake += `<line x1="150" y1="108" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      [0.5, 0.76].forEach((t) => {
        const bx = 150 + Math.cos(a) * 62 * t, by = 108 + Math.sin(a) * 62 * t;
        [-0.62, 0.62].forEach((d) => {
          flake += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + Math.cos(a + d) * 18).toFixed(1)}" y2="${(by + Math.sin(a + d) * 18).toFixed(1)}"/>`;
        });
      });
    }
    return `
    <circle cx="150" cy="108" r="78" fill="none" stroke="${v.gold}" stroke-width="1"/>
    <g stroke="${v.gold}" stroke-width="3" stroke-linecap="round">${flake}</g>
    ${diamond(150, 108, 7, v.gold)}
    ${steps(150, 226, 200, 76, 4, g.accent)}
    ${steps(150, 226, 108, 46, 3, v.gold)}
    <rect x="30" y="226" width="240" height="3" fill="${v.gold}"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${44 + i * 30} 240 q7.5 -8 15 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".6"/>`).join('')}`;
  }
};

/**
 * Retourne l'affiche SVG.
 * variant : poster (défaut) | night | blueprint | ticket
 */
function posterSVG(motif, variant = 'poster', opts = {}) {
  const v = VARIANT[variant] ? VARIANT[variant] : VARIANT.poster;
  const key = MOTIFS[motif] ? motif : 'mesa';
  let g = GROUND[key];
  if (variant === 'night') g = { a: '#06111A', b: '#0C2030', accent: g.accent };
  if (variant === 'blueprint') g = { a: v.mono, b: v.mono, accent: 'rgba(191,217,228,.14)' };

  const uid = 'p' + Math.random().toString(36).slice(2, 8);
  const land = escSvg((opts.label || '').toUpperCase());
  const lines = (opts.lines && opts.lines.length ? opts.lines : [opts.label || '']).map((l) => escSvg(l.toUpperCase()));

  /* Grille du plan d'ingénieur */
  let grid = '';
  if (v.grid) {
    for (let i = 20; i < 300; i += 20) grid += `<line x1="${i}" y1="60" x2="${i}" y2="300" stroke="${v.gold}" stroke-width=".7" opacity="${v.grid}"/>`;
    for (let j = 60; j < 300; j += 20) grid += `<line x1="18" y1="${j}" x2="282" y2="${j}" stroke="${v.gold}" stroke-width=".7" opacity="${v.grid}"/>`;
  }

  /* Rayons de fond dans la fenêtre */
  const rays = v.rays ? fan(150, 60, 290, 22, v.gold, v.rays) : '';

  /* Étoiles de la variante nocturne */
  let stars = '';
  if (variant === 'night') {
    [[46, 84], [254, 96], [70, 150], [230, 168], [150, 42], [96, 62], [206, 54]]
      .forEach(([x, y], i) => { stars += diamond(x, y, i % 2 ? 3 : 4.5, v.gold); });
  }

  /* Plaque de titre : 1 ou 2 lignes, corps ajusté à la ligne la plus longue */
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(lines.length === 1 ? 24 : 20, 244 / (longest * 0.82));
  const baseY = lines.length === 1 ? 356 : 346;
  const title = lines.map((l, i) =>
    `<text x="150" y="${(baseY + i * (size + 7)).toFixed(1)}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="${size.toFixed(1)}" letter-spacing="${(size * 0.13).toFixed(1)}" fill="${v.gold}">${l}</text>`
  ).join('');

  /* Coins en gradins, signature Art déco */
  const corner = (x, y, sx, sy) =>
    `<path d="M${x} ${y + sy * 26} L${x} ${y + sy * 12} L${x + sx * 7} ${y + sy * 12} L${x + sx * 7} ${y} L${x + sx * 26} ${y}" fill="none" stroke="${v.gold}" stroke-width="2"/>`;

  const stub = v.stub
    ? `<g><line x1="18" y1="300" x2="282" y2="300" stroke="${v.gold}" stroke-width="1" stroke-dasharray="4 5"/>
       <text x="150" y="320" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="9" letter-spacing="5" fill="${v.gold}" opacity=".85">ADMIT ONE</text></g>`
    : '';

  return `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escSvg(opts.alt || 'Affiche Art déco')}">
  <defs>
    <linearGradient id="${uid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.b}"/><stop offset="1" stop-color="${g.a}"/></linearGradient>
    <clipPath id="${uid}c"><rect x="18" y="60" width="264" height="240"/></clipPath>
  </defs>

  <rect width="300" height="420" fill="#0B1C26"/>

  <!-- Bandeau du land -->
  <text x="150" y="33" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="600" font-size="${land.length > 18 ? 9 : 10.5}" letter-spacing="${land.length > 18 ? 3 : 4.5}" fill="${v.gold}">${land}</text>
  <line x1="26" y1="44" x2="274" y2="44" stroke="${v.gold}" stroke-width="1"/>
  ${diamond(26, 44, 4, v.gold)}${diamond(274, 44, 4, v.gold)}

  <!-- Fenêtre illustrée -->
  <g clip-path="url(#${uid}c)">
    <rect x="18" y="60" width="264" height="240" fill="url(#${uid}g)"/>
    ${rays}${grid}
    <g transform="translate(18 60) scale(.88)" opacity="${v.dim || 1}">${MOTIFS[key](g, v)}</g>
    ${stars}
  </g>
  <rect x="18" y="60" width="264" height="240" fill="none" stroke="${v.gold}" stroke-width="2"/>
  <rect x="24" y="66" width="252" height="228" fill="none" stroke="${v.gold}" stroke-width=".8" opacity=".7"/>

  <!-- Plaque de titre -->
  ${stub}
  <line x1="60" y1="${baseY - 24}" x2="240" y2="${baseY - 24}" stroke="${v.gold}" stroke-width="1"/>
  ${diamond(150, baseY - 24, 5, v.gold)}
  ${title}
  <line x1="92" y1="${baseY + (lines.length === 1 ? 20 : 42)}" x2="208" y2="${baseY + (lines.length === 1 ? 20 : 42)}" stroke="${v.gold}" stroke-width=".8" opacity=".75"/>

  <!-- Encadrement -->
  <rect x="8" y="8" width="284" height="404" fill="none" stroke="${v.gold}" stroke-width="1.5"/>
  ${corner(14, 14, 1, 1)}${corner(286, 14, -1, 1)}${corner(14, 406, 1, -1)}${corner(286, 406, -1, -1)}
</svg>`;
}

/** Avis visiteurs : sauvegarde en localStorage (avec repli en mémoire si indisponible). */
const memory = new Map();
const keyOf = (id) => `chroniques-avis-${id}`;

function loadReviews(id) {
  try {
    const raw = localStorage.getItem(keyOf(id));
    return raw ? JSON.parse(raw) : memory.get(id) || [];
  } catch {
    return memory.get(id) || [];
  }
}

/** Ajoute un avis ; retourne true si la sauvegarde persistante a réussi */
function addReview(id, review) {
  const list = [review, ...loadReviews(id)].slice(0, 50);
  memory.set(id, list);
  try {
    localStorage.setItem(keyOf(id), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function average(list) {
  if (!list.length) return null;
  return list.reduce((sum, r) => sum + r.score, 0) / list.length;
}

/** Point d'entrée : données, filtres, grille, fiche détaillée, galerie, avis. */




const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  parks: [],
  attractions: [],
  live: new Map(),
  mode: 'loading',
  via: '',
  updatedAt: null,
  filters: { park: 'all', land: 'all', state: 'all', q: '' },
  openId: null
};

const STATE_OPTIONS = [
  { id: 'all', label: 'Toutes' },
  { id: 'open', label: 'Ouvertes' },
  { id: 'closed', label: 'Fermées / En rénovation' }
];

/* ---------- Utilitaires ---------- */
const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const parkName = (id) => state.parks.find((p) => p.id === id)?.name || id;
const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Statut affiché : réglage local (localStatus) > données Queue-Times, sinon indisponible */
function statusOf(a) {
  const local = a.localStatus || {};
  const live = state.live.get(a.id);
  if (local.status === 'refurb') return { kind: 'refurb', label: local.until ? `En rénovation jusqu'au ${fmtDate(local.until)}` : 'En rénovation', wait: null };
  if (local.status === 'closed') return { kind: 'closed', label: 'Fermée', wait: null };
  if (!live) return { kind: 'unknown', label: state.mode === 'loading' ? 'Chargement…' : 'Statut indisponible', wait: null };
  if (live.open) return { kind: 'open', label: 'Ouverte', wait: live.wait };
  return { kind: 'closed', label: 'Fermée', wait: null };
}

function matches(a) {
  const f = state.filters;
  if (f.park !== 'all' && a.park !== f.park) return false;
  if (f.land !== 'all' && a.land !== f.land) return false;
  const kind = statusOf(a).kind;
  if (f.state === 'open' && kind !== 'open') return false;
  if (f.state === 'closed' && kind !== 'closed' && kind !== 'refurb') return false;
  if (f.q && !fold(a.name).includes(fold(f.q)) && !fold(a.tagline).includes(fold(f.q))) return false;
  return true;
}

const poster = (a, variant = 'poster') => posterSVG(a.motif, variant, { label: a.land, lines: a.posterLines, tag: a.tagline, alt: `Affiche vintage de ${a.name}` });

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
}

/* ---------- Grille ---------- */
function ribbonHTML(st) {
  const wait = st.kind === 'open' ? `<span class="ribbon__wait">${st.wait} min</span>` : '';
  return `<div class="ribbon ribbon--${st.kind}"><span>${esc(st.label)}</span>${wait}</div>`;
}

function renderGrid() {
  const list = state.attractions.filter(matches);
  $('#count').textContent = `${list.length} attraction${list.length > 1 ? 's' : ''} affichée${list.length > 1 ? 's' : ''} sur ${state.attractions.length}`;
  $('#grid').innerHTML = list.length
    ? list.map((a) => {
        const st = statusOf(a);
        return `<article class="card">
          <div class="card__art" aria-hidden="true">${poster(a)}</div>
          <div class="card__body">
            <h2 class="card__title"><button type="button" class="card__btn" data-open="${esc(a.id)}">${esc(a.name)}</button></h2>
            <p class="card__park">${esc(parkName(a.park))}</p>
          </div>
          ${ribbonHTML(st)}
        </article>`;
      }).join('')
    : '<p class="empty">Aucune attraction ne correspond à ces critères. Modifiez les filtres ou la recherche.</p>';
}

function renderLivebar() {
  const bar = $('#livebar');
  bar.dataset.mode = state.mode;
  const time = state.updatedAt ? state.updatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const text = {
    loading: `Chargement des temps d'attente…`,
    live: `Temps d'attente en direct (Queue-Times) · mis à jour à ${time}`,
    partial: `Temps d'attente en direct pour une partie des attractions · ${time}`,
    unavailable: `Temps d'attente indisponibles : Queue-Times ne répond pas depuis cette page.`
  }[state.mode];
  bar.innerHTML = `<span>${esc(text)}</span><button type="button" id="refresh">Actualiser</button>`;
}

/* ---------- Données en direct ---------- */
async function refreshLive() {
  const btn = $('#refresh');
  if (btn) { btn.disabled = true; btn.textContent = 'Actualisation…'; }
  const res = await loadWaitTimes(state.parks, state.attractions).catch(() => ({ entries: new Map(), mode: 'unavailable', via: '' }));
  state.live = res.entries;
  state.mode = res.mode;
  state.via = res.via;
  state.updatedAt = new Date();
  renderLivebar();
  renderGrid();
  if (state.openId) renderFicheStatus();
}

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

function starsHTML(score) {
  const full = Math.round(score);
  return `<span class="stars" role="img" aria-label="${score} sur 5">${'★'.repeat(full)}<span class="off">${'★'.repeat(5 - full)}</span></span>`;
}

function liveBlock(a) {
  const st = statusOf(a);
  const wait = st.kind === 'open' ? `<div class="live__wait">${st.wait} min<small>d'attente</small></div>` : '';
  return `<div class="live"><div class="live__status ribbon--${st.kind}">${esc(st.label)}</div>${wait}</div>`;
}

function renderFicheStatus() {
  const a = state.attractions.find((x) => x.id === state.openId);
  const holder = $('#fiche-live');
  if (a && holder) holder.innerHTML = liveBlock(a);
  const meta = $('#fiche-meta');
  if (meta) meta.textContent = state.mode === 'unavailable' ? 'Temps d\'attente non disponibles sur cette page.' : state.mode === 'loading' ? '' : 'Source : Queue-Times.com';
}

function reviewsHTML(a) {
  const mine = loadReviews(a.id);
  const avg = average(mine);
  const editorial = a.review
    ? `<div class="chronicle">
      <h3>L'avis du chroniqueur</h3>
      <div class="score-line">${starsHTML(a.review.score)}<b>${a.review.score}/5</b></div>
      <p>${esc(a.review.text)}</p>
      <div class="pros-cons">
        <div class="pros"><h4>Points forts</h4><ul>${a.review.pros.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
        <div class="cons"><h4>Points faibles</h4><ul>${a.review.cons.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      </div>
      <p class="note">Avis éditorial rédigé pour ce site.</p>
    </div>`
    : `<div class="chronicle"><h3>L'avis du chroniqueur</h3><p>Pas encore rédigé pour cette attraction.</p></div>`;
  return `
    ${editorial}
    <div class="visitors">
      <h3>L'avis des visiteurs</h3>
      <div class="score-line">${avg ? `${starsHTML(avg)}<b>${avg.toFixed(1)}/5</b> <small>(${mine.length})</small>` : '<span>Aucun avis pour le moment.</span>'}</div>
      <form class="form" id="review-form" data-id="${esc(a.id)}">
        <fieldset>
          <legend>Votre note</legend>
          <div class="rate">
            ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="score" id="rate-${n}" value="${n}" required><label for="rate-${n}" title="${n} sur 5"><span class="sr-only">${n} sur 5</span>★</label>`).join('')}
          </div>
        </fieldset>
        <div><label for="rv-name">Votre prénom</label><input type="text" id="rv-name" name="name" maxlength="40" required></div>
        <div><label for="rv-text">Votre commentaire</label><textarea id="rv-text" name="text" maxlength="600" required></textarea></div>
        <button type="submit" class="btn">Publier mon avis</button>
        <p class="form__msg" id="rv-msg" role="status"></p>
      </form>
      <ul class="review-list">
        ${mine.map((r) => `<li>${starsHTML(r.score)} <strong>${esc(r.name)}</strong> <small>${new Date(r.date).toLocaleDateString('fr-FR')}</small><p>${esc(r.text)}</p></li>`).join('')}
      </ul>
    </div>`;
}

/** Éléments de la galerie : photos fournies (si présentes) puis planches originales */
function galleryItems(a) {
  const photos = (a.images || []).map((i) => ({ type: 'img', src: i.src, caption: i.caption || a.name, credit: i.credit }));
  const posters = (a.gallery || []).map((g) => ({ type: 'poster', variant: g.variant, caption: g.caption }));
  return [...photos, ...posters];
}

function itemHTML(a, it) {
  if (it.type === 'img') return `<img src="${esc(it.src)}" alt="${esc(it.caption)}" data-fallback="1">`;
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
    <button type="button" class="fiche__close" data-close>Fermer ✕</button>
    <div class="fiche__head">
      <div class="fiche__art" role="img" aria-label="Affiche vintage de ${esc(a.name)}">${poster(a)}</div>
      <div>
        <p class="fiche__kicker"><span class="tag tag--land">${esc(a.land)}</span><span class="tag tag--park">${esc(parkName(a.park))}</span></p>
        <h2 class="fiche__title" id="fiche-title">${esc(a.name)}</h2>
        <p class="fiche__tagline">${esc(a.tagline)}</p>
        <div id="fiche-live">${liveBlock(a)}</div>
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
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  try { if (location.hash !== '#' + id) location.hash = id; } catch {}
}

/** Si une photo ne charge pas, on la remplace par l'affiche originale */
function fixBrokenImages(root, a) {
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => { img.replaceWith(Object.assign(document.createElement('div'), { innerHTML: poster(a) }).firstElementChild); }, { once: true });
  });
}

function closeFiche() {
  const dlg = $('#fiche');
  if (dlg.open) dlg.close();
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
    const card = t.closest('[data-open]');
    if (card) return openFiche(card.dataset.open);
    if (t.closest('#refresh')) return refreshLive();
    if (t.closest('[data-close]')) return closeFiche();
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
    }
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
    const review = { score: Number(data.get('score')), name: String(data.get('name')).trim(), text: String(data.get('text')).trim(), date: new Date().toISOString() };
    if (!review.score || !review.name || !review.text) return;
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
      const res = await fetch(CONFIG.DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
    }
    state.parks = data.parks;
    state.attractions = data.attractions;
  } catch (err) {
    $('#grid').innerHTML = `<p class="empty">Impossible de charger les attractions (${esc(err.message)}). Servez le site via un serveur web local plutôt qu'en ouvrant le fichier directement.</p>`;
    return;
  }
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

})();