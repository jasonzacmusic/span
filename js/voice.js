/* Span — Voice mode: hear the root, sing the target, the needle tells you
   how close you are. Octave-agnostic so every voice type can play. */

import * as T from './theory.js';
import { INTERVAL_BY_ID, FAMILY_COLOR, PRESETS } from './data.js';
import { placeInterval } from './piano.js';
import { keyboardSVG } from './keys.js';
import { playNote, unlockAudio, audioContext } from './audio.js';

const HOLD_MS = 900;
const TOL_CENTS = 35;

let media = null;
let analyser = null;
let raf = 0;
let q = null;
let enabled = new Set(PRESETS[0].set);
let holdStart = 0;
let solved = false;

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* Autocorrelation pitch detector (ACF2+). Returns frequency or -1. */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) return -1;

  let r1 = 0; let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const b = buf.slice(r1, r2);
  const N = b.length;
  if (N < 128) return -1;

  const c = new Float32Array(N);
  for (let lag = 0; lag < N; lag++) {
    let sum = 0;
    for (let i = 0; i < N - lag; i++) sum += b[i] * b[i + lag];
    c[lag] = sum;
  }
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1; let maxpos = -1;
  for (let i = d; i < N; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  if (maxpos <= 0) return -1;
  let T0 = maxpos;
  const x1 = c[T0 - 1]; const x2 = c[T0]; const x3 = c[T0 + 1] ?? x2;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bq = (x3 - x1) / 2;
  if (a) T0 -= bq / (2 * a);
  return sampleRate / T0;
}

function centsOff(freq, targetPc) {
  // octave-agnostic distance from the target pitch class
  const m = T.midiOfFreq(freq);
  let diff = (((m - targetPc) % 12) + 12) % 12;   // 0..12 in semis
  if (diff > 6) diff -= 12;                        // −6..+6
  return diff * 100;
}

function ui() {
  return {
    status: document.getElementById('voiceStatus'),
    needle: document.getElementById('voiceNeedle'),
    meter: document.getElementById('voiceMeter'),
    heard: document.getElementById('voiceHeard'),
    prompt: document.getElementById('voicePrompt'),
    fb: document.getElementById('voiceFeedback'),
  };
}

function newQuestion() {
  const u = ui();
  solved = false;
  holdStart = 0;
  const iv = INTERVAL_BY_ID[randomOf([...enabled])];
  const rootName = randomOf(T.ROOTS_CHROMATIC);
  const rootNote = T.parseNote(rootName);
  const dir = Math.random() < 0.5 ? -1 : 1;
  const target = iv.id === 'TT' ? T.spellTritone(rootNote, dir)
    : T.transpose(rootNote, { num: iv.num, quality: iv.quality }, dir);
  const [rm, tm] = placeInterval(T.pitchClass(rootNote), iv.semis, dir);
  q = { iv, rootNote, target, dir, rootMidi: rm, targetMidi: tm };
  const color = FAMILY_COLOR[iv.family];
  u.prompt.innerHTML = `
    <button class="big-play" id="voiceRootBtn" title="hear the root again">▶</button>
    <span>Root is <b>${T.noteName(rootNote)}</b> — sing <b class="q-iv" style="--fam:${color}">${iv.short}</b> ${dir < 0 ? '↓ down' : '↑ up'}
    <em class="v-target-hide">(${T.noteName(target)})</em></span>
    <button class="ghost-btn" id="voiceRevealBtn">show answer</button>
    <button class="ghost-btn" id="voiceSkipBtn">skip</button>`;
  u.fb.innerHTML = '';
  u.fb.className = 'drill-feedback';
  // the shape you are aiming for, drawn — the target key stays hidden until asked
  const kbEl = document.getElementById('voiceKeys');
  if (kbEl) {
    kbEl.innerHTML = keyboardSVG([
      { midi: q.rootMidi, kind: 'root', label: T.noteName(rootNote) },
    ], { size: 'sm', minWhite: 10 });
  }
  document.getElementById('voiceRootBtn').addEventListener('click', () => { unlockAudio(); playNote(q.rootMidi, 0, 1.0, 0.5); });
  document.getElementById('voiceRevealBtn').addEventListener('click', () => {
    document.querySelector('.v-target-hide')?.classList.add('shown');
    if (kbEl) {
      kbEl.innerHTML = keyboardSVG([
        { midi: q.rootMidi, kind: 'root', label: T.noteName(rootNote) },
        { midi: q.targetMidi, kind: 'target', color, label: T.noteName(target) },
      ], { size: 'sm', minWhite: 10, arc: { from: q.rootMidi, to: q.targetMidi, color } });
    }
    playNote(q.targetMidi, 0, 1.0, 0.5);
  });
  document.getElementById('voiceSkipBtn').addEventListener('click', newQuestion);
  playNote(q.rootMidi, 0, 1.0, 0.5);
}

