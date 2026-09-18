import { GRID, PLUM, BASE_LINES } from './config.js';
import { el, setSeg } from './dom.js';
import { themeById, DEFAULT_THEME } from './themes.js';

/**
 * A line is: { id, text, size, x, y, color, align, blink }
 * x/y are the anchor point on the 300 grid; align decides how the text sits around it.
 */
export const state = {
  lines: [],
  btnAlign: 'center',
  lang: 'en',        // 'en' | 'si' | 'ta' — picks the @font-face draw() uses
  themeId: DEFAULT_THEME,  // colour treatment; see themes.js
  selected: null,     // { kind:'line', idx } | { kind:'button' } | { kind:'logo' } | null
  hits: []           // bounding boxes from the last draw, used for hit testing
};

let uid = 0;

export function makeLine(text, i) {
  const b = BASE_LINES[i] || { size: 18, y: 212, color: PLUM, blink: false };
  return { id: ++uid, text, size: b.size, x: GRID / 2, y: b.y, color: b.color, align: 'center', blink: b.blink };
}

export function newLine(y) {
  return { id: ++uid, text: 'NEW LINE', size: 18, x: GRID / 2, y, color: PLUM, align: 'center', blink: false };
}

/** Rebuild a line from a plain object (a saved layout, an undo step). Always gets a fresh id. */
export function cloneLine(data) {
  return {
    id: ++uid,
    text: data.text ?? '',
    size: data.size ?? 18,
    x: data.x ?? GRID / 2,
    y: data.y ?? 150,
    color: data.color || PLUM,
    align: data.align || 'center',
    blink: !!data.blink
  };
}

/** Replace all copy at once, used by presets and by the AI panel. */
export function applyCopy(texts, cta) {
  state.lines = texts.map(makeLine);
  if (cta) el('btnText').value = cta;
  state.selected = null;
}

export function resetButton(defaults) {
  el('btnSize').value = defaults.size;
  el('btnX').value = defaults.x;
  el('btnY').value = defaults.y;
  el('btnW').value = defaults.w;
  el('btnH').value = defaults.h;
  el('btnR').value = defaults.r;
  state.btnAlign = 'center';
  setSeg(el('btnAlign'), 'center');
}

/** The theme object currently in force. */
export function activeTheme() {
  return themeById(state.themeId);
}

/**
 * Switch colour treatment: repaints the background, every line and the button
 * from the theme. Emphasis (blinking) lines take the accent colour, everything
 * else takes the body colour, so the hierarchy survives the swap.
 */
export function applyTheme(id) {
  state.themeId = themeById(id).id;
  const t = activeTheme();
  el('bg').value = t.bg;
  state.lines.forEach(L => { L.color = L.blink ? t.accent : t.text; });
}
