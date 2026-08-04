---
name: Span
description: A printed theory broadsheet you can play — cream paper, ink pens, engraved type.
colors:
  paper: "#f3ece0"
  paper-2: "#eae0cd"
  paper-3: "#e2d6bf"
  surface-1: "rgba(255, 255, 255, 0.5)"
  surface-2: "rgba(255, 255, 255, 0.65)"
  surface-3: "rgba(255, 255, 255, 0.8)"
  ink: "#1a1713"
  ink-2: "#4b4234"
  ink-3: "#756853"
  rule: "#bcac8d"
  red: "#8e1d12"
  gold: "#856016"
  pen-seconds: "#8a5d14"
  pen-thirds: "#2f6b34"
  pen-perfect: "#1c3f7c"
  pen-tritone: "#a8271b"
  pen-sixths: "#6b3a7a"
  pen-sevenths: "#16645f"
  pen-octave: "#4a4237"
  key-white: "#fdfaf3"
  key-black: "#211d18"
  key-black-hover: "#35302a"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "normal"
  wordmark:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.3em"
  title:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  title-sm:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "normal"
  lead:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  prose:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  prose-sm:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  ui:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
  data-lg:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.03em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.05em"
  label-lg:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.2em"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "9.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.24em"
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "8.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.26em"
  micro:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "7.5px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  hair: "1px"
spacing:
  xs: "4px"
  sm: "9px"
  md: "16px"
  lg: "26px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "14px 34px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 12px"
    typography: "{typography.label}"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  plate:
    backgroundColor: "rgba(255, 255, 255, 0.55)"
    rounded: "{rounded.none}"
    padding: "26px 34px"
---

# Span — design

## Overview

Span looks like **Jason's own whiteboard page, printed properly**: a theory
broadsheet on cream stock, annotated in a set of coloured pens, that happens to
be playable. It is deliberately **not** the dark-tool look (`#0f1117` +
blue accent + rounded card grid) — that was built first and rejected as reading
"AI slop, not design".

The world is *engraved paper*, and every decision follows from that:

- Structure comes from **rules**, not boxes. Hairlines separate columns; a 3px
  double rule separates sections, the way a printed page does.
- Notation is drawn **directly onto the paper**. Because the page is already
  cream, the staff needs no container and looks native.
- Colour carries **meaning, not decoration**: one pen per interval family.

## Colors

Cream paper with near-black ink. The two brand colours are NSM deep red
(`red`, used for the root note, active tabs and emphasis) and a dark gold
(`gold`, used for anchors and in-progress states).

**The pens.** Each interval family owns one colour, chosen to echo the pens on
the original whiteboard and tuned so every one clears 4.5:1 on paper:

| Family | Pen | Ratio on paper |
| --- | --- | --- |
| Seconds | ochre `#8a5d14` | 4.89 |
| Thirds | forest `#2f6b34` | 5.46 |
| Perfect | navy `#1c3f7c` | 8.72 |
| Tritone | vermilion `#a8271b` | 6.02 |
| Sixths | plum `#6b3a7a` | 7.12 |
| Sevenths | teal `#16645f` | 5.92 |
| Octave | graphite `#4a4237` | 8.41 |

A pen is applied through the `--fam` custom property, so a component inherits
whichever family is in play rather than hard-coding a hue.

## Typography

Three faces, three jobs, no overlap:

- **Cormorant Garamond** — the voice. Display wordmark, interval names, all
  prose. Its high contrast and small x-height are what make the page read as
  engraved rather than as a web app.
- **Archivo** — the machinery. Small uppercase labels at 0.16–0.26em tracking:
  plate captions, section headings, buttons, options.
- **IBM Plex Mono** — measurement only. Note names, semitone counts, cents,
  key signatures. Mono is *earned* here because these are data, never a
  costume for "technical".

Prose sits in Cormorant at 15–22px; it is a serif page, so body copy is
comfortable well above the usual 16px web default.

