/**
 * Mon parcours : les attractions épinglées et celles déjà faites.
 *
 * Tout tient dans le navigateur. Rien n'est envoyé nulle part, et rien n'est
 * partagé entre deux appareils : c'est le carnet de celui qui est dans le parc,
 * pas un compte. Le stockage local peut être refusé (navigation privée, réglage
 * strict) — dans ce cas on garde tout en mémoire pour la durée de la visite
 * plutôt que de planter.
 */

const CLE = 'chroniques:parcours';
let memoire = null;

function lire() {
  if (memoire) return memoire;
  memoire = { epingles: [], faits: [] };
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const o = JSON.parse(brut);
      if (Array.isArray(o.epingles)) memoire.epingles = o.epingles;
      if (Array.isArray(o.faits)) memoire.faits = o.faits;
    }
  } catch { /* stockage indisponible : la mémoire suffira */ }
  return memoire;
}

function ecrire() {
  try { localStorage.setItem(CLE, JSON.stringify(memoire)); } catch { /* idem */ }
}

function bascule(liste, id) {
  const i = liste.indexOf(id);
  if (i === -1) liste.push(id); else liste.splice(i, 1);
  ecrire();
  return i === -1;
}

export const estEpingle = (id) => lire().epingles.includes(id);
export const estFait = (id) => lire().faits.includes(id);
export const basculeEpingle = (id) => bascule(lire().epingles, id);
export const basculeFait = (id) => bascule(lire().faits, id);
export const epingles = () => [...lire().epingles];

/** Combien d'épinglées, et combien déjà faites parmi elles. */
export function bilan() {
  const p = lire();
  return { epingles: p.epingles.length, faits: p.epingles.filter((id) => p.faits.includes(id)).length };
}

/** Vide le carnet — proposé seulement depuis le bandeau du parcours. */
export function videParcours() {
  memoire = { epingles: [], faits: [] };
  ecrire();
}
