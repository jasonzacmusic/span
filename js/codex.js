/* Span — the Codex: one view where the circle, the keyboard, the staff and
   the trick card all light up together for the selected interval. */

import * as T from './theory.js';
import {
  INTERVALS, INTERVAL_BY_ID, FAMILY_COLOR, THIRDS_SHAPES, TRITONE_PAIRS,
  CIRCLE_STEPS, KEY_SIGS, TRANSPOSING,
} from './data.js';
import { Piano, placeInterval } from './piano.js';
import { Circle } from './circle.js';
import { drawInterval } from './staff.js';
import { playInterval, playSequence, playNote, unlockAudio } from './audio.js';

const state = {
  root: 'G',          // never default to C — house rule
  iv: 'M6',
  staffMode: 'melodic',
  clef: 'treble',
  keySig: 'G',
  instr: 'C',
};

let piano, circle;

function ivColor(iv) {
  return FAMILY_COLOR[iv.family];
}

function spelledTarget(rootNote, iv, dir = 1) {
  if (iv.id === 'TT') return T.spellTritone(rootNote, dir);
  return T.transpose(rootNote, { num: iv.num, quality: iv.quality }, dir);
}

function currentNotes() {
  const rootNote = T.parseNote(state.root);
  const iv = INTERVAL_BY_ID[state.iv];
  const target = spelledTarget(rootNote, iv, 1);
  return { rootNote, iv, target };
}

/* ---------- rendering ---------- */

function renderRail() {
  const rail = document.getElementById('ivRail');
  rail.innerHTML = INTERVALS.map((iv) => {
    const active = iv.id === state.iv ? ' active' : '';
    const bonus = iv.bonus ? ' bonus' : '';
    return `<button class="iv-chip${active}${bonus}" data-iv="${iv.id}" style="--fam:${ivColor(iv)}">
      <span class="chip-short">${iv.short}</span><span class="chip-label">${iv.label}</span></button>`;
  }).join('');
}

function renderPianoPanel() {
  const { rootNote, iv, target } = currentNotes();
  const rootPc = T.pitchClass(rootNote);
  const [rm, tm] = placeInterval(rootPc, iv.semis, 1);
  const color = ivColor(iv);
  const marks = [
    { midi: rm, name: T.noteName(rootNote), kind: 'root' },
    { midi: tm, name: T.noteName(target), kind: 'target', color },
  ];
  if (iv.derive) {
    const anchorMidi = iv.derive.anchor === 'root' ? rm
      : iv.derive.anchor === 'P5' ? rm + 7 : rm + 12;
    if (anchorMidi !== tm && anchorMidi !== rm) {
      marks.push({ midi: anchorMidi, kind: 'ghost', color: '#f7b955', name: iv.derive.anchor === 'P5' ? '5' : '8' });
    }
  }
  piano.show(marks, { from: rm, to: tm, label: `${iv.semis} st`, color });
}

function renderCircle() {
  const { rootNote, iv, target } = currentNotes();
  circle.show(T.pitchClass(rootNote), T.pitchClass(target), CIRCLE_STEPS[iv.id] ?? 0, ivColor(iv), {
    root: T.noteName(rootNote), target: T.noteName(target),
  });
}

function renderStaff() {
  const { rootNote, iv, target } = currentNotes();
  const instr = TRANSPOSING.find((t) => t.id === state.instr);
  let notes = [rootNote, target];
  if (instr && instr.id !== 'C') {
    notes = notes.map((n) => T.transpose(n, { num: instr.num, quality: instr.quality }, 1));
  }
  const el = document.getElementById('codexStaff');
  const w = Math.max(260, Math.min(el.clientWidth || 300, 420));
  drawInterval(el, notes, {
    clef: state.clef, keySig: state.keySig, mode: state.staffMode, width: w,
  });
}

/* The working-out, drawn: how you actually get there from an anchor you
   already trust. */
