import { el } from './dom.js';
import { state, applyCopy } from './state.js';
import { render } from './render.js';
import { renderControls } from './controls.js';
import { commit } from './history.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

export const SYSTEM = [
  'You write copy for square 300x300 Dialog Pay app banners in Sri Lanka.',
  'Constraints: all caps, four short lines maximum, each line at most 22 characters.',
  'Line 1 and 2 form the headline (the action). Line 3 is a short supporting line.',
  'Line 4 is the reward line. The CTA is 2 to 3 words, all caps.',
  'Return JSON only, no prose and no code fences:',
  '{"options":[{"label":"short name","lines":["","","",""],"cta":""}]}'
].join(' ');

/**
 * Calls the Anthropic Messages API straight from the browser.
 * The key lives in the input only; nothing is persisted.
 */
export async function askClaude(userPrompt, system = SYSTEM) {
  const key = el('apiKey').value.trim();
  if (!key) throw new Error('Add your Anthropic API key first.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: el('model').value.trim() || 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 160)}`);
  }
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

function showOptions(options) {
  const out = el('aiOut');
  out.innerHTML = '';
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<b>${o.label || 'Option'}</b>${o.lines.filter(Boolean).join('<br>')}` +
      `<br><span style="color:#8A7788">${o.cta || ''}</span>`;
    b.addEventListener('click', () => {
      applyCopy(o.lines.filter(Boolean), o.cta);
      renderControls();
      render();
      commit();
      el('aiStatus').textContent = 'Applied.';
    });
    out.appendChild(b);
  });
}

async function run(prompt, busyText) {
  const status = el('aiStatus');
  status.className = 'status';
  status.textContent = busyText;
  el('aiGen').disabled = true;
  el('aiShort').disabled = true;
  try {
    const data = await askClaude(prompt);
    showOptions(data.options || []);
    status.textContent = 'Pick one to put it on the banner.';
  } catch (err) {
    status.className = 'status err';
    status.textContent = err.message;
  } finally {
    el('aiGen').disabled = false;
    el('aiShort').disabled = false;
  }
}

export function initAI() {
  el('aiGen').addEventListener('click', () => {
    const brief = el('brief').value.trim();
    if (!brief) {
      el('aiStatus').className = 'status err';
      el('aiStatus').textContent = 'Describe the banner first.';
      return;
    }
    run(`Write 3 distinct options for this banner. Brief: ${brief}`, 'Writing options…');
  });

  el('aiShort').addEventListener('click', () => {
    const current = state.lines.map(l => l.text).filter(Boolean).join(' / ') +
      ' | CTA: ' + el('btnText').value;
    const brief = el('brief').value.trim();
    run(`This copy is too long for the banner: ${current}. ` +
        'Give 3 tighter versions that keep the same meaning and every line under 22 characters.' +
        (brief ? ' Context: ' + brief : ''), 'Tightening…');
  });
}
