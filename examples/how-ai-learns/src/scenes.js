// ---------- storyboard: the single source of truth ----------
// 96 bpm, 72 beats = 45 s = 18 bars. One teal dot is the thread: it becomes Bit's eye, the mistake
// on the curve, the feature rings, and finally loops the "guess, nudge, repeat" circle.
const BPM = 96, BEAT = 60 / BPM, b = n => n * BEAT;
const S = { meet: 0, guess: b(6), nudge: b(14), repeat: b(22), pattern: b(34), fresh: b(42), bad: b(52), recap: b(62) };
const SECTIONS = [
  [0, 1, ['pad']],
  [1, 2, ['pad', 'pluck']],
  [2, 3, ['pad', 'pluck', 'hat8']],
  [3, 4, ['pad', 'pluck', 'hat8', 'kick2']],
  [4, 6, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']],
  [6, 9, ['pad', 'pluck', 'hat8', 'kick4', 'bassHalf', 'clap']],   // the practice montage
  [9, 10, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']],
  [10, 11, ['pad', 'pluck']],
  [11, 12, []],                                                     // break: a picture it has never seen
  [12, 13, ['pad', 'pluck', 'bassHalf']],                           // the right answer
  [13, 14, ['pad', 'pluck', 'hat8', 'bassHalf']],
  [14, 15, ['pad', 'pluck']],
  [15, 16, ['pad', 'pluck', 'hat8']],
  [16, 17, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']],
  [17, 18, ['pad', 'pluck']],
];
const SHOTS = [                                                    // world = screen at k 1; cuts are morphs, never hard cuts
  { from: S.meet, to: S.nudge, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 + .03 * prog(t, 0, S.nudge) }) },
  { from: S.nudge, to: S.repeat, cam: t => { const e = ease(prog(t, S.nudge, S.nudge + b(1.6))); return { cx: lerp(W / 2, 460, e), cy: lerp(H / 2, 774, e), k: lerp(1.03, 3, e) + .08 * prog(t, b(16), S.repeat) }; } },
  { from: S.repeat, to: S.pattern, cam: t => { const e = ease(prog(t, S.repeat, S.repeat + b(1.6))); return { cx: lerp(460, W / 2, e), cy: lerp(774, H / 2, e), k: lerp(3.08, 1, e) }; } },
  { from: S.pattern, to: S.fresh, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 + .025 * prog(t, S.pattern, S.fresh) }) },
  { from: S.fresh, to: S.bad, cam: t => ({ cx: W / 2 + 40 * ease(prog(t, b(44), b(48))), cy: H / 2, k: 1 + .06 * ease(prog(t, b(44), b(48))) - .06 * ease(prog(t, b(48), b(49))) }) },
  { from: S.bad, to: S.recap, cam: t => ({ cx: W / 2 + 40 - 40 * ease(prog(t, S.bad, S.bad + 1)), cy: H / 2, k: 1 + .02 * Math.sin(prog(t, b(54), b(58)) * Math.PI) }) },
  { from: S.recap, to: DUR, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 }) },
];

// ---------- blocking ----------
const HOME = { x: 620, y: 900, s: 1 };                             // Bit, scenes 1-3
const SIDE = { x: 400, y: 900, s: .85 };                           // Bit, scenes 4-7
const MID = { x: 960, y: 770, s: .5 };                             // Bit, recap
const CARD_AT = [1300, 480];
const CHART = { x: 1080, y: 400, w: 700, h: 320 };
const err = p => .07 + .72 * Math.exp(-3.4 * p) + .05 * (1 - p) * Math.sin(p * 41);   // the mistake, falling with practice
const KINDS = ['cat', 'dog', 'bird'];
const MONTAGE = [];                                                // cards in the practice montage: one per beat, then halves, then quarters
{ let at = b(23.5); const steps = [[4, 1], [8, .5], [10, .25]];
  for (const [n, d] of steps) for (let i = 0; i < n; i++) { const k = MONTAGE.length; MONTAGE.push({ at, kind: KINDS[Math.floor(hash2(k, 3) * 3)], ok: hash2(k, 9) < lerp(.15, .97, k / 21) }); at += b(d); } }
const MONTAGE_END = b(34);
const FEAT = [                                                     // what Bit learned, in card-local units (cat drawing)
  { name: 'ears', x: -50, y: -52, lx: -170, ly: -140, dial: 0, at: b(35.5) },
  { name: 'whiskers', x: -78, y: 42, lx: -200, ly: 110, dial: 2, at: b(36.5) },
  { name: 'eyes', x: 26, y: 0, lx: 170, ly: -40, dial: 4, at: b(37.5) },
];
const RECAP = [                                                    // the loop: angle on the circle, word, side of the word
  { a: -Math.PI / 2, word: 'Guess.', dx: 0, dy: -110, align: 'center', at: b(62.5) },
  { a: Math.PI / 6, word: 'Nudge.', dx: 95, dy: 10, align: 'left', at: b(64) },
  { a: Math.PI * 5 / 6, word: 'Repeat.', dx: -95, dy: 10, align: 'right', at: b(65.5) },
];
const RING = { x: 960, y: 520, r: 300 };

