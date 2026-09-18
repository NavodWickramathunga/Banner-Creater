import { PRESETS, LANGUAGES, BUTTON_DEFAULTS } from './config.js';
import { THEMES } from './themes.js';
import { el } from './dom.js';
import { state, applyCopy, applyTheme, resetButton } from './state.js';
import { captureLayout, applyLayout } from './layout.js';
import { render } from './render.js';
import { renderControls } from './controls.js';
import { encodeBudgeted, download, outSize } from './export.js';
import { makeZip } from './zip.js';

/**
 * Batch export: every ticked journey × language × theme, rendered and zipped in
 * one pass.
 *
 * The daily job is not "make a banner", it's "make the same message across six
 * journeys in three languages". Doing that by hand is six preset clicks, three
 * language clicks and eighteen downloads. This does it in one.
 *
 * Each combination runs through the same applyCopy/applyTheme path the operator
 * would click, then the same gifBytes()/pngBytes() the download buttons use, so
 * a batch file is byte-identical to what a manual export would have produced.
 * The editor's own state is snapshotted first and restored at the end.
 */

const batchSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function tickList(host, items, checkedIds) {
  host.innerHTML = '';
  items.forEach(([value, label]) => {
    const id = host.id + '-' + value;
    const wrap = document.createElement('label');
    wrap.className = 'tick';
    wrap.innerHTML = `<input type="checkbox" id="${id}" value="${value}"> <span></span>`;
    wrap.querySelector('span').textContent = label;
    wrap.querySelector('input').checked = checkedIds.includes(String(value));
    host.appendChild(wrap);
  });
}

const ticked = host => [...host.querySelectorAll('input:checked')].map(i => i.value);

/** Yield to the browser so the progress line actually repaints between items. */
const breathe = () => new Promise(r => setTimeout(r, 0));

export function initBatch() {
  const host = el('batchPanel');
  if (!host) return;

  const presetHost = el('batchPresets');
  const langHost = el('batchLangs');
  const themeHost = el('batchThemes');
  const status = el('batchStatus');

  tickList(presetHost, PRESETS.map((p, i) => [i, p[0]]), PRESETS.map((_, i) => String(i)));
  tickList(langHost, LANGUAGES, ['en']);
  tickList(themeHost, THEMES.map(t => [t.id, t.label]), [state.themeId]);

  el('batchRun').addEventListener('click', async () => {
    const presets = ticked(presetHost).map(Number);
    const langs = ticked(langHost);
    const themes = ticked(themeHost);
    const format = el('batchFormat').value;

    if (!presets.length || !langs.length || !themes.length) {
      status.textContent = 'Tick at least one journey, language and theme.';
      return;
    }

    const snapshot = captureLayout();
    const files = [];
    const oversize = [];
    const total = presets.length * langs.length * themes.length;
    let done = 0;

    try {
      for (const pi of presets) {
        const [label, lines, cta] = PRESETS[pi];
        for (const lang of langs) {
          for (const themeId of themes) {
            resetButton(BUTTON_DEFAULTS);
            applyCopy(lines, cta);
            state.lang = lang;
            applyTheme(themeId);
            render();
            await breathe();

            const base = `${batchSlug(label)}_${lang}_${themeId}`;
            for (const fmt of ['gif', 'png']) {
              if (format !== 'both' && format !== fmt) continue;
              const r = await encodeBudgeted(fmt, outSize());
              if (!r.fits) oversize.push(base + '.' + fmt);
              files.push({ name: base + '.' + fmt, data: r.data });
            }

            done++;
            status.textContent = `Rendering ${done} of ${total}…`;
            await breathe();
          }
        }
      }

      const stamp = new Date().toISOString().slice(0, 10);
      download(makeZip(files), `dialogpay-banners_${stamp}.zip`);
      status.textContent = `${files.length} file${files.length === 1 ? '' : 's'} exported.`
        + (oversize.length ? ` ${oversize.length} still over 500 KB — try a flatter theme.` : '');
    } catch (err) {
      console.error(err);
      status.textContent = 'Export failed — see the browser console.';
    } finally {
      applyLayout(snapshot);
      renderControls();
      render();
    }
  });
}
