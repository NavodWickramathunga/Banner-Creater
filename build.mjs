/**
 * Bundles the project into one self-contained HTML file that runs from disk
 * with no server, for sharing with the team.
 *
 *   node build.mjs            -> dist/DialogPay_Banner_Editor.html
 *
 * The bundler is deliberately simple: it concatenates the modules in
 * dependency order and strips the import/export keywords. That works because
 * every top-level name in js/ is unique. If you add a module, add it to
 * MODULE_ORDER below, before anything that depends on it.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

const MODULE_ORDER = [
  'js/gif-encoder.js',
  'js/config.js',
  'js/dom.js',
  'js/state.js',
  'js/layout.js',
  'js/draw.js',
  'js/render.js',
  'js/controls.js',
  'js/history.js',
  'js/layouts-panel.js',
  'js/drag.js',
  'js/export.js',
  'js/main.js'
];

const read = p => readFile(join(ROOT, p), 'utf8');
const b64 = async p => (await readFile(join(ROOT, p))).toString('base64');

function stripModuleSyntax(src) {
  return src
    .replace(/^\s*import[^;]*;\s*$/gm, '')          // drop imports
    .replace(/^\s*export\s+\{[^}]*\};\s*$/gm, '')   // drop export lists
    .replace(/^(\s*)export\s+/gm, '$1');            // unwrap `export const/function`
}

const [css, html, logo, font, sinhalaFont, tamilFont] = await Promise.all([
  read('css/styles.css'),
  read('index.html'),
  b64('assets/logo.png'),
  b64('assets/banner-font.woff2'),
  b64('assets/sinhala-font.woff2'),
  b64('assets/tamil-font.woff2')
]);

const js = (await Promise.all(MODULE_ORDER.map(read))).map(stripModuleSyntax).join('\n');

const inlineCss = css
  .replace(
    "src:url('../assets/banner-font.woff2') format('woff2');",
    `src:url(data:font/woff2;base64,${font}) format('woff2');`
  )
  .replace(
    "src:url('../assets/sinhala-font.woff2') format('woff2');",
    `src:url(data:font/woff2;base64,${sinhalaFont}) format('woff2');`
  )
  .replace(
    "src:url('../assets/tamil-font.woff2') format('woff2');",
    `src:url(data:font/woff2;base64,${tamilFont}) format('woff2');`
  );

// the bundled build reads the logo from a data URI rather than assets/
const inlineJs = js.replace(
  /const LOGO_SRC = ["'][^"']*["'];/,
  `const LOGO_SRC = "data:image/png;base64,${logo}";`
);

const out = html
  .replace('<link rel="stylesheet" href="css/styles.css">', `<style>\n${inlineCss}\n</style>`)
  .replace('<script type="module" src="js/main.js"></script>', `<script>\n${inlineJs}\n</script>`);

await mkdir(join(ROOT, 'dist'), { recursive: true });
const target = join(ROOT, 'dist/DialogPay_Banner_Editor.html');
await writeFile(target, out);
console.log(`Built ${target} (${Math.round(out.length / 1024)} KB)`);
