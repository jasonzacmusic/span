/* Span — shell: tabs + boot. */

import { initCodex } from './codex.js';
import { initTrainers, startDrill } from './trainer.js';
import { initVoice, stopVoice, voiceVisible } from './voice.js';
import { unlockAudio } from './audio.js';

const TABS = ['codex', 'ear', 'eyes', 'hands', 'voice'];
const started = new Set();

function showView(id) {
  TABS.forEach((t) => {
    document.getElementById('view-' + t).classList.toggle('active', t === id);
    document.querySelector(`.tab[data-tab="${t}"]`).classList.toggle('active', t === id);
  });
  if (id === 'voice') voiceVisible();
  else stopVoice();
  if (['ear', 'eyes', 'hands'].includes(id) && !started.has(id)) {
    started.add(id);
    startDrill(id);
  }
}

function boot() {
  initCodex();
  initTrainers();
  initVoice();
  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => { unlockAudio(); showView(b.dataset.tab); });
  });
  showView('codex');
  document.getElementById('year').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', boot);