function ladderHTML(rootNote, iv, target) {
  const rung = (cls, big, small) => `<span class="rung ${cls}">${big}<em>${small}</em></span>`;
  const rootR = rung('', T.noteName(rootNote), 'root');
  let body;

  if (iv.derive) {
    const anchorIv = iv.derive.anchor === 'P5' ? { num: 5, quality: 'P' } : null;
    const anchorNote = iv.derive.anchor === 'root' ? rootNote
      : iv.derive.anchor === 'P8' ? { ...rootNote, oct: rootNote.oct + 1 }
        : T.transpose(rootNote, anchorIv, 1);
    const off = iv.derive.offset;
    const anchorLabel = iv.derive.anchor === 'root' ? 'root' : iv.derive.anchor === 'P8' ? 'octave' : 'P5';
    const steps = `${off > 0 ? '+' : '−'}${Math.abs(off)}`;
    body = iv.derive.anchor === 'root'
      ? `${rootR}<span class="ladder-op">${steps}</span>${rung('dest', T.noteName(target), iv.short)}`
      : `${rootR}<span class="ladder-op">→</span>${rung('anchor', T.noteName(anchorNote), anchorLabel)}<span class="ladder-op">${steps}</span>${rung('dest', T.noteName(target), iv.short)}`;
  } else if (iv.id === 'TT') {
    body = `${rootR}<span class="ladder-op">⇄</span>${rung('dest', T.noteName(target), 'mirror')}`;
  } else if (iv.family === 'thirds') {
    const BLACK = new Set([1, 3, 6, 8, 10]);
    const colour = (n) => (BLACK.has(T.pitchClass(n)) ? 'black' : 'white');
    body = `${rootR}<span class="ladder-op">→</span>${rung('dest', T.noteName(target), `${colour(rootNote)}–${colour(target)}`)}`;
  } else if (iv.family === 'perfect') {
    const st = CIRCLE_STEPS[iv.id];
    body = `${rootR}<span class="ladder-op">${st > 0 ? '⟳' : '⟲'}</span>${rung('dest', T.noteName(target), `${Math.abs(st)} step`)}`;
  } else {
    body = `${rootR}<span class="ladder-op">→</span>${rung('dest', T.noteName(target), iv.short)}`;
  }
  return `<div class="iv-ladder">${body}</div>`;
}

function renderCard() {
  const { rootNote, iv, target } = currentNotes();
  const color = ivColor(iv);
  const partner = INTERVAL_BY_ID[iv.inversion];
  const el = document.getElementById('ivCard');
  el.style.setProperty('--fam', color);
  el.innerHTML = `
    <div class="iv-head">
      <span class="iv-big">${iv.short}</span>
      <div><h2>${iv.label}</h2>${iv.alias ? `<span class="iv-alias">${iv.alias}</span>` : ''}</div>
    </div>
    <div class="iv-notes">${T.noteName(rootNote)} <span class="arrow">→</span> ${T.noteName(target)}
      <span class="iv-semis">${iv.semis} semitone${iv.semis === 1 ? '' : 's'}</span></div>
    ${ladderHTML(rootNote, iv, target)}
    <div class="iv-trick"><span class="tag">trick</span>${iv.trick}</div>
    <div class="iv-practice"><span class="tag">practice</span>${iv.practice}</div>
    <div class="iv-pills">
      <span class="pill sargam" title="sargam">${iv.sargam} · ${iv.sargamName}</span>
      ${partner ? `<button class="pill flip" id="flipBtn" title="invert it">⇅ inverts to ${partner.short}</button>` : ''}
    </div>
    <div class="iv-songs">
      <span class="song">▲ ${iv.songs.up}</span>
      <span class="song">▼ ${iv.songs.down}</span>
    </div>
    <div class="iv-play">
      <button class="play-btn" data-play="up">▶ Up</button>
      <button class="play-btn" data-play="down">▶ Down</button>
      <button class="play-btn" data-play="harmonic">▶ Together</button>
    </div>`;
  const flip = document.getElementById('flipBtn');
  if (flip) flip.addEventListener('click', () => selectInterval(partner.id, true));
  el.querySelectorAll('.play-btn').forEach((b) => {
    b.addEventListener('click', () => playCurrent(b.dataset.play));
  });
}

function renderAll() {
  renderRail();
  renderPianoPanel();
  renderCircle();
  renderStaff();
  renderCard();
  document.getElementById('rootBadge').textContent = T.noteName(T.parseNote(state.root));
}

/* ---------- audio ---------- */

function playCurrent(mode) {
  const { rootNote, iv } = currentNotes();
  const rootPc = T.pitchClass(rootNote);
  const dir = mode === 'down' ? -1 : 1;
  const [rm, tm] = placeInterval(rootPc, iv.semis, dir);
  playInterval(rm, tm, mode === 'harmonic' ? 'harmonic' : mode);
}

/* ---------- interactions ---------- */

function selectInterval(id, autoplay = false) {
  state.iv = id;
  renderAll();
  if (autoplay) playCurrent('up');
}

function setRoot(name, autoplay = false) {
  state.root = name;
  renderAll();
  if (autoplay) playCurrent('up');
}

