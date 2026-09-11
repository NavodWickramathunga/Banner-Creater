import { GRID } from './config.js';
import { el, num } from './dom.js';
import { state } from './state.js';
import { draw, bandFor } from './draw.js';

export const canvas = el('preview');
export const ctx = canvas.getContext('2d');

export function render() {
  draw(ctx, canvas.width / GRID, true, true);
  drawSelection();
  const out = Math.round(num('outSize', 300));
  const frames = state.lines.some(l => l.blink && l.text) ? '2 frames' : '1 frame';
  el('meta').textContent = `${out} × ${out} px · ${frames}`;
  checkFit();
}

function drawSelection() {
  if (!state.selected) return;
  const sel = state.selected;
  const h = state.hits.find(o =>
    sel.kind === 'line' ? (o.kind === 'line' && o.idx === sel.idx) : o.kind === sel.kind);
  if (!h) return;
  const s = canvas.width / GRID;
  ctx.save();
  ctx.strokeStyle = 'rgba(211,6,79,.75)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect((h.x - 3) * s, (h.y - 3) * s, (h.w + 6) * s, (h.h + 6) * s);
  ctx.restore();
}

/** Warn when the fit logic had to shrink something. */
function checkFit() {
  const warn = [];
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  state.lines.forEach((L, i) => {
    if (!L.text) return;
    ctx.font = L.size + 'px BannerFont, sans-serif';
    if (ctx.measureText(L.text).width > bandFor(L)) warn.push('line ' + (i + 1));
  });
  const t = el('btnText').value;
  if (t) {
    ctx.font = num('btnSize', 22) + 'px BannerFont, sans-serif';
    if (ctx.measureText(t).width > num('btnW', 240) - 40) warn.push('button');
  }
  ctx.restore();
  el('warn').textContent = warn.length ? 'Shrunk to fit: ' + warn.join(', ') + '.' : '';
}
