/* Span — the interval data. Tricks straight from the B108 class, plus the
   embellishments: song anchors, sargam, circle-steps, ghost anchors. */

export const INTERVALS = [
  {
    id: 'm2', num: 2, quality: 'm', semis: 1, label: 'Minor 2nd', short: 'm2',
    family: 'seconds',
    trick: 'Root + 1 — a single chromatic step.',
    derive: { anchor: 'root', offset: 1, text: 'root + 1' },
    practice: 'Run the chromatic scale up and down.',
    character: 'tension', compound: 'm9', jazz: '♭9',
    inversion: 'M7', sargam: 'r', sargamName: 'komal Re',
    songs: { up: 'Jaws', down: 'Für Elise' },
  },
  {
    id: 'M2', num: 2, quality: 'M', semis: 2, label: 'Major 2nd', short: 'M2',
    family: 'seconds',
    trick: 'Root + 2 — one whole step.',
    derive: { anchor: 'root', offset: 2, text: 'root + 2' },
    practice: 'Run the whole-tone scale — six notes, all major 2nds.',
    character: 'anticipation', compound: 'M9', jazz: '9',
    inversion: 'm7', sargam: 'R', sargamName: 'shuddha Re',
    songs: { up: 'Happy Birthday', down: 'Yesterday' },
  },
  {
    id: 'm3', num: 3, quality: 'm', semis: 3, label: 'Minor 3rd', short: 'm3',
    family: 'thirds',
    trick: 'Memorize by shape: 4 white–white, 3 white–black, 3 black–white, 2 black–black.',
    derive: null,
    practice: 'Toggle each shape set — melodic in one hand, harmonic in the other.',
    character: 'resolution', compound: 'm10', jazz: '♯9',
    inversion: 'M6', sargam: 'g', sargamName: 'komal Ga',
    songs: { up: 'Greensleeves', down: 'Hey Jude' },
  },
  {
    id: 'M3', num: 3, quality: 'M', semis: 4, label: 'Major 3rd', short: 'M3',
    family: 'thirds',
    trick: 'Memorize by shape: 3 white–white (C·E, F·A, G·B), 4 white–black, 4 black–white, 1 black–black.',
    derive: null,
    practice: 'Chant the sets, then walk them around the circle of fifths.',
    character: 'resolution', compound: 'M10', jazz: '10',
    inversion: 'm6', sargam: 'G', sargamName: 'shuddha Ga',
    songs: { up: 'When the Saints', down: 'Swing Low, Sweet Chariot' },
  },
  {
    id: 'P4', num: 4, quality: 'P', semis: 5, label: 'Perfect 4th', short: 'P4',
    family: 'perfect',
    trick: 'Circle of fifths, one step counter-clockwise.',
    derive: null,
    practice: 'Chant the reverse circle: C F B♭ E♭ A♭ D♭ G♭ B E A D G C.',
    character: 'anticipation', compound: 'P11', jazz: '11',
    inversion: 'P5', sargam: 'm', sargamName: 'shuddha Ma',
    songs: { up: 'Here Comes the Bride', down: 'Born Free' },
  },
  {
    id: 'TT', num: 4, quality: 'A', semis: 6, label: 'Tritone', short: 'TT',
    family: 'tritone', alias: 'aug 4th · dim 5th',
    trick: 'P4 + 1 or P5 − 1. Six mirror pairs — the only interval that inverts into itself.',
    derive: { anchor: 'P5', offset: -1, text: 'P5 − 1' },
    practice: 'Straight across the circle — memorize the six pairs.',
    character: 'tension', compound: 'A11', jazz: '♯11',
    inversion: 'TT', sargam: 'M', sargamName: 'tivra Ma',
    songs: { up: 'The Simpsons', down: 'Black Sabbath' },
  },
  {
    id: 'P5', num: 5, quality: 'P', semis: 7, label: 'Perfect 5th', short: 'P5',
    family: 'perfect',
    trick: 'Circle of fifths, one step clockwise. The tanpura’s Sa–Pa.',
    derive: null,
    practice: 'Chant the circle: C G D A E B F♯ D♭ A♭ E♭ B♭ F C.',
    character: 'resolution', compound: 'P12', jazz: '12',
    inversion: 'P4', sargam: 'P', sargamName: 'Pa',
    songs: { up: 'Twinkle Twinkle · Star Wars', down: 'The Flintstones' },
  },
  {
    id: 'm6', num: 6, quality: 'm', semis: 8, label: 'Minor 6th', short: 'm6',
    family: 'sixths', alias: 'aug 5th',
    trick: 'P5 + 1. Or flip a major 3rd upside-down.',
    derive: { anchor: 'P5', offset: 1, text: 'P5 + 1' },
    practice: 'Find the fifth first, nudge one up.',
    character: 'mystery', compound: 'm13', jazz: '♭13',
    inversion: 'M3', sargam: 'd', sargamName: 'komal Dha',
    songs: { up: 'The Entertainer', down: 'Love Story' },
  },
  {
    id: 'M6', num: 6, quality: 'M', semis: 9, label: 'Major 6th', short: 'M6',
    family: 'sixths',
    trick: 'P5 + 2. Or flip a minor 3rd upside-down.',
    derive: { anchor: 'P5', offset: 2, text: 'P5 + 2' },
    practice: 'Find the fifth first, walk two up.',
    character: 'mystery', compound: 'M13', jazz: '13',
    inversion: 'm3', sargam: 'D', sargamName: 'shuddha Dha',
    songs: { up: 'My Bonnie · NBC chime', down: 'Nobody Knows the Trouble' },
  },
  {
    id: 'm7', num: 7, quality: 'm', semis: 10, label: 'Minor 7th', short: 'm7',
    family: 'sevenths',
    trick: 'Octave − 2. Don’t reach up — think down from the octave.',
    derive: { anchor: 'P8', offset: -2, text: 'octave − 2' },
    practice: 'Land the octave, step down two.',
    character: 'anticipation', compound: 'm14', jazz: '♭7',
    inversion: 'M2', sargam: 'n', sargamName: 'komal Ni',
    songs: { up: 'Star Trek (original)', down: 'think octave − 2' },
  },
  {
    id: 'M7', num: 7, quality: 'M', semis: 11, label: 'Major 7th', short: 'M7',
    family: 'sevenths',
    trick: 'Octave − 1. A big jump made easy.',
    derive: { anchor: 'P8', offset: -1, text: 'octave − 1' },
    practice: 'Land the octave, slide one down.',
    character: 'tension', compound: 'M14', jazz: 'maj7',
    inversion: 'm2', sargam: 'N', sargamName: 'shuddha Ni',
    songs: { up: 'Take On Me', down: 'I Love You (Porter)' },
  },
  {
    id: 'P8', num: 8, quality: 'P', semis: 12, label: 'Octave', short: 'P8',
    family: 'octave',
    trick: 'Same letter, double the frequency.',
    derive: null,
    practice: 'The anchor for every seventh.',
    character: 'resolution', compound: 'P15', jazz: '8ve',
    inversion: 'P8', sargam: 'Ṡ', sargamName: 'taar Sa',
    songs: { up: 'Somewhere Over the Rainbow', down: 'Willow Weep for Me' },
  },
  {
    id: 'd7', num: 7, quality: 'd', semis: 9, label: 'Dim 7th', short: '°7',
    family: 'sevenths', bonus: true, alias: 'sounds like M6',
    trick: 'Octave − 3. Same sound as a major 6th, spelled diminished.',
    derive: { anchor: 'P8', offset: -3, text: 'octave − 3' },
    practice: 'The outer shell of the diminished 7th chord.',
    character: 'mystery', compound: 'd14', jazz: '♭d7',
    inversion: 'A2', sargam: 'D', sargamName: '(as Dha)',
    songs: { up: 'dim7 chord shell', down: 'octave − 3' },
  },
];