function renderThirdsLab(which = 'M3') {
  const lab = document.getElementById('thirdsLab');
  const groups = THIRDS_SHAPES[which];
  const color = which === 'M3' ? FAMILY_COLOR.thirds : '#7fb4ff';
  lab.querySelector('.lab-body').innerHTML = groups.map((g) => `
    <div class="shape-row">
      <span class="shape-name">${g.shape} <em>${g.pairs.length}</em></span>
      <div class="shape-chips">${g.pairs.map(([a, b]) => {
        const an = T.noteName(T.parseNote(a));
        const bn = T.noteName(T.parseNote(b));
        return `<button class="note-chip" data-a="${a}" data-b="${b}" data-iv="${which}" style="--fam:${color}">${an}·${bn}</button>`;
      }).join('')}</div>
    </div>`).join('');
  lab.querySelectorAll('.thirds-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.which === which));
}

function renderTritoneLab() {
  const lab = document.getElementById('tritoneLab');
  lab.querySelector('.lab-body').innerHTML = `<div class="shape-chips tt-chips">${TRITONE_PAIRS.map(([a, b]) => {
    const an = T.noteName(T.parseNote(a));
    const bn = T.noteName(T.parseNote(b));
    return `<button class="note-chip tt" data-a="${a}" data-b="${b}" data-iv="TT" style="--fam:${FAMILY_COLOR.tritone}">${an} ⇄ ${bn}</button>`;
  }).join('')}</div>`;
}

function wireLabs() {
  document.querySelectorAll('.thirds-toggle button').forEach((b) => {
    b.addEventListener('click', () => renderThirdsLab(b.dataset.which));
  });
  renderThirdsLab('M3');
  renderTritoneLab();

  document.getElementById('labsRow').addEventListener('click', (e) => {
    const chip = e.target.closest('.note-chip');
    if (!chip) return;
    unlockAudio();
    state.root = chip.dataset.a;
    state.iv = chip.dataset.iv;
    renderAll();
    playCurrent(chip.dataset.iv === 'TT' ? 'up' : 'harmonic');
  });

  document.getElementById('wholeToneBtn').addEventListener('click', () => {
    unlockAudio();
    const { rootNote } = currentNotes();
    const [rm] = placeInterval(T.pitchClass(rootNote), 12, 1);
    const up = [0, 2, 4, 6, 8, 10, 12].map((s) => rm + s);
    playSequence([...up, ...up.slice(0, -1).reverse()], 0.24, 0.45);
  });
  document.getElementById('chromaticBtn').addEventListener('click', () => {
    unlockAudio();
    const { rootNote } = currentNotes();
    const [rm] = placeInterval(T.pitchClass(rootNote), 12, 1);
    const up = Array.from({ length: 13 }, (_, i) => rm + i);
    playSequence([...up, ...up.slice(0, -1).reverse()], 0.13, 0.3);
  });
}

export function initCodex() {
  piano = new Piano(document.getElementById('codexPiano'), {
    onKey: (midi) => {
      unlockAudio();
      playNote(midi, 0, 0.8, 0.5);
      setRoot(T.midiToNearestSpelling(midi).replace('♯', '#').replace('♭', 'b'));
    },
  });
  piano.setClickable(true);
  circle = new Circle(document.getElementById('circlePanel'), {
    onRoot: (name) => { unlockAudio(); setRoot(name, true); },
  });

  document.getElementById('ivRail').addEventListener('click', (e) => {
    const chip = e.target.closest('.iv-chip');
    if (!chip) return;
    unlockAudio();
    selectInterval(chip.dataset.iv, true);
  });

  const keySel = document.getElementById('codexKey');
  keySel.innerHTML = KEY_SIGS.map((k) => `<option${k === state.keySig ? ' selected' : ''}>${k}</option>`).join('');
  keySel.addEventListener('change', () => { state.keySig = keySel.value; renderStaff(); });

  const clefSel = document.getElementById('codexClef');
  clefSel.addEventListener('change', () => { state.clef = clefSel.value; renderStaff(); });

  const instrSel = document.getElementById('codexInstr');
  instrSel.innerHTML = TRANSPOSING.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
  instrSel.addEventListener('change', () => { state.instr = instrSel.value; renderStaff(); });

  const modeSel = document.getElementById('codexStaffMode');
  modeSel.addEventListener('change', () => { state.staffMode = modeSel.value; renderStaff(); });

  wireLabs();
  renderAll();
  window.addEventListener('resize', () => renderStaff());
}
