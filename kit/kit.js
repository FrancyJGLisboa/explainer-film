// ================= explainer-film kit =================
// Parts for Kurzgesagt x 3Blue1Brown films. Loaded after the starter library (math, camera, claim, glow)
// and before the film's scenes.js. Everything is a pure function of t: no Math.random, no Date.

// ---------- fonts ----------
const SANS = (s, w = 800) => `${w} ${s}px "Avenir Next", "Helvetica Neue", Arial, sans-serif`;
const MATH = (s, italic = true) => `${italic ? 'italic ' : ''}400 ${s}px "STIX Two Text", "STIXGeneral", "Times New Roman", serif`;
const MONO = (s, w = 600) => `${w} ${s}px Menlo, ui-monospace, monospace`;

// ---------- checks the qc script reads (window.CHECKS) ----------
const CHECKS = [];
function shows(label, ok, detail = '') {         // assert the picture shows the claim (reality map "test" column)
  if (!ok) CHECKS.push(`shows: "${label}" is not true of what is drawn${detail ? ' (' + detail + ')' : ''}`);
}
function bend(fn, u0, u1, k = .05) {             // end slope / start slope: 1 = straight line, >= 5 reads as "explodes"
  const d = (u1 - u0) * k, s0 = (fn(u0 + d) - fn(u0)) / d, s1 = (fn(u1) - fn(u1 - d)) / d;
  return s0 === 0 ? Infinity : s1 / s0;
}
function fits(label, start, end, lo, hi) {        // assert an action [start, end] happens inside its scene [lo, hi]
  if (start < lo - 1e-6 || end > hi + 1e-6) CHECKS.push(`${label}: runs ${start.toFixed(2)}-${end.toFixed(2)}s, outside its scene ${lo.toFixed(2)}-${hi.toFixed(2)}s`);
}
let HIDE_WORDS = false, HIDE_BACKDROP = false;   // qc toggles these                           // qc sets this to read what is behind the words
const WORD_LOG = new Set();                       // every headline string used (qc checks length)
function claimText(id, x, y, w, h, col, own = false) { claim(id, 'text', x, y, w, h); const L = LAYOUT[LAYOUT.length - 1]; L.col = col; L.own = own; }

// ---------- flat shapes ----------
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 7); ctx.fill(); }
function ell(x, y, rx, ry, rot, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function tri(a, c, d, e, f, g, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a, c); ctx.lineTo(d, e); ctx.lineTo(f, g); ctx.closePath(); ctx.fill(); }
function strokeLine(pts, col, w) { if (pts.length < 2) return; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); ctx.stroke(); }
function thread(x, y, r = 16, col = THREAD) {    // the one shape that runs through the film
  const rgb = rgbOf(col).join(','); glow(x, y, r * 3, rgb, .35); circ(x, y, r, col); circ(x - r * .3, y - r * .3, r * .28, 'rgba(255,255,255,.7)');
}
function motes(t, n = 70) {                       // slow drifting specks: the only background texture
  for (let i = 0; i < n; i++) {
    const x = (hash2(i, 1) * W + t * (6 + hash2(i, 2) * 10)) % W, y = (hash2(i, 3) * H - t * (4 + hash2(i, 4) * 8) + H * 10) % H;
    circ(x, y, 1.2 + hash2(i, 5) * 2.2, `rgba(245,240,230,${.05 + hash2(i, 6) * .09})`);
  }
}

