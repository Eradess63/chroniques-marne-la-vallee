import { posterSVG } from '/home/claude/site/js/posters.js';
import { readFileSync } from 'fs';

// La liste des motifs est lue dans le code source : plus rien à maintenir à la main.
const src = readFileSync('/home/claude/site/js/posters.js','utf8');
const bloc = src.slice(src.indexOf('const MOTIFS = {'), src.indexOf('\nexport function posterSVG'));
const motifs = [...bloc.matchAll(/^  ([a-z][a-z0-9]*):\s*\(g, v\)/gm)].map(m => m[1]);

const vus = new Map(); const pb = [];
for (const m of motifs) {
  const svg = posterSVG(m, 'poster', { label: 'Test', lines: ['A'] }).replace(/p[a-z0-9]{6}/g, 'UID');
  if (!svg.includes('</svg>')) pb.push(`${m} : SVG incomplet`);
  const jumeau = [...vus.entries()].find(([, v]) => v === svg);
  if (jumeau) pb.push(`${m} : dessin IDENTIQUE à ${jumeau[0]}`);
  vus.set(m, svg);
}
console.log(`${motifs.length} motifs dans le code, ${new Set(vus.values()).size} dessins distincts`);

const data = JSON.parse(readFileSync('/home/claude/site/data/attractions.json','utf8'));
const inconnus = [...new Set(data.attractions.filter(a => !motifs.includes(a.motif)).map(a => a.motif))];
if (inconnus.length) pb.push(`motifs absents du code : ${inconnus.join(', ')}`);

// Une attraction rédigée ne doit jamais partager son motif
const parMotif = new Map();
data.attractions.forEach(a => parMotif.set(a.motif, [...(parMotif.get(a.motif) || []), a]));
const partages = [...parMotif.entries()].filter(([, v]) => v.length > 1);
console.log(`\n${data.attractions.length} attractions, ${parMotif.size} motifs utilisés`);
if (partages.length) {
  console.log('Motifs encore partagés (fiches non rédigées) :');
  partages.forEach(([m, v]) => console.log(`  ${m} ×${v.length} : ${v.map(a => a.name).join(' · ')}`));
}
console.log(pb.length ? '\nPROBLÈMES :\n  ' + pb.join('\n  ') : '\nAucun problème bloquant.');
process.exit(pb.length ? 1 : 0);
