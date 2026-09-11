export const el = id => document.getElementById(id);

/** Numeric value of an input, falling back when empty or invalid. */
export function num(id, fallback) {
  const n = parseFloat(el(id).value);
  return isFinite(n) ? n : fallback;
}

/** Highlight the active button in a left/centre/right segmented control. */
export function setSeg(seg, value) {
  seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.align === value));
}
