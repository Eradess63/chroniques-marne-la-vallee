/*
 * Historique des temps d'attente (relevés toutes les 5 min par le Worker).
 *
 *   waitHistory.load()                → Promise (relit au plus toutes les 4 min)
 *   waitHistory.typical(id, date?)    → { wait, n } attente habituelle à cette heure-là, ou null
 *   waitHistory.curve(id, type?)      → [{ slot, wait, n }] par demi-heure (type 'j' semaine, 'w' week-end)
 *   waitHistory.today(id)             → [[minute, attente]…] relevés du jour
 *   waitHistory.best(id, fromMin?)    → { slot, wait } demi-heure la plus calme (à partir de fromMin)
 *   waitHistory.forecast(id, now, at, current) → attente prévue à l'heure « at »
 *   waitHistory.days                  → nombre de jours de relevés
 *   waitHistory.onChange(fn)
 * Identifiants : ceux de Disney (P1RA00…). Partagé avec les Chroniques.
 */
(() => {
  const API = 'https://carnet-parc-alexandre.alexandre-207cc.workers.dev/api/attentes';
  const MIN_N = 2; // relevés minimum pour parler d'une habitude
  let data = null, at = 0, pending = null;
  const listeners = new Set(), memo = new Map();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function paris(d) {
    const p = Object.fromEntries(parts.formatToParts(d).map(x => [x.type, x.value]));
    return { minute: +p.hour * 60 + +p.minute, type: p.weekday === 'Sat' || p.weekday === 'Sun' ? 'w' : 'j' };
  }
  // Le profil du bon type de jour, sinon l'autre faute de mieux.
  function table(id, type) {
    const m = data?.moyennes || {};
    return m[type]?.[id] || m[type === 'w' ? 'j' : 'w']?.[id] || null;
  }
  const api = {
    get days() { return data?.jours || 0; },
    get since() { return data?.depuis || null; },
    get ready() { return !!data; },
    load() {
      if (Date.now() - at < 4 * 60000 && data) return Promise.resolve(data);
      return pending ??= fetch(location.hostname.endsWith('github.io') ? API : '/api/attentes', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).then(d => { if (d) { data = d; at = Date.now(); listeners.forEach(f => { try { f(); } catch {} }); } return data; })
        .catch(() => data).finally(() => { pending = null; });
    },
    typical(id, date = new Date()) {
      // Mémorisé par demi-heure : l'itinéraire intelligent l'appelle des milliers de fois.
      const k = id + '|' + Math.floor(+date / 1800000) + '|' + at;
      if (memo.has(k)) return memo.get(k);
      const { minute, type } = paris(date), t = table(id, type);
      const c = t?.[Math.floor(minute / 30)];
      // Une « habitude » se lit sur plusieurs jours : pas avant le deuxième.
      const r = api.days >= 2 && c && c[1] >= MIN_N ? { wait: c[0], n: c[1] } : null;
      if (memo.size > 5000) memo.clear();
      memo.set(k, r);
      return r;
    },
    curve(id, type = paris(new Date()).type) {
      if (api.days < 2) return [];
      const t = table(id, type) || {};
      return Object.entries(t).map(([s, [wait, n]]) => ({ slot: +s, wait, n })).filter(x => x.n >= MIN_N).sort((a, b) => a.slot - b.slot);
    },
    today(id) { return data?.aujourdhui?.[id] || []; },
    best(id, fromMin = 0) {
      const c = api.curve(id).filter(x => x.slot * 30 + 30 > fromMin);
      return c.length ? c.reduce((a, b) => (b.wait < a.wait ? b : a)) : null;
    },
    // Attente prévue en arrivant à « later » : l'attente actuelle, corrigée de
    // l'écart habituel entre maintenant et cette heure-là.
    forecast(id, now, later, current) {
      if (typeof current !== 'number') return current;
      const a = api.typical(id, new Date(now)), b = api.typical(id, new Date(later));
      if (!a || !b || Math.abs(later - now) < 20 * 60000) return current;
      const ratio = a.wait > 4 ? b.wait / a.wait : null;
      const f = ratio ? current * ratio : current + (b.wait - a.wait);
      return Math.max(0, Math.round(Math.min(f, current + 90)));
    },
    // Affluence attendue un jour donné (date « AAAA-MM-JJ ») d'après le jour de
    // la semaine : 'calme' | 'moyenne' | 'chargée', ou null faute de recul.
    crowd(date) {
      const sem = data?.semaine || {};
      const known = Object.values(sem).filter(v => v[1] >= 2);
      if (known.length < 4) return null;
      const dow = String(new Date(date + 'T12:00:00Z').getUTCDay()), v = sem[dow];
      if (!v || v[1] < 2) return null;
      const all = known.reduce((a, b) => a + b[0], 0) / known.length;
      const r = v[0] / all;
      return { level: r < 0.88 ? 'calme' : r > 1.12 ? 'chargée' : 'moyenne', wait: Math.round(v[0]), days: v[1] };
    },
    slotLabel: s => `${Math.floor(s / 2)} h ${s % 2 ? '30' : ''}`.trim(),
    onChange(fn) { listeners.add(fn); }
  };
  window.waitHistory = api;
})();
