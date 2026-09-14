import { GRID, MARGIN } from './config.js';
import { el, num } from './dom.js';
import { state } from './state.js';
import { canvas, render } from './render.js';
import { renderControls } from './controls.js';
import { commit } from './history.js';

const SNAP = 4;               // grid units
const SNAP_X = [MARGIN, GRID / 2, GRID - MARGIN];
const PAD = 4;                // slop around a hit box

let drag = null;

function gridPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / r.width * GRID,
    y: (e.clientY - r.top) / r.height * GRID
  };
}

function hitAt(p) {
  for (let i = state.hits.length - 1; i >= 0; i--) {   // topmost first
    const h = state.hits[i];
    if (p.x >= h.x - PAD && p.x <= h.x + h.w + PAD &&
        p.y >= h.y - PAD && p.y <= h.y + h.h + PAD) return h;
  }
  return null;
}

function snap(v, targets) {
  for (const t of targets) if (Math.abs(v - t) < SNAP) return t;
  return Math.round(v);
}

function anchorOf(h) {
  if (h.kind === 'line')   return { x: state.lines[h.idx].x, y: state.lines[h.idx].y };
  if (h.kind === 'button') return { x: num('btnX', 150), y: num('btnY', 216) };
  return { x: num('logoX', 150), y: num('logoY', 15) };
}

function moveTo(h, x, y) {
  y = Math.max(0, Math.min(GRID, y));
  if (h.kind === 'line') { state.lines[h.idx].x = x; state.lines[h.idx].y = y; }
  else if (h.kind === 'button') { el('btnX').value = x; el('btnY').value = y; }
  else { el('logoX').value = x; el('logoY').value = y; }
}

export function initDrag() {
  canvas.addEventListener('pointerdown', e => {
    const p = gridPos(e);
    const h = hitAt(p);
    if (!h) { state.selected = null; renderControls(); render(); return; }

    state.selected = h.kind === 'line' ? { kind: 'line', idx: h.idx } : { kind: h.kind };
    const a = anchorOf(h);
    drag = { h, dx: p.x - a.x, dy: p.y - a.y };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    renderControls();
    render();
  });

  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = gridPos(e);
    moveTo(drag.h, snap(p.x - drag.dx, SNAP_X), Math.round(p.y - drag.dy));
    render();
  });

  canvas.addEventListener('pointerup', e => {
    if (!drag) return;
    drag = null;
    canvas.classList.remove('dragging');
    canvas.releasePointerCapture(e.pointerId);
    renderControls();   // push the dragged X/Y back into the number fields
    render();
    commit();            // a no-op if nothing actually moved
  });
}
