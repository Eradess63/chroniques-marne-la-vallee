/*
 * Itinéraire partagé entre le plan (/plan), les Chroniques, les boutiques et
 * les restaurants : une liste d'étapes « type|nom » gardée dans le navigateur
 * (même clé partout, même domaine).
 *
 *   type : a attraction · d restaurant · s boutique · e spectacle
 *
 * Un bouton <button data-iti-kind="a" data-iti-name="…"> bascule l'étape ;
 * son libellé suit l'état. Après un ajout, un petit message propose d'ouvrir
 * le plan.
 */
(() => {
  const KEY = 'carnet-itineraire-v1';
  const listeners = new Set();
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} };
  const fold = v => String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9]+/g, ' ').trim();
  const same = (a, b) => a.split('|')[0] === b.split('|')[0] && fold(a.split('|').slice(1).join('|')) === fold(b.split('|').slice(1).join('|'));

  const has = (kind, name) => read().some(k => same(k, kind + '|' + name));
  function toggle(kind, name) {
    const key = kind + '|' + name, list = read();
    const next = list.some(k => same(k, key)) ? list.filter(k => !same(k, key)) : [...list, key];
    write(next);
    for (const fn of listeners) fn(next);
    return next.some(k => same(k, key));
  }

  const style = document.createElement('style');
  style.textContent = `
  .itiBtn{display:inline-flex;align-items:center;gap:6px;border:1px solid #ffd76a99;background:transparent;color:#ffd76a;border-radius:999px;padding:6px 12px;font:600 12px 'Jost',Arial,sans-serif;cursor:pointer;white-space:nowrap;transition:background .18s,color .18s}
  .itiBtn:hover,.itiBtn:focus-visible{background:#ffd76a1f;outline:none}
  .itiBtn[aria-pressed="true"]{background:#ffd76a;color:#1b1418;border-color:#ffd76a}
  .itiToast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));z-index:9998;display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:999px;background:#1b1418f2;color:#fff;border:1px solid #ffd76a88;box-shadow:0 12px 34px #000a;font:500 14px 'Jost',Arial,sans-serif;transform:translate(-50%,160%);transition:transform .4s cubic-bezier(.2,.9,.2,1)}
  .itiToast.show{transform:translate(-50%,0)}
  .itiToast a{flex:none;border-radius:999px;padding:7px 13px;background:#ffd76a;color:#1b1418;font-weight:600;text-decoration:none}
  @media (prefers-reduced-motion:reduce){.itiToast{transition:none}}
  `;
  document.head.append(style);

  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = on => on ? '✓ Itinéraire' : '+ Itinéraire';
  function button(kind, name) {
    const on = has(kind, name);
    return `<button type="button" class="itiBtn" data-iti-kind="${kind}" data-iti-name="${esc(name)}" aria-pressed="${on}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} l’itinéraire : ${esc(name)}">${label(on)}</button>`;
  }

  let toastTimer = 0;
  function toast(count) {
    let el = document.querySelector('.itiToast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'itiToast';
      el.setAttribute('role', 'status');
      document.body.append(el);
    }
    // Lien absolu vers le plan : depuis les Chroniques, « /plan » est sur le même domaine.
    el.innerHTML = `<span>Ajouté · ${count} étape${count > 1 ? 's' : ''}</span><a href="/plan">Voir le plan</a>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-iti-name]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const on = toggle(b.dataset.itiKind, b.dataset.itiName);
    for (const other of document.querySelectorAll('[data-iti-name]')) {
      if (other.dataset.itiKind !== b.dataset.itiKind || fold(other.dataset.itiName) !== fold(b.dataset.itiName)) continue;
      other.setAttribute('aria-pressed', String(on));
      other.textContent = label(on);
    }
    if (on) toast(read().length);
  }, true); // phase de capture : passe avant les clics des cartes (ouvrir une fiche…)

  window.itinerary = {
    has, toggle, button,
    list: read,
    save: write,
    same,
    onChange(fn) { listeners.add(fn); }
  };
})();
