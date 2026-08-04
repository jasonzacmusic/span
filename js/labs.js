/* Span — the visual labs on the Learn page: thirds by key colour, the tritone
   clock, the inversion bench and the scale gym. Everything is a picture of a
   keyboard, not a list of note names. */

import * as T from './theory.js';
import {
  FAMILY_COLOR, INTERVAL_BY_ID, INTERVALS, THIRDS_SHAPES, TRITONE_PAIRS,
  CHARACTERS, TRIADS, GAP_NAME, QUALITY_CHAIN, QUALITY_NAME, QUALITY_SHORT, SARGAM_LADDER,
} from './data.js';
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

/* ─────────── 5. The ruler: all twelve from one root ─────────── */

/* The page Jason asks every student to write out by hand — "intervals of A"
   as a heading, then all twelve, then categorised. Here it draws itself. */
export function renderRulerLab(el, rootName, onPick) {
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);
  const rows = INTERVALS.filter((iv) => !iv.bonus).map((iv) => {
    const target = iv.id === 'TT' ? T.spellTritone(rootNote, 1)
      : T.transpose(rootNote, { num: iv.num, quality: iv.quality }, 1);
    const ch = CHARACTERS.find((c) => c.id === iv.character);
    return { iv, target, ch, midi: rootMidi + iv.semis };
  });

  // number every key 1..12 instead of flooding the keyboard with colour;
  // a row click lights just that one
  const drawKb = (litId) => {
    const lit = rows.find((r) => r.iv.id === litId);
    const marks = [{ midi: rootMidi, kind: 'root', label: T.noteName(rootNote) }].concat(
      rows.map((r) => (lit && r.iv.id === litId
        ? { midi: r.midi, kind: 'step', color: r.ch.color, label: T.noteName(r.target) }
        : { midi: r.midi, kind: 'plain', label: String(r.iv.semis) })),
    );
    return keyboardSVG(marks, {
      size: 'md', range: [rootMidi, rootMidi + 12],
      arc: lit ? { from: rootMidi, to: lit.midi, color: lit.ch.color } : null,
    });
  };

  el.querySelector('.lab-body').innerHTML = `
    <div class="ruler-kb">${drawKb(null)}</div>
    <div class="ruler-rows">${rows.map((r) => `
      <button class="ruler-row" data-iv="${r.iv.id}" style="--fam:${FAMILY_COLOR[r.iv.family]};--ch:${r.ch.color}">
        <span class="rr-semis">${r.iv.semis}</span>
        <span class="rr-short">${r.iv.short}</span>
        <span class="rr-note">${T.noteName(r.target)}</span>
        <span class="rr-label">${r.iv.label}</span>
        <span class="rr-sargam">${r.iv.sargam}</span>
        <span class="rr-char">${r.ch.label}</span>
      </button>`).join('')}</div>`;

  el.querySelectorAll('.ruler-row').forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    const r = rows.find((x) => x.iv.id === b.dataset.iv);
    playInterval(rootMidi, r.midi, 'up');
    el.querySelector('.ruler-kb').innerHTML = drawKb(b.dataset.iv);
    el.querySelectorAll('.ruler-row').forEach((x) => x.classList.toggle('on', x === b));
    if (onPick) onPick(b.dataset.iv);
  }));
}

/* ─────────── 6. Character: the four moods ─────────── */

export function renderCharacterLab(el, rootName, onPick) {
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);

  el.querySelector('.lab-body').innerHTML = `<div class="char-grid">${CHARACTERS.map((c) => `
    <div class="char-col" style="--ch:${c.color}">
      <div class="char-head"><h4>${c.label}</h4><p>${c.blurb}</p></div>
      <div class="char-chips">${c.set.map((id) => {
    const iv = INTERVAL_BY_ID[id];
    const target = id === 'TT' ? T.spellTritone(rootNote, 1)
      : T.transpose(rootNote, { num: iv.num, quality: iv.quality }, 1);
    return `<button class="char-chip" data-iv="${id}" data-semis="${iv.semis}">
          <b>${iv.short}</b><span>${T.noteName(rootNote)}·${T.noteName(target)}</span></button>`;
  }).join('')}</div>
    </div>`).join('')}</div>
    <p class="char-note">“An interval is the vibe created when two musical notes collide.”
      Play each column back to back and the four moods separate themselves.</p>`;

  el.querySelectorAll('.char-chip').forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    playInterval(rootMidi, rootMidi + Number(b.dataset.semis), 'harmonic');
    if (onPick) onPick(b.dataset.iv);
  }));
}

/* ─────────── 7. The quality shifter ─────────── */

