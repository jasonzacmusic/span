/* Span — the visual labs on the Learn page: thirds by key colour, the tritone
   clock, the inversion bench and the scale gym. Everything is a picture of a
   keyboard, not a list of note names. */

import * as T from './theory.js';
import { FAMILY_COLOR, INTERVAL_BY_ID, THIRDS_SHAPES, TRITONE_PAIRS } from './data.js';
import { keyboardSVG, shapeGlyph, isBlack } from './keys.js';
import { playInterval, playNote, playSequence, unlockAudio } from './audio.js';
import { icon, iconLabel } from './icons.js';

const BLACK_PC = new Set([1, 3, 6, 8, 10]);
const pcIsBlack = (n) => BLACK_PC.has(T.pitchClass(n));

/* Place a note in the octave nearest a reference, so mini keyboards stay put. */
function near(note, refMidi) {
  const m = { ...note };
  m.oct += Math.round((refMidi - T.midi(m)) / 12);
  return m;
}

/* ─────────── 1. Thirds by key colour ─────────── */

export function renderThirdsLab(el, which, onPick) {
  const groups = THIRDS_SHAPES[which];
  const color = FAMILY_COLOR.thirds;
  const iv = INTERVAL_BY_ID[which];

  el.querySelector('.lab-body').innerHTML = groups.map((g) => {
    const [sampleA, sampleB] = g.pairs[0];
    const glyph = shapeGlyph(pcIsBlack(T.parseNote(sampleA)), pcIsBlack(T.parseNote(sampleB)));
    const cards = g.pairs.map(([a, b]) => {
      const rootNote = near(T.parseNote(a), 60);
      const target = T.transpose(rootNote, { num: iv.num, quality: iv.quality }, 1);
      const kb = keyboardSVG([
        { midi: T.midi(rootNote), kind: 'root' },
        { midi: T.midi(target), kind: 'target', color },
      ], { size: 'xs', minWhite: 4 });
      return `<button class="shape-card" data-a="${a}" data-iv="${which}" title="${T.noteName(rootNote)} to ${T.noteName(target)}">
        ${kb}<span class="shape-card-name">${T.noteName(rootNote)}·${T.noteName(target)}</span></button>`;
    }).join('');
    return `<div class="shape-group">
      <div class="shape-head">${glyph}<span class="shape-name">${g.shape}</span><em>${g.pairs.length}</em></div>
      <div class="shape-cards">${cards}</div>
    </div>`;
  }).join('');

  el.querySelectorAll('.thirds-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.which === which));
  el.querySelectorAll('.shape-card').forEach((c) => {
    c.addEventListener('click', () => onPick(c.dataset.a, c.dataset.iv));
  });
}

/* ─────────── 2. The tritone clock ─────────── */

const CLOCK_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const CC = 132;
const CR = 96;

function clockXY(pc, radius = CR) {
  const a = (pc * 30 - 90) * (Math.PI / 180);
  return [CC + radius * Math.cos(a), CC + radius * Math.sin(a)];
}

export function renderTritoneLab(el, onPick) {
  const color = FAMILY_COLOR.tritone;
  const axes = TRITONE_PAIRS.map(([a, b], i) => {
    const pa = T.pitchClass(T.parseNote(a));
    const pb = T.pitchClass(T.parseNote(b));
    const [x1, y1] = clockXY(pa, CR - 17);
    const [x2, y2] = clockXY(pb, CR - 17);
    return `<line class="tt-axis" data-pair="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join('');

  const nodes = CLOCK_NAMES.map((n, pc) => {
    const [x, y] = clockXY(pc);
    return `<g class="tt-node" data-pc="${pc}" data-name="${n.replace('♯', '#').replace('♭', 'b')}">
      <circle cx="${x}" cy="${y}" r="15" class="${BLACK_PC.has(pc) ? 'blk' : 'wht'}"/>
      <text x="${x}" y="${y + 4}">${n}</text></g>`;
  }).join('');

  el.querySelector('.lab-body').innerHTML = `
    <div class="tt-wrap">
      <svg viewBox="0 0 ${CC * 2} ${CC * 2}" class="tt-clock" role="img" aria-label="tritone clock">
        <circle cx="${CC}" cy="${CC}" r="${CR - 17}" class="tt-ring"/>
        <g class="tt-axes">${axes}</g>
        ${nodes}
      </svg>
      <div class="tt-side">
        <div class="tt-readout" id="ttReadout"></div>
        <p class="tt-note">Every line is a straight diameter — six semitones each way.
          That is why a tritone flipped upside-down is still a tritone.</p>
      </div>
    </div>`;

  const readout = el.querySelector('#ttReadout');
  const show = (idx, play) => {
    const [a, b] = TRITONE_PAIRS[idx];
    const lo = near(T.parseNote(a), 60);
    const hi = T.spellTritone(lo, 1);
    el.querySelectorAll('.tt-axis').forEach((l, i) => l.classList.toggle('on', i === idx));
    el.querySelectorAll('.tt-node').forEach((n) => {
      const pc = +n.dataset.pc;
      n.classList.toggle('on', pc === T.pitchClass(lo) || pc === T.pitchClass(hi));
    });
    readout.innerHTML = `
      <div class="tt-pair">${T.noteName(lo)} <span>⇄</span> ${T.noteName(hi)}</div>
      ${keyboardSVG([
    { midi: T.midi(lo), kind: 'root', label: T.noteName(lo) },
    { midi: T.midi(hi), kind: 'target', color, label: T.noteName(hi) },
  ], { size: 'sm', minWhite: 8, arc: { from: T.midi(lo), to: T.midi(hi), color } })}
      <div class="tt-flip">
        <button class="ghost-btn" data-tt-play>${iconLabel('play', 'hear it')}</button>
        <button class="ghost-btn" data-tt-invert>${iconLabel('mirror', 'flip it over')}</button>
      </div>`;
    readout.querySelector('[data-tt-play]').addEventListener('click', () => {
      unlockAudio();
      playInterval(T.midi(lo), T.midi(hi), 'up');
    });
    readout.querySelector('[data-tt-invert]').addEventListener('click', () => {
      unlockAudio();
      // take the lower note up an octave — still six semitones
      const up = T.midi(lo) + 12;
      readout.querySelector('.tt-pair').innerHTML = `${T.noteName(hi)} <span>⇄</span> ${T.noteName(lo)} <em>still a tritone</em>`;
      readout.querySelector('.kb').outerHTML = keyboardSVG([
        { midi: T.midi(hi), kind: 'root', label: T.noteName(hi) },
        { midi: up, kind: 'target', color, label: T.noteName(lo) },
      ], { size: 'sm', minWhite: 8, arc: { from: T.midi(hi), to: up, color } });
      playInterval(T.midi(hi), up, 'up');
    });
    if (play) { unlockAudio(); playInterval(T.midi(lo), T.midi(hi), 'up'); }
    if (onPick) onPick(a);
  };

  el.querySelectorAll('.tt-axis').forEach((l) => l.addEventListener('click', () => show(+l.dataset.pair, true)));
  el.querySelectorAll('.tt-node').forEach((n) => n.addEventListener('click', () => {
    const pc = +n.dataset.pc;
    const idx = TRITONE_PAIRS.findIndex(([a, b]) => T.pitchClass(T.parseNote(a)) === pc || T.pitchClass(T.parseNote(b)) === pc);
    show(idx, true);
  }));
  show(0, false);
}

/* ─────────── 3. The inversion bench ─────────── */

export function renderInversionLab(el, rootName, ivId) {
  const iv = INTERVAL_BY_ID[ivId];
  const partner = INTERVAL_BY_ID[iv.inversion];
  if (!partner) { el.querySelector('.lab-body').innerHTML = ''; return; }

  const rootNote = near(T.parseNote(rootName), 60);
  const target = ivId === 'TT' ? T.spellTritone(rootNote, 1)
    : T.transpose(rootNote, { num: iv.num, quality: iv.quality }, 1);
  const rootUp = T.midi(rootNote) + 12;

  const c1 = FAMILY_COLOR[iv.family];
  const c2 = FAMILY_COLOR[partner.family];

  const before = keyboardSVG([
    { midi: T.midi(rootNote), kind: 'root', label: T.noteName(rootNote) },
    { midi: T.midi(target), kind: 'target', color: c1, label: T.noteName(target) },
  ], { size: 'sm', minWhite: 9, arc: { from: T.midi(rootNote), to: T.midi(target), color: c1 } });

  const after = keyboardSVG([
    { midi: T.midi(target), kind: 'root', label: T.noteName(target) },
    { midi: rootUp, kind: 'target', color: c2, label: T.noteName(rootNote) },
  ], { size: 'sm', minWhite: 9, arc: { from: T.midi(target), to: rootUp, color: c2 } });

  el.querySelector('.lab-body').innerHTML = `
    <div class="inv-bench">
      <div class="inv-side">
        <span class="inv-tag" style="--fam:${c1}">${iv.short} · ${iv.label}</span>
        ${before}
        <span class="inv-sum">the numbers: ${iv.num} + ${partner.num} = 9</span>
      </div>
      <button class="inv-flip" title="lift the bottom note up an octave">
        <span class="inv-arrow">${icon.invert({ size: '22px' })}</span><span>flip the<br>bottom note<br>up an octave</span>
      </button>
      <div class="inv-side">
        <span class="inv-tag" style="--fam:${c2}">${partner.short} · ${partner.label}</span>
        ${after}
        <span class="inv-sum">the semitones: ${iv.semis} + ${partner.semis} = 12</span>
      </div>
    </div>`;

  el.querySelector('.inv-flip').addEventListener('click', () => {
    unlockAudio();
    playInterval(T.midi(rootNote), T.midi(target), 'harmonic');
    setTimeout(() => playInterval(T.midi(target), rootUp, 'harmonic'), 1100);
    el.querySelectorAll('.inv-side')[0].classList.add('dimmed');
    el.querySelectorAll('.inv-side')[1].classList.add('flash');
    setTimeout(() => {
      el.querySelectorAll('.inv-side')[0].classList.remove('dimmed');
      el.querySelectorAll('.inv-side')[1].classList.remove('flash');
    }, 2200);
  });
}

/* ─────────── 4. The scale gym ─────────── */

export const GYM_SCALES = [
  { id: 'wholetone', label: 'Whole-tone', note: 'every step a major 2nd', steps: [0, 2, 4, 6, 8, 10, 12] },
  { id: 'chromatic', label: 'Chromatic', note: 'every step a minor 2nd', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'majblues', label: 'Major blues', note: '1 2 ♭3 3 5 6 — hexatonic', steps: [0, 2, 3, 4, 7, 9, 12] },
  { id: 'minblues', label: 'Minor blues', note: '1 ♭3 4 ♭5 5 ♭7 — hexatonic', steps: [0, 3, 5, 6, 7, 10, 12] },
];

/* Plain names, the way the class chants them: notation is biased towards the
   major and minor scales, so hexatonic and blues scales get plain spellings. */
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

function plainName(midi, useFlats) {
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[((midi % 12) + 12) % 12];
}

export function renderScaleGym(el, rootName) {
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);
  const useFlats = rootName.includes('b') || rootName === 'F';

  el.querySelector('.lab-body').innerHTML = `
    <div class="gym-picker">${GYM_SCALES.map((s, i) => `<button class="gym-tab${i === 0 ? ' active' : ''}" data-gym="${s.id}">${s.label}</button>`).join('')}</div>
    <div class="gym-stage"></div>`;

  const stage = el.querySelector('.gym-stage');
  let timers = [];

  const draw = (scale) => {
    timers.forEach(clearTimeout);
    timers = [];
    const midis = scale.steps.map((s) => rootMidi + s);
    const marks = midis.map((m, i) => ({
      midi: m, kind: i === 0 || i === midis.length - 1 ? 'root' : 'step',
      color: i === 0 || i === midis.length - 1 ? undefined : FAMILY_COLOR.seconds,
    }));
    stage.innerHTML = `
      <div class="gym-kb">${keyboardSVG(marks, { size: 'md', minWhite: 8, range: [rootMidi - ((rootMidi - 60) % 12 + 12) % 12, rootMidi + 12 + 4] })}</div>
      <div class="gym-names">${midis.map((m, i) => `<span class="gym-note-name" data-i="${i}">${plainName(m, useFlats)}</span>`).join('<i class="gym-gap"></i>')}</div>
      <div class="gym-actions">
        <button class="play-btn primary" data-gym-play>${iconLabel('play', 'Play it up and down')}</button>
        <span class="gym-caption">${scale.note}</span>
      </div>`;

    const keysEls = stage.querySelectorAll('.kb-key');
    const nameEls = stage.querySelectorAll('.gym-note-name');
    const lightAt = (i, on) => {
      const m = midis[i];
      keysEls.forEach((k) => { if (+k.dataset.midi === m) k.classList.toggle('lit-play', on); });
      if (nameEls[i]) nameEls[i].classList.toggle('on', on);
    };

    stage.querySelector('[data-gym-play]').addEventListener('click', () => {
      unlockAudio();
      timers.forEach(clearTimeout);
      timers = [];
      keysEls.forEach((k) => k.classList.remove('lit-play'));
      nameEls.forEach((n) => n.classList.remove('on'));
      const order = [...midis.keys(), ...[...midis.keys()].slice(0, -1).reverse()];
      const gap = scale.id === 'chromatic' ? 150 : 240;
      playSequence(order.map((i) => midis[i]), gap / 1000, gap / 1000 + 0.25);
      order.forEach((idx, n) => {
        timers.push(setTimeout(() => lightAt(idx, true), n * gap));
        timers.push(setTimeout(() => lightAt(idx, false), n * gap + gap * 0.92));
      });
    });
  };

  el.querySelectorAll('.gym-tab').forEach((b) => b.addEventListener('click', () => {
    el.querySelectorAll('.gym-tab').forEach((x) => x.classList.toggle('active', x === b));
    draw(GYM_SCALES.find((s) => s.id === b.dataset.gym));
  }));
  draw(GYM_SCALES[0]);
}
