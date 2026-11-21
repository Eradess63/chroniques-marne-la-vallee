/**
 * Proxy CORS minimal pour Queue-Times (Cloudflare Workers).
 * Déploiement : wrangler deploy, puis renseigner l'URL dans js/config.js (WORKER_URL).
 * Usage : https://votre-worker.workers.dev/?park=4  ou  ?park=28
 */
const ALLOWED_PARKS = new Set(['4', '28']);

export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=60'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const park = new URL(request.url).searchParams.get('park');
    if (!ALLOWED_PARKS.has(park)) {
      return new Response(JSON.stringify({ error: 'Parc non autorisé' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const upstream = await fetch(`https://queue-times.com/parks/${park}/queue_times.json`, {
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