export function renderQualityLab(el, rootName, num) {
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);
  const perfect = [1, 4, 5, 8].includes(num);
  const chain = perfect ? QUALITY_CHAIN.perfect : QUALITY_CHAIN.major;

  const steps = chain.map((q) => {
    const note = T.transpose(rootNote, { num, quality: q }, 1);
    return { q, note, semis: T.midi(note) - rootMidi, ok: Math.abs(note.acc) <= 2 };
  }).filter((s) => s.ok);

  el.querySelector('.lab-body').innerHTML = `
    <div class="qual-picker">${[2, 3, 4, 5, 6, 7].map((n) => `<button class="qual-num${n === num ? ' active' : ''}" data-num="${n}">${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}</button>`).join('')}</div>
    <div class="qual-chain">${steps.map((s, i) => `
      ${i ? '<span class="qual-arrow">♯ →</span>' : ''}
      <button class="qual-step${s.q === 'M' || s.q === 'P' ? ' anchor' : ''}" data-semis="${s.semis}">
        <span class="qs-name">${QUALITY_NAME[s.q]}</span>
        <span class="qs-note">${T.noteName(s.note)}</span>
        <span class="qs-tag">${QUALITY_SHORT[s.q]}${num} · ${s.semis} st</span>
      </button>`).join('')}</div>
    <p class="qual-note">${perfect
    ? 'A 4th, 5th, unison or octave is <b>perfect</b> — it has no major or minor. Flatten it and it is diminished; sharpen it and it is augmented.'
    : 'A 2nd, 3rd, 6th or 7th is <b>major</b> by default. One flat makes it minor, two makes it diminished; one sharp makes it augmented.'}</p>`;

  el.querySelectorAll('.qual-num').forEach((b) => b.addEventListener('click', () => {
    renderQualityLab(el, rootName, Number(b.dataset.num));
  }));
  el.querySelectorAll('.qual-step').forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    playInterval(rootMidi, rootMidi + Number(b.dataset.semis), 'up');
  }));
}

/* ─────────── 8. Triad anatomy ─────────── */

export function renderTriadLab(el, rootName, triadId) {
  const tri = TRIADS.find((t) => t.id === triadId) || TRIADS[0];
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);
  const color = FAMILY_COLOR.thirds;

  // three voicings: root position, 1st and 2nd inversion
  const voicings = [0, 1, 2].map((inv) => {
    const order = tri.semis.slice(inv).concat(tri.semis.slice(0, inv).map((s) => s + 12));
    const midis = order.map((s) => rootMidi + s);
    const gaps = [midis[1] - midis[0], midis[2] - midis[1]];
    return {
      inv, midis, gaps,
      outer: GAP_NAME[midis[2] - midis[0]],
      name: ['Root position', '1st inversion', '2nd inversion'][inv],
    };
  });

  el.querySelector('.lab-body').innerHTML = `
    <div class="triad-picker">${TRIADS.map((t) => `<button class="triad-tab${t.id === tri.id ? ' active' : ''}" data-t="${t.id}">${t.label}</button>`).join('')}</div>
    <p class="triad-recipe">Two thirds, stacked: <b>${tri.stack[0]}</b> then <b>${tri.stack[1]}</b>.
      The outer shell is a <b>${tri.outer}</b>.</p>
    <div class="triad-rows">${voicings.map((v) => `
      <div class="triad-row">
        <span class="tr-name">${v.name}</span>
        <div class="tr-kb">${keyboardSVG(v.midis.map((m, i) => ({
    midi: m, kind: i === 0 ? 'root' : 'target', color, label: T.noteName(spellTriadNote(rootNote, tri, v.inv, i)),
  })), { size: 'sm', minWhite: 10, arc: { from: v.midis[0], to: v.midis[2], color } })}</div>
        <span class="tr-anatomy">
          <em>${GAP_NAME[v.gaps[0]]}</em><i>${v.gaps[0]}</i>
          <em>${GAP_NAME[v.gaps[1]]}</em><i>${v.gaps[1]}</i>
          <b>outer ${v.outer}</b>
        </span>
        <button class="ghost-btn" data-play="${v.midis.join(',')}">hear it</button>
      </div>`).join('')}</div>`;

  el.querySelectorAll('.triad-tab').forEach((b) => b.addEventListener('click', () => {
    renderTriadLab(el, rootName, b.dataset.t);
  }));
  el.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    b.dataset.play.split(',').forEach((m) => playNote(Number(m), 0, 1.6, 0.38));
  }));
}

/* Spell a triad tone properly: stack real thirds, then rotate. */
function spellTriadNote(rootNote, tri, inv, idx) {
  const third = tri.stack[0] === 'M3' ? { num: 3, quality: 'M' } : { num: 3, quality: 'm' };
  const second = tri.stack[1] === 'M3' ? { num: 3, quality: 'M' } : { num: 3, quality: 'm' };
  const chord = [rootNote, T.transpose(rootNote, third, 1)];
  chord.push(T.transpose(chord[1], second, 1));
  return chord[(inv + idx) % 3];
}

/* ─────────── 9. The sargam ladder ─────────── */

export function renderSargamLab(el, rootName) {
  const rootNote = near(T.parseNote(rootName), 60);
  const rootMidi = T.midi(rootNote);

  el.querySelector('.lab-body').innerHTML = `
    <div class="sargam-ladder">${SARGAM_LADDER.map((s) => `
      <button class="sg-step${s.swara.length > 1 ? ' shared' : ''}" data-semis="${s.semis}">
        <span class="sg-swara">${s.swara.join(' · ')}</span>
        <span class="sg-west">${s.western.join(' · ')}</span>
        <span class="sg-full">${s.full.join(' · ')}</span>
      </button>`).join('')}</div>
    <p class="sargam-note">Twelve keys, sixteen swara names — because six positions carry two names each.
      That overlap is exactly how <b>6 × 2 × 6 = 72</b> melakarta are counted:
      six Ri–Ga pairs, two Ma, six Dha–Ni pairs.</p>`;

  el.querySelectorAll('.sg-step').forEach((b) => b.addEventListener('click', () => {
    unlockAudio();
    playInterval(rootMidi, rootMidi + Number(b.dataset.semis), 'up');
  }));
}
