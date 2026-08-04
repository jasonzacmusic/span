/* Span — the three drills: Ear (hear it), Eyes (read it), Hands (build it).
   One engine, three question types, shared stats + streaks. */

import * as T from './theory.js';
import { INTERVALS, INTERVAL_BY_ID, FAMILY_COLOR, PRESETS, KEY_SIGS } from './data.js';
import { Piano, placeInterval } from './piano.js';
import { keyboardSVG } from './keys.js';
import { drawInterval } from './staff.js';
import { playInterval, playNote, unlockAudio } from './audio.js';
import { icon, iconLabel } from './icons.js';

const DRILL_IVS = INTERVALS.filter((iv) => !iv.bonus);
const STORE_KEY = 'span-stats-v1';

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveStats(s) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

function spelledTarget(rootNote, iv, dir = 1) {
  if (iv.id === 'TT') return T.spellTritone(rootNote, dir);
  return T.transpose(rootNote, { num: iv.num, quality: iv.quality }, dir);
}

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class Drill {
  constructor(mode, viewEl, cfg) {
    this.mode = mode;           // 'ear' | 'eyes' | 'hands'
    this.el = viewEl;
    this.cfg = cfg;
    this.enabled = new Set(PRESETS[0].set);
    this.streak = 0;
    this.q = null;
    this.locked = false;
    this.build();
  }

  /* ---------- UI scaffolding ---------- */

  build() {
    this.el.innerHTML = `
      <div class="drill-top">
        <div class="drill-presets">${PRESETS.map((p) => `<button class="preset" data-p="${p.id}">${p.label}</button>`).join('')}</div>
        <div class="drill-ivs">${DRILL_IVS.map((iv) => `<button class="mini-chip" data-iv="${iv.id}" style="--fam:${FAMILY_COLOR[iv.family]}">${iv.short}</button>`).join('')}</div>
        <div class="drill-opts">${this.cfg.optsHTML || ''}</div>
      </div>
      <div class="drill-stage">
        <div class="drill-prompt"></div>
        <div class="drill-visual"></div>
        <div class="drill-answers"></div>
        <div class="drill-feedback"></div>
      </div>
      <div class="drill-foot">
        <div class="drill-streak">streak <b>0</b></div>
        <div class="drill-heat"></div>
        <label class="opt auto-opt"><input type="checkbox" data-auto checked> auto next</label>
        <button class="drill-next">${iconLabel('enter', 'Next')}</button>
      </div>`;
    this.promptEl = this.el.querySelector('.drill-prompt');
    this.visualEl = this.el.querySelector('.drill-visual');
    this.answersEl = this.el.querySelector('.drill-answers');
    this.feedbackEl = this.el.querySelector('.drill-feedback');
    this.el.querySelector('.drill-next').addEventListener('click', () => this.next());
    this.el.querySelectorAll('.preset').forEach((b) => {
      b.addEventListener('click', () => {
        this.enabled = new Set(PRESETS.find((p) => p.id === b.dataset.p).set);
        this.syncChips();
        this.next();
      });
    });
    this.el.querySelectorAll('.mini-chip').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.iv;
        if (this.enabled.has(id)) { if (this.enabled.size > 2) this.enabled.delete(id); } else this.enabled.add(id);
        this.syncChips();
      });
    });
    this.syncChips();
    if (this.cfg.wireOpts) this.cfg.wireOpts(this);
    this.cfg.setup?.(this);
    this.renderHeat();
  }

  syncChips() {
    this.el.querySelectorAll('.mini-chip').forEach((b) => b.classList.toggle('on', this.enabled.has(b.dataset.iv)));
  }

  answerGrid() {
    const ids = DRILL_IVS.filter((iv) => this.enabled.has(iv.id));
    this.answersEl.innerHTML = ids.map((iv, i) => `<button class="ans" data-iv="${iv.id}" style="--fam:${FAMILY_COLOR[iv.family]}"><b>${i + 1}</b> ${iv.short}</button>`).join('');
    this.answersEl.querySelectorAll('.ans').forEach((b) => {
      b.addEventListener('click', () => this.answer(b.dataset.iv));
    });
  }

  /* ---------- flow ---------- */

  next() {
    this.locked = false;
    this.feedbackEl.innerHTML = '';
    this.feedbackEl.className = 'drill-feedback';
    const ivId = randomOf([...this.enabled]);
    const rootName = randomOf(T.ROOTS_CHROMATIC);
    this.q = this.cfg.makeQuestion(this, INTERVAL_BY_ID[ivId], rootName);
    if (this.cfg.usesGrid !== false) this.answerGrid();
  }

  answer(ivId) {
    if (this.locked || !this.q) return;
    this.locked = true;
    const ok = ivId === this.q.iv.id;
    this.record(this.q.iv.id, ok);
    if (!ok) this.record(ivId, false);
    this.answersEl.querySelectorAll('.ans').forEach((b) => {
      if (b.dataset.iv === this.q.iv.id) b.classList.add('right');
      else if (b.dataset.iv === ivId) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    this.reveal(ok);
  }

  markResult(ok) {
    this.streak = ok ? this.streak + 1 : 0;
    this.el.querySelector('.drill-streak b').textContent = this.streak;
    this.renderHeat();
  }

  /* Always answer with a picture: the two keys, the distance drawn between
     them, and the trick that gets you there next time. */
  reveal(ok) {
    this.markResult(ok);
    const { iv, rootNote, target, dir } = this.q;
    const color = FAMILY_COLOR[iv.family];
    const [rm, tm] = placeInterval(T.pitchClass(rootNote), iv.semis, dir);
    const kb = this.cfg.showRevealKeys === false ? '' : `<div class="fb-keys">${keyboardSVG([
      { midi: rm, kind: 'root', label: T.noteName(rootNote) },
      { midi: tm, kind: 'target', color, label: T.noteName(target) },
    ], { size: 'sm', minWhite: 9, arc: { from: rm, to: tm, color } })}</div>`;

    this.feedbackEl.className = 'drill-feedback show ' + (ok ? 'ok' : 'no');
    this.feedbackEl.innerHTML = `
      <div class="fb-line"><b>${ok ? 'Yes!' : iv.short}</b> ${iv.label} — ${T.noteName(rootNote)} ${dir < 0 ? '↓' : '↑'} ${T.noteName(target)} · ${iv.semis} st</div>
      ${kb}
      <div class="fb-trick" style="--fam:${color}">${iv.trick}</div>
      <div class="fb-song">▲ ${iv.songs.up} · ▼ ${iv.songs.down}</div>`;
    if (ok && this.autoAdvance()) setTimeout(() => { if (this.locked) this.next(); }, 2400);
  }

  autoAdvance() {
    const box = this.el.querySelector('[data-auto]');
    return !box || box.checked;
  }

  record(ivId, ok) {
    const s = loadStats();
    s[this.mode] = s[this.mode] || {};
    s[this.mode][ivId] = s[this.mode][ivId] || { r: 0, w: 0 };
    if (ok) s[this.mode][ivId].r += 1; else s[this.mode][ivId].w += 1;
    saveStats(s);
  }

  renderHeat() {
    const s = loadStats()[this.mode] || {};
    this.el.querySelector('.drill-heat').innerHTML = DRILL_IVS.map((iv) => {
      const d = s[iv.id];
      let cls = 'none'; let tip = `${iv.short}: —`;
      if (d && d.r + d.w > 0) {
        const acc = d.r / (d.r + d.w);
        cls = acc >= 0.85 ? 'hot' : acc >= 0.6 ? 'warm' : 'cold';
        tip = `${iv.short}: ${d.r}/${d.r + d.w}`;
      }
      return `<span class="heat ${cls}" title="${tip}">${iv.short}</span>`;
    }).join('');
  }

  keydown(e) {
    if (e.key === 'r' || e.key === 'R') { this.cfg.replay?.(this); return; }
    if (e.key === 'Enter') { this.next(); return; }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 12) {
      const btn = this.answersEl.querySelectorAll('.ans')[n - 1];
      if (btn) btn.click();
    }
  }
}

