import { GRID, PLUM, MAGENTA } from './config.js';
import { el, setSeg } from './dom.js';
import { state, newLine } from './state.js';
import { render } from './render.js';
import { commit, commitDebounced } from './history.js';

const CARD_HTML = `
  <div class="top">
    <input type="text" data-k="text">
    <button class="icon" data-act="up" title="Move up">&#8593;</button>
    <button class="icon" data-act="down" title="Move down">&#8595;</button>
    <button class="icon danger" data-act="del" title="Delete">&times;</button>
  </div>
  <div class="grid4">
    <div><label>Size</label><input type="number" data-k="size" min="6" max="80" step="0.5"></div>
    <div><label>X</label><input type="number" data-k="x" min="0" max="300" step="1"></div>
    <div><label>Y</label><input type="number" data-k="y" min="0" max="300" step="1"></div>
    <div><label>Alignment</label><div class="seg">
      <button type="button" data-align="left">Left</button>
      <button type="button" data-align="center">Centre</button>
      <button type="button" data-align="right">Right</button>
    </div></div>
  </div>
  <div class="grid3">
    <div><label>Colour</label><select data-k="color">
      <option value="${PLUM}">Plum</option>
      <option value="${MAGENTA}">Magenta</option>
      <option value="#FFFFFF">White</option>
      <option value="#2A1B29">Near black</option>
    </select></div>
    <div class="blinkrow" style="margin-top:0;padding-bottom:8px">
      <input type="checkbox" data-k="blink"><span>Blinks</span></div>
  </div>`;

export function renderControls() {
  const host = el('lines');
  host.innerHTML = '';
  state.lines.forEach((L, i) => host.appendChild(lineCard(L, i)));
}

function lineCard(L, i) {
  const card = document.createElement('div');
  const isSel = state.selected && state.selected.kind === 'line' && state.selected.idx === i;
  card.className = 'card' + (isSel ? ' sel' : '');
  card.innerHTML = CARD_HTML;

  card.querySelector('[data-k=text]').value = L.text;
  card.querySelector('[data-k=size]').value = L.size;
  card.querySelector('[data-k=x]').value = Math.round(L.x);
  card.querySelector('[data-k=y]').value = Math.round(L.y);
  card.querySelector('[data-k=blink]').checked = L.blink;

  const colSel = card.querySelector('[data-k=color]');
  if (![...colSel.options].some(o => o.value.toUpperCase() === L.color.toUpperCase())) {
    const o = document.createElement('option');
    o.value = L.color;
    o.textContent = L.color;
    colSel.appendChild(o);
  }
  colSel.value = [...colSel.options].find(o => o.value.toUpperCase() === L.color.toUpperCase()).value;
  setSeg(card.querySelector('.seg'), L.align);

  card.querySelectorAll('[data-k]').forEach(input => {
    const k = input.dataset.k;
    const ev = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
    input.addEventListener(ev, () => {
      if (k === 'blink') L.blink = input.checked;
      else if (k === 'size' || k === 'x' || k === 'y') L[k] = parseFloat(input.value) || 0;
      else L[k] = input.value;
      render();
      if (ev === 'change') commit(); else commitDebounced();
    });
  });

  card.querySelector('.seg').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      L.align = b.dataset.align;
      setSeg(card.querySelector('.seg'), L.align);
      render();
      commit();
    });
  });

  card.querySelectorAll('[data-act]').forEach(b => {
    b.addEventListener('click', () => {
      const act = b.dataset.act, lines = state.lines;
      if (act === 'del') { lines.splice(i, 1); state.selected = null; }
      if (act === 'up' && i > 0) swap(i, i - 1);
      if (act === 'down' && i < lines.length - 1) swap(i, i + 1);
      renderControls();
      render();
      commit();
    });
  });

  return card;
}

/** Reorder two lines and trade their Y positions, so the visual order follows. */
function swap(a, b) {
  const lines = state.lines;
  const y = lines[b].y;
  lines[b].y = lines[a].y;
  lines[a].y = y;
  const [moved] = lines.splice(a, 1);
  lines.splice(b, 0, moved);
}

export function initControls() {
  el('addLine').addEventListener('click', () => {
    const lastY = state.lines.length ? Math.max(...state.lines.map(l => l.y)) : 96;
    state.lines.push(newLine(Math.min(lastY + 26, GRID - 5)));
    renderControls();
    render();
    commit();
  });
}
