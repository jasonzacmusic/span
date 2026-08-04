/* Span — shell: tabs + boot. */

import { initLearn } from './learn.js';
import { initTrainers, startDrill } from './trainer.js';
import { initVoice, stopVoice, voiceVisible } from './voice.js';
import { unlockAudio } from './audio.js';

const TABS = ['learn', 'ear', 'eyes', 'hands', 'voice'];
const started = new Set();

function showView(id, push = true) {
  TABS.forEach((t) => {
    document.getElementById('view-' + t).classList.toggle('active', t === id);
    document.querySelector(`.tab[data-tab="${t}"]`).classList.toggle('active', t === id);
  });
  if (push && window.location.hash.slice(1) !== id) {
    history.replaceState(null, '', '#' + id);
  }
  if (id === 'voice') voiceVisible();
  else stopVoice();
  if (['ear', 'eyes', 'hands'].includes(id) && !started.has(id)) {
    started.add(id);
    startDrill(id);
  }
}

function boot() {
  initLearn();
  initTrainers();
  initVoice();
  document.querySelectorAll('.tab').forEach((b) => {
    b.addEventListener('click', () => { unlockAudio(); showView(b.dataset.tab); });
  });
  const wanted = window.location.hash.slice(1);
  showView(TABS.includes(wanted) ? wanted : 'learn');
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1);
    if (TABS.includes(h)) showView(h, false);
  });
  document.getElementById('year').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', boot);