// ---------- words: spring up from a line, leave upward (never a plain fade) ----------
// *word* = THREAD accent, {word|#hex} = any colour (use VAR colours to tie words to objects)
function kine(str, x, y, t, at, out, o = {}) {
  const { size = 72, col = TEXT, align = 'left', w = 800, stagger = .07, id = str } = o;
  WORD_LOG.add(str);
  if (t < at || t > out + 1) return;
  ctx.save(); ctx.font = SANS(size, w); ctx.textBaseline = 'alphabetic';
  const toks = str.split(' ').map(s => { const m = s.match(/^\{(.+)\|(#[0-9a-fA-F]{3,8})\}(.*)$/); return m ? { s: m[1] + m[3], c: m[2] } : { s: s.replace(/\*/g, ''), c: s.includes('*') ? THREAD : col }; });
  const sp = ctx.measureText(' ').width, ws = toks.map(k => ctx.measureText(k.s).width), total = ws.reduce((a, c) => a + c, 0) + sp * (toks.length - 1);
  let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const left = x0;
  ctx.beginPath(); ctx.rect(x0 - 30, y - size * 1.1, total + 60, size * 1.45); ctx.clip();
  toks.forEach((k, i) => {
    const pin = back(prog(t, at + i * stagger, at + i * stagger + .5)), pout = ease(prog(t, out + i * stagger * .6, out + i * stagger * .6 + .4));
    if (!HIDE_WORDS) { ctx.fillStyle = k.c; ctx.fillText(k.s, x0, y + (1 - pin) * size * 1.3 - pout * size * 1.4); }
    x0 += ws[i] + sp;
  });
  ctx.restore();
  if (t > at + .3 && t < out) claimText(id, left, y - size * .95, total, size * 1.2, col);
}
function pill(str, x, y, p, o = {}) {             // small label on its own background; springs open from its centre
  if (p <= 0) return;
  const { bg = THREAD, fg = DEEP, size = 28, font = MONO(size, 700), align = 'left', id = null } = o;
  ctx.save(); ctx.font = font; const w = ctx.measureText(str).width + size * 1.4, h = size * 1.8;
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.translate(x0 + w / 2, y); ctx.scale(back(p), back(p));
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  if (!HIDE_WORDS) { ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(str, 0, 1); }
  ctx.restore();
  if (id && p > .9) claimText(id, x0, y - h / 2, w, h, fg, true);
}
const inOut = (t, a, z, d = .35) => Math.min(prog(t, a, a + d), 1 - prog(t, z - d, z));   // 0..1 open window

// ---------- 3Blue1Brown parts: math as objects ----------
// eq([['A', VAR.yellow], [' = '], ['P', VAR.blue], ['(1 + '], ['r', VAR.green], [')'], ['^n', VAR.red]], x, y, t, at, out)
// '^' raises a part (exponent), '_' lowers it (subscript). Each part springs in; colour ties a symbol to its object.
function eq(parts, x, y, t, at, out, o = {}) {
  const { size = 72, align = 'left', stagger = .09, id = 'eq' } = o;
  if (t < at || t > out + 1) return;
  ctx.save(); ctx.textBaseline = 'alphabetic';
  const P = parts.map(([s, c = TEXT]) => { const sup = s[0] === '^', sub = s[0] === '_', txt = sup || sub ? s.slice(1) : s, sz = sup || sub ? size * .6 : size;
    ctx.font = MATH(sz, /[a-zA-Z]/.test(txt) && txt.length <= 2); return { txt, c, sz, dy: sup ? -size * .42 : sub ? size * .2 : 0, w: ctx.measureText(txt).width, f: ctx.font }; });
  const total = P.reduce((a, p) => a + p.w, 0);
  let x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; const left = x0;
  ctx.beginPath(); ctx.rect(x0 - 30, y - size * 1.3, total + 60, size * 1.7); ctx.clip();
  P.forEach((p, i) => {
    const pin = back(prog(t, at + i * stagger, at + i * stagger + .45)), pout = ease(prog(t, out + i * stagger * .5, out + i * stagger * .5 + .4));
    if (!HIDE_WORDS) { ctx.font = p.f; ctx.fillStyle = p.c; ctx.fillText(p.txt, x0, y + p.dy + (1 - pin) * size * 1.4 - pout * size * 1.5); }
    x0 += p.w;
  });
  ctx.restore();
  if (t > at + .3 && t < out) claimText(id, left, y - size * 1.05, total, size * 1.35, TEXT);
}
function axes(o) {                                // returns mappers + a draw(p) that draws the axes on
  const { x, y, w, h, xmax = 1, ymax = 1, xlabel = '', ylabel = '', col = MUTED, ticks = 0 } = o;
  const X = u => x + u / xmax * w, Y = v => y + h - v / ymax * h;
  return { X, Y, draw(p, lw = 4) {
    if (p <= 0) return;
    const a = easeOut(p);
    strokeLine([[x, y + h], [x + w * a, y + h]], col, lw); strokeLine([[x, y + h], [x, y + h - h * a]], col, lw);
    if (a > .95) { tri(x + w + 16, y + h, x + w - 2, y + h - 9, x + w - 2, y + h + 9, col); tri(x, y - 16, x - 9, y + 2, x + 9, y + 2, col); }
    for (let i = 1; i <= ticks; i++) { const tx = x + w * i / ticks; if (tx < x + w * a) strokeLine([[tx, y + h - 8], [tx, y + h + 8]], col, 3); }
    ctx.save(); ctx.globalAlpha *= prog(p, .6, 1); ctx.font = MATH(38); ctx.fillStyle = col; ctx.textBaseline = 'middle';
    if (!HIDE_WORDS) { ctx.textAlign = 'right'; ctx.fillText(xlabel, x + w, y + h + 42); ctx.textAlign = 'left'; ctx.fillText(ylabel, x + 18, y - 6); }
    ctx.restore();
  } };
}
function plot(ax, fn, u0, u1, p, col = VAR.yellow, lw = 6, n = 160) {   // curve drawn on from left to right
  if (p <= 0) return null;
  const pts = []; for (let i = 0; i <= n * p; i++) { const u = lerp(u0, u1, i / n); pts.push([ax.X(u), ax.Y(fn(u))]); }
  strokeLine(pts, col, lw); return pts[pts.length - 1];
}
function arrow(x0, y0, x1, y1, p = 1, col = TEXT, lw = 6, head = 20) {   // grows from its tail
  if (p <= 0) return;
  const x = lerp(x0, x1, easeOut(p)), y = lerp(y0, y1, easeOut(p)), a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x - x0, y - y0);
  const hx = x - Math.cos(a) * Math.min(head * .8, L), hy = y - Math.sin(a) * Math.min(head * .8, L);
  strokeLine([[x0, y0], [hx, hy]], col, lw);
  tri(x, y, x - Math.cos(a - .45) * head, y - Math.sin(a - .45) * head, x - Math.cos(a + .45) * head, y - Math.sin(a + .45) * head, col);
}
function brace(x0, x1, y, p, label = '', col = TEXT, o = {}) {   // a curly brace under a span, label springs below
  if (p <= 0) return;
  const { size = 40, dir = 1 } = o, m = (x0 + x1) / 2, d = 22 * dir, a = easeOut(p);
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
  const L = lerp(m, x0, a), R = lerp(m, x1, a);
  ctx.moveTo(L, y); ctx.quadraticCurveTo(L, y + d, lerp(L, m, .2), y + d); ctx.lineTo(m - 14, y + d); ctx.quadraticCurveTo(m, y + d, m, y + d * 1.7);
  ctx.quadraticCurveTo(m, y + d, m + 14, y + d); ctx.lineTo(lerp(R, m, .2), y + d); ctx.quadraticCurveTo(R, y + d, R, y); ctx.stroke(); ctx.restore();
  if (label && p > .5) { ctx.save(); ctx.font = MATH(size); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const k = back(prog(p, .5, 1)); ctx.translate(m, y + d * 1.7 + dir * size * .8); ctx.scale(k, k); if (!HIDE_WORDS) ctx.fillText(label, 0, 0); ctx.restore();
    if (p > .95) { ctx.font = MATH(size); const w = ctx.measureText(label).width; claimText('brace ' + label, m - w / 2, y + d * 1.7 + dir * size * .8 - size * .6, w, size * 1.2, col); } }
}
function grid(x, y, w, h, step, p, col = 'rgba(88,196,221,.12)') {   // faint coordinate plane, lines sweep in
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (let gx = x; gx <= x + w + 1; gx += step) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h * easeOut(prog(p, (gx - x) / w * .5, (gx - x) / w * .5 + .5))); ctx.stroke(); }
  for (let gy = y; gy <= y + h + 1; gy += step) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w * easeOut(prog(p, (gy - y) / h * .5, (gy - y) / h * .5 + .5)), gy); ctx.stroke(); }
  ctx.restore();
}
function numberLine(x, y, w, min, max, p, o = {}) {  // ticks + numbers, drawn on
  const { step = 1, col = MUTED, size = 30 } = o; if (p <= 0) return u => x + (u - min) / (max - min) * w;
  const X = u => x + (u - min) / (max - min) * w;
  strokeLine([[x, y], [x + w * easeOut(p), y]], col, 4);
  for (let u = min; u <= max + 1e-9; u += step) { const q = prog(p, (u - min) / (max - min) * .7, (u - min) / (max - min) * .7 + .3); if (q <= 0) continue;
    strokeLine([[X(u), y - 10 * q], [X(u), y + 10 * q]], col, 3);
    if (!HIDE_WORDS) { ctx.font = MATH(size, false); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(+u.toFixed(3)), X(u), y + 20 + (1 - back(q)) * 20); } }
  return X;
}
function bars(x, y, w, h, values, max, p, cols, o = {}) {   // bars that grow, one after another (quantities -> lengths)
  const { gap = .25, stagger = .12 } = o, n = values.length, bw = w / (n + (n - 1) * gap);
  values.forEach((v, i) => { const q = back(prog(p, i * stagger, i * stagger + .5)); if (q <= 0) return;
    const bh = h * v / max * q, bx = x + i * bw * (1 + gap); rr(bx, y + h - bh, bw, bh, Math.min(10, bw / 4), cols[i % cols.length]); });
  return i => [x + i * bw * (1 + gap) + bw / 2, y + h - h * values[i] / max];
}

