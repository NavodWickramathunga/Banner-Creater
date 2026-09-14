import { el } from './dom.js';
import { captureLayout, applyLayout } from './layout.js';
import { render } from './render.js';
import { renderControls } from './controls.js';

const LIMIT = 60;   // steps kept; older ones just fall off

let undoStack = [];
let redoStack = [];
let current = null;     // JSON snapshot of the state as of the last commit
let suppress = false;   // true while undo()/redo() itself is applying a snapshot

function snapshot() {
  return JSON.stringify(captureLayout());
}

function updateButtons() {
  el('undoBtn').disabled = undoStack.length === 0;
  el('redoBtn').disabled = redoStack.length === 0;
}

/**
 * Record the current state as an undo step. Call after a change has
 * actually landed (a click, a drag release, a value that settled) — not on
 * every keystroke. A no-op change (nothing actually differs) is skipped.
 */
export function commit() {
  if (suppress) return;
  const snap = snapshot();
  if (snap === current) return;
  if (current !== null) {
    undoStack.push(current);
    if (undoStack.length > LIMIT) undoStack.shift();
    redoStack = [];
  }
  current = snap;
  updateButtons();
}

let debounceTimer = null;

/** Same as commit(), but waits for a pause in rapid-fire input (typing, dragging) first. */
export function commitDebounced(delay = 500) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(commit, delay);
}

function jumpTo(snap) {
  suppress = true;
  applyLayout(JSON.parse(snap));
  suppress = false;
  current = snap;
  renderControls();
  render();
  updateButtons();
}

export function undo() {
  clearTimeout(debounceTimer);
  if (!undoStack.length) return;
  redoStack.push(current);
  jumpTo(undoStack.pop());
}

export function redo() {
  clearTimeout(debounceTimer);
  if (!redoStack.length) return;
  undoStack.push(current);
  jumpTo(redoStack.pop());
}

export function initHistory() {
  current = snapshot();   // baseline: the state the editor booted with
  updateButtons();

  el('undoBtn').addEventListener('click', undo);
  el('redoBtn').addEventListener('click', redo);

  window.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
  });
}
