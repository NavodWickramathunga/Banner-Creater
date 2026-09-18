import { GRID, MARGIN, LOGO_RATIO, FONTS } from './config.js';
import { el, num } from './dom.js';
import { state, activeTheme } from './state.js';

export const logoImg = new Image();

/** The font-family stack for whichever language is currently selected. */
function fontFamily() {
  return (FONTS[state.lang] || FONTS.en) + ', sans-serif';
}

/** Shrink a size until the text fits maxWidth. Returns the size actually used. */
export function fitText(c, text, size, maxWidth) {
  let s = size;
  c.font = s + 'px ' + fontFamily();
  while (c.measureText(text).width > maxWidth && s > 6) {
    s -= 0.5;
    c.font = s + 'px ' + fontFamily();
  }
  return s;
}

/** How much horizontal room a line has, given its anchor and alignment. */
export function bandFor(L) {
  if (L.align === 'left')  return Math.max(20, GRID - MARGIN - L.x);
  if (L.align === 'right') return Math.max(20, L.x - MARGIN);
  return Math.max(20, Math.min(L.x - MARGIN, GRID - MARGIN - L.x) * 2);
}

export function roundRect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, h / 2, w / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/**
 * Paint one frame.
 * @param scale      output pixels per grid unit (600px export = 2)
 * @param showBlink  include lines flagged as blinking
 * @param collect    record hit boxes into state.hits (preview only)
 */
export function draw(c, scale, showBlink, collect) {
  if (collect) state.hits = [];
  c.save();
  c.scale(scale, scale);
  c.clearRect(0, 0, GRID, GRID);
  c.fillStyle = el('bg').value.trim() || '#fff';
  c.fillRect(0, 0, GRID, GRID);

  // logo
  if (el('logoShow').checked && logoImg.complete && logoImg.naturalWidth) {
    const w = num('logoW', 167), h = w * LOGO_RATIO;
    const x = num('logoX', 150) - w / 2, y = num('logoY', 15);
    c.drawImage(logoImg, x, y, w, h);
    if (collect) state.hits.push({ kind: 'logo', x, y, w, h });
  }

  // copy lines
  state.lines.forEach((L, i) => {
    if (!L.text) return;
    if (L.blink && !showBlink) return;
    const s = fitText(c, L.text, L.size, bandFor(L));
    c.fillStyle = L.color;
    c.font = s + 'px ' + fontFamily();
    c.textAlign = L.align;
    c.fillText(L.text, L.x, L.y);
    if (collect) {
      const w = c.measureText(L.text).width;
      const x = L.align === 'left' ? L.x : L.align === 'right' ? L.x - w : L.x - w / 2;
      state.hits.push({ kind: 'line', idx: i, x, y: L.y - s * 0.78, w, h: s * 1.05 });
    }
  });

  // button
  if (el('btnShow').checked) {
    const w = num('btnW', 240), h = num('btnH', 52);
    const x = num('btnX', 150) - w / 2, y = num('btnY', 216);
    const theme = activeTheme();
    const g = c.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, theme.btn[0]);
    g.addColorStop(1, theme.btn[1]);
    c.fillStyle = g;
    roundRect(c, x, y, w, h, num('btnR', 12));
    c.fill();

    const t = el('btnText').value, pad = 20;
    if (t) {
      const cs = fitText(c, t, num('btnSize', 22), w - pad * 2);
      c.fillStyle = theme.btnText;
      c.font = cs + 'px ' + fontFamily();
      c.textAlign = state.btnAlign;
      const cx = state.btnAlign === 'left' ? x + pad
               : state.btnAlign === 'right' ? x + w - pad
               : x + w / 2;
      c.fillText(t, cx, y + h / 2 + cs * 0.36);
    }
    if (collect) state.hits.push({ kind: 'button', x, y, w, h });
  }

  // rounded canvas corners: knock out everything outside the shape
  const r = num('radius', 0);
  if (r > 0) {
    c.globalCompositeOperation = 'destination-in';
    roundRect(c, 0, 0, GRID, GRID, r);
    c.fillStyle = '#000';
    c.fill();
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}
