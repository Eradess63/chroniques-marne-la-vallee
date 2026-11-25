/*
 * Journal de visites : ce que j'ai fait, jour par jour.
 *
 * Gardé dans le navigateur (clé carnet-journal-v1, synchronisée entre
 * appareils), partagé entre le plan, les restaurants et les Chroniques :
 *   { "2026-12-04": [{ k: 'a'|'d'|'s' (attraction, restaurant, boutique), name, t: horodatage, wait?: min, lat?, lng? }] }
 *
 *   journal.button(kind, name, extra?) → bouton « Fait aujourd'hui » à bascule
 *   journal.toggle(kind, name, extra?) / add / remove / has(kind, name)
 *   journal.days()               → { jour: [entrées] }
 *   journal.onChange(fn)
 * L'attente notée est celle affichée en direct au moment de cocher.
 */
(() => {
  const KEY = 'carnet-journal-v1';
  const listeners = new Set();
  const parisDay = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = () => parisDay.format(new Date());
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const write = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} listeners.forEach(f => { try { f(d); } catch {} }); envoyerResume(d); };
  /* Résumé du jour pour la notification du soir (envoyée par le serveur après
     le train du retour). Regroupé : un envoi 15 s après la dernière coche. */
  let minuteur = 0;
  function envoyerResume(d) {
    if (document.documentElement.hasAttribute('data-invite') || location.hostname.endsWith('github.io')) return;
    clearTimeout(minuteur);
    minuteur = setTimeout(() => {
      const j = today(), l = (d[j] || []).slice().sort((a, b) => a.t - b.t), att = l.filter(e => e.k === 'a');
      let m = 0, prev = null;
      for (const e of l) if (e.lat != null) { if (prev) { const r = Math.PI / 180, h = Math.sin((e.lat - prev.lat) * r / 2) ** 2 + Math.cos(prev.lat * r) * Math.cos(e.lat * r) * Math.sin((e.lng - prev.lng) * r / 2) ** 2; m += 2 * 6371000 * Math.asin(Math.sqrt(h)) * 1.3; } prev = e; }
      fetch('/api/push/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jour: j, attractions: att.length, repas: l.filter(e => e.k === 'd').length, file: att.reduce((s, e) => s + (e.wait || 0), 0), km: m / 1000, top: att.length ? att[att.length - 1].name : '' }), keepalive: true }).catch(() => {});
    }, 15000);
  }
  const fold = v => String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
  const match = (e, kind, name) => e.k === kind && fold(e.name) === fold(name);

  // Coordonnées et attente du moment, quand la page les connaît.
  function context(kind, name) {
    const out = {};
    const pts = window.parkMapPoints?.[kind] || {};
    const hit = pts[name] || Object.entries(pts).find(([n]) => fold(n) === fold(name))?.[1];
    if (hit) { out.lat = hit[0]; out.lng = hit[1]; }
    if (kind === 'a' && hit?.[2] && window.parkLive) {
      const info = window.parkLive.get(hit[2]);
      if (info?.status === 'OPERATING' && typeof info.wait === 'number') out.wait = info.wait;
    }
    return out;
  }

  const has = (kind, name, day = today()) => (read()[day] || []).some(e => match(e, kind, name));
  function add(kind, name, extra = {}) {
    const d = read(), day = today();
    if ((d[day] || []).some(e => match(e, kind, name))) return;
    const e = { k: kind, name, t: Date.now(), ...context(kind, name) };
    for (const [k, v] of Object.entries(extra)) if (v != null && v !== '') e[k] = v;
    (d[day] ||= []).push(e);
    write(d);
  }
  function remove(kind, name, day = today()) {
    const d = read();
    if (!d[day]) return;
    d[day] = d[day].filter(e => !match(e, kind, name));
    if (!d[day].length) delete d[day];
    write(d);
  }
  function toggle(kind, name, extra) {
    if (has(kind, name)) { remove(kind, name); return false; }
    add(kind, name, extra); return true;
  }

  const style = document.createElement('style');
  style.textContent = `
  .jrnBtn{display:inline-flex;align-items:center;gap:6px;border:1px solid #84c7a099;background:transparent;color:#9be0b4;border-radius:999px;padding:6px 12px;font:600 12px 'Jost',Arial,sans-serif;cursor:pointer;white-space:nowrap}
  .jrnBtn:hover,.jrnBtn:focus-visible{background:#84c7a01f;outline:none}
  .jrnBtn[aria-pressed="true"]{background:#84c7a0;color:#1b1418;border-color:#84c7a0}`;
  document.head.append(style);
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = (kind, on) => on ? (kind === 's' ? '✓ Visitée aujourd’hui' : '✓ Fait aujourd’hui') : kind === 'd' ? '🍽 Mangé ici aujourd’hui' : kind === 's' ? '🛍 Visitée aujourd’hui' : '☐ Fait aujourd’hui';
  // extra : { wait, lat, lng } connus de la page (attente affichée, position du repère).
  function button(kind, name, extra) {
    const on = has(kind, name);
    const x = extra && Object.keys(extra).length ? ` data-jrn-extra="${esc(JSON.stringify(extra))}"` : '';
    return `<button type="button" class="jrnBtn" data-jrn-kind="${kind}" data-jrn-name="${esc(name)}"${x} aria-pressed="${on}">${label(kind, on)}</button>`;
  }
  function refreshButtons() {
    for (const b of document.querySelectorAll('[data-jrn-name]')) {
      const on = has(b.dataset.jrnKind, b.dataset.jrnName);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = label(b.dataset.jrnKind, on);
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-jrn-name]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    let extra;
    try { extra = b.dataset.jrnExtra ? JSON.parse(b.dataset.jrnExtra) : undefined; } catch {}
    toggle(b.dataset.jrnKind, b.dataset.jrnName, extra);
    refreshButtons();
  }, true);
  addEventListener('storage', e => { if (e.key === KEY) refreshButtons(); });

  window.journal = { KEY, today, has, add, remove, toggle, button, days: read, onChange(fn) { listeners.add(fn); } };
})();
