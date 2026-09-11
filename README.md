# Dialog Pay Banner Editor

Builds 300×300 Dialog Pay splash banners as animated GIFs or PNGs, with editable
copy, drag-and-drop placement, rounded corners and AI-written copy options.

## Quick start

```bash
git clone <your-repo> && cd dialogpay-banner-editor
python3 -m http.server 8000
```

Open <http://localhost:8000>.

Opening `index.html` directly from the file system will not work — the canvas
gets tainted and the export buttons fail. Any static server is fine
(`npx serve`, `php -S localhost:8000`, VS Code Live Server).

## Sharing with the team

```bash
node build.mjs
```

Produces `dist/DialogPay_Banner_Editor.html`: one file, no server, no
dependencies. Send it to anyone who needs to make a banner without cloning
anything.

## Using it

**Presets** load the copy for each journey: eZ Cash creation, Just Pay, first QR,
savings creation, savings top-up, eZ Cash top-up.

**Lines** — add as many as you need. Each has its own text, size, colour,
alignment, X/Y position and blink toggle. Copy that is too wide shrinks
automatically and the preview tells you which line it touched.

**Drag** any line, the button or the logo directly on the preview. It snaps to the
centre line and both margins. The number fields update as you drag.

**Corner radius** under Canvas rounds the banner itself. The corners are genuinely
transparent in both the GIF and the PNG, so it sits cleanly on any background.

**Export size** takes any dimension. Everything scales together, so 600 gives the
same layout at double resolution.

**AI copy** needs an Anthropic API key pasted into the panel. Describe the
campaign and it returns three complete options sized to the banner; click one to
apply it. "Shorten what's on the banner" tightens copy that is overflowing. The
key stays in the page, is never saved, and goes only to Anthropic. Everything else
works without a key.

## Deliverables

GIFs are written by a bundled encoder, so exports do not depend on any external
library or service. Two frames when a line blinks, one frame otherwise, at the
delay set in the panel (1000ms matches the original artwork).

## Development

See `CLAUDE.md` for architecture, the layout model and the GIF encoder's quirks.
