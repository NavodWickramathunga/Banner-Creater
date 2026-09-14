import { PRESETS, LOGO_SRC, BUTTON_DEFAULTS } from './config.js';
import { el, setSeg } from './dom.js';
import { state, makeLine, applyCopy, resetButton } from './state.js';
import { logoImg } from './draw.js';
import { render } from './render.js';
import { renderControls, initControls } from './controls.js';
import { initDrag } from './drag.js';
import { initAI } from './ai.js';
import { initExport } from './export.js';
import { initHistory, commit, commitDebounced } from './history.js';
import { initLayoutsPanel } from './layouts-panel.js';

const LIVE_INPUTS = [
  'btnText', 'btnSize', 'btnX', 'btnY', 'btnW', 'btnH', 'btnR',
  'logoW', 'logoX', 'logoY', 'bg', 'outSize', 'delay', 'radius'
];

function initPresets() {
  const sel = el('preset');
  PRESETS.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = p[0];
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => {
    const p = PRESETS[sel.value];
    if (!p) return;
    resetButton(BUTTON_DEFAULTS);
    applyCopy(p[1], p[2]);
    renderControls();
    render();
    commit();
  });
}

function initInputs() {
  LIVE_INPUTS.forEach(id => el(id).addEventListener('input', () => { render(); commitDebounced(); }));
  ['btnShow', 'logoShow'].forEach(id => el(id).addEventListener('change', () => { render(); commit(); }));
  el('btnAlign').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      state.btnAlign = b.dataset.align;
      setSeg(el('btnAlign'), state.btnAlign);
      render();
      commit();
    });
  });
}

function boot() {
  state.lines = PRESETS[3][1].map(makeLine);   // Savings creation, the original artwork
  initPresets();
  initInputs();
  initControls();
  initDrag();
  initAI();
  initExport();
  initHistory();
  initLayoutsPanel();
  renderControls();

  logoImg.onload = render;
  logoImg.src = LOGO_SRC;

  if (document.fonts) {
    document.fonts.load('25px BannerFont').then(render);
    document.fonts.ready.then(render);
  }
  render();
}

boot();
