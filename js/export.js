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

function download(blob, name) {
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

const outSize = () => Math.max(50, Math.round(num('outSize', 300)));

export function initExport() {
  el('dlGif').addEventListener('click', () => {
    const size = outSize();
    const delay = Math.max(20, num('delay', 1000));
    const blinks = state.lines.some(l => l.blink && l.text);
    const frames = blinks
      ? [frameData(size, true), frameData(size, false)]
      : [frameData(size, true)];
    const bytes = encodeGIF(frames, size, size, Math.round(delay / 10));
    download(new Blob([bytes], { type: 'image/gif' }), fileBase() + '.gif');
  });

  el('dlPng').addEventListener('click', () => {
    offscreen(outSize(), true).toBlob(b => download(b, fileBase() + '.png'), 'image/png');
  });
}
