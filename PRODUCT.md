# Span

## What this is

An interval practice studio for pianists, vocalists and every other
instrumentalist, built from the interval tricks Jason Zac teaches at Nathaniel
School of Music (class B108 Piano 15, 3 Aug 2026).

Live at https://span.nathanielschool.com

## Who it is for

- **Jason's own students**, mid-teens to adults, in the Piano Foundation and
  theory courses. Many are non-Western-trained and think in sargam as readily as
  in letter names.
- **Any instrumentalist or singer** working on interval recognition. The app is
  piano-centric because the keyboard is the clearest picture of a distance, but
  nothing assumes the visitor plays piano.
- **Jason himself**, on camera, as a teaching surface during a lesson.

## The one idea

Most interval trainers make you memorise twelve unrelated facts. This one is
built the way the class actually teaches it: **memorise five anchors, derive the
rest.**

| Anchor | How you find it |
| --- | --- |
| P5 | circle of fifths, one step clockwise |
| P4 | circle of fifths, one step counter-clockwise |
| M3 / m3 | by key-colour shape (white–white, white–black, black–white, black–black) |
| Tritone | six mirror pairs — the only interval that inverts into itself |

Everything else is derived: M6 = P5 + 2, m6 = P5 + 1, M2 = root + 2,
m2 = root + 1, M7 = octave − 1, m7 = octave − 2, dim7 = octave − 3,
tritone = P4 + 1 = P5 − 1.

## Surfaces

| Surface | Mode | Success looks like |
| --- | --- | --- |
| Learn | Operate | The visitor sees one interval simultaneously as a circle hop, a keyboard shape, a notated pair and a memory trick, and can pick any of the four as their way in. |
| Ear · Eyes · Hands · Voice | Operate | The visitor runs reps and can see, at a glance, which distances they actually own. |

There is no marketing surface. Span is the product, not a page about a product.

## Non-negotiables

- **Theory accuracy leads everything.** Notes are spelled from letter-distance
  plus quality, never from pitch class. `node _t.mjs` must pass before shipping.
- **Plain note names on every visible surface** — "C", "F♯", "B♭". Never
  octave numbers like C4.
- **Teaching examples never default to C.** The app opens on G.
- **Tritone spelling follows the class's own six pairs**, not a heuristic.
- **Blues and hexatonic scales are named plainly**, because — as the class puts
  it — notation is biased towards the major and minor scales.
- Jason Zac is spelled exactly that way, everywhere.

## Evidence this is built from

- The class recording and transcript: `B108 Piano 15` (57.9 min, 3 Aug 2026).
- Jason's handwritten whiteboard page from that class — the tritone box, the
  thirds-by-shape lists, the P5+2 / octave−1 derivations. This is also the
  source of the app's visual world; see DESIGN.md.

## Deliberately not here

- No accounts, no payments, no backend. Progress lives in localStorage.
- No AI-generated imagery, notation or lettering.
- No `*.vercel.app` URL on any public surface.
