/*
 * Plan des Parcs : un clic sur le nom d'une boutique ou d'un restaurant ouvre
 * le plan illustré officiel et y vole, en zoomant, jusqu'à l'emplacement.
 *
 * Le plan est celui du site Disneyland Paris, découpé en tuiles de 512 px
 * (media.disneylandparis.com/mapTiles/images/{z}/{x}/{y}.jpg, niveaux 15 à 19,
 * découpage Web Mercator classique). Les tuiles sont chargées à la demande :
 * rien n'alourdit le Worker, et le plan reste net à tous les niveaux de zoom.
 *
 * Usage : tout élément portant data-map-kind ("s" boutique, "d" restaurant) et
 * data-map-name ouvre le plan au clic. Les coordonnées viennent de
 * park-map-data.js (window.parkMapPoints).
 */
(() => {
  const TILE_URL = (z, x, y) => `https://media.disneylandparis.com/mapTiles/images/${z}/${x}/${y}.jpg`;
  const TILE = 256;            // taille d'affichage d'une tuile (image 512 px : nette sur écran Retina)
  const Z_MIN = 15, Z_MAX = 19; // niveaux de tuiles disponibles
  const ZOOM_MIN = 15, ZOOM_MAX = 20;
  // Étendue des tuiles au niveau 15 ; au-delà, le fond reprend la couleur du plan.
  const BOUNDS15 = { x0: 16633, x1: 16642, y0: 11266, y1: 11278 };
  const BACKGROUND = '#a3bf62';
  const OVERVIEW = { lat: 48.8702, lng: 2.7775, zoom: 15.7 };
  const TARGET_ZOOM = 18.4;

  /* ---------- Coordonnées ---------- */
  const normalize = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’`]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
  // Index construit à la première demande (et refait si window.parkMapPoints
  // change) : une page peut fournir ses coordonnées après ce script.
  let index = null, source = null;
  const findPoint = (kind, name) => {
    if (source !== window.parkMapPoints) {
      source = window.parkMapPoints;
      index = {};
      for (const [k, list] of Object.entries(source || {})) {
        index[k] = new Map(Object.entries(list).map(([n, point]) => [normalize(n), point]));
      }
    }
    return index[kind]?.get(normalize(name)) || null;
  };
  // Mercator normalisé : x et y entre 0 et 1 sur le monde entier.
  const project = (lat, lng) => {
    const s = Math.sin(lat * Math.PI / 180);
    return { x: (lng + 180) / 360, y: 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI) };
  };
  window.parkMapHas = (kind, name) => !!findPoint(kind, name);
  // Identifiant Disney (P1MB05…) : sert au statut ouvert / fermé.
  window.parkPlaceId = (kind, name) => findPoint(kind, name)?.[2] || null;
  window.parkPlacePoint = (kind, name) => findPoint(kind, name);

  /* ---------- Styles ---------- */
  const css = `
  .pmLink{all:unset;cursor:pointer;display:inline;color:inherit;font:inherit;text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--accent,#d4a95b) 55%,transparent);text-decoration-thickness:1px;text-underline-offset:4px;transition:color .18s,text-decoration-color .18s}
  .pmLink:hover,.pmLink:focus-visible{color:var(--accent-strong,#f3d79a);text-decoration-color:currentColor}
  .pmLink:focus-visible{outline:2px solid var(--accent,#d4a95b);outline-offset:3px;border-radius:3px}
  .pmLink .pmPinIcon{display:inline-block;margin-left:7px;font-size:.78em;color:var(--accent,#d4a95b);text-decoration:none;vertical-align:.08em}
  .pmOverlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));background:#06040acc;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .28s ease}
  .pmOverlay.pmOpen{opacity:1}
  .pmDialog{position:relative;width:min(1100px,100%);height:min(780px,100%);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--line,#6b5a3e);border-radius:18px;background:var(--bg2,#1b1712);box-shadow:0 30px 90px #000a;transform:translateY(18px) scale(.97);transition:transform .38s cubic-bezier(.2,.8,.2,1)}
  .pmOpen .pmDialog{transform:none}
  .pmHead{display:flex;align-items:center;gap:14px;padding:14px 16px 14px 20px;border-bottom:1px solid var(--line,#6b5a3e)}
  .pmHead div{flex:1;min-width:0}
  .pmHead small{display:block;font:600 10px var(--body,'Jost',sans-serif);letter-spacing:1.6px;text-transform:uppercase;color:var(--accent,#d4a95b)}
  .pmHead h2{margin:3px 0 0;font:500 clamp(18px,2.4vw,24px)/1.2 var(--serif,'Cinzel',serif);color:var(--ink,#f3eadf);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pmBtn{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;border:1px solid var(--line,#6b5a3e);background:#0000002e;color:var(--ink,#f3eadf);font:20px/1 var(--body,'Jost',sans-serif);cursor:pointer;transition:background .18s,border-color .18s}
  .pmBtn:hover,.pmBtn:focus-visible{border-color:var(--accent,#d4a95b);background:#ffffff14;outline:none}
  .pmView{position:relative;flex:1;overflow:hidden;background:${BACKGROUND};cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
  .pmView.pmDragging{cursor:grabbing}
  .pmView img{position:absolute;display:block;max-width:none;pointer-events:none;-webkit-user-drag:none}
  .pmLayer{position:absolute;inset:0;z-index:1}
  .pmPin{position:absolute;width:0;height:0;pointer-events:none;z-index:3}
  .pmPin svg{position:absolute;left:-19px;top:-50px;width:38px;height:50px;filter:drop-shadow(0 6px 6px #0007);transform-origin:50% 100%}
  .pmPin.pmDrop svg{animation:pmDrop .6s cubic-bezier(.3,1.4,.5,1) both}
  .pmPin::before{content:'';position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:3px solid #e03a3a;opacity:0}
  .pmPin.pmDrop::before{animation:pmPulse 1.6s ease-out .45s 3}
  .pmLabel{position:absolute;left:0;top:-62px;transform:translateX(-50%);white-space:nowrap;padding:5px 10px;border-radius:7px;background:#1b1418ee;color:#fff;font:600 12px var(--body,'Jost',sans-serif);box-shadow:0 4px 12px #0006;opacity:0;transition:opacity .3s}
  .pmPin.pmDrop .pmLabel{opacity:1;transition-delay:.45s}
  @keyframes pmDrop{0%{transform:translateY(-70px) scale(.6);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}
  @keyframes pmPulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.2);opacity:0}}
  .pmMe{position:absolute;width:0;height:0;z-index:2;pointer-events:none}
  .pmMe::before{content:'';position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#2f80ff;border:3px solid #fff;box-shadow:0 0 0 6px #2f80ff40,0 2px 6px #0006}
  .pmPreview{all:unset;position:relative;display:block;width:100%;aspect-ratio:4/3;overflow:hidden;background:${BACKGROUND};cursor:zoom-in;line-height:0}
  .pmPreview img{position:absolute;width:256px;height:256px;max-width:none;pointer-events:none}
  .pmPreview .pmPin{left:50%;top:50%}
  .pmPreview .pmPin svg{animation:none}
  .pmPreviewHint{position:absolute;right:8px;bottom:8px;padding:4px 9px;border-radius:999px;background:#1b1418dd;color:#fff;font:600 11px/1.3 var(--body,'Jost',sans-serif);line-height:1.3}
  .pmPreview:hover .pmPreviewHint,.pmPreview:focus-visible .pmPreviewHint{background:#000}
  .pmPreview:focus-visible{outline:2px solid var(--accent,#d4a95b);outline-offset:-2px}
  .pmControls{position:absolute;right:12px;bottom:12px;z-index:4;display:flex;flex-direction:column;gap:8px}
  .pmControls .pmBtn{background:#1b1418dd;color:#fff;border-color:#ffffff40}
  .pmCredit{position:absolute;left:10px;bottom:8px;z-index:4;padding:3px 8px;border-radius:6px;background:#ffffffcc;color:#333;font:11px var(--body,'Jost',sans-serif)}
  .pmMissing{position:absolute;inset:auto 0 50% 0;z-index:4;text-align:center;font:14px var(--body,'Jost',sans-serif);color:#1d2a10}
  /* Plein écran sur téléphone : l'en-tête et les boutons s'écartent de l'heure,
     de la batterie (encoche) et de la barre d'accueil de l'iPhone. */
  @media (max-width:640px){
    .pmOverlay{padding:0}
    .pmDialog{height:100%;height:100dvh;border-radius:0;border:0}
    .pmHead{padding-top:calc(12px + env(safe-area-inset-top));padding-left:calc(18px + env(safe-area-inset-left));padding-right:calc(14px + env(safe-area-inset-right))}
    .pmControls{right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom))}
    .pmCredit{left:calc(10px + env(safe-area-inset-left));bottom:calc(8px + env(safe-area-inset-bottom))}
  }
  @media (prefers-reduced-motion:reduce){.pmOverlay,.pmDialog{transition:none}.pmPin.pmDrop svg,.pmPin.pmDrop::before{animation:none}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  /* ---------- Visionneuse ---------- */
  let ui = null;          // éléments de la fenêtre ouverte
  let view = null;        // { cx, cy, zoom } : centre en Mercator normalisé, zoom fractionnaire
  let anim = 0;           // requestAnimationFrame de l'envol
  let target = null;      // point visé, projeté
  let lastFocus = null;
  const tiles = new Map();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function tileExists(z, x, y) {
    const f = 2 ** (z - 15);
    return x >= BOUNDS15.x0 * f && x < (BOUNDS15.x1 + 1) * f && y >= BOUNDS15.y0 * f && y < (BOUNDS15.y1 + 1) * f;
  }

  function render() {
    if (!ui) return;
    const { width: W, height: H } = ui.view.getBoundingClientRect();
    const wanted = new Set();
    const zTop = clamp(Math.round(view.zoom), Z_MIN, Z_MAX);
    // Le niveau inférieur reste dessous : pas de trou pendant que l'autre charge.
    for (const z of zTop > Z_MIN ? [zTop - 1, zTop] : [zTop]) {
      const world = TILE * 2 ** view.zoom;        // largeur du monde en px CSS au zoom courant
      const size = world / 2 ** z;                 // taille d'une tuile du niveau z
      const left = W / 2 - view.cx * world, top = H / 2 - view.cy * world;
      const x0 = Math.floor(-left / size), x1 = Math.floor((W - left) / size);
      const y0 = Math.floor(-top / size), y1 = Math.floor((H - top) / size);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (!tileExists(z, x, y)) continue;
        const key = `${z}/${x}/${y}`;
        wanted.add(key);
        let img = tiles.get(key);
        if (!img) {
          img = new Image();
          img.alt = '';
          img.decoding = 'async';
          img.style.zIndex = String(z);
          img.src = TILE_URL(z, x, y);
          tiles.set(key, img);
          ui.layer.append(img);
        }
        // +0.5 px : évite les fines lignes entre deux tuiles.
        img.style.transform = `translate(${left + x * size}px,${top + y * size}px)`;
        img.style.width = img.style.height = (size + 0.5) + 'px';
      }
    }
    for (const [key, img] of tiles) if (!wanted.has(key)) { img.remove(); tiles.delete(key); }
    const me = window.nearby?.active && window.nearby.position;
    ui.me.hidden = !me;
    if (me) {
      const p = project(me.lat, me.lng), world = TILE * 2 ** view.zoom;
      ui.me.style.transform = `translate(${W / 2 + (p.x - view.cx) * world}px,${H / 2 + (p.y - view.cy) * world}px)`;
    }
    if (target) {
      const world = TILE * 2 ** view.zoom;
      ui.pin.style.transform = `translate(${W / 2 + (target.x - view.cx) * world}px,${H / 2 + (target.y - view.cy) * world}px)`;
    }
  }

  function zoomAround(newZoom, px, py) {
    const { width: W, height: H } = ui.view.getBoundingClientRect();
    newZoom = clamp(newZoom, ZOOM_MIN, ZOOM_MAX);
    const before = TILE * 2 ** view.zoom, after = TILE * 2 ** newZoom;
    // Le point sous le doigt (ou la souris) reste sous le doigt.
    const mx = view.cx + (px - W / 2) / before, my = view.cy + (py - H / 2) / before;
    view.cx = mx - (px - W / 2) / after;
    view.cy = my - (py - H / 2) / after;
    view.zoom = newZoom;
    render();
  }

  function flyTo(dest, duration, done) {
    cancelAnimationFrame(anim);
    if (reduceMotion) { Object.assign(view, dest); render(); done?.(); return; }
    const from = { ...view }, start = performance.now();
    const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    const step = now => {
      const t = Math.min(1, (now - start) / duration), k = ease(t);
      // Le centre glisse un peu plus vite que le zoom : on voit où l'on va avant d'y plonger.
      const kc = ease(Math.min(1, t * 1.25));
      view.cx = from.cx + (dest.cx - from.cx) * kc;
      view.cy = from.cy + (dest.cy - from.cy) * kc;
      view.zoom = from.zoom + (dest.zoom - from.zoom) * k;
      render();
      if (t < 1) anim = requestAnimationFrame(step); else done?.();
    };
    anim = requestAnimationFrame(step);
  }

  function bindGestures(el) {
    const pointers = new Map();
    let pinch = null;
    el.addEventListener('pointerdown', e => {
      cancelAnimationFrame(anim);
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.classList.add('pmDragging');
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: view.zoom };
      }
    });
    el.addEventListener('pointermove', e => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const rect = el.getBoundingClientRect();
      if (pointers.size === 1) {
        const world = TILE * 2 ** view.zoom;
        view.cx -= (e.clientX - prev.x) / world;
        view.cy -= (e.clientY - prev.y) / world;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        render();
      } else if (pointers.size === 2 && pinch) {
        const [a0, b0] = [...pointers.values()];
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        // Déplacement du milieu des deux doigts, puis zoom autour de ce milieu.
        const world = TILE * 2 ** view.zoom;
        view.cx -= ((a.x + b.x) - (a0.x + b0.x)) / 2 / world;
        view.cy -= ((a.y + b.y) - (a0.y + b0.y)) / 2 / world;
        zoomAround(pinch.zoom + Math.log2(dist / pinch.dist), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
    });
    const up = e => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) el.classList.remove('pmDragging');
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => {
      e.preventDefault();
      cancelAnimationFrame(anim);
      const rect = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAround(view.zoom - delta / 400, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
    el.addEventListener('dblclick', e => {
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const { width: W, height: H } = rect, world = TILE * 2 ** view.zoom;
      const nz = clamp(view.zoom + 1, ZOOM_MIN, ZOOM_MAX), nw = TILE * 2 ** nz;
      const mx = view.cx + (px - W / 2) / world, my = view.cy + (py - H / 2) / world;
      flyTo({ cx: mx - (px - W / 2) / nw, cy: my - (py - H / 2) / nw, zoom: nz }, 350);
    });
  }

  const PIN_SVG = '<svg viewBox="0 0 24 32" aria-hidden="true"><path fill="#e03a3a" stroke="#fff" stroke-width="1.6" d="M12 1C5.9 1 1 5.9 1 12c0 7.6 11 19 11 19s11-11.4 11-19C23 5.9 18.1 1 12 1Z"/><circle cx="12" cy="12" r="4.3" fill="#fff"/></svg>';

  /* Aperçu fixe du plan, centré sur un lieu (fiches attractions). Les tuiles
     sont placées autour du centre de la boîte : aucune mesure n'est nécessaire,
     l'aperçu se dessine dès qu'il est inséré. Un clic ouvre le plan complet. */
  window.parkMapPreview = (kind, name, zoom = 17) => {
    const point = findPoint(kind, name);
    if (!point) return '';
    const p = project(point[0], point[1]), world = TILE * 2 ** zoom;
    const px = p.x * world, py = p.y * world;
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    let tiles = '';
    for (let x = tx - 2; x <= tx + 2; x++) for (let y = ty - 2; y <= ty + 2; y++) {
      if (!tileExists(zoom, x, y)) continue;
      tiles += `<img src="${TILE_URL(zoom, x, y)}" alt="" loading="lazy" decoding="async" style="left:calc(50% + ${Math.round(x * TILE - px)}px);top:calc(50% + ${Math.round(y * TILE - py)}px)">`;
    }
    const safe = String(name).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return `<button type="button" class="pmPreview" data-map-kind="${kind}" data-map-name="${safe}" aria-label="${safe} : ouvrir le plan interactif">${tiles}<span class="pmPin" aria-hidden="true">${PIN_SVG}</span><span class="pmPreviewHint">Agrandir le plan ⤢</span></button>`;
  };

  function open(kind, name, subtitle) {
    close(true);
    const point = findPoint(kind, name);
    lastFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'pmOverlay';
    overlay.innerHTML = `
      <div class="pmDialog" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
        <header class="pmHead">
          <div><small></small><h2 id="pmTitle"></h2></div>
          <button type="button" class="pmBtn" data-pm="close" aria-label="Fermer le plan">✕</button>
        </header>
        <div class="pmView" aria-label="Plan des Parcs Disney">
          <div class="pmLayer"></div>
          <div class="pmPin"><span class="pmLabel"></span>${PIN_SVG}</div>
          <div class="pmMe" hidden title="Ta position"></div>
          <div class="pmControls">
            <button type="button" class="pmBtn" data-pm="in" aria-label="Zoomer">+</button>
            <button type="button" class="pmBtn" data-pm="out" aria-label="Dézoomer">−</button>
            <button type="button" class="pmBtn" data-pm="focus" aria-label="Revenir à l’emplacement">⌖</button>
          </div>
          <span class="pmCredit">Plan © Disneyland Paris</span>
        </div>
      </div>`;
    overlay.querySelector('small').textContent = subtitle || ({ s: 'Boutique', d: 'Restaurant', a: 'Attraction' }[kind] || '');
    overlay.querySelector('h2').textContent = name;
    overlay.querySelector('.pmLabel').textContent = name;
    document.body.append(overlay);
    ui = { overlay, view: overlay.querySelector('.pmView'), layer: overlay.querySelector('.pmLayer'), pin: overlay.querySelector('.pmPin'), me: overlay.querySelector('.pmMe') };
    document.documentElement.style.overflow = 'hidden';

    const start = project(OVERVIEW.lat, OVERVIEW.lng);
    view = { cx: start.x, cy: start.y, zoom: OVERVIEW.zoom };
    target = point ? project(point[0], point[1]) : null;
    if (!target) {
      ui.pin.hidden = true;
      const msg = document.createElement('p');
      msg.className = 'pmMissing';
      msg.textContent = 'Emplacement non référencé sur le plan officiel.';
      ui.view.append(msg);
    }

    bindGestures(ui.view);
    overlay.addEventListener('click', e => {
      const action = e.target.closest('[data-pm]')?.dataset.pm;
      if (e.target === overlay || action === 'close') return close();
      const { width: W, height: H } = ui.view.getBoundingClientRect();
      if (action === 'in' || action === 'out') {
        const nz = clamp(Math.round(view.zoom) + (action === 'in' ? 1 : -1), ZOOM_MIN, ZOOM_MAX);
        const z0 = view.zoom;
        cancelAnimationFrame(anim);
        const t0 = performance.now();
        const step = now => { const t = Math.min(1, (now - t0) / 260); zoomAround(z0 + (nz - z0) * (1 - (1 - t) ** 3), W / 2, H / 2); if (t < 1) anim = requestAnimationFrame(step); };
        anim = requestAnimationFrame(step);
      }
      if (action === 'focus' && target) flyTo({ cx: target.x, cy: target.y, zoom: TARGET_ZOOM }, 900);
    });
    overlay.addEventListener('keydown', trapFocus);
    addEventListener('resize', render);

    render();
    requestAnimationFrame(() => overlay.classList.add('pmOpen'));
    overlay.querySelector('[data-pm="close"]').focus({ preventScroll: true });

    if (target) {
      // Un temps d'arrêt sur la vue d'ensemble, puis l'envol vers l'emplacement.
      setTimeout(() => {
        if (!ui) return;
        flyTo({ cx: target.x, cy: target.y, zoom: TARGET_ZOOM }, 1700, () => ui?.pin.classList.add('pmDrop'));
      }, reduceMotion ? 0 : 380);
    }
  }

  function trapFocus(e) {
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key !== 'Tab') return;
    const items = [...ui.overlay.querySelectorAll('button')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function close(immediate) {
    if (!ui) return;
    cancelAnimationFrame(anim);
    removeEventListener('resize', render);
    const { overlay } = ui;
    ui = null; target = null; tiles.clear();
    document.documentElement.style.overflow = '';
    if (immediate || reduceMotion) overlay.remove();
    else { overlay.classList.remove('pmOpen'); setTimeout(() => overlay.remove(), 300); }
    lastFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-map-name]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.dataset.mapKind, trigger.dataset.mapName, trigger.dataset.mapSubtitle);
  });

  window.nearby?.onChange(() => render());
  window.openParkMap = open;
})();
