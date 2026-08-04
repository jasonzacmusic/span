/* Span — the mini keyboard. Every visual in the app is built from this, so a
   student always sees the physical shape, not just note names. */

const WHITE_SEMIS = [0, 2, 4, 5, 7, 9, 11];

export const isBlack = (m) => !WHITE_SEMIS.includes(((m % 12) + 12) % 12);

/* Snap outward to white keys and guarantee a minimum width, so a two-note
   shape always sits inside a readable stretch of keyboard. */
export function windowFor(lo, hi, minWhite = 5) {
  let start = lo - 1;
  while (isBlack(start)) start -= 1;
  let end = hi + 1;
  while (isBlack(end)) end += 1;
  const whites = () => {
    let n = 0;
    for (let m = start; m <= end; m++) if (!isBlack(m)) n += 1;
    return n;
  };
  let flip = 0;
  while (whites() < minWhite) {
    if (flip % 2 === 0) { end += 1; while (isBlack(end)) end += 1; } else { start -= 1; while (isBlack(start)) start -= 1; }
    flip += 1;
  }
  return [start, end];
}

const SIZES = {
  xs: { w: 13, h: 44, bw: 8.5, bh: 27, font: 8, r: 5.5 },
  sm: { w: 18, h: 60, bw: 11.5, bh: 37, font: 9.5, r: 7 },
  md: { w: 26, h: 86, bw: 16, bh: 53, font: 12, r: 9.5 },
};

/* marks: [{ midi, kind:'root'|'target'|'ghost'|'step', label, color }] */
export function keyboardSVG(marks, opts = {}) {
  const {
    size = 'sm', minWhite = 5, pad = 0, arc = null, extraClass = '',
  } = opts;
  const S = SIZES[size] || SIZES.sm;
  const midis = marks.map((m) => m.midi);
  const [start, end] = opts.range || windowFor(Math.min(...midis), Math.max(...midis), minWhite);

  const keys = [];
  let wi = 0;
  for (let m = start; m <= end; m++) {
    if (isBlack(m)) keys.push({ m, black: true, x: wi * S.w - S.bw / 2 });
    else { keys.push({ m, black: false, x: wi * S.w }); wi += 1; }
  }
  const width = wi * S.w;
  const top = arc ? S.r * 2 + 8 : 0;
  const height = top + S.h;
  const byMidi = Object.fromEntries(keys.map((k) => [k.m, k]));
  const centre = (m) => {
    const k = byMidi[m];
    return k ? k.x + (k.black ? S.bw : S.w) / 2 : null;
  };
  const markOf = Object.fromEntries(marks.map((m) => [m.midi, m]));

  const parts = [`<svg viewBox="${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}" class="kb kb-${size} ${extraClass}" role="img">`];

  if (arc) {
    const x1 = centre(arc.from);
    const x2 = centre(arc.to);
    if (x1 != null && x2 != null) {
      const lift = Math.min(S.r * 2.4, 8 + Math.abs(x2 - x1) / 8);
      parts.push(`<path d="M ${x1} ${top - 4} Q ${(x1 + x2) / 2} ${top - 4 - lift} ${x2} ${top - 4}" class="kb-arc" style="--lit:${arc.color || 'currentColor'}"/>`);
    }
  }

  for (const k of keys.filter((k) => !k.black)) {
    const mk = markOf[k.m];
    parts.push(`<rect class="kb-key white${mk ? ' lit-' + mk.kind : ''}" data-midi="${k.m}" x="${k.x + 0.6}" y="${top}" width="${S.w - 1.2}" height="${S.h}" rx="${S.w / 12}"${mk && mk.color ? ` style="--lit:${mk.color}"` : ''}/>`);
  }
  for (const k of keys.filter((k) => k.black)) {
    const mk = markOf[k.m];
    parts.push(`<rect class="kb-key black${mk ? ' lit-' + mk.kind : ''}" data-midi="${k.m}" x="${k.x}" y="${top}" width="${S.bw}" height="${S.bh}" rx="${S.bw / 8}"${mk && mk.color ? ` style="--lit:${mk.color}"` : ''}/>`);
  }
  for (const mk of marks) {
    if (!mk.label) continue;
    const k = byMidi[mk.midi];
    if (!k) continue;
    const cx = k.x + (k.black ? S.bw : S.w) / 2;
    const cy = top + (k.black ? S.bh - S.r - 3 : S.h - S.r - 4);
    parts.push(`<g class="kb-badge kind-${mk.kind}"${mk.color ? ` style="--lit:${mk.color}"` : ''}><circle cx="${cx}" cy="${cy}" r="${S.r}"/><text x="${cx}" y="${cy + S.font / 3}" style="font-size:${S.font}px">${mk.label}</text></g>`);
  }
  parts.push('</svg>');
  return parts.join('');
}

/* The key-colour glyph: two little keys showing white–white, white–black … */
export function shapeGlyph(aBlack, bBlack) {
  const key = (x, black) => `<rect class="glyph-key ${black ? 'black' : 'white'}" x="${x}" y="0" width="9" height="16" rx="1.5"/>`;
  return `<svg viewBox="-1 -1 22 18" class="shape-glyph" role="img" aria-hidden="true">${key(0, aBlack)}${key(11, bBlack)}</svg>`;
}