// ---------- morphs: one shape becomes the next (the "no hard cuts" rule) ----------
function resampleClosed(pts, n = 120) {           // n points evenly spaced along a closed outline
  const P = [...pts, pts[0]], L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const out = [], tot = L[L.length - 1]; let j = 1;
  for (let k = 0; k < n; k++) { const d = tot * k / n; while (L[j] < d) j++; const u = (d - L[j - 1]) / (L[j] - L[j - 1] || 1); out.push([lerp(P[j - 1][0], P[j][0], u), lerp(P[j - 1][1], P[j][1], u)]); }
  return out;
}
const SHAPE = {
  circle: (cx, cy, r, n = 120) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832 - Math.PI / 2) * r, cy + Math.sin(i / n * 6.2832 - Math.PI / 2) * r]),
  rect: (x, y, w, h, n = 120) => resampleClosed([[x + w / 2, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], n),
  star: (cx, cy, r, k = 5, inner = .45, n = 120) => resampleClosed(Array.from({ length: k * 2 }, (_, i) => { const a = i / (k * 2) * 6.2832 - Math.PI / 2, rr2 = i % 2 ? r * inner : r; return [cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2]; }), n),
  poly: (pts, n = 120) => resampleClosed(pts, n),
};
function morph(a, b2, p) { const e = ease(p); return a.map((q, i) => [lerp(q[0], b2[i][0], e), lerp(q[1], b2[i][1], e)]); }
function fillPts(pts, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(q => ctx.lineTo(...q)); ctx.closePath(); ctx.fill(); }
function writeOn(pts, p, col, fillCol = null, lw = 5) {   // 3b1b "draw border, then fill"
  if (p <= 0) return;
  const k = Math.max(2, Math.round(pts.length * clamp(p / .6)));
  if (fillCol && p > .6) { ctx.save(); ctx.globalAlpha *= prog(p, .6, 1); fillPts(pts, fillCol); ctx.restore(); }
  strokeLine(p >= .6 ? [...pts, pts[0]] : pts.slice(0, k), col, lw);
}

