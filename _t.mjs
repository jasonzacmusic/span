import * as T from './js/theory.js';
import { INTERVALS, THIRDS_SHAPES, TRITONE_PAIRS, CIRCLE_STEPS } from './js/data.js';
let fail = 0;
const chk = (c, m) => { if (!c) { console.log('FAIL', m); fail++; } };

// 1. every interval, every root: semitone distance + letter distance must match
for (const iv of INTERVALS) {
  for (const r of T.ROOTS_CHROMATIC) {
    const root = T.parseNote(r);
    const tgt = iv.id === 'TT' ? T.spellTritone(root, 1)
      : T.transpose(root, { num: iv.num, quality: iv.quality }, 1);
    chk(T.midi(tgt) - T.midi(root) === iv.semis, `${iv.id} from ${r}: got ${T.midi(tgt)-T.midi(root)} want ${iv.semis} (${T.noteAscii(tgt)})`);
    chk(Math.abs(tgt.acc) <= 2, `${iv.id} from ${r}: triple accidental ${T.noteAscii(tgt)}`);
    // descending
    const dn = iv.id === 'TT' ? T.spellTritone(root, -1)
      : T.transpose(root, { num: iv.num, quality: iv.quality }, -1);
    chk(T.midi(root) - T.midi(dn) === iv.semis, `${iv.id} down from ${r}`);
    chk(Math.abs(dn.acc) <= 2, `${iv.id} down from ${r}: ${T.noteAscii(dn)}`);
  }
}

// 2. spot-check named spellings from the class
const sp = (r, id) => { const iv = INTERVALS.find(i=>i.id===id); const root=T.parseNote(r);
  return T.noteAscii(iv.id==='TT'?T.spellTritone(root,1):T.transpose(root,{num:iv.num,quality:iv.quality},1)); };
chk(sp('C','M3')==='E','C M3');
chk(sp('Db','M3')==='F','Db M3');
chk(sp('C','m3')==='Eb','C m3');
chk(sp('C','TT')==='F#','C TT = F#');
chk(sp('D','TT')==='Ab','D TT = Ab, got '+sp('D','TT'));
chk(sp('E','TT')==='Bb','E TT = Bb, got '+sp('E','TT'));
chk(sp('F','TT')==='B','F TT = B, got '+sp('F','TT'));
chk(sp('G','TT')==='C#','G TT = C#, got '+sp('G','TT'));
chk(sp('A','TT')==='Eb','A TT = Eb, got '+sp('A','TT'));
chk(sp('G','M6')==='E','G M6 = E');
chk(sp('C','m7')==='Bb','C m7');
chk(sp('C','M7')==='B','C M7');
chk(sp('C','d7')==='Bbb','C dim7 = Bbb, got '+sp('C','d7'));

// 3. tritone pairs are genuinely mutual + 6 semitones
for (const [a,b] of TRITONE_PAIRS) {
  const d = ((T.pitchClass(T.parseNote(b)) - T.pitchClass(T.parseNote(a))) + 12) % 12;
  chk(d === 6, `tritone pair ${a}/${b} = ${d} semis`);
}
chk(TRITONE_PAIRS.length === 6, 'six pairs');

// 4. thirds shape charts: correct interval + correct key colour + complete 12
const BLACK = new Set([1,3,6,8,10]);
for (const [id, groups] of Object.entries(THIRDS_SHAPES)) {
  const want = id === 'M3' ? 4 : 3;
  let total = 0; const roots = new Set();
  for (const g of groups) {
    for (const [a,b] of g.pairs) {
      total++;
      const na=T.parseNote(a), nb=T.parseNote(b);
      const d = ((T.pitchClass(nb)-T.pitchClass(na))+12)%12;
      chk(d===want, `${id} ${a}-${b} = ${d} semis`);
      const col = (BLACK.has(T.pitchClass(na))?'black':'white')+'–'+(BLACK.has(T.pitchClass(nb))?'black':'white');
      chk(col===g.shape, `${id} ${a}-${b} listed as ${g.shape} but is ${col}`);
      roots.add(T.pitchClass(na));
    }
  }
  chk(total===12, `${id} has ${total} pairs, want 12`);
  chk(roots.size===12, `${id} covers ${roots.size} roots, want 12`);
}

// 5. circle steps must land on the right pitch class (7 semis per cw step)
for (const iv of INTERVALS) {
  const st = CIRCLE_STEPS[iv.id];
  if (st === undefined) continue;
  chk(((st*7)%12+12)%12 === iv.semis%12, `${iv.id} circle steps ${st} → ${((st*7)%12+12)%12}, want ${iv.semis%12}`);
}

// 6. inversions are mutual and sum to 12 (except octave)
for (const iv of INTERVALS) {
  if (iv.bonus) continue;
  const p = INTERVALS.find(i=>i.id===iv.inversion);
  chk(!!p, `${iv.id} inversion ${iv.inversion} missing`);
  if (p) {
    chk(p.inversion===iv.id, `${iv.id}↔${p.id} not mutual`);
    if (iv.id!=='P8') chk(iv.semis+p.semis===12, `${iv.id}+${p.id} = ${iv.semis+p.semis}`);
  }
}

// 7. derive formulas actually produce the interval
for (const iv of INTERVALS) {
  if (!iv.derive) continue;
  const base = iv.derive.anchor==='root'?0:iv.derive.anchor==='P5'?7:12;
  chk(base+iv.derive.offset===iv.semis, `${iv.id} derive ${iv.derive.text} = ${base+iv.derive.offset}, want ${iv.semis}`);
}
console.log(fail===0?'ALL THEORY TESTS PASS':`${fail} FAILURES`);