**The ramp is closed.** Fourteen steps, listed as `type-ramp` in the
frontmatter, cover every surface in the app. Add a new size only by adding it
here first — the detector flags any literal that is off the ramp, which is how
the scale stays a scale instead of drifting into 27 near-identical values.

**Surfaces are three tints, not seven.** Paper is lifted by white at 0.5
(resting), 0.65 (hover or selected) and 0.8 (pressed). Nothing else.

## Layout

A single centred column, `min(1500px, 100%)`, with 34px page margins.

- **Learn** is a three-column plate: circle · keyboard + staff · the entry.
  Columns are divided by 1px rules, never gaps or cards.
- Below it, **lab sheets** stack full-width, separated by 3px double rules,
  the way plates are separated in a printed manual.
- Drills centre a single **plate** — a paper panel with a hairline border and
  an inner hairline inset, holding the question.

Breakpoints: 1240px collapses Learn to two columns and stacks the lab pair;
760px goes single column and the interval rail rewraps from 13 to 4 across.

## Elevation & Depth

Almost none, on purpose. Paper does not float.

The only elevation is the `plate`: a 1px rule, a white inset highlight, and one
soft shadow with real offset and blur (`0 6px 22px rgba(26,23,19,0.06)`). No
glass, no glow, no zero-offset halos.

## Shapes

**Square.** `rounded` is 0 everywhere — buttons, plates, chips, note badges.
The only curves in the app are the ones that mean something: piano key corners,
the circle of fifths, the arc drawn between two notes, and the note-name badges
on keys.

## Components

- **Interval rail** — 13 cells in a bordered strip, each a serif abbreviation
  over a tracked uppercase label. The active cell takes a paper-white fill and a
  3px underline in its own pen.
- **Mini keyboard** (`js/keys.js`) — every visual in the app is built from this.
  Real white/black key colours, an optional dashed arc between two notes, and
  circular note badges. Three sizes: `xs`, `sm`, `md`.
- **Plate** — the paper panel that holds a drill question.
- **Sidenote** — a 1px pen-coloured rule to the left of an indented passage.
  A printer's change-bar, not a callout card.
- **Icons** (`js/icons.js`) — drawn SVG at a single 1.6 stroke weight, sized in
  ems. Musical and diagrammatic glyphs (♯ ♭ ▲ ▼ ⟳ ⟲ ⇄ →) stay as *type*,
  because they are notation, not interface.

**One detector waiver.** `layout-transition` is ignored for `css/style.css`
(recorded in `.impeccable/config.json`). The rule matches the substring "width"
and fires on `stroke-width` transitions used by the circle-of-fifths nodes and
the tritone diameters. SVG stroke width is a paint attribute, not a CSS box
dimension — it reflows nothing, and the hover thickening is the affordance that
says those shapes are clickable. The waiver is scoped to this one file so the
rule still applies everywhere else.

## Do's and Don'ts

**Do**

- Draw the keyboard. When a concept can be shown as a key shape, show it as a
  key shape and put the note name second.
- Let colour mean the interval family, and nothing else.
- Separate with rules and whitespace.
- Keep every control reachable by keyboard, with a visible `:focus-visible`
  ring in NSM red.
- Check contrast before adding a colour: 4.5:1 on paper is the floor, including
  for the pens.

**Don't**

- **No dark theme.** Not as an option, not as a toggle. The page is paper.
- **No purple/violet or blue-to-purple gradients**, no gradient text, no glass,
  no neon. The palette above is the whole palette.
- **No card grids.** Same-size cards of icon + heading + text are banned as page
  structure; nested cards doubly so.
- **No border radius** on interface chrome.
- **No emoji or unicode glyphs as interface icons.** Draw them.
- **No octave numbers** and no key of C as the default teaching example.
- **No AI-generated imagery, notation or lettering.** The NSM mark is the real
  PNG from the iCloud Logos folder.
