/*
 * « Près de moi » : avec l'accord du visiteur, le navigateur donne sa position
 * GPS ; les boutiques et restaurants sont alors triés du plus proche au plus
 * éloigné, avec la distance et le temps de marche sur chaque fiche.
 *
 * Rien ne quitte le téléphone : la position sert au calcul dans la page et
 * n'est envoyée nulle part. La géolocalisation ne démarre que sur un appui
 * sur le bouton, à chaque visite : jamais d'elle-même.
 *
 * Les pages appellent nearby.compare(kind) pour trier, et posent
 * data-near-kind / data-near-name sur l'emplacement du badge de distance.
 */
(() => {
  const SITE = { lat: 48.8705, lng: 2.7795 };   // centre du domaine
  const FAR = 4000;                               // au-delà : « loin du site »
  const WALK = 75;                                // mètres par minute
  const DETOUR = 1.3;                             // les allées ne vont pas tout droit

  let active = false, position = null, watchId = null, error = '';
  const listeners = new Set();

  const style = document.createElement('style');
  style.textContent = `
  .nearBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0 0}
  .nearToggle{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:transparent;color:var(--ink);padding:8px 14px;border-radius:999px;font:600 12px var(--body);cursor:pointer;transition:background .18s,border-color .18s,color .18s}
  .nearToggle:hover,.nearToggle:focus-visible{border-color:var(--accent);outline:none}
  .nearToggle[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#120e14}
  .nearToggle[aria-pressed="true"] .nearDot{background:#120e14;box-shadow:0 0 0 3px #120e1433}
  .nearDot{width:8px;height:8px;border-radius:50%;background:var(--accent)}
  .nearToggle.searching .nearDot{animation:nearBlink 1s ease-in-out infinite}
  @keyframes nearBlink{50%{opacity:.25}}
  .nearInfo{color:var(--muted);font-size:12px}
  .nearInfo.warn{color:#f2c96b}
  .nearDistance{display:inline-flex;align-items:center;gap:5px;font:600 11px var(--body);color:var(--accent-strong);white-space:nowrap}
  .nearDistance:empty{display:none}
  .nearDistance::before{content:'📍';font-size:10px}
  @media (prefers-reduced-motion:reduce){.nearToggle.searching .nearDot{animation:none}}
  `;
  document.head.append(style);

  function metres(a, b) {
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function distanceTo(kind, name) {
    if (!position) return null;
    const point = window.parkPlacePoint?.(kind, name);
    return point ? metres(position, { lat: point[0], lng: point[1] }) : null;
  }

  function describe(m) {
    if (m == null) return '';
    const minutes = Math.max(1, Math.round(m * DETOUR / WALK));
    const dist = m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
    return m > FAR ? dist : `${dist} · ${minutes} min à pied`;
  }

  // Comparateur pour Array.sort : les lieux sans coordonnées passent à la fin.
  function compare(kind, fallback) {
    if (!active || !position) return fallback;
    return (a, b) => {
      const da = distanceTo(kind, a.name), db = distanceTo(kind, b.name);
      if (da == null && db == null) return fallback(a, b);
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    };
  }

  function paint(root = document) {
    for (const el of root.querySelectorAll('[data-near-name]')) {
      el.className = 'nearDistance';
      el.textContent = active ? describe(distanceTo(el.dataset.nearKind, el.dataset.nearName)) : '';
    }
  }

  function notify() { for (const fn of listeners) fn(); paint(); updateBar(); }

  function start() {
    if (!('geolocation' in navigator)) { error = 'Ton navigateur ne donne pas accès à la position.'; active = false; return notify(); }
    active = true; error = '';
    watchId = navigator.geolocation.watchPosition(
      p => { position = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }; error = ''; notify(); },
      e => {
        error = e.code === e.PERMISSION_DENIED
          ? 'Position refusée : autorise-la pour ce site dans les réglages du navigateur.'
          : 'Position introuvable pour le moment.';
        if (e.code === e.PERMISSION_DENIED) stop(true);
        notify();
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    notify();
  }

  function stop(keepError) {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null; active = false; position = null;
    if (!keepError) error = '';
    notify();
  }

  /* ---------- Bouton ---------- */
  let bar = null;
  function updateBar() {
    if (!bar) return;
    const button = bar.querySelector('.nearToggle'), info = bar.querySelector('.nearInfo');
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('searching', active && !position);
    info.classList.remove('warn');
    if (error) { info.textContent = error; info.classList.add('warn'); return; }
    if (!active) { info.textContent = 'Active-le dans les Parcs pour voir ce qui est autour de toi.'; return; }
    if (!position) { info.textContent = 'Recherche de ta position…'; return; }
    const far = metres(position, SITE) > FAR;
    if (far) { info.textContent = 'Tu sembles loin des Parcs : les distances partent de ta position actuelle.'; info.classList.add('warn'); return; }
    info.textContent = position.accuracy > 80
      ? `Triés du plus proche au plus loin · position à ±${Math.round(position.accuracy)} m`
      : 'Triés du plus proche au plus loin';
  }

  function mount() {
    const chips = document.querySelector('#parkChips');
    if (!chips) return;
    bar = document.createElement('div');
    bar.className = 'nearBar';
    bar.innerHTML = '<button type="button" class="nearToggle" aria-pressed="false"><span class="nearDot" aria-hidden="true"></span>Près de moi</button><span class="nearInfo" aria-live="polite"></span>';
    chips.before(bar);
    bar.querySelector('.nearToggle').addEventListener('click', () => active ? stop() : start());
    updateBar();
    const results = document.querySelector('#results');
    if (results) new MutationObserver(() => paint(results)).observe(results, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  window.nearby = {
    compare, describe, distanceTo, paint, start, stop: () => stop(),
    get active() { return active; },
    get position() { return position; },
    get error() { return error; },
    get far() { return !!position && metres(position, SITE) > FAR; },
    onChange(fn) { listeners.add(fn); }
  };
})();
