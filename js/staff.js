/* Span — VexFlow staff rendering. Key signature always + applyAccidentals,
   per house engraving law. */

import { midi, vexKey } from './theory.js';

const CLEF_CENTER = { treble: 71, bass: 50, alto: 60 };

/* Shift a pair of notes by whole octaves so they sit around the clef. */
export function fitToClef(notes, clef) {
  const center = CLEF_CENTER[clef] || 71;
  const avg = notes.reduce((s, n) => s + midi(n), 0) / notes.length;
  const shift = Math.round((center - avg) / 12);
  return notes.map((n) => ({ ...n, oct: n.oct + shift }));
}

export function drawInterval(el, notes, opts = {}) {
  const {
    clef = 'treble', keySig = 'G', mode = 'melodic', width = 300, height = 150,
    scale = 1,
  } = opts;
  const VF = Vex.Flow;
  el.innerHTML = '';
  const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  renderer.resize(width * scale, height * scale);
  const ctx = renderer.getContext();
  if (scale !== 1) ctx.scale(scale, scale);
  // engraved straight onto the paper — ink, not pure black
  ctx.setFillStyle('#1a1713');
  ctx.setStrokeStyle('#1a1713');
  const stave = new VF.Stave(6, 24, width - 14);
  stave.addClef(clef).addKeySignature(keySig);
  stave.setContext(ctx).draw();

  const fitted = fitToClef(notes, clef);
  let tickables;
  if (mode === 'harmonic') {
    const sorted = [...fitted].sort((a, b) => midi(a) - midi(b));
    tickables = [new VF.StaveNote({ keys: sorted.map(vexKey), duration: 'w', clef })];
  } else {
    tickables = fitted.map((n) => new VF.StaveNote({ keys: [vexKey(n)], duration: 'h', clef }));
  }
  const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
  voice.addTickables(tickables);
  VF.Accidental.applyAccidentals([voice], keySig);
  new VF.Formatter().joinVoices([voice]).format([voice], width - 110);
  voice.draw(ctx, stave);
}
