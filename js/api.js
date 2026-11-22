/**
 * Temps d'attente, via l'API publique ThemeParks.wiki.
 *
 * Elle autorise le CORS : la page l'interroge directement, sans proxy ni
 * relevé intermédiaire. Elle fournit aussi ce que Queue-Times ne donnait
 * pas — le statut réel d'exploitation, l'attente Single Rider, et le prix
 * et le créneau de retour du Premier Access.
 *
 * Rien n'est inventé : sans réponse, l'attraction reste sans statut.
 */
import { CONFIG } from './config.js';

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const CACHE_KEY = 'chroniques-dernier-releve';

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

/* ---------- Cache navigateur, dernier recours ---------- */

function readCache() {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function writeCache(parkId, liveData) {
  try {
    const all = readCache() || { parks: {} };
    all.parks[parkId] = liveData;
    all.releve = new Date().toISOString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch { /* stockage indisponible */ }
}

/* ---------- Association attraction ↔ ligne de l'API ---------- */

/** Ne retient jamais une file « Single Rider » séparée si la principale existe. */
function findEntry(entries, aliases) {
  const wanted = aliases.map(norm);
  const named = entries
    .map((e) => ({ e, n: norm(e.name) }))
    .sort((a, b) => Number(a.n.includes('single rider')) - Number(b.n.includes('single rider')));
  return (
    named.find((x) => wanted.includes(x.n))?.e ||
    named.find((x) => wanted.some((w) => x.n.startsWith(w)))?.e ||
    named.find((x) => wanted.some((w) => x.n.includes(w) || w.includes(x.n)))?.e ||
    null
  );
}

/** Traduit le statut de l'API en l'un des quatre états du site. */
function kindOf(status) {
  switch (status) {
    case 'OPERATING': return 'open';
    case 'REFURBISHMENT': return 'refurb';
    case 'DOWN': return 'down';
    case 'CLOSED': return 'closed';
    default: return 'unknown';
  }
}

function readEntry(e) {
  const q = e.queue || {};
  const standby = q.STANDBY?.waitTime;
  const prt = q.PAID_RETURN_TIME;
  return {
    kind: kindOf(e.status),
    wait: typeof standby === 'number' ? standby : null,
    singleRider: typeof q.SINGLE_RIDER?.waitTime === 'number' ? q.SINGLE_RIDER.waitTime : null,
    premier: prt && prt.state === 'AVAILABLE'
      ? { prix: prt.price?.formatted || null, debut: prt.returnStart || null, fin: prt.returnEnd || null }
      : null,
    updated: e.lastUpdated || null,
    source: 'live'
  };
}

/**
 * Retourne { entries, mode, via, age, failures }
 * mode : 'live' | 'partial' | 'unavailable'
 */
export async function loadWaitTimes(parks, attractions) {
  const entries = new Map();
  const failures = [];
  let livePark = 0;
  let ages = [];
  let via = 'ThemeParks.wiki';

  if (CONFIG.LIVE_ENABLED === false) return { entries, mode: 'unavailable', via: '', age: null, failures };

  // Les deux parcs en parallèle : l'API n'impose pas de limite de débit stricte.
  const res = await Promise.allSettled(parks.map((p) =>
    fetchJson(`${CONFIG.API}/entity/${CONFIG.PARKS[p.id]}/live`)));

  res.forEach((r, i) => {
    const park = parks[i];
    let liveData = null;

    if (r.status === 'fulfilled' && Array.isArray(r.value?.liveData)) {
      liveData = r.value.liveData;
      writeCache(park.id, liveData);
    } else {
      const cache = readCache();
      if (Array.isArray(cache?.parks?.[park.id])) {
        liveData = cache.parks[park.id];
        if (cache.releve) ages.push(cache.releve);
        via = 'cache';
      } else {
        failures.push(`${park.name} — ${r.reason?.message || 'pas de réponse'}`);
        return;
      }
    }

    livePark++;
    attractions.filter((a) => a.park === park.id).forEach((a) => {
      const hit = findEntry(liveData, a.queueTimes?.aliases || [a.name]);
      if (hit) entries.set(a.id, readEntry(hit));
    });
  });

  const mode = livePark === 0 ? 'unavailable' : livePark < parks.length ? 'partial' : 'live';
  return { entries, mode, via, age: ages.length ? ages.sort()[0] : null, failures };
}