// ---------- Kurzgesagt parts: characters and props ----------
// blob: the default character (a round creature). robot: for tech topics. Same state API for both:
// { grow, mood: plain|happy|sad|think, look (-1..1), blink (0..1), tilt, squash, armL, armR, winkR, body, belly }
function blob(x, y, s, st = {}) {
  // state: grow, mood (plain|happy|sad|think|surprised|worried|excited), look (-1..1), blink, tilt, squash,
  // walk (step phase: pass t * 2 for ~2 steps/s; 0 = standing), talk (0..1 mouth open: voiceLevel(t)),
  // armL/armR (0 down .. 2.4 up), waveR (pass t to wave the right arm), winkR, body, belly
  const { grow = 1, mood = 'plain', look = 0, blink = 0, tilt = 0, squash = 0, body = HERO, belly = null, armL = 0, armR = 0, winkR = 0, walk = 0, talk = 0, waveR = false } = st;
  if (grow <= 0) return;
  const stepA = Math.sin(walk * Math.PI), bob = walk ? Math.abs(stepA) * 10 : 0, lean = walk ? .05 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(0, 4, 130 * grow * (1 - bob * .01), 18 * grow, 0, 'rgba(5,10,25,.4)');
  ctx.scale(grow * (1 + squash), grow * (1 - squash));
  ell(-40 + stepA * 14, -8 - Math.max(0, stepA) * 16, 26, 14, 0, tint(body, .7)); ell(40 - stepA * 14, -8 - Math.max(0, -stepA) * 16, 26, 14, 0, tint(body, .7));
  ctx.translate(0, -bob); ctx.rotate(tilt + lean);
  const wav = waveR ? .45 * Math.sin(waveR * 9) : 0;
  const arm = (side, a) => { ctx.save(); ctx.translate(side * 105, -150); ctx.rotate(-side * (.5 + a + (walk ? side * stepA * .3 : 0))); rr(-11, 0, 22, 70, 11, tint(body, .82)); ctx.restore(); };
  arm(-1, armL); arm(1, waveR ? 2.3 + wav : armR);
  ell(0, -150, 120, 145, 0, body);
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -150, 120, 145, 0, 0, 7); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(45, -300, 90, 300); ctx.restore();
  if (belly) ell(0, -95, 70, 60, 0, belly);
  const big = mood === 'surprised' || mood === 'excited' ? 1.18 : 1;
  const eye = (ex, wink) => { ctx.save(); ctx.translate(ex, -190);
    if (mood === 'happy' || wink) { ctx.strokeStyle = DEEP; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 8, 18, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore(); return; }
    ctx.scale(big, big * Math.max(.08, 1 - blink)); circ(0, 0, 30, '#ffffff');
    const lx = look * 9, ly = mood === 'think' ? -9 : mood === 'worried' ? 4 : 0, pr = mood === 'surprised' ? 11 : 15;
    circ(lx, ly + 3, pr, DEEP); circ(lx - 5, ly - 3, 5, '#fff');
    if (mood === 'excited') { ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832, r = i % 2 ? 3 : 8; ctx.lineTo(lx + 6 + Math.cos(a) * r, ly - 4 + Math.sin(a) * r); } ctx.fill(); }
    if (mood === 'sad') { ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-34, -34); ctx.lineTo(34, -34); ctx.lineTo(ex < 0 ? 34 : -34, -8); ctx.closePath(); ctx.fill(); }
    ctx.restore(); };
  eye(-42, 0); eye(42, winkR);
  const brow = { surprised: [-.0, -18], worried: [.35, -4], sad: [.3, 0], think: [-.25, 0], excited: [0, -12] }[mood];
  if (brow) [-1, 1].forEach(sd => { ctx.save(); ctx.translate(sd * 42, -236 + brow[1]); ctx.rotate(sd * brow[0]); rr(-20, -4, 40, 8, 4, tint(body, .55)); ctx.restore(); });
  ctx.fillStyle = DEEP; ctx.strokeStyle = DEEP; ctx.lineWidth = 6; ctx.lineCap = 'round';
  if (talk > .02 || mood === 'surprised') { const o = mood === 'surprised' ? Math.max(.6, talk) : talk; ell(0, -128, 14 + 6 * o, 4 + 18 * o, 0, DEEP); if (o > .3) ell(0, -120 + 6 * o, 8, 4 * o, 0, '#e8746a'); }
  else { ctx.beginPath();
    if (mood === 'sad') ctx.arc(0, -115, 16, Math.PI * 1.2, Math.PI * 1.8);
    else if (mood === 'think') { ctx.moveTo(-10, -128); ctx.lineTo(10, -128); }
    else if (mood === 'worried') { ctx.moveTo(-16, -126); ctx.quadraticCurveTo(-8, -134, 0, -126); ctx.quadraticCurveTo(8, -118, 16, -126); }
    else if (mood === 'excited') { ctx.arc(0, -142, 24, Math.PI * .1, Math.PI * .9); ctx.fill(); }
    else ctx.arc(0, -140, mood === 'happy' ? 22 : 14, Math.PI * .2, Math.PI * .8);
    ctx.stroke(); }
  ell(-78, -140, 15, 9, 0, 'rgba(252,98,85,.3)'); ell(78, -140, 15, 9, 0, 'rgba(252,98,85,.3)');
  ctx.restore();
  claim('hero', 'keep', x - 130 * s, y - 300 * s, 260 * s, 300 * s);
}
function crowd(x, y, w, h, n, t, o = {}) {        // n small creatures in a loose grid; `mark` of them in another colour (a true proportion)
  const { mark = 0, markCol = WRONG, cols = ['#6f82ad'], s = null, p = 1, mood = 'plain', seed = 7 } = o;
  const cw = Math.ceil(Math.sqrt(n * w / h)), ch = Math.ceil(n / cw), gx = w / cw, gy = h / ch, sc = s ?? Math.min(gx / 300, gy / 330) * .9;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b2) => hash2(a, seed) - hash2(b2, seed));   // which ones are marked: scattered, not a block
  const marked = new Set(order.slice(0, mark));
  for (let i = 0; i < n; i++) { const q = back(prog(p, i / n * .6, i / n * .6 + .4)); if (q <= 0) continue;
    const cx = x + (i % cw + .5) * gx + (hash2(i, seed + 1) - .5) * gx * .25, cy = y + (Math.floor(i / cw) + 1) * gy - (hash2(i, seed + 2)) * gy * .1;
    blob(cx, cy, sc * q, { body: marked.has(i) ? markCol : cols[i % cols.length], mood, blink: blinkAt(t + hash2(i, 3) * 9), look: Math.sin(t + i) * .5, squash: .03 * Math.sin(t * 4 + i) }); }
  LAYOUT = LAYOUT.filter(L => L.id !== 'hero' || L.w > 200);      // the crowd's members don't claim layout space individually
  claim('crowd', 'keep', x, y, w, h);
}
const DIALS = [[-48, -132], [0, -132], [48, -132], [-24, -88], [24, -88]];
function robot(x, y, s, st = {}) {                // Bit: screen face, chest panel with a meter and 5 dials (weights, knobs, settings)
  const { grow = 1, eyeR = 1, blink = 0, mood = 'plain', tilt = 0, look = 0, dials = [0, 0, 0, 0, 0], meter = 0, dialGlow = 0, armL = 0, armR = 0, squash = 0, antenna = 0, winkR = 0, body = HERO } = st;
  if (grow <= 0) return;
  const bodyD = tint(body, .9);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(0, 4, 150 * grow, 20 * grow, 0, 'rgba(5,10,25,.4)');
  ctx.translate(-48, -345); ctx.scale(grow, grow); ctx.translate(48, 345);
  ctx.scale(1 + squash, 1 - squash);
  rr(-58, -45, 32, 45, 10, bodyD); rr(26, -45, 32, 45, 10, bodyD); ell(-44, -2, 30, 12, 0, DEEP); ell(44, -2, 30, 12, 0, DEEP);
  const arm = (side, a) => { ctx.save(); ctx.translate(side * 100, -185); ctx.rotate(-side * (.22 + a)); rr(-12, 0, 24, 88, 12, bodyD); circ(0, 94, 19, body); ctx.restore(); };
  arm(-1, armL); arm(1, armR);
  rr(-108, -215, 216, 178, 44, body);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-108, -215, 216, 178, 44); ctx.clip(); ctx.fillStyle = 'rgba(160,90,20,.16)'; ctx.fillRect(40, -220, 80, 190); ctx.restore();
  rr(-80, -195, 160, 138, 22, DEEP);
  rr(-64, -181, 128, 14, 7, '#22335a'); if (meter > .005) rr(-64, -181, 128 * clamp(meter), 14, 7, WRONG);
  DIALS.forEach(([dx, dy], i) => { const v = dials[i] || 0, a = -Math.PI / 2 + v * 2.3;
    circ(dx, dy, 19, '#22335a'); if (dialGlow > 0) glow(dx, dy, 34, rgbOf(THREAD).join(','), .45 * dialGlow);
    ctx.strokeStyle = THREAD; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(dx, dy, 19, -Math.PI / 2, a, a < -Math.PI / 2); ctx.stroke();
    strokeLine([[dx, dy], [dx + Math.cos(a) * 13, dy + Math.sin(a) * 13]], TEXT, 4); circ(dx, dy, 4, TEXT); });
  rr(-22, -238, 44, 28, 8, bodyD);
  ctx.translate(0, -238); ctx.rotate(tilt); ctx.translate(0, 238);
  ctx.save(); ctx.translate(0, -452); ctx.rotate(antenna * Math.sin(antenna * 30) * .25); strokeLine([[0, 0], [0, -58]], bodyD, 8); thread(0, -70, 16); ctx.restore();
  rr(-142, -458, 284, 224, 62, body);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-142, -458, 284, 224, 62); ctx.clip(); ctx.fillStyle = 'rgba(160,90,20,.16)'; ctx.fillRect(70, -460, 90, 230); ctx.restore();
  rr(-114, -428, 228, 166, 40, DEEP);
  const eye = (ex, open, wink) => { if (open <= 0) return; ctx.save(); ctx.translate(ex, -350); ctx.scale(open, open);
    if (mood === 'happy' || wink > .5) { ctx.strokeStyle = THREAD; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 10, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore(); return; }
    ctx.scale(1, Math.max(.08, 1 - blink)); glow(0, 0, 70, rgbOf(THREAD).join(','), .25); circ(0, 0, 28, THREAD);
    const lx = look * 10, ly = mood === 'think' ? -9 : 0; circ(lx, ly, 13, DEEP); circ(lx - 5, ly - 6, 5, TEXT);
    if (mood === 'sad') { ctx.fillStyle = DEEP; ctx.beginPath(); ctx.moveTo(-36, -34); ctx.lineTo(36, -34); ctx.lineTo(ex < 0 ? 36 : -36, -4); ctx.closePath(); ctx.fill(); }
    ctx.restore(); };
  eye(-48, 1, 0); eye(48, eyeR, winkR);
  ctx.strokeStyle = THREAD; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
  if (st.talk > .02) { ell(0, -290, 16 + 6 * st.talk, 3 + 16 * st.talk, 0, THREAD); ctx.beginPath(); }
  else if (mood === 'sad') ctx.arc(0, -282, 16, Math.PI * 1.2, Math.PI * 1.8); else if (mood === 'think') { ctx.moveTo(-10, -292); ctx.lineTo(10, -292); } else ctx.arc(0, -305, mood === 'happy' ? 22 : 15, Math.PI * .2, Math.PI * .8);
  ctx.stroke();
  ell(-92, -300, 16, 10, 0, 'rgba(252,98,85,.35)'); ell(92, -300, 16, 10, 0, 'rgba(252,98,85,.35)');
  ctx.restore();
  claim('hero', 'keep', x - 150 * s, y - 530 * s, 300 * s, 530 * s);
}
function blinkAt(t, times = [1.3, 5.2, 12.4, 19, 27.3, 33.7, 40.2]) { const k = times.find(c => t > c && t < c + .16); return k ? Math.sin((t - k) / .16 * Math.PI) : 0; }
function card(x, y, s, pic, o = {}) {             // an example / document / photo card; pic() draws in a 260x320 box centred on 0,0
  const { face = 1, rot = 0, blur = 0, mark = null, markP = 0, back: backCol = THREAD } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const fx = Math.max(.02, Math.abs(Math.cos(Math.PI * (1 - face))));
  ctx.save(); ctx.scale(fx, 1); rr(-114, -142, 260, 320, 26, 'rgba(5,10,25,.35)');
  if (face >= .5) { rr(-130, -160, 260, 320, 26, CARD); ctx.save(); ctx.beginPath(); ctx.roundRect(-130, -160, 260, 320, 26); ctx.clip(); if (blur) { ctx.filter = `blur(${blur}px) saturate(.4)`; ctx.rotate(.35); } pic && pic(); ctx.restore(); }
  else { rr(-130, -160, 260, 320, 26, backCol); for (let i = 0; i < 5; i++) for (let j = 0; j < 6; j++) circ(-96 + i * 48, -125 + j * 50, 4, 'rgba(12,19,38,.18)');
    ctx.font = SANS(150); ctx.fillStyle = DEEP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 8); }
  ctx.restore();
  if (mark) stamp(98, -128, 40, mark === 'ok', markP);
  ctx.restore();
}
function stamp(x, y, r, ok, p) {                  // ✓ / ✗ lands like a rubber stamp
  if (p <= 0) return;
  const k = lerp(1.7, 1, easeOut(p)); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(ok ? -.12 : .12);
  circ(0, 0, r, ok ? THREAD : WRONG);
  if (ok) strokeLine([[-r * .42, 0], [-r * .1, r * .32], [r * .45, -r * .34]], DEEP, r * .2);
  else { strokeLine([[-r * .35, -r * .35], [r * .35, r * .35]], TEXT, r * .2); strokeLine([[r * .35, -r * .35], [-r * .35, r * .35]], TEXT, r * .2); }
  ctx.restore();
}
function glove(x, y, rot = -.5) {                 // a helper's hand that holds things up
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  rr(26, -26, 50, 52, 12, THREAD); ell(0, 0, 50, 42, 0, TEXT); [-24, -6, 12].forEach(dy => ell(-40, dy, 22, 11, 0, TEXT));
  ctx.strokeStyle = 'rgba(12,19,38,.25)'; ctx.lineWidth = 3; [-15, 3].forEach(dy => { ctx.beginPath(); ctx.moveTo(-58, dy); ctx.lineTo(-30, dy); ctx.stroke(); });
  ell(-10, -44, 16, 26, -.7, TEXT); ctx.restore();
}
function bubble(x, y, w, h, p, txt, o = {}) {     // speech bubble growing from its tail tip (x, y)
  if (p <= 0) return;
  const { col = TEXT, fg = DEEP, size = 52, type = 1 } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(back(p), back(p));
  tri(0, 0, 18, -46, 60, -40, col); rr(0, -h - 30, w, h, h / 2, col);
  if (!HIDE_WORDS) { ctx.font = SANS(size); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt.slice(0, Math.round(txt.length * clamp(type))), w / 2, -h / 2 - 28); }
  ctx.restore();
  if (p > .9) claim('bubble', 'keep', x, y - h - 30, w, h + 30);
}
function confetti(t, at, x, y, cols = [THREAD, HERO, WRONG, TEXT]) {   // a burst that shrinks away
  const u = t - at; if (u < 0 || u > 1.6) return;
  for (let i = 0; i < 28; i++) { const a = hash2(i, 11) * 6.2832, v = 380 + hash2(i, 12) * 520;
    circ(x + Math.cos(a) * v * u, y + Math.sin(a) * v * u + 520 * u * u, (5 + hash2(i, 13) * 7) * (1 - u / 1.6), cols[i % cols.length]); }
}
function counter(n) { return Math.round(n).toLocaleString('en-US'); }
function pathAlong(pts, u) {                      // point at fraction u along a polyline (for a dot that travels a route)
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const d = L[L.length - 1] * clamp(u); let j = 1; while (j < L.length - 1 && L[j] < d) j++;
  const k = (d - L[j - 1]) / (L[j] - L[j - 1] || 1); return [lerp(pts[j - 1][0], pts[j][0], k), lerp(pts[j - 1][1], pts[j][1], k)];
}