const EVENTS = [
  [b(2) / 3, 'popLow', 0], [b(2) * 2 / 3, 'popLow', 1], [b(2), 'boing'], [b(2.6), 'pop'], [b(3), 'tick'],
  [S.guess, 'whooshIn'], [b(7.5), 'swish'], [b(9), 'pop'], [b(10), 'thud'], [b(10.05), 'alarm'], [b(10.5), 'tick'],
  [S.nudge, 'whoosh'], [b(15.5), 'zip'], ...[0, 1, 2, 3, 4].map(i => [b(18 + i * .5), 'tick']), [b(20.5), 'ding'],
  [S.repeat, 'whooshOut'], [b(23), 'pop'], ...MONTAGE.map((c, i) => [c.at, i < 12 ? 'clack' : 'click']),
  [S.pattern, 'whooshIn'], ...FEAT.map((f, i) => [f.at, 'popLow', i + 2]),
  [S.fresh, 'whoosh'], [b(45), 'tick'], [b(46), 'tick'], [b(47), 'tick'], [b(48), 'ding'], [b(48.05), 'flag'],
  [S.bad, 'whooshIn'], [b(54), 'boing'], [b(55), 'alarm'],
  [S.recap, 'swish'], ...RECAP.map(r => [r.at, 'pop']), [b(67), 'notify'], [b(70), 'drip'],
];

// ---------- type: words spring up from a line, and leave upward (no plain fades) ----------
const SANS = (s, w = 800) => `${w} ${s}px "Avenir Next", "Helvetica Neue", Arial, sans-serif`;
const MONO = (s, w = 600) => `${w} ${s}px Menlo, ui-monospace, monospace`;
function kine(str, x, y, t, at, out, o = {}) {   // *word* = teal accent
  const { size = 72, col = CREAM, align = 'left', w = 800, stagger = .07, id = str } = o;
  if (t < at || t > out + 1) return;
  ctx.save(); ctx.font = SANS(size, w); ctx.textBaseline = 'alphabetic';
  const words = str.split(' '), sp = ctx.measureText(' ').width, ws = words.map(s => ctx.measureText(s.replace(/\*/g, '')).width);
  const total = ws.reduce((a, c) => a + c, 0) + sp * (words.length - 1);
  let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const left = x0;
  ctx.beginPath(); ctx.rect(x0 - 30, y - size * 1.1, total + 60, size * 1.45); ctx.clip();
  words.forEach((s, i) => {
    const pin = back(prog(t, at + i * stagger, at + i * stagger + .5)), pout = ease(prog(t, out + i * stagger * .6, out + i * stagger * .6 + .4));
    ctx.fillStyle = s.includes('*') ? TEAL : col;
    ctx.fillText(s.replace(/\*/g, ''), x0, y + (1 - pin) * size * 1.3 - pout * size * 1.4); x0 += ws[i] + sp;
  });
  ctx.restore();
  if (t < out + .3) claim(id, 'text', left, y - size * .95, total, size * 1.2);
}
function pill(str, x, y, p, o = {}) {            // small label; springs open from its centre, closes the same way
  if (p <= 0) return;
  const { bg = TEAL, fg = DEEP, size = 28, font = MONO(size, 700), align = 'left', id = null } = o;
  ctx.save(); ctx.font = font; const w = ctx.measureText(str).width + size * 1.4, h = size * 1.8;
  const x0 = align === 'center' ? x - w / 2 : x;
  ctx.translate(x0 + w / 2, y); ctx.scale(back(p), back(p));
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(str, 0, 1); ctx.restore();
  if (id) claim(id, 'text', x0, y - h / 2, w, h);
}
const inOut = (t, a, z, d = .35) => Math.min(prog(t, a, a + d), 1 - prog(t, z - d, z));   // 0..1 open window, for pills

// ---------- flat helpers ----------
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 7); ctx.fill(); }
function ell(x, y, rx, ry, rot, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function tri(a, c, d, e, f, g, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a, c); ctx.lineTo(d, e); ctx.lineTo(f, g); ctx.closePath(); ctx.fill(); }
function strokeLine(pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); ctx.stroke(); }
function teal(x, y, r) { glow(x, y, r * 3, '46,196,182', .35); circ(x, y, r, TEAL); circ(x - r * .3, y - r * .3, r * .28, 'rgba(255,255,255,.7)'); }   // the dot