function success() {
  solved = true;
  const u = ui();
  const color = FAMILY_COLOR[q.iv.family];
  const kbEl = document.getElementById('voiceKeys');
  if (kbEl) {
    kbEl.innerHTML = keyboardSVG([
      { midi: q.rootMidi, kind: 'root', label: T.noteName(q.rootNote) },
      { midi: q.targetMidi, kind: 'target', color, label: T.noteName(q.target) },
    ], { size: 'sm', minWhite: 10, arc: { from: q.rootMidi, to: q.targetMidi, color } });
  }
  u.fb.className = 'drill-feedback show ok';
  u.fb.innerHTML = `<div class="fb-line"><b>Nailed it!</b> ${q.iv.label} — ${T.noteName(q.rootNote)} ${q.dir < 0 ? '↓' : '↑'} ${T.noteName(q.target)}</div>
    <div class="fb-trick" style="--fam:${FAMILY_COLOR[q.iv.family]}">${q.iv.trick}</div>`;
  playNote(q.targetMidi, 0, 0.5, 0.4);
  playNote(q.targetMidi + (q.dir < 0 ? -12 : 12), 0.18, 0.7, 0.3);
  setTimeout(newQuestion, 1800);
}

function loop() {
  const u = ui();
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const f = detectPitch(buf, audioContext().sampleRate);
  if (f > 60 && f < 1200 && q && !solved) {
    const cents = centsOff(f, q.targetMidi % 12);
    const clamped = Math.max(-600, Math.min(600, cents));
    u.needle.style.left = `${50 + (clamped / 600) * 48}%`;
    u.needle.classList.add('live');
    u.heard.textContent = `hearing ${T.midiToNearestSpelling(Math.round(T.midiOfFreq(f)))} · ${cents > 0 ? '+' : ''}${Math.round(cents)}¢`;
    const inTune = Math.abs(cents) <= TOL_CENTS;
    u.meter.classList.toggle('in-tune', inTune);
    if (inTune) {
      if (!holdStart) holdStart = performance.now();
      else if (performance.now() - holdStart > HOLD_MS) success();
    } else holdStart = 0;
  } else {
    u.needle.classList.remove('live');
    if (!solved) u.heard.textContent = 'listening…';
    holdStart = 0;
  }
  raf = requestAnimationFrame(loop);
}

async function start() {
  const u = ui();
  try {
    unlockAudio();
    media = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const ac = audioContext();
    const src = ac.createMediaStreamSource(media);
    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    u.status.style.display = 'none';
    document.getElementById('voiceStage').style.display = '';
    newQuestion();
    loop();
  } catch (err) {
    u.status.innerHTML = `<p>Microphone access is needed for Voice mode.<br>
      <span class="dim-text">Allow the mic in your browser’s address bar, then try again.</span></p>
      <button class="play-btn" id="voiceStartBtn">Enable microphone</button>`;
    document.getElementById('voiceStartBtn').addEventListener('click', start);
  }
}

export function initVoice() {
  const status = document.getElementById('voiceStatus');
  status.innerHTML = `<div class="plate voice-intro">
      <span class="plate-label">sing it back</span>
      <p>Hear the root, <b>sing the interval</b>,<br>hold it steady for one second.</p>
      <div class="voice-steps">
        <span><em>1</em> the app plays your root</span>
        <span><em>2</em> you sing the interval above or below it</span>
        <span><em>3</em> the needle turns green when you land it</span>
      </div>
      <button class="play-btn primary" id="voiceStartBtn">Enable microphone</button>
      <span class="dim-text">Any voice, any octave — the octave never counts against you.</span>
    </div>`;
  document.getElementById('voiceStartBtn').addEventListener('click', start);

  const chips = document.getElementById('voiceIvs');
  const DRILL = PRESETS[2].set;
  chips.innerHTML = DRILL.map((id) => {
    const iv = INTERVAL_BY_ID[id];
    return `<button class="mini-chip" data-iv="${id}" style="--fam:${FAMILY_COLOR[iv.family]}">${iv.short}</button>`;
  }).join('');
  const sync = () => chips.querySelectorAll('.mini-chip').forEach((b) => b.classList.toggle('on', enabled.has(b.dataset.iv)));
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.mini-chip');
    if (!b) return;
    const id = b.dataset.iv;
    if (enabled.has(id)) { if (enabled.size > 2) enabled.delete(id); } else enabled.add(id);
    sync();
  });
  sync();
}

export function stopVoice() {
  // pause analysis while another tab is showing; keep the mic stream alive
  cancelAnimationFrame(raf);
  raf = 0;
}

export function voiceVisible() {
  if (analyser && media && !raf) loop();
}