/* ---------- Ear ---------- */

function earConfig() {
  return {
    optsHTML: `
      <label class="opt"><input type="checkbox" data-dir="up" checked> up</label>
      <label class="opt"><input type="checkbox" data-dir="down"> down</label>
      <label class="opt"><input type="checkbox" data-dir="harmonic"> together</label>
      <select class="sel" data-reg><option value="0" selected>mid register</option><option value="-12">low register</option><option value="12">high register</option><option value="rand">roaming register</option></select>
      <label class="opt" title="spread the two notes more than an octave apart"><input type="checkbox" data-wide> wide</label>`,
    wireOpts(d) {
      d.dirs = () => [...d.el.querySelectorAll('[data-dir]:checked')].map((c) => c.dataset.dir);
      d.reg = () => {
        const v = d.el.querySelector('[data-reg]').value;
        return v === 'rand' ? randomOf([-12, -7, 0, 5, 12]) : parseInt(v, 10);
      };
      d.wide = () => d.el.querySelector('[data-wide]').checked;
      d.el.querySelectorAll('[data-dir]').forEach((c) => c.addEventListener('change', () => {
        if (d.dirs().length === 0) c.checked = true;
      }));
    },
    makeQuestion(d, iv, rootName) {
      const mode = randomOf(d.dirs().length ? d.dirs() : ['up']);
      const dir = mode === 'down' ? -1 : 1;
      const rootNote = T.parseNote(rootName);
      const target = spelledTarget(rootNote, iv, dir);
      const [rm, tm] = placeInterval(T.pitchClass(rootNote), iv.semis, dir);
      const off = d.reg();
      // "wide" throws the upper note an octave further out — same interval,
      // much harder to place by ear
      const spread = d.wide() ? 12 * dir : 0;
      d.promptEl.innerHTML = `<span>What do you hear?</span>`;
      const label = mode === 'harmonic' ? 'both together' : mode === 'down' ? 'downwards' : 'upwards';
      d.visualEl.innerHTML = `<div class="plate plate-ear">
        <button class="big-play" title="replay (R)" aria-label="replay">${icon.play({ size: '21px' })}</button>
        <span class="ear-mode">${label}${spread ? ' · spread wide' : ''}</span>
        <span class="ear-hint">press <b>R</b> to replay · <b>1–9</b> to answer</span></div>`;
      const play = () => playInterval(rm + off, tm + off + spread, mode);
      d.visualEl.querySelector('.big-play').addEventListener('click', () => { unlockAudio(); play(); });
      setTimeout(() => { unlockAudio(); play(); }, 250);
      d.q_play = play;
      return { iv, rootNote, target, dir, play };
    },
    replay(d) { d.q?.play?.(); },
  };
}

