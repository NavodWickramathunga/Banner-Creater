# Dialog Pay Banner Editor — project context

A browser tool for producing 300×300 Dialog Pay splash banners (GIF and PNG) for
MyDialog app placements. It replaces hand-editing artwork every time campaign copy
changes across the eZ Cash, Just Pay, savings and first-QR journeys.

## Running it

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

**A server is required.** Opening `index.html` over `file://` taints the canvas,
which breaks `getImageData` and therefore both exports. Chrome also refuses to
load ES modules over `file://`.

```bash
node build.mjs                  # -> dist/DialogPay_Banner_Editor.html
```

The bundle is one self-contained file with the font and logo inlined. That is the
artefact to share with the team — it runs by double-clicking, no server needed,
because there is nothing left to fetch.

## Architecture

Vanilla ES modules, no framework, no dependencies, no build step for development.

```
index.html          markup and control ids only, no logic
css/styles.css      all styling; @font-face points at assets/banner-font.woff2
js/config.js        grid size, brand colours, journey presets, defaults
js/dom.js           el() / num() / setSeg() helpers
js/state.js         the lines array, selection, button alignment
js/draw.js          all canvas painting; the single source of truth for layout
js/render.js        preview canvas, selection outline, overflow warnings
js/controls.js      builds the per-line editor cards
js/drag.js          pointer handling and snapping on the preview
js/ai.js            Anthropic Messages API calls for copy generation
js/export.js        GIF and PNG download
js/gif-encoder.js   self-contained animated GIF encoder
js/main.js          wiring and boot
```

### Key ideas

**Everything is authored on a 300×300 grid.** Sizes, X and Y are always in grid
units. `draw(ctx, scale, ...)` multiplies by `scale` (`outputSize / 300`), so
exporting at 600 or 1200 needs no layout changes. Never store pixel values that
assume a specific output size.

**`draw()` is the only thing that paints.** The preview, both GIF frames and the
PNG all call it. Anything visual belongs there, or the export will drift from the
preview.

**Hit boxes come out of the draw pass.** When `collect` is true, `draw()` records
`state.hits` from the same `measureText` call used for painting, so dragging stays
in sync with what is actually on screen. Do not compute hit boxes separately.

**Lines are anchored, not centred.** Each line has an `x` anchor plus an `align`.
`bandFor()` derives the available width from those two, and `fitText()` shrinks
until the text fits. That is why dragging a line to the edge makes it shrink.

**Blink is per line.** Frame 1 draws everything, frame 2 omits lines with
`blink: true`. With no blinking line the GIF is written as a single frame.

### The GIF encoder

`js/gif-encoder.js` is a from-scratch GIF89a writer: median-cut quantisation to
256 colours, nearest-neighbour mapping with a colour cache, LZW compression.

When any pixel has alpha below 128 (rounded corners), palette index 0 is reserved
as the transparent colour and the graphic control extension sets the transparency
flag. Keep index 0 out of the nearest-neighbour search or transparent pixels will
bleed into the image.

Median cut picks the box to split by `range × log(count)`. Selecting purely by
pixel count fails here: a banner is mostly flat white, so the largest box has zero
colour range and splitting stalls after one or two colours.

### AI copy

`js/ai.js` posts to the Messages API with `anthropic-dangerous-direct-browser-access`
so it works from the browser. The key is read from the input on each call and is
never written to `localStorage` or anywhere else. The system prompt pins the
banner's constraints (all caps, ≤22 characters a line, 4 lines, short CTA) and
demands JSON, which is parsed after stripping code fences.

## Conventions

- British spelling in UI copy ("Centre", "Colour").
- Brand colours live in `config.js` and as CSS custom properties; don't hardcode
  hex values in new modules.
- The banner font is a subset of Poppins Bold covering Latin, digits and basic
  punctuation. **It has no Sinhala glyphs** — Sinhala copy will fall back to a
  system font and look off-brand. Adding Sinhala means subsetting a Sinhala face
  and adding a second `@font-face`.
- If you add a module, register it in `MODULE_ORDER` in `build.mjs` before its
  dependents. The bundler concatenates and strips module syntax; it relies on
  every top-level name being unique across `js/`.

## Ideas not yet built

- Sinhala and Tamil variants with a bundled Sinhala/Tamil font.
- Other placement sizes (leaderboard, half-page) — the grid constant would need
  to become a width/height pair.
- Save and load layouts as JSON, so a journey's exact placement is reusable.
- Batch export: one click producing all six journeys from the same layout.
