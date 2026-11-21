/** Avis visiteurs : sauvegarde en localStorage (avec repli en mémoire si indisponible). */
const memory = new Map();
const keyOf = (id) => `chroniques-avis-${id}`;

export function loadReviews(id) {
  try {
    const raw = localStorage.getItem(keyOf(id));
    return raw ? JSON.parse(raw) : memory.get(id) || [];
  } catch {
    return memory.get(id) || [];
  }
}

/** Ajoute un avis ; retourne true si la sauvegarde persistante a réussi */
export function addReview(id, review) {
  const list = [review, ...loadReviews(id)].slice(0, 50);
  memory.set(id, list);
  try {
    localStorage.setItem(keyOf(id), JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function average(list) {
  if (!list.length) return null;
  return list.reduce((sum, r) => sum + r.score, 0) / list.length;
}
