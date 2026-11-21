/**
 * Temps d'attente Queue-Times, sans données simulées.
 * Ordre d'essai : Worker personnalisé, appel direct, puis proxies publics.
 * Une attraction sans donnée reste « indisponible » : rien n'est inventé.
 */
import { CONFIG } from './config.js';

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
  // Les files « Single Rider » sont listées à part : on ne les retient qu'en dernier recours.
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
 * Retourne { entries: Map(id → état), mode: 'live' | 'partial' | 'unavailable', via }
 * Une entrée n'existe que si Queue-Times a répondu pour cette attraction.
 */
export async function loadWaitTimes(parks, attractions) {
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