/* ---------- Eyes ---------- */

function eyesConfig() {
  return {
    optsHTML: `
      <select class="sel" data-clef><option value="treble" selected>treble clef</option><option value="bass">bass clef</option></select>
      <select class="sel" data-key>${KEY_SIGS.map((k) => `<option${k === 'G' ? ' selected' : ''}>${k}</option>`).join('')}</select>
      <select class="sel" data-smode><option value="melodic" selected>melodic</option><option value="harmonic">harmonic</option></select>`,
    wireOpts(d) {
      d.clef = () => d.el.querySelector('[data-clef]').value;
      d.keySig = () => d.el.querySelector('[data-key]').value;
      d.smode = () => d.el.querySelector('[data-smode]').value;
    },
    makeQuestion(d, iv, rootName) {
      const rootNote = T.parseNote(rootName);
      const target = spelledTarget(rootNote, iv, 1);
      d.promptEl.innerHTML = `<span>Name this interval</span>`;
      d.visualEl.innerHTML = `<div class="plate"><div class="staff-box"></div>
        <button class="ghost-btn plate-hear" title="hear it (R)">hear it</button></div>`;
      drawInterval(d.visualEl.querySelector('.staff-box'), [rootNote, target], {
        clef: d.clef(), keySig: d.keySig(), mode: d.smode(), width: 300, scale: 1.5,
      });
      d.visualEl.querySelector('.plate-hear').addEventListener('click', () => {
        unlockAudio();
        const [rm, tm] = placeInterval(T.pitchClass(rootNote), iv.semis, 1);
        playInterval(rm, tm, d.smode() === 'harmonic' ? 'harmonic' : 'up');
      });
      return { iv, rootNote, target, dir: 1 };
    },
    replay(d) {
      if (!d.q) return;
      const [rm, tm] = placeInterval(T.pitchClass(d.q.rootNote), d.q.iv.semis, 1);
      playInterval(rm, tm, 'up');
    },
  };
}

/* ---------- Hands ---------- */

