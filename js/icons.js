/* Span — the drawn icon set. One stroke weight, one geometry, sized in ems so
   an icon always matches the type it sits beside. Musical glyphs (♯ ♭ ▲ ▼ ⟳ ⟲)
   are notation and stay as type; these are the interface controls. */

const SW = 1.6;

function svg(body, { size = '1em', extra = '' } = {}) {
  return `<svg class="icn ${extra}" viewBox="0 0 20 20" width="${size}" height="${size}" `
    + `fill="none" stroke="currentColor" stroke-width="${SW}" stroke-linecap="round" `
    + `stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const icon = {
  play: (o) => svg('<path d="M6.5 4.2 15.4 10l-8.9 5.8z" fill="currentColor" stroke-linejoin="round"/>', o),
  playUp: (o) => svg('<path d="M6.5 4.2 15.4 10l-8.9 5.8z" fill="currentColor"/>', o),
  invert: (o) => svg('<path d="M6.6 3.4v13.2M6.6 3.4 3.9 6.3M6.6 3.4l2.7 2.9M13.4 16.6V3.4M13.4 16.6l-2.7-2.9M13.4 16.6l2.7-2.9"/>', o),
  mirror: (o) => svg('<path d="M10 3.2v13.6M6.2 7.4 2.8 10l3.4 2.6M13.8 7.4 17.2 10l-3.4 2.6"/>', o),
  enter: (o) => svg('<path d="M16.5 4.5v6.2a2 2 0 0 1-2 2H4.4M7.6 9.5 4 12.7l3.6 3.2"/>', o),
  ear: (o) => svg('<path d="M6.4 8.2a3.6 3.6 0 0 1 7.2 0c0 2.6-2.4 3.1-2.4 5.3a2 2 0 0 1-3.9.5M9.9 8.3a.6.6 0 1 0 .1 0"/>', o),
};

/* Label + icon, in the order a button reads. */
export function iconLabel(name, text, opts) {
  return `${icon[name](opts)}<span>${text}</span>`;
}
