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
css/styles.css      all styling; @font-face points at assets/*.woff2
js/config.js        grid size, brand colours, journey presets, per-language fonts, defaults
js/dom.js           el() / num() / setSeg() helpers
js/state.js         the lines array, selection, button alignment, language
js/draw.js          all canvas painting; the single source of truth for layout
js/render.js        preview canvas, selection outline, overflow warnings
js/controls.js      builds the per-line editor cards
js/drag.js          pointer handling and snapping on the preview
js/layout.js        capture/apply the full editor state as one plain object
js/history.js       undo/redo stack built on layout.js snapshots
js/layouts-panel.js named saved layouts (localStorage) plus JSON export/import
js/export.js        GIF and PNG download, with an optional custom file name
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

### Undo/redo and layouts

`js/layout.js` is the single place that knows how to turn the live editor state
(`state.lines`, `state.btnAlign`, `state.lang`, and every button/logo/canvas
input) into one plain JSON-safe object, and back. `js/history.js` and
`js/layouts-panel.js` both build on that instead of touching `state` or the DOM
directly, so a saved layout, an imported file and an undo step are all the same
shape.

`js/history.js` keeps an undo/redo stack of those snapshots. Discrete actions
(button clicks, drag release, preset/layout load) call `commit()` immediately;
continuous input (typing, number fields) calls `commitDebounced()` so the stack
gets one step per pause, not one per keystroke.

`js/layouts-panel.js` persists named layouts to `localStorage` under
`dialogpay-banner-layouts`, and offers Export/Import as a `.json` file for
handing a layout to someone else or keeping a backup outside the browser.

### Language and fonts

`state.lang` (`'en' | 'si' | 'ta'`) picks the `@font-face` `draw()` uses, via the
`FONTS` map in `config.js`. Switching language only swaps glyphs — it does not
translate anything; the operator types the Sinhala/Tamil copy into the line
fields themselves. The Sinhala and Tamil faces are the Bold weight of Google's
Noto Sans Sinhala/Tamil, subsetted to just that script by Google Fonts itself
(the `sinhala`/`tamil` `unicode-range` subset from the CSS2 API), which is why
they're a few dozen KB rather than a full multi-script family.

## Conventions

- British spelling in UI copy ("Centre", "Colour").
- Brand colours live in `config.js` and as CSS custom properties; don't hardcode
  hex values in new modules.
- The banner (Latin) font is a subset of Poppins Bold. It has no Sinhala or Tamil
  glyphs by design — that's what the Sinhala/Tamil `@font-face`s in
  `css/styles.css` are for. Don't fall back to the Latin font for those scripts.
- If you add a module, register it in `MODULE_ORDER` in `build.mjs` before its
  dependents. The bundler concatenates and strips module syntax; it relies on
  every top-level name being unique across `js/`.

## Ideas not yet built

- Other placement sizes (leaderboard, half-page) — the grid constant would need
  to become a width/height pair.
- Batch export: one click producing all six journeys from the same layout.
- Rename/reorder for saved layouts in the Layouts panel (currently save/load/delete only).