// ---------- storyboard helpers ----------
// scenes(['meet', 6], ['guess', 8], ...) -> { meet: {from, to}, guess: {...} } in seconds, on the beat grid
function scenes(...list) { const out = {}; let at = 0; for (const [name, beats] of list) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) CHECKS.push(`scene name "${name}": use letters, digits and _ only (it becomes SC.${name})`); out[name] = { from: b(at), to: b(at + beats), beats: [at, at + beats] }; at += beats; } out._beats = at; return out; }

// ---------- narration (voice/timing.json from film.sh voice; null when the film is music only) ----------
// Lines play in order inside their scene: the first starts `delay` beats after the scene starts, each next one `delay` beats after the last ends.
function narrationPlan() {
  if (!NARRATION) return [];
  const plan = [], end = {};
  for (const ln of NARRATION.lines) {
    const sc = SC[ln.scene]; if (!sc) { CHECKS.push(`narration: line "${ln.text.slice(0, 30)}..." names scene "${ln.scene}", which does not exist`); continue; }
    const at = (end[ln.scene] ?? sc.from) + b(ln.delay ?? .5); end[ln.scene] = at + ln.dur;
    plan.push({ ...ln, at, to: at + ln.dur });
  }
  return plan;
}
let VO = [];                                      // filled by finish(): [{file, scene, text, at, to}]
function said(scene, i = 0) {                     // time visuals and words to the voice: said('hook').at / .to
  const l = VO.filter(v => v.scene === scene)[i]; return l || { at: SC[scene]?.from ?? 0, to: SC[scene]?.to ?? 0 };
}
function voiceLevel(t) {                          // 0..1 loudness of the narration right now (real envelope, for lip-sync: talk: voiceLevel(t))
  const v = VO.find(l => t >= l.at && t <= l.to); if (!v || !v.env) return 0;
  const i = (t - v.at) * 30, a = v.env[Math.floor(i)] ?? 0, c = v.env[Math.floor(i) + 1] ?? 0; return lerp(a, c, i % 1);
}
function speaking(t) { return VO.some(v => t >= v.at && t <= v.to); }   // e.g. a character's mouth moves while this is true

