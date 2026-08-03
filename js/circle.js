/* Span — interactive circle of fifths. Clockwise = P5, counter = P4,
   straight across = tritone. Every interval is a number of steps around
   the circle. */

const NODES = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const NODE_PC = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

const CX = 170;
const CY = 170;
const R = 128;

function nodeAngle(i) {
  return (i * 30 - 90) * (Math.PI / 180);
}

function nodeXY(i, radius = R) {
  const a = nodeAngle(i);
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}

export class Circle {
  constructor(el, { onRoot = null } = {}) {
    this.el = el;
    this.onRoot = onRoot;
    this.render();
  }

  render() {
    const parts = [];
    parts.push(`<svg viewBox="0 0 ${CX * 2} ${CY * 2}" class="circle-svg" role="img" aria-label="circle of fifths">`);
    parts.push(`<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z"/></marker></defs>`);
    parts.push(`<circle cx="${CX}" cy="${CY}" r="${R}" class="ring-guide"/>`);
    parts.push(`<g class="hop-layer"></g>`);
    for (let i = 0; i < 12; i++) {
      const [x, y] = nodeXY(i);
      parts.push(`<g class="cnode" data-i="${i}"><circle cx="${x}" cy="${y}" r="24"/><text x="${x}" y="${y + 5}">${NODES[i]}</text></g>`);
    }
    parts.push(`<g class="circle-core">
      <line x1="${CX - 46}" y1="${CY - 34}" x2="${CX + 46}" y2="${CY - 34}" class="core-rule"/>
      <text x="${CX}" y="${CY - 12}" class="core-move"></text>
      <text x="${CX}" y="${CY + 12}" class="core-steps"></text>
      <line x1="${CX - 46}" y1="${CY + 26}" x2="${CX + 46}" y2="${CY + 26}" class="core-rule"/>
      <text x="${CX}" y="${CY + 46}" class="core-legend">⟳ P5 · ⟲ P4</text>
    </g>`);
    parts.push('</svg>');
    this.el.innerHTML = parts.join('');
    this.svg = this.el.querySelector('svg');
    this.svg.addEventListener('pointerdown', (e) => {
      const g = e.target.closest('.cnode');
      if (!g || !this.onRoot) return;
      this.onRoot(NODES[parseInt(g.dataset.i, 10)].replace('♯', '#').replace('♭', 'b'));
    });
  }

  indexOfPc(pc) {
    return NODE_PC.indexOf(((pc % 12) + 12) % 12);
  }

  clear() {
    this.svg.querySelectorAll('.cnode').forEach((n) => {
      n.classList.remove('is-root', 'is-target');
      n.style.removeProperty('--lit');
    });
    this.svg.querySelector('.hop-layer').innerHTML = '';
  }

  /* rootPc/targetPc are pitch classes; steps signed (cw positive), 6 = chord
     across; color for the target + path. */
  show(rootPc, targetPc, steps, color, labels = {}) {
    this.clear();
    const ri = this.indexOfPc(rootPc);
    const ti = this.indexOfPc(targetPc);
    const move = this.svg.querySelector('.core-move');
    const stepsEl = this.svg.querySelector('.core-steps');
    move.textContent = `${labels.root || ''} → ${labels.target || ''}`;
    move.style.fill = color;
    stepsEl.textContent = steps === 0 ? 'same note'
      : Math.abs(steps) === 6 ? 'straight across'
        : `${Math.abs(steps)} step${Math.abs(steps) === 1 ? '' : 's'} ${steps > 0 ? '⟳' : '⟲'}`;
    const rootNode = this.svg.querySelector(`.cnode[data-i="${ri}"]`);
    if (rootNode) rootNode.classList.add('is-root');
    if (ti === ri || targetPc == null) return;
    const targetNode = this.svg.querySelector(`.cnode[data-i="${ti}"]`);
    if (targetNode) {
      targetNode.classList.add('is-target');
      targetNode.style.setProperty('--lit', color);
    }
    const hop = this.svg.querySelector('.hop-layer');
    if (steps === 6 || steps === -6) {
      const [x1, y1] = nodeXY(ri, R - 26);
      const [x2, y2] = nodeXY(ti, R - 26);
      hop.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="hop-path" style="--lit:${color}" marker-end="url(#arrowhead)"/>`;
      return;
    }
    if (steps === 0) return;
    const sweep = steps > 0 ? 1 : 0;
    const a1 = nodeAngle(ri);
    const a2 = nodeAngle(ti);
    const [x1, y1] = [CX + R * Math.cos(a1), CY + R * Math.sin(a1)];
    const [x2, y2] = [CX + R * Math.cos(a2), CY + R * Math.sin(a2)];
    const large = Math.abs(steps) > 6 ? 1 : 0;
    hop.innerHTML = `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${large} ${sweep} ${x2} ${y2}" class="hop-path" style="--lit:${color}" marker-end="url(#arrowhead)"/>`;
  }
}