export const INTERVAL_BY_ID = Object.fromEntries(INTERVALS.map((iv) => [iv.id, iv]));

/* One pen per interval family — the colours he actually reaches for on the
   whiteboard, tuned to read on cream paper. */
export const FAMILY_COLOR = {
  seconds: '#8a5d14',   // ochre
  thirds: '#2f6b34',    // forest green
  perfect: '#1c3f7c',   // navy
  tritone: '#a8271b',   // vermilion
  sixths: '#6b3a7a',    // plum
  sevenths: '#16645f',  // teal
  octave: '#4a4237',    // graphite
};

/* Shape charts, exactly as chanted in class. */
export const THIRDS_SHAPES = {
  M3: [
    { shape: 'white–white', pairs: [['C', 'E'], ['F', 'A'], ['G', 'B']] },
    { shape: 'white–black', pairs: [['D', 'F#'], ['E', 'G#'], ['A', 'C#'], ['B', 'D#']] },
    { shape: 'black–white', pairs: [['Db', 'F'], ['Eb', 'G'], ['Ab', 'C'], ['Bb', 'D']] },
    { shape: 'black–black', pairs: [['F#', 'A#']] },
  ],
  m3: [
    { shape: 'white–white', pairs: [['A', 'C'], ['D', 'F'], ['E', 'G'], ['B', 'D']] },
    { shape: 'white–black', pairs: [['C', 'Eb'], ['F', 'Ab'], ['G', 'Bb']] },
    { shape: 'black–white', pairs: [['C#', 'E'], ['F#', 'A'], ['G#', 'B']] },
    { shape: 'black–black', pairs: [['Eb', 'Gb'], ['Bb', 'Db']] },
  ],
};

