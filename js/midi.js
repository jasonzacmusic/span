/* Span — real MIDI keyboard input.

   Clicking keys with a mouse is not practising piano. If a keyboard is
   plugged in, Hands should be answered by playing the interval on it. */

let access = null;
let listeners = new Set();
let inputs = [];
const held = new Set();

export function midiSupported() {
  return typeof navigator.requestMIDIAccess === 'function';
}

/* Ask once. Chrome prompts; Safari and Firefox may simply refuse, which is
   not an error worth shouting about — the keyboard on screen still works. */
export async function initMidi() {
  if (!midiSupported()) return { ok: false, reason: 'unsupported' };
  if (access) return { ok: true, inputs: inputNames() };
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch (e) {
    return { ok: false, reason: e?.name === 'SecurityError' ? 'blocked' : 'failed' };
  }
  bind();
  access.onstatechange = bind;
  return { ok: true, inputs: inputNames() };
}

function bind() {
  if (!access) return;
  inputs = [...access.inputs.values()];
  inputs.forEach((inp) => { inp.onmidimessage = onMessage; });
  emit({ type: 'devices', inputs: inputNames() });
}

function inputNames() {
  return inputs.map((i) => i.name || 'MIDI input');
}

function onMessage(e) {
  const [status, note, velocity] = e.data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && velocity > 0) {
    held.add(note);
    emit({ type: 'noteon', note, velocity, held: [...held] });
  } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
    held.delete(note);
    emit({ type: 'noteoff', note, held: [...held] });
  }
}

function emit(ev) {
  listeners.forEach((fn) => { try { fn(ev); } catch { /* one bad listener */ } });
}

export function onMidi(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function heldNotes() {
  return [...held];
}

/* The computer keyboard as a fallback piano — the home row is white keys,
   the row above is the black keys, exactly like a tracker. */
const KEY_MAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17,
};

export function computerKeyToOffset(key) {
  const k = key.length === 1 ? key.toLowerCase() : key;
  return Object.prototype.hasOwnProperty.call(KEY_MAP, k) ? KEY_MAP[k] : null;
}
