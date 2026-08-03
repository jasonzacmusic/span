/* Span — Web Audio piano-ish synth. Warm, quick, no samples to load. */

import { freqOfMidi } from './theory.js';

let ctx = null;
let master = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function playNote(midiNum, when = 0, dur = 1.1, vel = 0.5) {
  const ac = ensureCtx();
  const t = ac.currentTime + when;
  const f = freqOfMidi(midiNum);

  const out = ac.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(vel, t + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0008, t + dur);

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(f * 7, 9000), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 300), t + dur * 0.85);
  lp.Q.value = 0.4;

  const partials = [
    { type: 'triangle', ratio: 1, gain: 1.0, detune: 0 },
    { type: 'sine', ratio: 2, gain: 0.30, detune: 3 },
    { type: 'sine', ratio: 3, gain: 0.10, detune: -4 },
    { type: 'triangle', ratio: 1, gain: 0.22, detune: 6 },
  ];
  const oscs = partials.map((p) => {
    const o = ac.createOscillator();
    o.type = p.type;
    o.frequency.value = f * p.ratio;
    o.detune.value = p.detune;
    const g = ac.createGain();
    g.gain.value = p.gain;
    o.connect(g).connect(lp);
    o.start(t);
    o.stop(t + dur + 0.1);
    return o;
  });

  // soft hammer thump for attack realism
  const noise = ac.createOscillator();
  noise.type = 'square';
  noise.frequency.value = f * 5.04;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.05 * vel, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  noise.connect(ng).connect(lp);
  noise.start(t);
  noise.stop(t + 0.08);

  lp.connect(out).connect(master);
  return oscs;
}

/* mode: 'up' | 'down' | 'harmonic' — midiA is the root. */
export function playInterval(midiA, midiB, mode = 'up') {
  ensureCtx();
  if (mode === 'harmonic') {
    playNote(midiA, 0, 1.6, 0.42);
    playNote(midiB, 0, 1.6, 0.42);
  } else {
    playNote(midiA, 0, 1.1, 0.5);
    playNote(midiB, 0.6, 1.4, 0.5);
  }
}

export function playSequence(midis, step = 0.28, dur = 0.5) {
  ensureCtx();
  midis.forEach((m, i) => playNote(m, i * step, dur, 0.45));
}

export function audioContext() {
  return ensureCtx();
}
