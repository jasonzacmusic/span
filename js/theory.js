/* Span — interval theory engine.
   Notes are {letter, acc, oct}. Spelling is derived from letter distance +
   quality, never from pitch class alone. */

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NAT_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC_GLYPH = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };
const ACC_ASCII = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: '##' };

export function parseNote(str) {
  // "Gb4" / "F#" / "C" — octave optional (defaults 4)
  const m = str.match(/^([A-Ga-g])(bb|b|##|#)?(-?\d)?$/);
  if (!m) throw new Error('bad note: ' + str);
  const letter = m[1].toUpperCase();
  const accMap = { bb: -2, b: -1, '': 0, '#': 1, '##': 2 };
  return { letter, acc: accMap[m[2] || ''], oct: m[3] ? parseInt(m[3], 10) : 4 };
}

export function midi(n) {
  return 12 * (n.oct + 1) + NAT_SEMI[n.letter] + n.acc;
}

export function noteName(n) {
  return n.letter + ACC_GLYPH[n.acc];
}

export function noteAscii(n) {
  return n.letter + ACC_ASCII[n.acc];
}

export function vexKey(n) {
  // vexflow key string: "gb/4"
  return (n.letter + ACC_ASCII[n.acc]).toLowerCase() + '/' + n.oct;
}

/* Interval: {num, quality} — quality in P M m A d.
   Semitones for perfect-class (1,4,5,8): P as-is, A +1, d −1.
   For major-class (2,3,6,7): M as-is, m −1, A +1, d −2. */
const PERFECT_BASE = { 1: 0, 4: 5, 5: 7, 8: 12 };
const MAJOR_BASE = { 2: 2, 3: 4, 6: 9, 7: 11 };

export function intervalSemis(iv) {
  const simple = ((iv.num - 1) % 7) + 1;
  const octaves = Math.floor((iv.num - 1) / 7);
  let s;
  if (simple in PERFECT_BASE) {
    s = PERFECT_BASE[simple];
    if (iv.quality === 'A') s += 1;
    else if (iv.quality === 'd') s -= 1;
  } else {
    s = MAJOR_BASE[simple];
    if (iv.quality === 'm') s -= 1;
    else if (iv.quality === 'A') s += 1;
    else if (iv.quality === 'd') s -= 2;
  }
  return s + 12 * octaves;
}

export function transpose(root, iv, dir = 1) {
  const steps = (iv.num - 1) * dir;
  const li = LETTERS.indexOf(root.letter);
  let ti = li + steps;
  let oct = root.oct;
  while (ti < 0) { ti += 7; oct -= 1; }
  while (ti > 6) { ti -= 7; oct += 1; }
  const letter = LETTERS[ti];
  const targetMidi = midi(root) + intervalSemis(iv) * dir;
  const acc = targetMidi - (12 * (oct + 1) + NAT_SEMI[letter]);
  return { letter, acc, oct };
}

/* The 12 practical roots, circle-of-fifths order for the wheel and
   chromatic order for drills. Plain names only — no octave numbers on any
   visible surface. */
export const ROOTS_CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
export const ROOTS_CHROMATIC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function pitchClass(n) {
  return ((midi(n) % 12) + 12) % 12;
}

/* The six mirror pairs from the class chart. Because each pair covers two
   roots, the six pairs name a partner for all twelve roots — so tritone
   spelling is a lookup, not a guess. */
export const TRITONE_PARTNER = (() => {
  const pairs = [['C', 'F#'], ['D', 'Ab'], ['E', 'Bb'], ['F', 'B'], ['G', 'C#'], ['A', 'Eb']];
  const map = {};
  for (const [a, b] of pairs) { map[a] = b; map[b] = a; }
  return map;
})();

/* Tritone target, spelled the way it is chanted in class. Falls back to
   whichever of aug4 / dim5 needs fewer accidentals for exotic roots. */
export function spellTritone(root, dir = 1) {
  const key = root.letter + ACC_ASCII[root.acc];
  const partner = TRITONE_PARTNER[key];
  if (partner) {
    const p = parseNote(partner);
    // place it in the octave that makes the distance a real tritone
    const want = midi(root) + 6 * dir;
    const base = 12 * (p.oct + 1) + NAT_SEMI[p.letter] + p.acc;
    p.oct += Math.round((want - base) / 12);
    return p;
  }
  const a4 = transpose(root, { num: 4, quality: 'A' }, dir);
  const d5 = transpose(root, { num: 5, quality: 'd' }, dir);
  return Math.abs(d5.acc) < Math.abs(a4.acc) ? d5 : a4;
}

/* The other name for the same key — what he means by "F♯, also known as
   G♭". Returns null when there is no sane second spelling. */
export function enharmonic(n) {
  const alt = { C: ['B', 1], D: null, E: ['F', -1], F: ['E', 1], G: null, A: null, B: ['C', -1] };
  const cands = [];
  for (const letter of LETTERS) {
    if (letter === n.letter) continue;
    for (const oct of [n.oct - 1, n.oct, n.oct + 1]) {
      const acc = midi(n) - (12 * (oct + 1) + NAT_SEMI[letter]);
      if (Math.abs(acc) >= 1 && Math.abs(acc) <= 1) cands.push({ letter, acc, oct });
    }
  }
  void alt;
  return cands[0] || null;
}

export function midiToNearestSpelling(m) {
  // for the voice needle: sharp-preferring plain spelling
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  return names[((m % 12) + 12) % 12];
}

export function freqOfMidi(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function midiOfFreq(f) {
  return 69 + 12 * Math.log2(f / 440);
}
