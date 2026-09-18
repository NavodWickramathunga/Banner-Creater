import { PRESETS, LOGO_SRC, BUTTON_DEFAULTS } from './config.js';
import { THEMES } from './themes.js';
import { el, setSeg } from './dom.js';
import { state, makeLine, applyCopy, applyTheme, resetButton } from './state.js';
import { logoImg } from './draw.js';
import { render } from './render.js';
import { renderControls, initControls } from './controls.js';
import { initDrag } from './drag.js';
import { initExport } from './export.js';
import { initHistory, commit, commitDebounced } from './history.js';
import { initLayoutsPanel } from './layouts-panel.js';
import { initBatch } from './batch.js';

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

function initThemes() {
  const seg = el('themeSeg');
  if (!seg) return;
  THEMES.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.theme = t.id;
    b.textContent = t.label;
    b.classList.toggle('on', t.id === state.themeId);
    b.addEventListener('click', () => {
      applyTheme(t.id);
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      renderControls();
      render();
      commit();
    });
    seg.appendChild(b);
  });
}

function initLanguage() {
  const seg = el('langSeg');
  seg.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      state.lang = b.dataset.lang;
      seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      render();
      commit();
    });
  });
}

function boot() {
  state.lines = PRESETS[2][1].map(makeLine);   // Savings creation, the original artwork
  initPresets();
  initInputs();
  initControls();
  initDrag();
  initExport();
  initLanguage();
  initThemes();
  initHistory();
  initBatch();
  initLayoutsPanel();
  renderControls();

  logoImg.onload = render;
  logoImg.src = LOGO_SRC;

  if (document.fonts) {
    Promise.all([
      document.fonts.load('25px BannerFont'),
      document.fonts.load('25px SinhalaFont'),
      document.fonts.load('25px TamilFont')
    ]).then(render);
    document.fonts.ready.then(render);
  }
  render();
}

boot();