// ---------- frame ----------
function frameAt(frame) {
  const t = frame / FPS;
  BOIL = 0; LAYOUT = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.drawImage(paper, 0, 0);
  const shot = SHOTS.find(s => t >= s.from && t < s.to) || SHOTS[SHOTS.length - 1], cam = shot.cam(t);
  if (HIDE_BACKDROP) {} else if (typeof backdrop === 'function') backdrop(t, cam); else motes(t);
  withCamera(cam, () => world(t));
  if (LOOK.grain !== 0 && !HIDE_BACKDROP) grain(LOOK.grain ?? .06);
  words(t);
  window.LAYOUT = LAYOUT;
}
function finish() {                               // call once at the end of scenes.js
  VO = narrationPlan();
  VO.forEach(v => { const sc = SC[v.scene]; if (v.to > sc.to - .1) CHECKS.push(`narration: a "${v.scene}" line ends at ${v.to.toFixed(2)}s, after its scene ends at ${sc.to.toFixed(2)}s; give "${v.scene}" ${Math.ceil((v.to - sc.to + .35) / BEAT)} more beats`); });
  window.NARRATION_PLAN = VO.map(v => ({ file: v.file, at: v.at }));
  if (Math.abs(SC._beats * BEAT - DUR) > .01) CHECKS.push(`storyboard is ${SC._beats} beats = ${(SC._beats * BEAT).toFixed(2)}s but DUR = ${DUR}s`);
  const bars = Math.round(DUR / (4 * BEAT)); let edge = 0;   // music must cover every bar, in order (1 bar = 4 beats)
  SECTIONS.forEach(([a, z]) => { if (a !== edge) CHECKS.push(`SECTIONS: bar ${edge} to ${a} has no music (sections must be contiguous from bar 0)`); edge = z; });
  if (edge !== bars) CHECKS.push(`SECTIONS end at bar ${edge} but the film has ${bars} bars (DUR / (4 x BEAT))`);
  let sEdge = 0; SHOTS.forEach(s => { if (Math.abs(s.from - sEdge) > 1e-6) CHECKS.push(`SHOTS: gap or overlap at ${sEdge.toFixed(2)}s`); sEdge = s.to; });
  if (sEdge < DUR - 1e-6) CHECKS.push(`SHOTS end at ${sEdge.toFixed(2)}s, before DUR`);
  EVENTS.forEach(([at, name]) => { if (at < 0 || at > DUR) CHECKS.push(`sound "${name}" at ${at.toFixed(2)}s is outside the film`); });
  window.draw = frameAt; window.FRAMES = FRAMES; window.FPS = FPS;
  window.CUES = SHOTS.slice(1).map(s => s.from);
  window.CHECKS = CHECKS; window.getWords = () => [...WORD_LOG];
  window.setHideWords = v => { HIDE_WORDS = v; }; window.setHideBackdrop = v => { HIDE_BACKDROP = v; }; window.BG_HEX = BG;
  window.SCORE = ac => buildGroove(ac, { dur: DUR, bpm: BPM, sections: SECTIONS, events: EVENTS, ...MUSIC });
}
