import { el } from './dom.js';
import { captureLayout, applyLayout } from './layout.js';
import { render } from './render.js';
import { renderControls } from './controls.js';
import { commit } from './history.js';

const STORE_KEY = 'dialogpay-banner-layouts';

function readAll() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch { /* storage full or blocked */ }
}

function setStatus(msg, isErr) {
  const s = el('layoutStatus');
  s.className = 'status' + (isErr ? ' err' : '');
  s.textContent = msg;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function slugName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layout';
}

function downloadJSON(obj, name) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Apply a saved/imported layout and land it as one fresh undo step. */
function load(data, label) {
  if (!applyLayout(data)) { setStatus('That layout looks corrupted.', true); return; }
  renderControls();
  render();
  commit();
  setStatus(label);
}

function renderList() {
  const host = el('layoutList');
  host.innerHTML = '';
  const list = readAll();
  if (!list.length) {
    host.innerHTML = '<div class="hint">No saved layouts yet — name one above and save it.</div>';
    return;
  }
  list.slice().sort((a, b) => b.savedAt - a.savedAt).forEach(entry => {
    const row = document.createElement('div');
    row.className = 'card';
    row.style.cssText = 'padding:10px 12px;margin-bottom:8px';
    row.innerHTML = `
      <div class="top" style="margin-bottom:0;gap:10px">
        <button type="button" class="opt" style="flex:1;margin:0">
          <b>${escapeHtml(entry.name)}</b>${new Date(entry.savedAt).toLocaleString()}
        </button>
        <button type="button" class="icon danger" title="Delete this layout">&times;</button>
      </div>`;
    row.querySelector('.opt').addEventListener('click', () => load(entry.data, `Loaded "${entry.name}".`));
    row.querySelector('.icon.danger').addEventListener('click', () => {
      writeAll(readAll().filter(e => e.id !== entry.id));
      renderList();
      setStatus(`Deleted "${entry.name}".`);
    });
    host.appendChild(row);
  });
}

export function initLayoutsPanel() {
  renderList();

  el('saveLayoutBtn').addEventListener('click', () => {
    const name = el('layoutName').value.trim();
    if (!name) { setStatus('Name this layout first.', true); return; }
    const list = readAll();
    const existing = list.find(e => e.name.toLowerCase() === name.toLowerCase());
    const entry = { id: existing ? existing.id : 'l' + Date.now(), name, savedAt: Date.now(), data: captureLayout() };
    writeAll(existing ? list.map(e => e.id === entry.id ? entry : e) : [...list, entry]);
    renderList();
    setStatus(existing ? `Updated "${name}".` : `Saved "${name}".`);
  });

  el('exportLayoutBtn').addEventListener('click', () => {
    const name = el('layoutName').value.trim() || 'dialogpay-layout';
    downloadJSON(captureLayout(), slugName(name) + '.json');
  });

  el('importLayoutBtn').addEventListener('click', () => el('importLayoutFile').click());

  el('importLayoutFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      load(data, `Imported "${file.name}".`);
    } catch {
      setStatus('That file is not a layout this editor can read.', true);
    }
  });
}