// ---------- Bit: the learner ----------
const DIALS = [[-48, -132], [0, -132], [48, -132], [-24, -88], [24, -88]];
function bit(x, y, s, st = {}) {
  const { grow = 1, eyeL = 1, eyeR = 1, blink = 0, mood = 'plain', tilt = 0, look = 0, dials = [0, 0, 0, 0, 0], mistake = 0, dialGlow = 0,
          armL = 0, armR = 0, squash = 0, antenna = 0, winkR = 0 } = st;
  if (grow <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(0, 4, 150 * grow, 20 * grow, 0, 'rgba(5,10,25,.4)');                                 // floor shadow
  ctx.translate(-48, -345); ctx.scale(grow, grow); ctx.translate(48, 345);                  // grows out of its left eye
  ctx.scale(1 + squash, 1 - squash);
  // legs
  rr(-58, -45, 32, 45, 10, SUN_D); rr(26, -45, 32, 45, 10, SUN_D); ell(-44, -2, 30, 12, 0, DEEP); ell(44, -2, 30, 12, 0, DEEP);
  // arms
  const arm = (side, a) => { ctx.save(); ctx.translate(side * 100, -185); ctx.rotate(-side * (.22 + a)); rr(-12, 0, 24, 88, 12, SUN_D); circ(0, 94, 19, SUN); ctx.restore(); };
  arm(-1, armL); arm(1, armR);
  // torso + chest panel (the knobs)
  rr(-108, -215, 216, 178, 44, SUN);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-108, -215, 216, 178, 44); ctx.clip(); ctx.fillStyle = 'rgba(160,90,20,.16)'; ctx.fillRect(40, -220, 80, 190); ctx.restore();
  rr(-80, -195, 160, 138, 22, DEEP);
  rr(-64, -181, 128, 14, 7, '#22335a'); if (mistake > .005) rr(-64, -181, 128 * clamp(mistake), 14, 7, CORAL);
  DIALS.forEach(([dx, dy], i) => {
    const v = dials[i] || 0, a = -Math.PI / 2 + v * 2.3;
    circ(dx, dy, 19, '#22335a');
    if (dialGlow > 0) glow(dx, dy, 34, '46,196,182', .45 * dialGlow);
    ctx.strokeStyle = TEAL; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(dx, dy, 19, -Math.PI / 2, a, a < -Math.PI / 2); ctx.stroke();
    strokeLine([[dx, dy], [dx + Math.cos(a) * 13, dy + Math.sin(a) * 13]], CREAM, 4); circ(dx, dy, 4, CREAM);
  });
  // neck, head
  rr(-22, -238, 44, 28, 8, SUN_D);
  ctx.translate(0, -238); ctx.rotate(tilt); ctx.translate(0, 238);
  const ant = antenna * Math.sin(antenna * 30) * .25;                                                      // antenna sway
  ctx.save(); ctx.translate(0, -452); ctx.rotate(ant); strokeLine([[0, 0], [0, -58]], SUN_D, 8); teal(0, -70, 16); ctx.restore();
  rr(-142, -458, 284, 224, 62, SUN);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-142, -458, 284, 224, 62); ctx.clip(); ctx.fillStyle = 'rgba(160,90,20,.16)'; ctx.fillRect(70, -460, 90, 230); ctx.restore();
  rr(-114, -428, 228, 166, 40, DEEP);
  const eye = (ex, open, wink) => {
    if (open <= 0) return;
    ctx.save(); ctx.translate(ex, -350); ctx.scale(open, open);
    if (mood === 'happy' || wink > .5) { ctx.strokeStyle = TEAL; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 10, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore(); return; }
    ctx.scale(1, Math.max(.08, 1 - blink));
    glow(0, 0, 70, '46,196,182', .25); circ(0, 0, 28, TEAL);
    const lx = look * 10, ly = mood === 'think' ? -9 : 0; circ(lx, ly, 13, DEEP); circ(lx - 5, ly - 6, 5, CREAM);
    if (mood === 'sad') { ctx.fillStyle = DEEP; ctx.beginPath(); ctx.moveTo(-36, -34); ctx.lineTo(36, -34); ctx.lineTo(ex < 0 ? 36 : -36, -4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };
  eye(-48, eyeL, 0); eye(48, eyeR, winkR);
  ctx.strokeStyle = TEAL; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();                        // mouth
  if (mood === 'sad') ctx.arc(0, -282, 16, Math.PI * 1.2, Math.PI * 1.8); else if (mood === 'think') { ctx.moveTo(-10, -292); ctx.lineTo(10, -292); } else ctx.arc(0, -305, mood === 'happy' ? 22 : 15, Math.PI * .2, Math.PI * .8);
  ctx.stroke();
  ell(-92, -300, 16, 10, 0, 'rgba(255,107,107,.35)'); ell(92, -300, 16, 10, 0, 'rgba(255,107,107,.35)');
  ctx.restore();
  claim('bit', 'keep', x - 150 * s, y - 530 * s, 300 * s, 530 * s);
}

// ---------- cards and what is on them ----------
function catPic(hat) {
  const O = '#f4a259', D = '#d98446';
  tri(-68, -20, -52, -92, -10, -52, O); tri(68, -20, 52, -92, 10, -52, O);
  tri(-56, -32, -50, -74, -26, -52, '#f7b7a3'); tri(56, -32, 50, -74, 26, -52, '#f7b7a3');
  circ(0, 10, 74, O);
  [-18, 0, 18].forEach(dx => rr(dx - 4, -62, 8, 22, 4, D));
  ell(0, 42, 36, 24, 0, '#fbe3c8');
  ell(-26, 0, 10, 13, 0, DEEP); ell(26, 0, 10, 13, 0, DEEP); circ(-29, -4, 3.5, '#fff'); circ(23, -4, 3.5, '#fff');
  tri(-8, 28, 8, 28, 0, 37, '#e8746a');
  strokeLine([[-16, 42], [-8, 50], [0, 43], [8, 50], [16, 42]], DEEP, 3);
  [[30, 94, 30], [32, 98, 45], [34, 92, 60]].forEach(([a, c, d]) => { strokeLine([[a, 42], [c, d]], DEEP, 2.5); strokeLine([[-a, 42], [-c, d]], DEEP, 2.5); });
  if (hat) { ctx.save(); ctx.translate(0, -58); ctx.rotate(-.14); ell(0, 0, 64, 13, 0, '#23233a'); rr(-40, -86, 80, 86, 8, '#23233a'); rr(-40, -22, 80, 15, 0, CORAL); ctx.restore(); }
}
function dogPic() {
  ell(-70, 4, 24, 52, .3, '#7a5234'); ell(70, 4, 24, 52, -.3, '#7a5234');
  circ(0, 6, 68, '#c8925f'); ell(28, -22, 24, 19, .3, '#a8744a');
  ell(0, 42, 42, 29, 0, '#efd3b0'); ell(0, 26, 16, 11, 0, '#2a1d18');
  strokeLine([[0, 36], [0, 48]], DEEP, 3); strokeLine([[-14, 52], [0, 48], [14, 52]], DEEP, 3); ell(0, 62, 9, 11, 0, '#ef7f8a');
  circ(-25, -8, 9, DEEP); circ(25, -8, 9, DEEP); circ(-28, -11, 3, '#fff'); circ(22, -11, 3, '#fff');
}
function birdPic() {
  [-14, 0, 14].forEach((dx, i) => ell(dx, -58, 7, 18, (i - 1) * .4, '#3b8dc4'));
  circ(0, 18, 70, '#5dade2'); ell(-4, 46, 44, 34, 0, '#d6eef9'); ell(-40, 30, 32, 20, .5, '#3b8dc4');
  tri(44, 2, 88, 14, 44, 26, '#f4a259'); circ(20, -6, 10, DEEP); circ(17, -9, 3.5, '#fff');
  strokeLine([[-14, 86], [-14, 104]], '#f4a259', 5); strokeLine([[14, 86], [14, 104]], '#f4a259', 5);
}
const PICS = { cat: () => catPic(false), hat: () => catPic(true), dog: dogPic, bird: birdPic };
function stamp(x, y, r, ok, p) {                  // ✓ / ✗ lands like a rubber stamp
  if (p <= 0) return;
  const k = lerp(1.7, 1, easeOut(p)) ; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(ok ? -.12 : .12);
  circ(0, 0, r, ok ? TEAL : CORAL);
  const L = ok ? [[-r * .42, 0], [-r * .1, r * .32], [r * .45, -r * .34]] : null;
  if (ok) strokeLine(L, DEEP, r * .2); else { strokeLine([[-r * .35, -r * .35], [r * .35, r * .35]], CREAM, r * .2); strokeLine([[r * .35, -r * .35], [-r * .35, r * .35]], CREAM, r * .2); }
  ctx.restore();
}
function card(x, y, s, kind, o = {}) {
  const { face = 1, rot = 0, blur = 0, mark = null, markP = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const fx = Math.max(.02, Math.abs(Math.cos(Math.PI * (1 - face))));
  ctx.save(); ctx.scale(fx, 1);
  rr(-130 + 16, -160 + 18, 260, 320, 26, 'rgba(5,10,25,.35)');
  if (face >= .5) {
    rr(-130, -160, 260, 320, 26, CARD);
    ctx.save(); ctx.beginPath(); ctx.roundRect(-130, -160, 260, 320, 26); ctx.clip();
    if (blur) { ctx.filter = `blur(${blur}px) saturate(.4)`; ctx.rotate(.35); }
    PICS[kind](); ctx.restore();
  } else {
    rr(-130, -160, 260, 320, 26, TEAL);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) circ(-96 + i * 48, -125 + j * 50, 4, 'rgba(15,26,48,.18)');
    ctx.font = SANS(150); ctx.fillStyle = DEEP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 8);
  }
  ctx.restore();
  if (mark) stamp(98, -128, 40, mark === 'ok', markP);
  ctx.restore();
}
function mitten(x, y, rot = -.5) {                // Coach Ada: a white glove that holds up the examples
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  rr(26, -26, 50, 52, 12, TEAL);
  ell(0, 0, 50, 42, 0, CREAM); [-24, -6, 12].forEach(dy => ell(-40, dy, 22, 11, 0, CREAM));
  ctx.strokeStyle = 'rgba(15,26,48,.25)'; ctx.lineWidth = 3; [-15, 3].forEach(dy => { ctx.beginPath(); ctx.moveTo(-58, dy); ctx.lineTo(-30, dy); ctx.stroke(); });
  ell(-10, -44, 16, 26, -.7, CREAM);
  ctx.restore();
}
function bubble(x, y, w, h, p, txt, o = {}) {     // speech bubble, grows from its tail (x, y is the tail tip)
  if (p <= 0) return;
  const { col = CREAM, fg = DEEP, size = 52, type = 1 } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(back(p), back(p));
  tri(0, 0, 18, -46, 60, -40, col);
  rr(0, -h - 30, w, h, h / 2, col);
  ctx.font = SANS(size); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt.slice(0, Math.round(txt.length * clamp(type))), w / 2, -h / 2 - 28);
  ctx.restore();
  claim('bubble', 'keep', x, y - h - 30, w, h + 30);
}

