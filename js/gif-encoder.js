// Minimal animated GIF encoder: median-cut quantize + LZW
function medianCut(pixels, maxColors) {
  // pixels: array of [r,g,b]
  let boxes = [pixels];
  const rangeOf = (box) => {
    let mn = [255,255,255], mx = [0,0,0];
    for (const p of box) for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; }
    let ch = 0, best = 0;
    for (let c = 0; c < 3; c++) { const r = mx[c] - mn[c]; if (r > best) { best = r; ch = c; } }
    return [best, ch];
  };
  while (boxes.length < maxColors) {
    let bi = -1, score = 0, splitCh = 0;
    for (let i = 0; i < boxes.length; i++) {
      const [r, ch] = rangeOf(boxes[i]);
      const s = r * Math.log(boxes[i].length + 1);
      if (r > 0 && s > score) { score = s; bi = i; splitCh = ch; }
    }
    if (bi < 0) break;
    const box = boxes[bi];
    box.sort((a, b) => a[splitCh] - b[splitCh]);
    const mid = box.length >> 1;
    boxes.splice(bi, 1, box.slice(0, mid), box.slice(mid));
  }
  return boxes.filter(b => b.length).map(b => {
    let r = 0, g = 0, bl = 0;
    for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
    return [Math.round(r / b.length), Math.round(g / b.length), Math.round(bl / b.length)];
  });
}

function buildPalette(frames, w, h, hasAlpha) {
  const samples = [];
  for (const data of frames) {
    for (let i = 0; i < w * h; i++) {
      if (i % 3 === 0 && data[i*4+3] >= 128) samples.push([data[i*4], data[i*4+1], data[i*4+2]]);
    }
  }
  const room = hasAlpha ? 255 : 256;
  let pal = medianCut(samples, room);
  while (pal.length < room) pal.push([0, 0, 0]);
  if (hasAlpha) pal.unshift([0, 0, 0]);   // index 0 reserved for transparency
  return pal;
}

function mapFrame(data, w, h, pal, cache, hasAlpha) {
  const out = new Uint8Array(w * h);
  const first = hasAlpha ? 1 : 0;
  for (let i = 0; i < w * h; i++) {
    if (hasAlpha && data[i*4+3] < 128) { out[i] = 0; continue; }
    const r = data[i*4], g = data[i*4+1], b = data[i*4+2];
    const key = (r << 16) | (g << 8) | b;
    let idx = cache.get(key);
    if (idx === undefined) {
      let bd = Infinity;
      for (let p = first; p < pal.length; p++) {
        const dr = r - pal[p][0], dg = g - pal[p][1], db = b - pal[p][2];
        const d = dr*dr + dg*dg + db*db;
        if (d < bd) { bd = d; idx = p; if (d === 0) break; }
      }
      cache.set(key, idx);
    }
    out[i] = idx;
  }
  return out;
}

function lzwEncode(indices, minCodeSize) {
  const out = [];
  let cur = 0, curBits = 0;
  const clear = 1 << minCodeSize, eoi = clear + 1;
  let codeSize = minCodeSize + 1, next = eoi + 1;
  let dict = new Map();
  const push = (code) => {
    cur |= code << curBits; curBits += codeSize;
    while (curBits >= 8) { out.push(cur & 0xff); cur >>= 8; curBits -= 8; }
  };
  push(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 4096 + k;
    if (dict.has(key)) { prefix = dict.get(key); }
    else {
      push(prefix);
      dict.set(key, next++);
      if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++;
      if (next === 4096) { push(clear); dict = new Map(); codeSize = minCodeSize + 1; next = eoi + 1; }
      prefix = k;
    }
  }
  push(prefix); push(eoi);
  if (curBits > 0) out.push(cur & 0xff);
  return out;
}

function encodeGIF(frames, w, h, delayCs) {
  let hasAlpha = false;
  for (const f of frames) { for (let i = 3; i < f.length; i += 4) if (f[i] < 128) { hasAlpha = true; break; } if (hasAlpha) break; }
  const pal = buildPalette(frames, w, h, hasAlpha);
  const cache = new Map();
  const bytes = [];
  const str = (s) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i)); };
  const u16 = (v) => { bytes.push(v & 0xff, (v >> 8) & 0xff); };
  str('GIF89a'); u16(w); u16(h);
  bytes.push(0xF7, 0, 0);
  for (const c of pal) bytes.push(c[0], c[1], c[2]);
  // netscape loop
  bytes.push(0x21, 0xFF, 11); str('NETSCAPE2.0'); bytes.push(3, 1, 0, 0, 0);
  for (const f of frames) {
    bytes.push(0x21, 0xF9, 4, hasAlpha ? 0x09 : 0x04); u16(delayCs); bytes.push(hasAlpha ? 0 : 0, 0);
    bytes.push(0x2C); u16(0); u16(0); u16(w); u16(h); bytes.push(0);
    const idx = mapFrame(f, w, h, pal, cache, hasAlpha);
    const lzw = lzwEncode(idx, 8);
    bytes.push(8);
    for (let i = 0; i < lzw.length; i += 255) {
      const chunk = lzw.slice(i, i + 255);
      bytes.push(chunk.length); for (const b of chunk) bytes.push(b);
    }
    bytes.push(0);
  }
  bytes.push(0x3B);
  return new Uint8Array(bytes);
}



export { encodeGIF };
