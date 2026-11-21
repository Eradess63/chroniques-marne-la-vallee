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
  frost:   { a: '#0D2430', b: '#1E5464', accent: '#6FB7C4' },
  locomotive: { a: '#1E1410', b: '#4A3326', accent: '#A8552C' },
  tram:       { a: '#1C2418', b: '#3F5638', accent: '#6E8C4A' },
  riverboat:  { a: '#122630', b: '#2F5F6B', accent: '#4E8FA0' },
  keelboat:   { a: '#1A2218', b: '#3C4E33', accent: '#7A8F4C' },
  fort:       { a: '#241A12', b: '#56402C', accent: '#996437' }
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
  },

  /** Main Street : locomotive à vapeur de type 4-4-0, roues motrices et panache */
  locomotive: (g, v) => `
    ${fan(96, 48, 130, 13, v.gold, .3)}
    <rect x="18" y="214" width="264" height="4" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map((i) => `<rect x="${24 + i * 26}" y="218" width="16" height="5" fill="${v.gold}" opacity=".6"/>`).join('')}
    <rect x="206" y="118" width="70" height="78" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    ${[0,1,2].map((i) => `<rect x="${216 + i * 20}" y="130" width="12" height="18" fill="${v.gold}"/>`).join('')}
    <rect x="70" y="140" width="140" height="56" rx="28" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="96" y="140" width="5" height="56" fill="${v.gold}" opacity=".8"/>
    <rect x="140" y="140" width="5" height="56" fill="${v.gold}" opacity=".8"/>
    <rect x="184" y="140" width="5" height="56" fill="${v.gold}" opacity=".8"/>
    <path d="M84 118 L112 118 L106 140 L90 140Z" fill="${v.gold}"/>
    <path d="M80 110 L116 110 L116 118 L80 118Z" fill="${v.gold}"/>
    <circle cx="68" cy="152" r="11" fill="${v.gold}"/>
    <path d="M56 196 L36 214 L70 214Z" fill="${v.gold}"/>
    <circle cx="106" cy="196" r="22" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="106" cy="196" r="6" fill="${v.gold}"/>
    <circle cx="170" cy="196" r="22" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="170" cy="196" r="6" fill="${v.gold}"/>
    <circle cx="238" cy="200" r="14" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map((i) => `<ellipse cx="${98 - i * 4}" cy="${96 - i * 19}" rx="${15 + i * 5}" ry="${9 + i * 3}" fill="${v.gold}" opacity="${(.5 - i * .08).toFixed(2)}"/>`).join('')}`,

  /** Main Street : omnibus à impériale et rails de tramway */
  tram: (g, v) => `
    ${fan(150, 40, 120, 14, v.gold, .22)}
    <rect x="18" y="212" width="264" height="3" fill="${v.gold}"/>
    <rect x="18" y="222" width="264" height="3" fill="${v.gold}" opacity=".5"/>
    <rect x="72" y="96" width="156" height="104" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="66" y="86" width="168" height="12" fill="${v.gold}"/>
    <rect x="72" y="146" width="156" height="4" fill="${v.gold}" opacity=".8"/>
    ${[0,1,2,3].map((i) => `<rect x="${84 + i * 36}" y="106" width="24" height="30" fill="${v.gold}"/>`).join('')}
    ${[0,1,2,3].map((i) => `<rect x="${84 + i * 36}" y="158" width="24" height="30" fill="${v.gold}" opacity=".85"/>`).join('')}
    <circle cx="104" cy="204" r="16" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="196" cy="204" r="16" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="104" cy="204" r="4" fill="${v.gold}"/>
    <circle cx="196" cy="204" r="4" fill="${v.gold}"/>
    <rect x="46" y="118" width="7" height="82" fill="${v.gold}"/>
    ${diamond(49, 110, 7, v.gold)}
    <rect x="247" y="118" width="7" height="82" fill="${v.gold}" opacity=".7"/>`,

  /** Frontierland : vapeur à roues latérales, cheminées jumelles */
  riverboat: (g, v) => `
    ${fan(150, 36, 120, 14, v.gold, .2)}
    <path d="M52 186 L248 186 L228 220 L72 220Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="72" y="150" width="156" height="36" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="98" y="116" width="104" height="34" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="124" y="92" width="52" height="24" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5].map((i) => `<rect x="${80 + i * 25}" y="160" width="14" height="16" fill="${v.gold}"/>`).join('')}
    ${[0,1,2,3].map((i) => `<rect x="${108 + i * 23}" y="126" width="13" height="15" fill="${v.gold}" opacity=".9"/>`).join('')}
    <rect x="128" y="40" width="10" height="52" fill="${v.gold}"/>
    <rect x="162" y="40" width="10" height="52" fill="${v.gold}"/>
    <rect x="122" y="34" width="22" height="8" fill="${v.gold}"/>
    <rect x="156" y="34" width="22" height="8" fill="${v.gold}"/>
    <circle cx="56" cy="178" r="30" fill="none" stroke="${v.gold}" stroke-width="3"/>
    ${[0,1,2,3,4,5,6,7].map((i) => { const a = i * Math.PI / 4; return `<line x1="56" y1="178" x2="${(56 + Math.cos(a) * 30).toFixed(1)}" y2="${(178 + Math.sin(a) * 30).toFixed(1)}" stroke="${v.gold}" stroke-width="2.5"/>`; }).join('')}
    <circle cx="56" cy="178" r="7" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map((i) => `<path d="M${18 + i * 28} 232 q7 -8 14 0 t14 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".55"/>`).join('')}`,

  /** Frontierland : keelboat de bois, cabine et voile carrée */
  keelboat: (g, v) => `
    ${fan(150, 44, 110, 12, v.gold, .18)}
    <path d="M46 182 L254 182 L232 216 L68 216Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="104" y="128" width="98" height="54" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M98 128 L208 128 L202 114 L104 114Z" fill="${v.gold}"/>
    ${[0,1,2].map((i) => `<rect x="${118 + i * 30}" y="142" width="18" height="22" fill="${v.gold}"/>`).join('')}
    <rect x="68" y="60" width="6" height="122" fill="${v.gold}"/>
    <path d="M74 70 L74 112 L132 92Z" fill="${v.gold}" opacity=".85"/>
    ${diamond(71, 54, 7, v.gold)}
    <path d="M214 120 L262 176" stroke="${v.gold}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="150" cy="200" r="9" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9].map((i) => `<path d="M${18 + i * 28} 228 q7 -8 14 0 t14 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".55"/>`).join('')}`,

  /** Frontierland : palissade en rondins et tour de guet */
  fort: (g, v) => `
    ${fan(150, 40, 120, 14, v.gold, .2)}
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => {
      const x = 24 + i * 22;
      return `<rect x="${x}" y="150" width="18" height="72" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/><path d="M${x} 150 L${x + 9} 136 L${x + 18} 150Z" fill="${v.gold}"/>`;
    }).join('')}
    <rect x="112" y="96" width="76" height="126" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M100 96 L200 96 L188 74 L112 74Z" fill="${v.gold}"/>
    <path d="M124 74 L150 48 L176 74Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="132" y="112" width="16" height="22" fill="${v.gold}"/>
    <rect x="152" y="112" width="16" height="22" fill="${v.gold}"/>
    <path d="M132 222 L132 172 Q150 156 168 172 L168 222Z" fill="${v.gold}"/>
    <rect x="147" y="18" width="6" height="32" fill="${v.gold}"/>
    <path d="M153 22 L186 32 L153 42Z" fill="${v.gold}"/>
    <rect x="18" y="222" width="264" height="4" fill="${v.gold}"/>`
};

/**
 * Retourne l'affiche SVG.
 * variant : poster (défaut) | night | blueprint | ticket
 */
export function posterSVG(motif, variant = 'poster', opts = {}) {
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
