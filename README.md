# Span — twelve distances, one view

An interval practice studio for pianists, vocalists and every other instrument,
built from the interval tricks Jason Zac teaches at Nathaniel School of Music
(class B108 Piano 15).

**Live:** https://span.nathanielschool.com

## The idea

Most interval trainers make you memorise twelve unrelated facts. This one is
built the way the class teaches it: memorise five **anchors**, derive the rest.

| Anchor | How you find it |
| --- | --- |
| P5 | circle of fifths, one step clockwise |
| P4 | circle of fifths, one step counter-clockwise |
| M3 / m3 | by key-colour shape (white–white, white–black, black–white, black–black) |
| Tritone | six mirror pairs — the only interval that inverts into itself |

Everything else falls out of those:

- M6 = P5 + 2 · m6 = P5 + 1
- M2 = root + 2 · m2 = root + 1
- M7 = octave − 1 · m7 = octave − 2 · dim7 = octave − 3
- Tritone = P4 + 1 = P5 − 1

## The five views

- **Codex** — one screen where the circle of fifths, the keyboard, the staff and
  the trick card all light up together for whichever interval you pick. Includes
  the thirds shape charts, the six tritone mirrors and a scale gym (whole-tone
  for major 2nds, chromatic for minor 2nds).
- **Ear** — hear it, name it. Up, down or together; low, mid or high register.
- **Eyes** — read it off the staff, in any key signature and either clef.
- **Hands** — build it on the keyboard from a given root.
- **Voice** — hear the root, sing the interval, hold it for a second. Live pitch
  detection, octave-agnostic so any voice type can practise.

Each drill keeps a streak and a per-interval accuracy heat strip in
localStorage, so you can see which distances you actually own.

## Extras beyond the class

- Song anchors both directions for every interval (ascending and descending).
- Sargam names on every interval, for students who think in Carnatic terms.
- A derivation ladder that draws the arithmetic (`G root → D P5 → +2 → E M6`).
- Transposing-instrument view: read the same interval as a B♭, E♭ or F player.
- Circle-step readout: every interval as a number of hops around the circle.

## Running it

Any static server works — there is no build step.

```bash
python3 serve.py
```

Then open http://localhost:8802.

## Notes for future edits

- `js/theory.js` spells notes from letter-distance plus quality, never from
  pitch class. Do not shortcut this — it is what keeps `C → B♭♭` a diminished
  7th instead of a major 6th.
- Tritone spelling comes from the class's own six pairs
  (`TRITONE_PARTNER`), which between them name a partner for all twelve roots.
- Notation is VexFlow 4.2.2, vendored in `assets/vendor/`. Key signature is
  always set and `Accidental.applyAccidentals` always runs.
- `_t.mjs` is the theory test suite: `node _t.mjs`. It checks every interval
  from every root in both directions, the shape charts against actual key
  colours, tritone mutuality, inversions and every derivation formula.

Teaching examples default to G, never C.