// ---------- background: flat night, a few slow motes, a disc under the hero ----------
function motes(t) {
  for (let i = 0; i < 70; i++) {
    const x = (hash2(i, 1) * W + t * (6 + hash2(i, 2) * 10)) % W, y = (hash2(i, 3) * H - t * (4 + hash2(i, 4) * 8) + H * 10) % H;
    circ(x, y, 1.2 + hash2(i, 5) * 2.2, `rgba(247,241,227,${.06 + hash2(i, 6) * .1})`);
  }
}

// ---------- Bit, per moment ----------
const D_NUDGE = [.35, -.45, .3, .55, -.3], D_LEARNED = [.85, -.7, .55, .95, -.65];
function dialsAt(t) {
  if (t < b(18)) return [0, 0, 0, 0, 0];
  const n = D_NUDGE.map((v, i) => v * back(prog(t, b(18 + i * .5), b(18.4 + i * .5))));
  if (t < S.repeat) return n;
  const p = prog(t, b(23.5), MONTAGE_END), k = MONTAGE.filter(c => c.at <= t).length;
  const d = n.map((v, i) => lerp(v, D_LEARNED[i], ease(p)) + (t < MONTAGE_END + .3 ? .12 * Math.sin(k * 2.1 + i) * (1 - p * .6) : 0));
  if (t < S.fresh) return d;
  const think = t > b(44) && t < b(48) ? .1 * Math.sin((t - b(44)) * 9) : 0;
  let e = d.map((v, i) => v + think * (i % 2 ? 1 : -1));
  if (t > b(54.5) && t < S.recap) e = e.map((v, i) => v + .35 * Math.sin((t - b(54.5)) * 11 + i * 2) * (1 - prog(t, b(60), S.recap)));
  return e;
}
function mistakeAt(t) {
  if (t < b(15.5)) return 0;
  if (t < b(18)) return .8 * easeOut(prog(t, b(15.5), b(16.3)));
  if (t < S.repeat) return .8 - .18 * prog(t, b(18), b(20.5));
  if (t < MONTAGE_END) return lerp(.62, err(1), prog(t, b(23.5), MONTAGE_END));
  if (t < b(55)) return err(1) - .04 * prog(t, b(48), b(48.5));
  if (t < S.recap) return lerp(.03, .7, easeOut(prog(t, b(55), b(55.6))));
  return lerp(.7, .05, ease(prog(t, S.recap, b(64))));
}
function blinkAt(t) { const k = [1.3, 5.2, 12.4, 19, 27.3, 33.7, 40.2].find(c => t > c && t < c + .16); return k ? Math.sin((t - k) / .16 * Math.PI) : 0; }
function hero(t) {
  let pos = HOME;
  if (t >= S.repeat) { const e = ease(prog(t, S.repeat, S.repeat + b(1.6))); pos = { x: lerp(HOME.x, SIDE.x, e), y: HOME.y, s: lerp(HOME.s, SIDE.s, e) }; }
  if (t >= S.recap) { const e = ease(prog(t, S.recap, S.recap + b(1.4))); pos = { x: lerp(SIDE.x, MID.x, e), y: lerp(SIDE.y, MID.y, e), s: lerp(SIDE.s, MID.s, e) }; }
  const st = { grow: back(prog(t, b(2), b(2.8))), eyeL: t > b(2) ? 1 : 0, eyeR: back(prog(t, b(2.6), b(3))), blink: blinkAt(t),
    dials: dialsAt(t), mistake: mistakeAt(t), antenna: prog(t, b(3), b(4.2)) < 1 && t > b(3) ? 1 - prog(t, b(3), b(4.2)) : 0 };
  let mood = 'plain', look = 0, tilt = 0, armL = 0, armR = 0, squash = 0, dialGlow = 0;
  if (t > b(6.4) && t < b(14)) look = 1;
  if (t > b(8) && t < b(10)) { mood = 'think'; tilt = .06 * ease(prog(t, b(8), b(8.6))); }
  if (t > b(10) && t < b(14)) { mood = 'sad'; tilt = -.07; }
  if (t > b(10) && t < b(10.4)) squash = .06 * Math.sin(prog(t, b(10), b(10.4)) * Math.PI);
  if (t > b(18) && t < S.repeat) dialGlow = .6 + .4 * Math.sin(t * 8);
  if (t >= S.repeat && t < MONTAGE_END) { const p = prog(t, b(23.5), MONTAGE_END); mood = p < .35 ? 'sad' : p < .75 ? 'plain' : 'happy'; look = 1; const k = MONTAGE.filter(c => c.at <= t).pop(); if (k) squash = .04 * (1 - prog(t, k.at, k.at + .15)); }
  if (t >= b(34.5) && t < S.fresh) { look = 1; dialGlow = prog(t, FEAT[0].at, FEAT[0].at + .3); mood = t > b(38) ? 'happy' : 'plain'; }
  if (t >= S.fresh && t < S.bad) { look = 1; if (t > b(43.5) && t < b(48)) { mood = 'think'; tilt = .08 * Math.sin((t - b(43.5)) * 2.4); } if (t >= b(48)) { mood = 'happy'; const a = back(prog(t, b(48), b(48.5))); armL = armR = 2.4 * a * (1 - prog(t, b(51), b(51.8))); squash = -.05 * Math.sin(prog(t, b(48), b(48.6)) * Math.PI); } }
  if (t >= S.bad && t < S.recap) { look = 1; if (t > b(54)) { mood = t > b(55) ? 'sad' : 'think'; tilt = .12 * Math.sin((t - b(54)) * 7) * (1 - prog(t, b(57), b(60))); } }
  if (t >= S.recap) { mood = t > b(66) ? 'happy' : 'plain'; dialGlow = prog(t, b(64), b(64.5)); }
  const winkR = t > b(70) && t < b(71.3) ? 1 : 0;
  return { pos, st: { ...st, mood, look, tilt, armL, armR, squash, dialGlow, winkR } };
}