/* The six tritone mirror pairs from the board. */
export const TRITONE_PAIRS = [
  ['C', 'F#'], ['D', 'Ab'], ['E', 'Bb'], ['F', 'B'], ['G', 'C#'], ['A', 'Eb'],
];

/* Circle-steps: how many steps around the circle of fifths each interval
   is. Positive = clockwise (fifths), negative = counter-clockwise. */
export const CIRCLE_STEPS = {
  P5: 1, M2: 2, M6: 3, M3: 4, M7: 5, TT: 6,
  P4: -1, m7: -2, m3: -3, m6: -4, m2: -5, P8: 0, d7: 3,
};

export const KEY_SIGS = ['G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C'];

export const TRANSPOSING = [
  { id: 'C', label: 'Concert (piano · voice)', num: 1, quality: 'P', dir: 1 },
  { id: 'Bb', label: 'B♭ instruments (trumpet · tenor sax · clarinet)', num: 2, quality: 'M', dir: 1 },
  { id: 'Eb', label: 'E♭ instruments (alto sax · bari sax)', num: 6, quality: 'M', dir: 1 },
  { id: 'F', label: 'F instruments (french horn)', num: 5, quality: 'P', dir: 1 },
];

/* Preset drill sets — anchors first, then derived, then everything. */
export const PRESETS = [
  { id: 'anchors', label: 'The Anchors', set: ['P4', 'P5', 'TT', 'M3', 'm3'] },
  { id: 'derived', label: 'Derived', set: ['m2', 'M2', 'm6', 'M6', 'm7', 'M7'] },
  { id: 'all', label: 'All Twelve', set: ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'] },
];

/* Jason's four-way classification — his own framework, including "mystery",
   which he adds because the sixths behave as both anticipation and resolution.
   From music-theory/07-remembering-intervals-part-1. */
export const CHARACTERS = [
  {
    id: 'resolution', label: 'Resolution', color: '#2f6b34',
    blurb: 'At rest. Stable, peaceful, home.',
    set: ['P8', 'P5', 'M3', 'm3'],
  },
  {
    id: 'anticipation', label: 'Anticipation', color: '#1c3f7c',
    blurb: 'Leaning somewhere. It wants to move on.',
    set: ['P4', 'm7', 'M2'],
  },
  {
    id: 'mystery', label: 'Mystery', color: '#6b3a7a',
    blurb: 'Sometimes it settles, sometimes it pulls. Jason’s own fourth category.',
    set: ['M6', 'm6'],
  },
  {
    id: 'tension', label: 'Tension', color: '#a8271b',
    blurb: 'Chaos on its own — beautiful once you add a third note.',
    set: ['M7', 'm2', 'TT'],
  },
];

/* Triads are what intervals are FOR: two thirds stacked. */
export const TRIADS = [
  { id: 'major', label: 'Major', stack: ['M3', 'm3'], semis: [0, 4, 7], outer: 'P5', face: 'happy' },
  { id: 'minor', label: 'Minor', stack: ['m3', 'M3'], semis: [0, 3, 7], outer: 'P5', face: 'sad' },
  { id: 'dim', label: 'Diminished', stack: ['m3', 'm3'], semis: [0, 3, 6], outer: 'TT', face: 'uneasy' },
  { id: 'aug', label: 'Augmented', stack: ['M3', 'M3'], semis: [0, 4, 8], outer: 'm6', face: 'unsettled' },
];

/* Semitone gap → the interval that gap spells, for triad anatomy. */
export const GAP_NAME = {
  1: 'm2', 2: 'M2', 3: 'm3', 4: 'M3', 5: 'P4', 6: 'TT',
  7: 'P5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7', 12: 'P8',
};

/* Quality chains — flatten and sharpen a number and watch its name change.
   Perfect-class numbers have no major/minor; major-class numbers do. */
export const QUALITY_CHAIN = {
  perfect: ['d', 'P', 'A'],
  major: ['d', 'm', 'M', 'A'],
};
export const QUALITY_NAME = { d: 'diminished', m: 'minor', M: 'MAJOR', P: 'perfect', A: 'augmented' };
export const QUALITY_SHORT = { d: 'dim', m: 'm', M: 'M', P: 'P', A: 'aug' };

/* The Carnatic ladder, twelve positions from Sa. Where two swaras share a
   position they are genuinely the same key with two names — which is exactly
   how 6 x 2 x 6 = 72 melakarta are counted. */
export const SARGAM_LADDER = [
  { semis: 0, swara: ['Sa'], full: ['shadja'], western: ['unison'] },
  { semis: 1, swara: ['r1'], full: ['shuddha Ri'], western: ['m2'] },
  { semis: 2, swara: ['r2', 'g1'], full: ['chatushruti Ri', 'shuddha Ga'], western: ['M2', 'dim3'] },
  { semis: 3, swara: ['r3', 'g2'], full: ['shatshruti Ri', 'sadharana Ga'], western: ['A2', 'm3'] },
  { semis: 4, swara: ['g3'], full: ['antara Ga'], western: ['M3'] },
  { semis: 5, swara: ['m1'], full: ['shuddha Ma'], western: ['P4'] },
  { semis: 6, swara: ['m2'], full: ['prati Ma'], western: ['A4 · d5'] },
  { semis: 7, swara: ['Pa'], full: ['panchama'], western: ['P5'] },
  { semis: 8, swara: ['d1'], full: ['shuddha Dha'], western: ['m6'] },
  { semis: 9, swara: ['d2', 'n1'], full: ['chatushruti Dha', 'shuddha Ni'], western: ['M6', 'd7'] },
  { semis: 10, swara: ['d3', 'n2'], full: ['shatshruti Dha', 'kaisiki Ni'], western: ['A6', 'm7'] },
  { semis: 11, swara: ['n3'], full: ['kakali Ni'], western: ['M7'] },
  { semis: 12, swara: ['Ṡa'], full: ['taara shadja'], western: ['octave'] },
];
