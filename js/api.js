/**
 * Temps d'attente Queue-Times.
 *
 * Queue-Times n'envoie aucun en-tête CORS : un navigateur ne peut pas l'appeler
 * directement. Il faut un intermédiaire. Routes, de la plus fiable à la moins sûre :
 *   1. le Worker personnalisé, s'il est configuré — direct et frais ;
 *   2. le relevé déposé par GitHub Actions, servi par le même domaine — sûr, jusqu'à 10 min d'âge ;
 *   3. l'appel direct, au cas où l'API ajouterait les en-têtes un jour ;
 *   4. un proxy public — dépanne, mais se bloque souvent.
 * Dernier recours : le dernier relevé réussi, gardé dans le navigateur.
 * Rien n'est inventé, et l'âge de la donnée est toujours remonté à l'interface.
 */
import { CONFIG } from './config.js';

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE_KEY = 'chroniques-dernier-releve';

async function fetchJson(url, timeout) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const valid = (j) => j && (j.lands || j.rides);

/* ---------- Relevé déposé par GitHub Actions ---------- */

let snapshotPromise = null;
/** Un seul téléchargement sert les deux parcs. */
function loadSnapshot() {
  if (!snapshotPromise) {
    snapshotPromise = fetchJson(CONFIG.SNAPSHOT_URL, CONFIG.TIMEOUT_MS.snapshot)
      .then((j) => (j && j.parks ? j : null))
      .catch(() => null);
  }
  return snapshotPromise;
}

/* ---------- Cache navigateur ---------- */

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(parkId, json) {
  try {
    const all = readCache() || { parks: {} };
    all.parks[parkId] = json;
    all.releve = new Date().toISOString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch { /* stockage indisponible : on continue sans */ }
}

/* ---------- Interrogation d'un parc ---------- */

async function fetchPark(queueTimesId) {
  const target = CONFIG.QUEUE_TIMES_URL(queueTimesId);
  const t = CONFIG.TIMEOUT_MS;
  const tried = [];

  // 1. Worker personnalisé
  if (CONFIG.WORKER_URL) {
    try {
      const json = await fetchJson(`${CONFIG.WORKER_URL}?park=${queueTimesId}`, t.worker);
      if (!valid(json)) throw new Error('format inattendu');
      return { json, via: 'worker', age: null };
    } catch (err) { tried.push(`worker : ${describe(err, t.worker)}`); }
  }

  // 2. Relevé GitHub Actions
  const snap = await loadSnapshot();
  const fromSnap = snap?.parks?.[String(queueTimesId)];
  if (valid(fromSnap)) return { json: fromSnap, via: 'relevé', age: snap.releve };

  // 3. Appel direct
  try {
    const json = await fetchJson(target, t.direct);
    if (!valid(json)) throw new Error('format inattendu');
    return { json, via: 'direct', age: null };
  } catch (err) { tried.push(`direct : ${describe(err, t.direct)}`); }

  // 4. Proxies publics, deux essais chacun
  for (let i = 0; i < CONFIG.PUBLIC_PROXIES.length; i++) {
    const p = CONFIG.PUBLIC_PROXIES[i];
    for (let n = 1; n <= 2; n++) {
      try {
        const raw = await fetchJson(p.url(target), t.proxy);
        const json = p.unwrap ? p.unwrap(raw) : raw;
        if (!valid(json)) throw new Error('format inattendu');
        return { json, via: 'proxy ' + (i + 1), age: null };
      } catch (err) {
        if (n === 2) tried.push(`proxy ${i + 1} : ${describe(err, t.proxy)}`);
        else await pause(CONFIG.STAGGER_MS);
      }
    }
  }

  // 5. Dernier relevé gardé dans ce navigateur
  const cache = readCache();
  const fromCache = cache?.parks?.[String(queueTimesId)];
  if (valid(fromCache)) return { json: fromCache, via: 'cache', age: cache.releve };

  throw new Error(tried.join(' · '));
}

const describe = (err, timeout) =>
  err.name === 'AbortError' ? `délai dépassé (${timeout / 1000} s)` : err.message;

/* ---------- Association attraction ↔ ligne de l'API ---------- */

function flattenRides(json) {
  const out = [];
  (json.lands || []).forEach((land) => (land.rides || []).forEach((r) => out.push(r)));
  (json.rides || []).forEach((r) => out.push(r));
  return out;
}

/** Ne retient jamais une file « Single Rider » si la file principale existe. */
function findRide(rides, aliases) {
  const wanted = aliases.map(norm);
  const named = rides
    .map((r) => ({ r, n: norm(r.name) }))
    .sort((a, b) => Number(a.n.includes('single rider')) - Number(b.n.includes('single rider')));
  return (
    named.find((x) => wanted.includes(x.n))?.r ||
    named.find((x) => wanted.some((w) => x.n.startsWith(w)))?.r ||
    named.find((x) => wanted.some((w) => x.n.includes(w) || w.includes(x.n)))?.r ||
    null
  );
}

/**
 * Retourne { entries, mode, via, age, failures }
 * mode : 'live' | 'partial' | 'unavailable'
 * age  : date ISO du relevé quand la donnée n'est pas en direct, sinon null
 */
export async function loadWaitTimes(parks, attractions) {
  const entries = new Map();
  const failures = [];
  const sources = new Set();
  let ages = [];
  let livePark = 0;

  if (CONFIG.LIVE_ENABLED === false) return { entries, mode: 'unavailable', via: '', age: null, failures };

  snapshotPromise = null; // un relevé frais à chaque actualisation

  // Les parcs sont interrogés l'un après l'autre : en parallèle, les proxies
  // publics refusent le second appel.
  for (let i = 0; i < parks.length; i++) {
    if (i > 0) await pause(CONFIG.STAGGER_MS);
    try {
      const res = await fetchPark(parks[i].queueTimesId);
      livePark++;
      sources.add(res.via);
      if (res.age) ages.push(res.age);
      const rides = flattenRides(res.json);
      attractions
        .filter((a) => a.park === parks[i].id)
        .forEach((a) => {
          const ride = findRide(rides, a.queueTimes?.aliases || [a.name]);
          if (ride) {
            entries.set(a.id, {
              open: !!ride.is_open,
              wait: ride.is_open ? Number(ride.wait_time) || 0 : null,
              source: res.via
            });
          }
        });
      if (res.via === 'worker' || res.via === 'direct' || res.via.startsWith('proxy')) {
        writeCache(parks[i].queueTimesId, res.json);
      }
    } catch (err) {
      failures.push(`${parks[i].name} — ${err.message}`);
    }
  }

  const mode = livePark === 0 ? 'unavailable' : livePark < parks.length ? 'partial' : 'live';
  // La donnée la plus ancienne décide de l'âge affiché.
  const age = ages.length ? ages.sort()[0] : null;
  return { entries, mode, via: [...sources].join(' + '), age, failures };
}