// ---------- the world ----------
function world(t) {
  const { pos, st } = hero(t);
  const discR = 380 * pos.s * back(prog(t, b(2), b(3)));
  if (discR > 0) circ(pos.x, pos.y - 230 * pos.s, discR, DISC);

  // 1. the dot bounces in and becomes Bit's left eye
  if (t < b(2) + .02) {
    const p = prog(t, 0, b(2)), ex = HOME.x - 48, ey = HOME.y - 350, hop = Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 320;
    ctx.save(); ctx.translate(lerp(-60, ex, easeOut(p * 1.05)), ey - hop); const sq = hop < 12 ? .18 * (1 - hop / 12) : 0; ctx.scale(1 + sq, 1 - sq); teal(0, 0, 28); ctx.restore();
  }

  // 3. the error chart and its counter (behind Bit's world, right of him)
  chart(t);

  bit(pos.x, pos.y, pos.s, st);

  // 2. Coach Ada shows a cat; Bit guesses "dog?"; wrong
  if (t > S.guess && t < b(15.5)) {
    const e = back(prog(t, S.guess, S.guess + b(1.3))), cx = lerp(W + 260, CARD_AT[0], e), cy = CARD_AT[1];
    card(cx, cy, 1, 'cat', { face: ease(prog(t, b(7.5), b(8.1))) });
    mitten(cx + 125, cy + 150);
    pill('cat', cx, cy + 205, prog(t, b(10.5), b(10.9)), { size: 30, align: 'center', bg: CREAM, id: 'cat label' });
    const bp = prog(t, b(9), b(9.4));
    bubble(HOME.x + 150, HOME.y - 440, 250, 110, bp, 'dog?', { type: prog(t, b(9.1), b(9.7)) });
    if (t > b(10)) stamp(HOME.x + 150 + 250, HOME.y - 440 - 140, 44, false, prog(t, b(10), b(10.25)));
  }

  // 4. practice montage: cards drop in front of Bit, get marked, fall away
  MONTAGE.forEach((c, i) => {
    const next = MONTAGE[i + 1] ? MONTAGE[i + 1].at : MONTAGE_END, d = next - c.at;
    if (t < c.at - .25 || t > next + .45) return;
    const inP = easeOut(prog(t, c.at - .25, c.at)), outP = ease(prog(t, next, next + .45));
    const x = 790 + outP * 60, y = lerp(-240, 520, inP) + outP * 900, rot = (hash2(i, 7) - .5) * .2 + outP * .8;
    card(x, y, .62, c.kind, { rot, mark: c.ok ? 'ok' : 'no', markP: prog(t, c.at + d * .3, c.at + d * .3 + .12) });
  });

  // 5. patterns: the cat again, with what Bit learned lit up and wired to its knobs
  if (t > S.pattern && t < b(43.5)) {
    const e = back(prog(t, S.pattern, S.pattern + b(1.3))), out = ease(prog(t, S.fresh, b(43.5)));
    const cx = lerp(W + 300, 1250, e) + out * 900, cy = 520 - out * 500, cs = 1.45;
    card(cx, cy, cs, 'cat', { rot: out * .6 });
    FEAT.forEach(f => {
      const p = prog(t, f.at, f.at + .45); if (p <= 0 || out > .05) return;
      const fx = cx + f.x * cs, fy = cy + f.y * cs, [dx, dy] = DIALS[f.dial], bx = pos.x + dx * pos.s, by = pos.y + dy * pos.s;
      const mxp = (bx + fx) / 2, myp = Math.min(by, fy) - 180, n = 40, k = Math.round(n * easeOut(p));
      const pts = []; for (let j = 0; j <= k; j++) { const u = j / n; pts.push([(1 - u) ** 2 * bx + 2 * (1 - u) * u * mxp + u * u * fx, (1 - u) ** 2 * by + 2 * (1 - u) * u * myp + u * u * fy]); }
      if (pts.length > 1) { ctx.setLineDash([2, 12]); strokeLine(pts, TEAL, 5); ctx.setLineDash([]); }
      const last = pts[pts.length - 1]; teal(last[0], last[1], 9);
      if (p > .8) { ctx.strokeStyle = TEAL; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(fx, fy, 38 * back(prog(t, f.at + .35, f.at + .7)), 0, 7); ctx.stroke(); }
      pill(f.name, fx + f.lx, fy + f.ly, prog(t, f.at + .4, f.at + .7), { size: 32, align: 'center', id: 'feat ' + f.name });
    });
  }

  // 6. a picture it has never seen: a cat in a hat
  if (t > S.fresh && t < b(53.2)) {
    const e = back(prog(t, S.fresh + .2, S.fresh + b(1.5))), out = ease(prog(t, S.bad, b(53.2)));
    const cx = lerp(W + 300, 1250, e) - out * 0 + out * 900, cy = 520 - out * 500, cs = 1.45;
    card(cx, cy, cs, 'hat', { rot: out * .6, mark: t > b(48) ? 'ok' : null, markP: prog(t, b(48), b(48.25)) });
    pill('NEW', cx - 130 * cs + 20, cy - 160 * cs - 10, prog(t, b(43.3), b(43.7)) * (1 - out), { bg: CORAL, fg: CREAM, size: 26, id: 'new tag' });
    const bx = SIDE.x + 125, by = SIDE.y - 390;
    const thinking = '•••'.slice(0, 1 + Math.floor(((t - b(44.5)) / BEAT) % 3));
    bubble(bx, by, 250, 110, prog(t, b(44.5), b(44.9)) * (1 - out * 3), t < b(48) ? thinking : 'cat!', {});
    confetti(t, b(48), bx + 125, by - 90);
  }

  // 7. bad examples: a blurry cat labelled "dog"
  if (t > S.bad && t < b(63.2)) {
    const e = back(prog(t, S.bad + .3, S.bad + b(1.6))), out = ease(prog(t, S.recap, b(63.2)));
    const cx = lerp(W + 300, 1270, e) + out * 900, cy = 500 - out * 500;
    card(cx, cy, 1.3, 'cat', { blur: 9, rot: -.08 + out * .6 });
    mitten(cx + 160, cy + 190);
    pill('dog', cx, cy + 250, prog(t, b(53.8), b(54.2)) * (1 - out * 3), { size: 32, align: 'center', bg: CORAL, fg: CREAM, id: 'bad label' });
    bubble(SIDE.x + 125, SIDE.y - 390, 170, 110, prog(t, b(54), b(54.4)) * (1 - out * 3), '?', { size: 64 });
  }

  // 8. the loop: guess, nudge, repeat
  if (t > S.recap) {
    const p = ease(prog(t, S.recap + .2, b(64.5)));
    if (p > 0) { ctx.strokeStyle = 'rgba(46,196,182,.35)'; ctx.lineWidth = 6; ctx.setLineDash([3, 16]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(RING.x, RING.y, RING.r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    RECAP.forEach((r, i) => {
      const x = RING.x + Math.cos(r.a) * RING.r, y = RING.y + Math.sin(r.a) * RING.r, q = back(prog(t, r.at, r.at + .4));
      if (q <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(q, q); circ(0, 0, 62, DISC); circ(0, 0, 50, i === 1 ? DEEP : CREAM);
      if (i === 0) { ctx.font = SANS(58); ctx.fillStyle = DEEP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 4); }
      if (i === 1) { const a = -Math.PI / 2 + 1.4 * Math.sin(t * 3); ctx.strokeStyle = TEAL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 30, -Math.PI / 2, a); ctx.stroke(); strokeLine([[0, 0], [Math.cos(a) * 22, Math.sin(a) * 22]], CREAM, 6); circ(0, 0, 6, CREAM); }
      if (i === 2) { ctx.rotate(t * 2.2); ctx.strokeStyle = DEEP; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 26, .3, Math.PI * 1.7); ctx.stroke(); tri(22, -22, 34, -4, 14, -4, DEEP); }
      ctx.restore();
      claim('icon ' + i, 'keep', x - 62, y - 62, 124, 124);
    });
    const lap = t - b(62.8); if (lap > 0) { const a = -Math.PI / 2 + lap * 1.5; teal(RING.x + Math.cos(a) * RING.r, RING.y + Math.sin(a) * RING.r, 16); }
  }
}
function confetti(t, at, x, y) {                 // a burst that shrinks away (no fade)
  const u = t - at; if (u < 0 || u > 1.6) return;
  for (let i = 0; i < 28; i++) {
    const a = hash2(i, 11) * Math.PI * 2, v = 380 + hash2(i, 12) * 520, px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 520 * u * u;
    const r = (5 + hash2(i, 13) * 7) * (1 - u / 1.6); circ(px, py, r, [TEAL, SUN, CORAL, CREAM][i % 4]);
  }
}
function chart(t) {                              // the mistake, falling as practice piles up
  if (t < b(22.8) || t > b(35)) return;
  const { x, y, w, h } = CHART, sIn = back(prog(t, b(23), b(23.8))), sOut = 1 - ease(prog(t, S.pattern, b(34.9)));
  const p = prog(t, b(23.5), MONTAGE_END), k = sIn * sOut; if (k <= 0) return;
  const px = u => x + u * w, py = v => y + h - v * h;
  ctx.save(); ctx.translate(px(p), py(err(p))); ctx.scale(k, k); ctx.translate(-px(p), -py(err(p)));
  rr(x - 40, y - 40, w + 80, h + 110, 30, DISC);
  strokeLine([[x, y], [x, y + h], [x + w, y + h]], 'rgba(247,241,227,.35)', 3);
  ctx.font = MONO(22, 700); ctx.fillStyle = CORAL; ctx.textBaseline = 'middle'; ctx.fillText('mistakes', x + 16, y + 6);
  ctx.fillStyle = MUTED; ctx.textAlign = 'right'; ctx.fillText('practice →', x + w, y + h + 34);
  const pts = []; for (let j = 0; j <= 90; j++) { const u = p * j / 90; pts.push([px(u), py(err(u))]); }
  if (pts.length > 1) { strokeLine(pts, CORAL, 7); const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, CORAL); g.addColorStop(1, TEAL); strokeLine(pts, g, 7); }
  teal(px(p), py(err(p)), 16);
  const n = Math.round(Math.pow(10, 1 + 5 * ease(p)) / (p > .6 ? 1000 : 1)) * (p > .6 ? 1000 : 1);
  ctx.textAlign = 'left'; ctx.fillStyle = MUTED; ctx.font = MONO(22, 700); ctx.fillText('examples seen', x, y + h + 34);
  ctx.fillStyle = CREAM; ctx.font = MONO(56, 700); ctx.fillText(n.toLocaleString('en-US'), x + 230, y + h + 36);
  ctx.restore();
  if (k > .9) claim('chart', 'keep', x - 40, y - 40, w + 80, h + 110);
}

