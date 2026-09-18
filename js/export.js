import { GRID } from './config.js';
import { el, num } from './dom.js';
import { state } from './state.js';
import { draw } from './draw.js';
import { encodeGIF } from './gif-encoder.js';

function offscreen(size, showBlink) {
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  draw(cv.getContext('2d'), size / GRID, showBlink, false);
  return cv;
}

function frameData(size, showBlink) {
  const cv = offscreen(size, showBlink);
  return cv.getContext('2d').getImageData(0, 0, size, size).data;
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function slug() {
  const t = state.lines.map(l => l.text).join('-')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (t || 'dialogpay-banner').slice(0, 50);
}

/** The typed file name wins when there is one; otherwise fall back to the banner copy. */
function fileBase() {
  const custom = el('fileName').value.trim().replace(/[/\\]/g, '');
  return custom || slug();
}

export const outSize = () => Math.max(50, Math.round(num('outSize', 1200)));

/**
 * CleverTap accepts uploads up to 500 KB. Exporting at the 300px display size
 * was the real cause of the quality drop: the banner is rendered at 300 and
 * then upscaled on a modern phone screen, which is what looks soft. Exporting
 * at 1200 and letting the device scale *down* costs nothing in quality and
 * still lands well inside the budget.
 */
export const SIZE_BUDGET = 500 * 1024;

/** Sizes to fall back through when an export overshoots the budget. */
const SIZE_LADDER = [1500, 1200, 900, 600, 450, 300];

const kb = n => (n / 1024).toFixed(0) + ' KB';

function setExportStatus(msg) {
  const node = el('exportStatus');
  if (node) node.textContent = msg;
}

/**
 * Encode at the requested size, then step down the ladder until the result
 * fits SIZE_BUDGET. Returns the bytes actually used plus the size they were
 * rendered at, so the caller can report what happened.
 */
export async function encodeBudgeted(format, requested = outSize(), budget = SIZE_BUDGET) {
  const ladder = [requested, ...SIZE_LADDER.filter(s => s < requested)];
  let last = null;
  for (const px of ladder) {
    const data = format === 'gif' ? gifBytes(px) : await pngBytes(px);
    last = { data, px, fits: data.length <= budget };
    if (last.fits) return last;
  }
  return last;
}

/**
 * Encode whatever is currently on the canvas as GIF bytes. Shared by the
 * single download button and by batch export, so the two can never drift.
 */
export function gifBytes(size = outSize()) {
  const delay = Math.max(20, num('delay', 1000));
  const blinks = state.lines.some(l => l.blink && l.text);
  const frames = blinks
    ? [frameData(size, true), frameData(size, false)]
    : [frameData(size, true)];
  return encodeGIF(frames, size, size, Math.round(delay / 10));
}

/** PNG bytes for the current canvas, as a promise. */
export function pngBytes(size = outSize()) {
  return new Promise(resolve => {
    offscreen(size, true).toBlob(
      b => b.arrayBuffer().then(buf => resolve(new Uint8Array(buf))),
      'image/png'
    );
  });
}

/** True when the operator wants exports kept inside the upload budget. */
const budgetOn = () => {
  const box = el('fitBudget');
  return box ? box.checked : true;
};

async function runExport(format) {
  setExportStatus('Rendering…');
  const mime = format === 'gif' ? 'image/gif' : 'image/png';

  if (!budgetOn()) {
    const data = format === 'gif' ? gifBytes() : await pngBytes();
    download(new Blob([data], { type: mime }), fileBase() + '.' + format);
    setExportStatus(`${format.toUpperCase()} at ${outSize()}px — ${kb(data.length)}`);
    return;
  }

  const r = await encodeBudgeted(format);
  download(new Blob([r.data], { type: mime }), fileBase() + '.' + format);
  setExportStatus(
    r.fits
      ? `${format.toUpperCase()} at ${r.px}px — ${kb(r.data.length)}` +
        (r.px < outSize() ? ' (scaled down to fit 500 KB)' : '')
      : `${format.toUpperCase()} at ${r.px}px — ${kb(r.data.length)}, still over 500 KB. ` +
        'Try a flatter theme: gradients cost far more than solid backgrounds.'
  );
}

export function initExport() {
  el('dlGif').addEventListener('click', () => runExport('gif'));
  el('dlPng').addEventListener('click', () => runExport('png'));

  const seg = el('sizeSeg');
  if (seg) {
    seg.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        el('outSize').value = b.dataset.size;
        el('outSize').dispatchEvent(new Event('input', { bubbles: true }));
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      });
    });
  }
}
