/* Span — SVG piano keyboard, two octaves. Plain note names only, never
   octave numbers, on anything visible. */

const LOW = 60;               // internal anchor (displayed unlabeled)
const HIGH = 84;
const WHITE_W = 50;
const WHITE_H = 150;
const BLACK_W = 30;
const BLACK_H = 92;
const TOP = 46;               // arc strip above the keys

const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11];

function keyGeometry() {
  const keys = [];
  let wi = 0;
  for (let m = LOW; m <= HIGH; m++) {
    const pc = m % 12;
    if (WHITE_SEMIS.includes(pc)) {
      keys.push({ midi: m, black: false, x: wi * WHITE_W, w: WHITE_W });
      wi += 1;
    } else {
      keys.push({ midi: m, black: true, x: wi * WHITE_W - BLACK_W / 2, w: BLACK_W });
    }
  }
  return { keys, width: wi * WHITE_W };
}

export class Piano {
  constructor(el, { onKey = null } = {}) {
    this.el = el;
    this.onKey = onKey;
    this.clickable = !!onKey;
    const { keys, width } = keyGeometry();
    this.keys = keys;
    this.width = width;
    this.render();
  }

  render() {
    const H = TOP + WHITE_H;
    const parts = [];
    parts.push(`<svg viewBox="0 0 ${this.width} ${H}" class="piano-svg" role="img" aria-label="piano keyboard">`);
    parts.push(`<g class="arc-layer"></g>`);
    for (const k of this.keys.filter((k) => !k.black)) {
      parts.push(`<rect class="pk white" data-midi="${k.midi}" x="${k.x + 1}" y="${TOP}" width="${WHITE_W - 2}" height="${WHITE_H}" rx="5"/>`);
    }
    for (const k of this.keys.filter((k) => k.black)) {
      parts.push(`<rect class="pk black" data-midi="${k.midi}" x="${k.x}" y="${TOP}" width="${BLACK_W}" height="${BLACK_H}" rx="4"/>`);
    }
    parts.push(`<g class="badge-layer"></g>`);
    parts.push('</svg>');
    this.el.innerHTML = parts.join('');
    this.svg = this.el.querySelector('svg');
    this.svg.addEventListener('pointerdown', (e) => {
      const r = e.target.closest('.pk');
      if (!r || !this.clickable) return;
      const midi = parseInt(r.dataset.midi, 10);
      if (this.onKey) this.onKey(midi);
    });
  }

  setClickable(v) {
    this.clickable = v;
    this.svg.classList.toggle('clickable', v);
  }

  keyFor(midi) {
    return this.keys.find((k) => k.midi === midi);
  }

  keyCenter(midi) {
    const k = this.keyFor(midi);
    if (!k) return null;
    return k.x + k.w / 2;
  }

  clear() {
    this.svg.querySelectorAll('.pk').forEach((r) => {
      r.classList.remove('lit-root', 'lit-target', 'lit-ghost', 'lit-wrong');
      r.style.removeProperty('--lit');
    });
    this.svg.querySelector('.badge-layer').innerHTML = '';
    this.svg.querySelector('.arc-layer').innerHTML = '';
  }

  /* marks: [{midi, name, kind, color}] ; arc: {from, to, label, color} */
  show(marks, arc = null) {
    this.clear();
    const badges = [];
    for (const mk of marks) {
      const key = this.keyFor(mk.midi);
      if (!key) continue;
      const rect = this.svg.querySelector(`.pk[data-midi="${mk.midi}"]`);
      rect.classList.add('lit-' + mk.kind);
      if (mk.color) rect.style.setProperty('--lit', mk.color);
      if (mk.name) {
        const cx = key.x + key.w / 2;
        const y = key.black ? TOP + BLACK_H - 16 : TOP + WHITE_H - 18;
        const cls = key.black || mk.kind !== 'ghost' ? 'badge-on-key' : 'badge-on-key';
        badges.push(`<g class="${cls} kind-${mk.kind}"><circle cx="${cx}" cy="${y}" r="13" style="--lit:${mk.color || '#4f8ef7'}"/><text x="${cx}" y="${y + 4}">${mk.name}</text></g>`);
      }
    }
    this.svg.querySelector('.badge-layer').innerHTML = badges.join('');
    if (arc) {
      const x1 = this.keyCenter(arc.from);
      const x2 = this.keyCenter(arc.to);
      if (x1 != null && x2 != null) {
        const midX = (x1 + x2) / 2;
        const lift = Math.min(40, 14 + Math.abs(x2 - x1) / 14);
        const path = `M ${x1} ${TOP - 6} Q ${midX} ${TOP - 6 - lift} ${x2} ${TOP - 6}`;
        this.svg.querySelector('.arc-layer').innerHTML =
          `<path d="${path}" class="span-arc" style="--lit:${arc.color || '#4f8ef7'}"/>` +
          `<g class="span-arc-label"><rect x="${midX - 26}" y="${TOP - 24 - lift / 2 - 12}" width="52" height="20" rx="10" style="--lit:${arc.color || '#4f8ef7'}"/><text x="${midX}" y="${TOP - 24 - lift / 2 + 2}">${arc.label}</text></g>`;
      }
    }
  }

  flashWrong(midi) {
    const rect = this.svg.querySelector(`.pk[data-midi="${midi}"]`);
    if (!rect) return;
    rect.classList.add('lit-wrong');
    setTimeout(() => rect.classList.remove('lit-wrong'), 450);
  }
}

/* Choose octaves so both notes of an interval sit inside the visual range.
   Ascending: root low; descending: root high. Returns [rootMidi, targetMidi]. */
export function placeInterval(rootPc, semis, dir) {
  if (dir >= 0) {
    let root = LOW + ((rootPc - LOW % 12 + 12) % 12);
    if (root + semis > HIGH) root -= 12;
    if (root < LOW) root = LOW + ((rootPc + 12 - LOW % 12) % 12);
    return [root, root + semis];
  }
  let root = HIGH - ((HIGH % 12 - rootPc + 12) % 12);
  if (root - semis < LOW) root += 12;
  if (root > HIGH) root -= 12;
  return [root, root - semis];
}