function handsConfig() {
  return {
    usesGrid: false,
    optsHTML: `
      <label class="opt"><input type="checkbox" data-hdir="1" checked> up</label>
      <label class="opt"><input type="checkbox" data-hdir="-1"> down</label>
      <label class="opt" title="find the root yourself as well"><input type="checkbox" data-both> build both notes</label>`,
    wireOpts(d) {
      d.hdirs = () => [...d.el.querySelectorAll('[data-hdir]:checked')].map((c) => parseInt(c.dataset.hdir, 10));
      d.both = () => d.el.querySelector('[data-both]').checked;
      d.el.querySelectorAll('[data-hdir]').forEach((c) => c.addEventListener('change', () => {
        if (d.hdirs().length === 0) c.checked = true;
      }));
      d.el.querySelector('[data-both]').addEventListener('change', () => d.next());
    },
    setup(d) {
      const plate = document.createElement('div');
      plate.className = 'plate plate-keys';
      d.visualEl.appendChild(plate);
      d.piano = new Piano(plate.appendChild(document.createElement('div')), {
        onKey: (midi) => {
          if (d.locked || !d.q) return;
          unlockAudio();
          const q = d.q;
          const wanted = q.needRoot ? q.rootMidi : q.targetMidi;
          if (midi !== wanted) {
            playNote(midi, 0, 0.35, 0.35);
            d.piano.flashWrong(midi);
            if (!q.missed) { q.missed = true; d.record(q.iv.id, false); d.markResult(false); }
            return;
          }
          playNote(midi, 0, 1.0, 0.5);
          if (q.needRoot) {
            // "build both notes": the root has just been found, now the interval
            q.needRoot = false;
            d.piano.show([{ midi: q.rootMidi, name: T.noteName(q.rootNote), kind: 'root' }]);
            const h = d.el.querySelector('.hands-hint');
            if (h) h.innerHTML = `<span>now play <b>${q.iv.label.toLowerCase()}</b> ${q.dir < 0 ? 'below' : 'above'} it</span>`;
            return;
          }
          d.locked = true;
          d.record(q.iv.id, !q.missed);
          d.piano.show([
            { midi: q.rootMidi, name: T.noteName(q.rootNote), kind: 'root' },
            { midi: q.targetMidi, name: T.noteName(q.target), kind: 'target', color: FAMILY_COLOR[q.iv.family] },
          ], { from: q.rootMidi, to: q.targetMidi, label: `${q.iv.semis} st`, color: FAMILY_COLOR[q.iv.family] });
          d.reveal(!q.missed);
        },
      });
      d.piano.setClickable(true);
      const hint = document.createElement('div');
      hint.className = 'hands-hint';
      plate.appendChild(hint);
      hint.addEventListener('click', (e) => {
        if (!e.target.closest('[data-hear-root]') || !d.q) return;
        unlockAudio();
        playNote(d.q.rootMidi, 0, 0.9, 0.5);
      });
    },
    makeQuestion(d, iv, rootName) {
      const dir = randomOf(d.hdirs().length ? d.hdirs() : [1]);
      const rootNote = T.parseNote(rootName);
      const target = spelledTarget(rootNote, iv, dir);
      const [rootMidi, targetMidi] = placeInterval(T.pitchClass(rootNote), iv.semis, dir);
      const needRoot = d.both();
      d.promptEl.innerHTML = `<span>Build <b class="q-iv" style="--fam:${FAMILY_COLOR[iv.family]}">${iv.short}</b> ${dir < 0 ? '↓ down' : '↑ up'} from <b>${T.noteName(rootNote)}</b></span>`;
      const hint = d.el.querySelector('.hands-hint');
      if (hint) {
        hint.innerHTML = needRoot
          ? `<span>first find <b>${T.noteName(rootNote)}</b> on the keyboard</span>`
          : `<span>play the key that is <b>${iv.label.toLowerCase()}</b> ${dir < 0 ? 'below' : 'above'} the red one</span><button class="ghost-btn" data-hear-root>hear the root</button>`;
      }
      d.piano.show(needRoot ? [] : [{ midi: rootMidi, name: T.noteName(rootNote), kind: 'root' }]);
      if (!needRoot) playNote(rootMidi, 0, 0.8, 0.5);
      return { iv, rootNote, target, dir, rootMidi, targetMidi, needRoot };
    },
    replay(d) { if (d.q) playNote(d.q.rootMidi, 0, 0.8, 0.5); },
  };
}

/* ---------- init ---------- */

const drills = {};

export function initTrainers() {
  drills.ear = new Drill('ear', document.getElementById('view-ear'), earConfig());
  drills.eyes = new Drill('eyes', document.getElementById('view-eyes'), eyesConfig());
  drills.hands = new Drill('hands', document.getElementById('view-hands'), handsConfig());
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const active = document.querySelector('.view.active');
    if (!active) return;
    const d = drills[active.id.replace('view-', '')];
    if (d) d.keydown(e);
  });
}

export function startDrill(mode) {
  drills[mode]?.next();
}