// ---------- words, in screen space, next to the action ----------
function words(t) {
  kine('Meet *Bit.*', 1040, 470, t, b(2.4), b(5.6), { size: 120 });
  kine('It knows nothing.', 1044, 580, t, b(3.6), b(5.7), { size: 64, col: MUTED });

  pill('STEP 1', 1172, 96, inOut(t, b(6.4), b(13.6)), { id: 'step1' });
  kine('*Guess.*', 1170, 222, t, b(6.6), b(13.4), { size: 96 });

  pill('STEP 2', 120, 140, inOut(t, b(15), b(21.6)), { id: 'step2' });
  kine('Measure the *mistake.*', 118, 250, t, b(15.8), b(21.4), { size: 76 });
  kine('Then nudge the *knobs.*', 120, 360, t, b(17.4), b(21.5), { size: 64, col: CREAM });

  pill('STEP 3', CHART.x, 96, inOut(t, b(23), b(33.6)), { id: 'step3' });
  kine('*Repeat.*', CHART.x, 222, t, b(23.2), b(33.4), { size: 96 });
  kine('Millions of times.', CHART.x, 300, t, b(25), b(33.5), { size: 56, col: MUTED });

  kine('Not memorizing *pictures.*', 820, 140, t, b(35), b(41.4), { size: 72 });
  kine('Learning *patterns.*', 820, 950, t, b(38.6), b(41.5), { size: 72 });

  kine('A picture it has *never seen.*', 820, 140, t, b(42.6), b(47.4), { size: 72 });
  kine('*Right* answer.', 900, 950, t, b(48.6), b(51.5), { size: 96 });

  kine('Bad examples, bad *lessons.*', 760, 140, t, b(52.8), b(61.4), { size: 72 });
  kine('AI is only as good as its *data.*', 760, 990, t, b(56.6), b(61.5), { size: 60, col: CREAM });

  RECAP.forEach(r => { const x = RING.x + Math.cos(r.a) * RING.r + r.dx, y = RING.y + Math.sin(r.a) * RING.r + r.dy + 22; kine(r.word, x, y, t, r.at + .1, DUR + 5, { size: 64, align: r.align }); });
  kine("That's how *AI learns.*", W / 2, 1000, t, b(67), DUR + 5, { size: 76, align: 'center' });
}

function draw(frame) {
  const t = frame / FPS;
  BOIL = 0; LAYOUT = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.drawImage(paper, 0, 0);
  motes(t);
  const shot = SHOTS.find(s => t >= s.from && t < s.to) || SHOTS[SHOTS.length - 1];
  withCamera(shot.cam(t), () => world(t));
  words(t);
  window.LAYOUT = LAYOUT;
}
window.draw = draw; window.FRAMES = FRAMES; window.FPS = FPS;
window.CUES = SHOTS.slice(1).map(s => s.from);
