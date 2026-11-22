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
  fort:       { a: '#241A12', b: '#56402C', accent: '#996437' },
  launch:     { a: '#0A1020', b: '#1E2A55', accent: '#C0392B' },
  globe:       { a: '#101C2E', b: '#1E3A5F', accent: '#4A7FB5' },
  clocktower:  { a: '#101826', b: '#2A3A52', accent: '#6B82A8' },
  bigtop:      { a: '#2A1218', b: '#5E2430', accent: '#C0453F' },
  marionette:  { a: '#241A10', b: '#4E3A20', accent: '#9C7338' },
  apple:       { a: '#1C1012', b: '#4A1A20', accent: '#B8292F' },
  teacup:      { a: '#152420', b: '#2E4A3E', accent: '#6FA88C' },
  carousel:    { a: '#201428', b: '#443058', accent: '#8C6BA8' },
  pocketwatch: { a: '#1A2018', b: '#36442E', accent: '#7A8F4C' },
  dragon:      { a: '#1E1410', b: '#48281C', accent: '#9E4A2C' },
  cottage:     { a: '#14201A', b: '#2E4634', accent: '#6B9460' },
  circustrain: { a: '#221628', b: '#4A2E4E', accent: '#A05890' },
  marquee:     { a: '#201A10', b: '#463A1E', accent: '#9E8438' },
  concert:     { a: '#161C2E', b: '#303E62', accent: '#6E82BE' },
  crown:       { a: '#1C1424', b: '#3E2C4E', accent: '#8A6CA0' },
  spaceport:   { a: '#0E1626', b: '#24344E', accent: '#5C7FA8' },
  target:      { a: '#1A1020', b: '#3E2040', accent: '#A8407A' },
  orrery:      { a: '#161020', b: '#342A4E', accent: '#7E6BB0' },
  roadster:    { a: '#101C1E', b: '#24423E', accent: '#4E8A72' },
  porthole:    { a: '#08181E', b: '#163840', accent: '#2E7686' },
  beacon:      { a: '#101428', b: '#2A2E56', accent: '#6670B8' },
  playground:  { a: '#201A10', b: '#44361E', accent: '#90723A' }
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
    <rect x="18" y="222" width="264" height="4" fill="${v.gold}"/>`,

  /** Avengers Campus : rampe de lancement, chevrons de vitesse et champ d'étoiles */
  launch: (g, v) => `
    ${fan(150, 236, 200, 20, v.gold, .26)}
    ${[[42,58],[254,46],[76,112],[228,124],[150,34],[34,166],[266,172],[108,74],[196,88]]
      .map(([x, y], i) => diamond(x, y, i % 3 ? 3.5 : 5.5, v.gold)).join('')}
    <circle cx="150" cy="128" r="86" fill="none" stroke="${v.gold}" stroke-width="1" opacity=".55"/>
    <circle cx="150" cy="128" r="64" fill="none" stroke="${v.gold}" stroke-width="1.5" opacity=".75"/>
    ${[0,1,2,3].map((i) => `<path d="M${98 + i * 7} ${212 - i * 26} L150 ${182 - i * 26} L${202 - i * 7} ${212 - i * 26}" fill="none" stroke="${v.gold}" stroke-width="${(4 - i * .6).toFixed(1)}" opacity="${(1 - i * .2).toFixed(2)}" stroke-linejoin="miter"/>`).join('')}
    <path d="M150 48 L178 142 L150 170 L122 142 Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M150 48 L164 142 L150 162 L136 142 Z" fill="${v.gold}"/>
    <path d="M122 132 L100 178 L134 158 Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/>
    <path d="M178 132 L200 178 L166 158 Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/>
    ${diamond(150, 104, 9, v.gold)}
    <rect x="18" y="232" width="264" height="3" fill="${v.gold}"/>`,

  /** it's a small world : globe à méridiens et aiguilles d'horloge */
  globe: (g, v) => `
    ${fan(150, 120, 140, 18, v.gold, .22)}
    <circle cx="150" cy="120" r="76" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map((i) => `<ellipse cx="150" cy="120" rx="${(76 * Math.cos(i * Math.PI / 5)).toFixed(1)}" ry="76" fill="none" stroke="${v.gold}" stroke-width="1.4" opacity=".8"/>`).join('')}
    ${[-46,-22,0,22,46].map((dy) => `<line x1="${150 - Math.sqrt(Math.max(0, 76*76 - dy*dy)).toFixed(1)}" y1="${120 + dy}" x2="${150 + Math.sqrt(Math.max(0, 76*76 - dy*dy)).toFixed(1)}" y2="${120 + dy}" stroke="${v.gold}" stroke-width="1.4" opacity=".8"/>`).join('')}
    <path d="M150 120 L150 70" stroke="${v.gold}" stroke-width="5" stroke-linecap="round"/>
    <path d="M150 120 L188 140" stroke="${v.gold}" stroke-width="5" stroke-linecap="round"/>
    ${diamond(150, 120, 8, v.gold)}
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => { const a = i * Math.PI / 6 - Math.PI / 2; return diamond(150 + Math.cos(a) * 94, 120 + Math.sin(a) * 94, i % 3 ? 3 : 5, v.gold); }).join('')}
    <rect x="18" y="226" width="264" height="3" fill="${v.gold}"/>`,

  /** Peter Pan's Flight : horloge de clocher et nacelle suspendue */
  clocktower: (g, v) => `
    ${[[46,52],[252,44],[82,34],[216,66],[34,120]].map(([x,y],i) => diamond(x, y, i % 2 ? 4 : 6, v.gold)).join('')}
    ${steps(150, 232, 120, 96, 4, g.accent)}
    <rect x="112" y="92" width="76" height="52" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="118" r="30" fill="${g.a}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => { const a = i * Math.PI / 6; return `<line x1="${(150 + Math.cos(a) * 24).toFixed(1)}" y1="${(118 + Math.sin(a) * 24).toFixed(1)}" x2="${(150 + Math.cos(a) * 28).toFixed(1)}" y2="${(118 + Math.sin(a) * 28).toFixed(1)}" stroke="${v.gold}" stroke-width="${i % 3 ? 1.5 : 2.5}"/>`; }).join('')}
    <path d="M150 118 L150 100 M150 118 L168 126" stroke="${v.gold}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M124 92 L150 58 L176 92Z" fill="${v.gold}"/>
    <rect x="18" y="52" width="264" height="2.5" fill="${v.gold}" opacity=".6"/>
    <path d="M196 54 L196 78" stroke="${v.gold}" stroke-width="2"/>
    <path d="M182 78 L210 78 L204 98 L188 98Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>`,

  /** Dumbo : chapiteau de cirque et plume */
  bigtop: (g, v) => `
    ${fan(150, 44, 130, 16, v.gold, .22)}
    <path d="M40 212 L150 56 L260 212Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map((i) => `<path d="M150 56 L${80 + i * 35} 212" stroke="${v.gold}" stroke-width="2" opacity=".75"/>`).join('')}
    <path d="M126 212 L126 166 Q150 146 174 166 L174 212Z" fill="${v.gold}"/>
    <rect x="30" y="212" width="240" height="4" fill="${v.gold}"/>
    ${diamond(150, 48, 9, v.gold)}
    <rect x="147" y="18" width="6" height="26" fill="${v.gold}"/>
    <path d="M232 92 q22 24 0 52 q-10 -26 0 -52Z" fill="${v.gold}" opacity=".9"/>
    <path d="M232 92 L232 150" stroke="${g.a}" stroke-width="1.5"/>
    <path d="M68 92 q-22 24 0 52 q10 -26 0 -52Z" fill="${v.gold}" opacity=".6"/>`,

  /** Les Voyages de Pinocchio : marionnette à fils */
  marionette: (g, v) => `
    ${fan(150, 36, 110, 14, v.gold, .18)}
    <rect x="96" y="44" width="108" height="9" rx="4" fill="${v.gold}"/>
    <rect x="146" y="30" width="8" height="26" fill="${v.gold}"/>
    ${[108,134,166,192].map((x) => `<line x1="${x}" y1="53" x2="${x < 150 ? x + 14 : x - 14}" y2="112" stroke="${v.gold}" stroke-width="1.4" opacity=".8"/>`).join('')}
    <circle cx="150" cy="124" r="22" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M150 128 L150 146 L164 134Z" fill="${v.gold}"/>
    <rect x="128" y="150" width="44" height="46" rx="5" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="98" y="156" width="28" height="9" rx="4" fill="${v.gold}"/>
    <rect x="174" y="156" width="28" height="9" rx="4" fill="${v.gold}"/>
    <rect x="132" y="198" width="11" height="32" rx="5" fill="${v.gold}"/>
    <rect x="157" y="198" width="11" height="32" rx="5" fill="${v.gold}"/>
    ${diamond(150, 112, 5, v.gold)}`,

  /** Blanche-Neige : la pomme et la forêt */
  apple: (g, v) => `
    ${fan(150, 40, 120, 14, v.gold, .2)}
    ${[50,78,222,250].map((x, i) => `<path d="M${x} 230 L${x} 196 M${x - 16} 200 L${x} 172 L${x + 16} 200 M${x - 13} 180 L${x} 156 L${x + 13} 180" fill="none" stroke="${v.gold}" stroke-width="2" opacity="${i % 2 ? .55 : .8}"/>`).join('')}
    <path d="M150 88 C108 88 92 124 96 154 C100 188 124 214 150 214 C176 214 200 188 204 154 C208 124 192 88 150 88Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M150 88 C128 88 116 112 118 136" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".65"/>
    <rect x="146" y="58" width="8" height="34" rx="4" fill="${v.gold}"/>
    <path d="M154 70 q30 -14 44 6 q-30 12 -44 -6Z" fill="${v.gold}"/>
    ${diamond(150, 150, 10, v.gold)}
    <rect x="18" y="230" width="264" height="3" fill="${v.gold}"/>`,

  /** Mad Hatter's Tea Cups : tasse sur plateau tournant */
  teacup: (g, v) => `
    ${fan(150, 44, 120, 16, v.gold, .22)}
    <ellipse cx="150" cy="212" rx="112" ry="22" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="212" rx="78" ry="15" fill="none" stroke="${v.gold}" stroke-width="1.2" opacity=".7"/>
    <path d="M96 128 L108 190 Q150 206 192 190 L204 128Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="128" rx="54" ry="16" fill="${g.a}" stroke="${v.gold}" stroke-width="2.5"/>
    <ellipse cx="150" cy="128" rx="38" ry="10" fill="none" stroke="${v.gold}" stroke-width="1.4" opacity=".8"/>
    <path d="M204 140 q34 10 20 36 q-10 16 -28 12" fill="none" stroke="${v.gold}" stroke-width="5"/>
    <path d="M110 150 L190 150" stroke="${v.gold}" stroke-width="2" opacity=".7"/>
    ${[124,150,176].map((x) => `<path d="M${x} 112 q-8 -14 0 -26 q8 -12 0 -24" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".55"/>`).join('')}
    ${diamond(150, 196, 5, v.gold)}`,

  /** Le Carrousel de Lancelot : cheval de manège et lance */
  carousel: (g, v) => `
    ${fan(150, 34, 126, 18, v.gold, .24)}
    <path d="M44 86 L150 34 L256 86Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6].map((i) => `<path d="M${54 + i * 32} 86 L150 34" stroke="${v.gold}" stroke-width="1.4" opacity=".6"/>`).join('')}
    <rect x="40" y="86" width="220" height="8" fill="${v.gold}"/>
    ${diamond(150, 28, 8, v.gold)}
    <rect x="146" y="94" width="8" height="120" fill="${v.gold}"/>
    <path d="M112 196 L112 160 Q118 136 142 132 L152 112 L158 132 Q186 138 190 164 L190 196 L176 196 L176 170 L126 170 L126 196Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M150 116 L138 128 L158 128Z" fill="${v.gold}"/>
    <circle cx="146" cy="140" r="3.5" fill="${v.gold}"/>
    <path d="M214 100 L214 216" stroke="${v.gold}" stroke-width="4"/>
    <path d="M208 96 L220 96 L214 76Z" fill="${v.gold}"/>
    <rect x="30" y="216" width="240" height="4" fill="${v.gold}"/>`,

  /** Alice's Curious Labyrinth : montre à gousset et haies */
  pocketwatch: (g, v) => `
    ${[0,1,2,3,4,5].map((i) => `<rect x="${26 + i * 44}" y="186" width="30" height="48" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/>`).join('')}
    ${[0,1,2,3,4].map((i) => `<rect x="${48 + i * 44}" y="206" width="30" height="28" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5" opacity=".7"/>`).join('')}
    <circle cx="150" cy="112" r="70" fill="${g.accent}" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="150" cy="112" r="58" fill="${g.a}" stroke="${v.gold}" stroke-width="1.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map((i) => { const a = i * Math.PI / 6; return `<line x1="${(150 + Math.cos(a) * 44).toFixed(1)}" y1="${(112 + Math.sin(a) * 44).toFixed(1)}" x2="${(150 + Math.cos(a) * 54).toFixed(1)}" y2="${(112 + Math.sin(a) * 54).toFixed(1)}" stroke="${v.gold}" stroke-width="${i % 3 ? 1.6 : 3}"/>`; }).join('')}
    <path d="M150 112 L150 74 M150 112 L182 128" stroke="${v.gold}" stroke-width="4" stroke-linecap="round"/>
    ${diamond(150, 112, 6, v.gold)}
    <rect x="142" y="26" width="16" height="18" rx="4" fill="${v.gold}"/>
    <circle cx="150" cy="22" r="11" fill="none" stroke="${v.gold}" stroke-width="3.5"/>`,

  /** La Tanière du Dragon : dragon héraldique */
  dragon: (g, v) => `
    ${fan(150, 40, 110, 14, v.gold, .18)}
    <path d="M60 216 Q86 170 128 164 L116 138 L146 152 L150 118 L170 148 L200 134 L192 162 Q236 172 254 216Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M150 118 L164 92 L178 116" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M108 160 L78 120 L112 136" fill="${v.gold}" opacity=".9"/>
    <path d="M192 160 L222 120 L188 136" fill="${v.gold}" opacity=".9"/>
    <circle cx="136" cy="176" r="5" fill="${v.gold}"/>
    <circle cx="166" cy="176" r="5" fill="${v.gold}"/>
    <path d="M120 196 L132 204 L144 196 L156 204 L168 196 L180 204" fill="none" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M44 208 q-18 -26 2 -44 q6 22 -2 44Z" fill="${v.gold}" opacity=".7"/>
    <path d="M256 208 q18 -26 -2 -44 q-6 22 2 44Z" fill="${v.gold}" opacity=".7"/>
    <rect x="18" y="216" width="264" height="4" fill="${v.gold}"/>`,

  /** Le Pays des Contes de Fées : chaumière miniature et canal */
  cottage: (g, v) => `
    ${fan(150, 36, 118, 14, v.gold, .2)}
    <rect x="108" y="128" width="84" height="66" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M96 128 L150 78 L204 128Z" fill="${v.gold}"/>
    <rect x="166" y="82" width="14" height="34" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <rect x="120" y="144" width="20" height="22" fill="${v.gold}"/>
    <path d="M152 194 L152 158 Q164 146 176 158 L176 194Z" fill="${v.gold}"/>
    <rect x="56" y="154" width="44" height="40" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M48 154 L78 124 L108 154Z" fill="${v.gold}" opacity=".85"/>
    <rect x="200" y="160" width="40" height="34" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M192 160 L220 132 L248 160Z" fill="${v.gold}" opacity=".85"/>
    <rect x="18" y="194" width="264" height="4" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map((i) => `<path d="M${18 + i * 28} 212 q7 -9 14 0 t14 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".6"/>`).join('')}
    <path d="M118 222 L182 222 L172 240 L128 240Z" fill="${v.gold}" opacity=".85"/>`,

  /** Casey Jr. : train de cirque et wagon-cage */
  circustrain: (g, v) => `
    ${fan(96, 44, 120, 13, v.gold, .22)}
    <rect x="18" y="206" width="264" height="4" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6,7,8,9].map((i) => `<rect x="${24 + i * 26}" y="210" width="16" height="5" fill="${v.gold}" opacity=".55"/>`).join('')}
    <rect x="54" y="140" width="76" height="52" rx="8" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M62 120 L94 120 L88 140 L68 140Z" fill="${v.gold}"/>
    <rect x="58" y="114" width="40" height="8" fill="${v.gold}"/>
    <circle cx="74" cy="192" r="15" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="112" cy="192" r="15" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <rect x="148" y="136" width="94" height="56" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5].map((i) => `<rect x="${158 + i * 15}" y="144" width="5" height="40" fill="${v.gold}"/>`).join('')}
    <path d="M142 136 L248 136 L240 118 L150 118Z" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6].map((i) => `<path d="M${152 + i * 14} 136 L${159 + i * 14} 126 L${166 + i * 14} 136Z" fill="${g.accent}"/>`).join('')}
    <circle cx="170" cy="192" r="14" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="222" cy="192" r="14" fill="none" stroke="${v.gold}" stroke-width="3"/>
    ${[0,1,2,3].map((i) => `<ellipse cx="${74 - i * 5}" cy="${100 - i * 20}" rx="${12 + i * 5}" ry="${7 + i * 3}" fill="${v.gold}" opacity="${(.45 - i * .09).toFixed(2)}"/>`).join('')}`,

  /** Meet Mickey Mouse : marquise de théâtre et cordon de velours */
  marquee: (g, v) => `
    ${fan(150, 30, 120, 16, v.gold, .22)}
    <path d="M56 56 L244 56 L228 110 L72 110Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11,12].map((i) => `<circle cx="${66 + i * 14}" cy="${118 - Math.abs(i - 6) * 0.6}" r="4.5" fill="${v.gold}"/>`).join('')}
    <rect x="86" y="68" width="128" height="30" fill="${g.a}" stroke="${v.gold}" stroke-width="1.5"/>
    ${diamond(150, 83, 9, v.gold)}
    <rect x="104" y="130" width="92" height="104" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M104 130 L150 162 L196 130" fill="none" stroke="${v.gold}" stroke-width="2"/>
    ${[66,234].map((x) => `<rect x="${x - 7}" y="166" width="14" height="68" rx="7" fill="${v.gold}"/>`).join('')}
    ${[66,234].map((x) => `<circle cx="${x}" cy="160" r="10" fill="none" stroke="${v.gold}" stroke-width="3"/>`).join('')}
    <path d="M76 178 Q150 212 224 178" fill="none" stroke="${v.gold}" stroke-width="3.5"/>`,

  /** Mickey's PhilharMagic : avant-scène, baguette et pupitre */
  concert: (g, v) => `
    ${fan(150, 34, 124, 16, v.gold, .24)}
    <path d="M34 58 L266 58 L266 72 L34 72Z" fill="${v.gold}"/>
    <path d="M40 72 Q78 132 44 220" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M260 72 Q222 132 256 220" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3].map((i) => `<path d="M${52 + i * 6} 76 Q${86 + i * 4} 136 ${56 + i * 6} 216" fill="none" stroke="${v.gold}" stroke-width="1.3" opacity=".6"/>`).join('')}
    ${[0,1,2,3].map((i) => `<path d="M${248 - i * 6} 76 Q${214 - i * 4} 136 ${244 - i * 6} 216" fill="none" stroke="${v.gold}" stroke-width="1.3" opacity=".6"/>`).join('')}
    <rect x="104" y="140" width="92" height="12" rx="4" fill="${v.gold}" transform="rotate(-10 150 146)"/>
    <rect x="146" y="152" width="8" height="58" fill="${v.gold}"/>
    <path d="M122 210 L178 210 L186 222 L114 222Z" fill="${v.gold}"/>
    <circle cx="126" cy="116" r="11" fill="${v.gold}"/>
    <rect x="135" y="80" width="5" height="38" fill="${v.gold}"/>
    <path d="M135 80 q22 6 26 22" fill="none" stroke="${v.gold}" stroke-width="4"/>
    <circle cx="198" cy="104" r="9" fill="${v.gold}"/>
    <rect x="205" y="74" width="4" height="32" fill="${v.gold}"/>
    <rect x="18" y="226" width="264" height="3" fill="${v.gold}"/>`,

  /** Princess Pavilion : couronne et pavillon */
  crown: (g, v) => `
    ${fan(150, 38, 122, 16, v.gold, .22)}
    <path d="M64 126 L150 54 L236 126Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3,4].map((i) => `<path d="M${80 + i * 35} 126 L150 54" stroke="${v.gold}" stroke-width="1.3" opacity=".55"/>`).join('')}
    ${[0,1,2,3,4,5,6].map((i) => `<path d="M${72 + i * 26} 126 q13 16 26 0" fill="none" stroke="${v.gold}" stroke-width="2"/>`).join('')}
    <rect x="147" y="30" width="6" height="26" fill="${v.gold}"/>
    ${diamond(150, 26, 8, v.gold)}
    <path d="M104 212 L96 158 L122 182 L150 146 L178 182 L204 158 L196 212Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <rect x="100" y="212" width="100" height="14" fill="${v.gold}"/>
    ${[122,150,178].map((x) => diamond(x, 196, 6, v.gold)).join('')}
    ${diamond(96, 154, 5, v.gold)}${diamond(204, 154, 5, v.gold)}${diamond(150, 142, 5, v.gold)}
    <rect x="30" y="230" width="240" height="3" fill="${v.gold}"/>`,

  /** Star Tours : portique d'embarquement spatioport et tableau des départs */
  spaceport: (g, v) => `
    ${fan(150, 30, 126, 18, v.gold, .2)}
    ${[[44,56],[256,48],[78,30],[222,36]].map(([x,y],i) => diamond(x, y, i % 2 ? 4 : 6, v.gold)).join('')}
    <path d="M52 220 L52 108 Q150 56 248 108 L248 220" fill="none" stroke="${v.gold}" stroke-width="3.5"/>
    <path d="M70 220 L70 118 Q150 76 230 118 L230 220" fill="none" stroke="${v.gold}" stroke-width="1.5" opacity=".7"/>
    <rect x="96" y="124" width="108" height="50" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    ${[0,1,2,3].map((i) => `<rect x="${106 + (i % 2) * 52}" y="${134 + Math.floor(i / 2) * 18}" width="${38 - (i % 2) * 10}" height="8" fill="${v.gold}" opacity="${(.9 - i * .12).toFixed(2)}"/>`).join('')}
    <rect x="40" y="220" width="220" height="6" fill="${v.gold}"/>
    ${[66,110,190,234].map((x) => `<rect x="${x - 5}" y="186" width="10" height="34" fill="${v.gold}" opacity=".8"/>`).join('')}
    <circle cx="150" cy="200" r="16" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <ellipse cx="150" cy="200" rx="30" ry="8" fill="none" stroke="${v.gold}" stroke-width="2" transform="rotate(-18 150 200)"/>`,

  /** Buzz Lightyear : cible concentrique et faisceau */
  target: (g, v) => `
    ${fan(150, 232, 180, 18, v.gold, .2)}
    <circle cx="150" cy="112" r="82" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <circle cx="150" cy="112" r="62" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="112" r="42" fill="none" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="112" r="22" fill="${v.gold}"/>
    ${[0,1,2,3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return `<line x1="${(150 + Math.cos(a) * 82).toFixed(1)}" y1="${(112 + Math.sin(a) * 82).toFixed(1)}" x2="${(150 + Math.cos(a) * 104).toFixed(1)}" y2="${(112 + Math.sin(a) * 104).toFixed(1)}" stroke="${v.gold}" stroke-width="3"/>`; }).join('')}
    <path d="M44 232 L140 124" stroke="${v.gold}" stroke-width="4" opacity=".9"/>
    <path d="M44 232 L140 124" stroke="${g.a}" stroke-width="1.4" stroke-dasharray="5 7"/>
    <path d="M24 236 L58 236 L66 222 L32 222Z" fill="${v.gold}"/>
    ${[['M212 60',6],['M236 92',4],['M74 70',5],['M58 136',4]].map(([d, r]) => diamond(Number(d.slice(1).split(' ')[0]), Number(d.split(' ')[1]), r, v.gold)).join('')}`,

  /** Orbitron : planétaire mécanique, anneaux et machines volantes */
  orrery: (g, v) => `
    ${fan(150, 124, 136, 20, v.gold, .18)}
    <circle cx="150" cy="124" r="26" fill="${v.gold}"/>
    <circle cx="150" cy="124" r="34" fill="none" stroke="${v.gold}" stroke-width="1.5" opacity=".7"/>
    ${[[96,16,-22],[122,12,14],[148,9,-8]].map(([rx, ry, rot]) => `<ellipse cx="150" cy="124" rx="${rx}" ry="${ry}" fill="none" stroke="${v.gold}" stroke-width="2.5" transform="rotate(${rot} 150 124)"/>`).join('')}
    <circle cx="246" cy="98" r="13" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="58" cy="146" r="10" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="192" cy="186" r="8" fill="${v.gold}"/>
    ${[[88,74,-30],[214,160,24]].map(([x, y, rot]) => `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x} ${y - 20} L${x + 9} ${y + 8} L${x} ${y + 16} L${x - 9} ${y + 8}Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.8"/><path d="M${x - 9} ${y + 6} L${x - 18} ${y + 20} L${x - 3} ${y + 14}Z M${x + 9} ${y + 6} L${x + 18} ${y + 20} L${x + 3} ${y + 14}Z" fill="${v.gold}"/></g>`).join('')}
    ${[0,1,2,3,4,5,6,7].map((i) => { const a = i * Math.PI / 4; return `<line x1="${(150 + Math.cos(a) * 38).toFixed(1)}" y1="${(124 + Math.sin(a) * 38).toFixed(1)}" x2="${(150 + Math.cos(a) * 46).toFixed(1)}" y2="${(124 + Math.sin(a) * 46).toFixed(1)}" stroke="${v.gold}" stroke-width="2"/>`; }).join('')}
    <rect x="146" y="150" width="8" height="78" fill="${v.gold}"/>
    <rect x="112" y="228" width="76" height="8" rx="4" fill="${v.gold}"/>`,

  /** Autopia : volant, route et gratte-ciels miniatures */
  roadster: (g, v) => `
    ${fan(150, 34, 120, 14, v.gold, .18)}
    ${[[36,96],[62,72],[88,110],[212,110],[238,72],[264,96]].map(([x, h]) => `<rect x="${x - 13}" y="${236 - h}" width="26" height="${h}" fill="${g.accent}" stroke="${v.gold}" stroke-width="1.5"/><path d="M${x - 13} ${236 - h} L${x} ${236 - h - 16} L${x + 13} ${236 - h}Z" fill="${v.gold}"/>`).join('')}
    <circle cx="150" cy="126" r="66" fill="none" stroke="${v.gold}" stroke-width="7"/>
    <circle cx="150" cy="126" r="20" fill="${g.accent}" stroke="${v.gold}" stroke-width="3"/>
    ${[0,1,2].map((i) => { const a = i * 2 * Math.PI / 3 - Math.PI / 2; return `<line x1="150" y1="126" x2="${(150 + Math.cos(a) * 62).toFixed(1)}" y2="${(126 + Math.sin(a) * 62).toFixed(1)}" stroke="${v.gold}" stroke-width="6"/>`; }).join('')}
    ${diamond(150, 126, 7, v.gold)}
    <path d="M86 236 L124 196 L176 196 L214 236Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    ${[0,1,2].map((i) => `<rect x="146" y="${200 + i * 13}" width="8" height="8" fill="${v.gold}"/>`).join('')}`,

  /** Les Mystères du Nautilus : hublot riveté et scaphandre */
  porthole: (g, v) => `
    <circle cx="150" cy="118" r="88" fill="${g.accent}" stroke="${v.gold}" stroke-width="4"/>
    <circle cx="150" cy="118" r="68" fill="${g.a}" stroke="${v.gold}" stroke-width="2"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((i) => { const a = i * Math.PI / 8; return `<circle cx="${(150 + Math.cos(a) * 78).toFixed(1)}" cy="${(118 + Math.sin(a) * 78).toFixed(1)}" r="4" fill="${v.gold}"/>`; }).join('')}
    ${[0,1,2,3].map((i) => `<path d="M${98 + i * 6} ${104 + i * 16} q24 -11 48 0 t48 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity="${(.8 - i * .13).toFixed(2)}"/>`).join('')}
    <path d="M128 142 q22 -16 44 0 q-10 20 -22 20 q-12 0 -22 -20Z" fill="${v.gold}" opacity=".85"/>
    <path d="M172 150 L196 138 L196 164Z" fill="${v.gold}" opacity=".85"/>
    <rect x="116" y="212" width="68" height="20" rx="4" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M126 212 L126 196 Q150 182 174 196 L174 212Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <circle cx="150" cy="200" r="9" fill="${v.gold}"/>
    <rect x="18" y="232" width="264" height="3" fill="${v.gold}"/>`,

  /** Welcome to Starport : balise d'atterrissage et portique */
  beacon: (g, v) => `
    ${[0,1,2,3,4].map((i) => `<ellipse cx="150" cy="206" rx="${40 + i * 28}" ry="${10 + i * 7}" fill="none" stroke="${v.gold}" stroke-width="${(2.6 - i * .4).toFixed(1)}" opacity="${(.9 - i * .16).toFixed(2)}"/>`).join('')}
    <path d="M110 206 L132 92 L168 92 L190 206Z" fill="${g.accent}" stroke="${v.gold}" stroke-width="2.5"/>
    <path d="M132 92 L150 50 L168 92Z" fill="${v.gold}"/>
    ${[0,1,2].map((i) => `<rect x="${130 - i * 2}" y="${118 + i * 26}" width="${40 + i * 4}" height="9" fill="${v.gold}" opacity="${(.9 - i * .16).toFixed(2)}"/>`).join('')}
    ${diamond(150, 44, 9, v.gold)}
    ${[0,1,2,3,4,5].map((i) => { const a = -Math.PI + i * Math.PI / 5; return `<path d="M150 56 L${(150 + Math.cos(a) * 126).toFixed(1)} ${(56 + Math.sin(a) * 126).toFixed(1)}" stroke="${v.gold}" stroke-width="1.4" opacity=".4" stroke-dasharray="6 8"/>`; }).join('')}
    ${[[48,112],[252,104],[72,168],[228,172]].map(([x, y], i) => diamond(x, y, i % 2 ? 4 : 5.5, v.gold)).join('')}
    <rect x="30" y="228" width="240" height="4" fill="${v.gold}"/>`,

  /** Frontierland Playground : structure de jeu en bois et toboggan */
  playground: (g, v) => `
    ${fan(150, 36, 118, 14, v.gold, .18)}
    <path d="M96 226 L128 110 L160 226Z" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <path d="M140 226 L172 110 L204 226Z" fill="none" stroke="${v.gold}" stroke-width="3"/>
    <rect x="112" y="128" width="76" height="8" fill="${v.gold}"/>
    <rect x="118" y="136" width="64" height="40" fill="${g.accent}" stroke="${v.gold}" stroke-width="2"/>
    <path d="M106 132 L150 96 L194 132Z" fill="${v.gold}"/>
    <path d="M188 176 Q236 190 232 226" fill="none" stroke="${v.gold}" stroke-width="7" stroke-linecap="round"/>
    <path d="M188 176 Q236 190 232 226" fill="none" stroke="${g.a}" stroke-width="2" stroke-dasharray="5 7"/>
    <rect x="42" y="118" width="7" height="108" fill="${v.gold}"/>
    <rect x="42" y="118" width="68" height="7" fill="${v.gold}"/>
    <line x1="66" y1="125" x2="66" y2="180" stroke="${v.gold}" stroke-width="2"/>
    <line x1="92" y1="125" x2="92" y2="180" stroke="${v.gold}" stroke-width="2"/>
    <rect x="60" y="180" width="38" height="8" rx="4" fill="${v.gold}"/>
    <rect x="18" y="226" width="264" height="4" fill="${v.gold}"/>
    ${[0,1,2,3,4,5,6,7,8].map((i) => `<path d="M${22 + i * 31} 238 q8 -7 16 0" fill="none" stroke="${v.gold}" stroke-width="2" opacity=".5"/>`).join('')}`
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
