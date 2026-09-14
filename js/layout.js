import { el, setSeg } from './dom.js';
import { state, cloneLine } from './state.js';

/**
 * Everything that isn't in state.lines but still belongs to a layout: the
 * button, the logo, and the canvas settings. Kept as one list so capture and
 * apply can never drift out of sync with each other.
 */
const FIELD_IDS = [
  'btnText', 'btnSize', 'btnX', 'btnY', 'btnW', 'btnH', 'btnR',
  'logoW', 'logoX', 'logoY', 'bg', 'outSize', 'delay', 'radius'
];
const CHECK_IDS = ['btnShow', 'logoShow'];

/** A plain, JSON-safe snapshot of everything the canvas draws from. */
export function captureLayout() {
  return {
    lines: state.lines.map(({ text, size, x, y, color, align, blink }) =>
      ({ text, size, x, y, color, align, blink })),
    btnAlign: state.btnAlign,
    lang: state.lang,
    fields: Object.fromEntries(FIELD_IDS.map(id => [id, el(id).value])),
    checks: Object.fromEntries(CHECK_IDS.map(id => [id, el(id).checked]))
  };
}

/**
 * Rebuild state and inputs from a captured layout (an undo step, a saved
 * layout, an imported file). Returns false without touching anything if the
 * shape doesn't look like a layout.
 */
export function applyLayout(data) {
  if (!data || !Array.isArray(data.lines)) return false;

  state.lines = data.lines.map(cloneLine);
  state.selected = null;
  state.btnAlign = (data.btnAlign === 'left' || data.btnAlign === 'right') ? data.btnAlign : 'center';
  state.lang = (data.lang === 'si' || data.lang === 'ta') ? data.lang : 'en';

  FIELD_IDS.forEach(id => { if (data.fields && id in data.fields) el(id).value = data.fields[id]; });
  CHECK_IDS.forEach(id => { if (data.checks && id in data.checks) el(id).checked = data.checks[id]; });
  setSeg(el('btnAlign'), state.btnAlign);
  const langSeg = document.getElementById('langSeg');
  if (langSeg) langSeg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.lang === state.lang));

  return true;
}
