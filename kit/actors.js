// ================= explainer-film actors: characters that stand for real actors, and the links between them =================
// A character is drawn with actor(name, x, y, s, state) and returns its anchors (hands, head, top), so the
// interaction verbs can connect characters: give, trade, say, walkTo. Each verb animates a real causal link:
// an object travels from one hand to the other; it never appears from nowhere.
// The kit ships one plain figure ('person'). A private cast (a named character set) registers more bodies with
// registerActor(); build.sh loads it from ~/.config/explainer-film/cast/cast.js when present.
// Conservation (film.sh check): the same item (same description, or same `id`) drawn twice in one frame fails: chain verbs with
// { after: false } on the first and { before: false } on the next. Two genuinely different identical items need different ids.
// A guide dot (a travelling thread with a face) pushes { kind: 'actor', guide: true }: it needs no Cast row and does not count toward the 3.
// Rules (film.sh check): every character drawn must be listed in the brief's "## Cast" table (character -> the
// real actor it stands for); at most 3 characters on screen at once; a character's colour may not match a
// VAR colour (colours mean quantities); scale at most 1.3 (the explanation, not the cast, fills the frame).

const ACTORS = {};
function registerActor(name, spec) { ACTORS[name] = spec; }

// the plain figure: a rounded capsule person, recoloured per role with st.body
registerActor('person', {
  col: '#9aa7c7', h: 260, bodyW: 150, eye: { y: -205, dx: 26, r: 20 }, mouthY: -165, arm: { x: 70, y: -150, len: 66, w: 20 }, top: -262, headW: 120, chestY: -120,
  path: () => { ctx.beginPath(); ctx.roundRect(-75, -262, 150, 252, 75); },
});

// role props: a costume on top of any body (who they are in this film), drawn relative to the body's top and chest
const ROLES = {
  farmer:    (S) => { ell(0, S.top + 6, S.headW * .95, 16, 0, '#d8b46a'); rr(-S.headW * .42, S.top - 44, S.headW * .84, 50, 18, '#e2c27c'); rr(-S.headW * .42, S.top - 4, S.headW * .84, 10, 4, '#a0522d'); },
  trader:    (S) => { ctx.save(); ctx.strokeStyle = '#2b2f3a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, S.top + 34, S.headW * .52, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.restore();
                      rr(S.headW * .44, S.top + 22, 18, 34, 8, '#2b2f3a'); strokeLine([[S.headW * .5, S.top + 54], [S.headW * .2, S.top + 88]], '#2b2f3a', 5); circ(S.headW * .2, S.top + 88, 7, '#2b2f3a'); },
  scientist: (S) => { rr(-S.headW * .5, S.top + 18, S.headW, 14, 7, '#2b2f3a'); [-1, 1].forEach(k => circ(k * S.headW * .2, S.top + 25, 20, '#bfe6ff', ['#2b2f3a', 6])); },
  doctor:    (S) => { rr(-S.headW * .5, S.top + 20, S.headW, 12, 6, '#e9edf2'); circ(0, S.top + 26, 22, '#dfe7ef', ['#8a96a8', 5]); circ(0, S.top + 26, 8, '#8a96a8'); },
  worker:    (S) => { ctx.save(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.arc(0, S.top + 8, S.headW * .46, Math.PI, 0); ctx.fill(); ctx.restore(); rr(-S.headW * .6, S.top + 2, S.headW * 1.2, 14, 7, '#e0ad1c'); rr(-6, S.top - S.headW * .44, 12, S.headW * .4, 6, '#e0ad1c'); },
  official:  (S) => { ctx.save(); ctx.beginPath(); ctx.moveTo(-S.bodyW * .45, S.chestY - 50); ctx.lineTo(S.bodyW * .45, S.chestY + 60); ctx.lineWidth = 22; ctx.strokeStyle = '#7a2e3a'; ctx.stroke(); ctx.restore(); star5(S.bodyW * .12, S.chestY + 6, 16, '#e8c35a'); },
  banker:    (S) => { tri(0, S.chestY - 40, -24, S.chestY - 56, -24, S.chestY - 24, '#2b2f3a'); tri(0, S.chestY - 40, 24, S.chestY - 56, 24, S.chestY - 24, '#2b2f3a'); circ(0, S.chestY - 40, 7, '#2b2f3a'); },
  seller:    (S) => { rr(-S.bodyW * .34, S.chestY - 10, S.bodyW * .68, 100, 14, '#f3efe6'); strokeLine([[-S.bodyW * .3, S.chestY - 8], [0, S.chestY - 60], [S.bodyW * .3, S.chestY - 8]], '#f3efe6', 6); },
  student:   (S) => { tri(-S.headW * .62, S.top + 2, S.headW * .62, S.top + 2, 0, S.top - 30, '#2b2f3a'); rr(-S.headW * .32, S.top, S.headW * .64, 22, 6, '#2b2f3a'); strokeLine([[S.headW * .45, S.top - 4], [S.headW * .5, S.top + 40]], '#e8c35a', 4); },
};
function star5(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.fill(); }

// state: t (for idle mannerisms), mood (plain|happy|sad|think|surprised|worried|excited), look (-1..1), blink, talk (0..1),
// walk (step phase), face (1 right, -1 left), armL/armR (0 down .. 2.4 up), hold ('L'|'R': arm forward to carry or hand over),
// pointAt ([x, y] world point: the front arm points at it), waveR (t), role (ROLES key), body (colour override), grow (0..1 pop-in)
function actor(name, x, y, s, st = {}) {
  const S = ACTORS[name];
  if (!S) { if (!CHECKS.some(c => c.includes(`actor "${name}"`))) CHECKS.push(`actor "${name}" is not in the cast (known: ${Object.keys(ACTORS).join(', ')})`); return null; }
  const { t = 0, mood = 'plain', look = 0, blink = 0, talk = 0, walk = 0, face = 1, armL = 0, armR = 0, hold = null, pointAt = null, waveR = false, role = null, body = S.col, grow = 1, tilt = 0 } = st;
  if (grow <= 0) return null;
  const idle = S.idle ? S.idle(t, st) : {}, stepA = Math.sin(walk * Math.PI), bob = (walk ? Math.abs(stepA) * 10 : 0) + (idle.bob || 0);
  const A = S.arm, pivot = side => [side * A.x, A.y];
  // arm angles (local, facing right): a = 0 hangs, ~1.07 horizontal, 2.4 up
  let aL = armL, aR = armR;
  if (hold === 'R' || hold === true) aR = Math.max(aR, 1.0); if (hold === 'L') aL = Math.max(aL, 1.0);
  if (pointAt) { const [px, py] = pivot(1), wx = x + face * s * grow * px, wy = y + s * grow * (py - bob), dx = (pointAt[0] - wx) * face, dy = pointAt[1] - wy; aR = -Math.atan2(-dx, dy) - .5; }
  if (waveR) aR = 2.3 + .45 * Math.sin(waveR * 9);
  if (S.pose) { const p2 = S.pose(t, st, aL, aR); aL = p2[0]; aR = p2[1]; }
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  ell(0, 4, S.bodyW * .8 * grow, 16 * grow, 0, 'rgba(5,10,25,.3)');
  ctx.scale(grow, grow);
  ell(-S.bodyW * .26 + stepA * 14, -8 - Math.max(0, stepA) * 16, 24, 13, 0, tint(body, .66)); ell(S.bodyW * .26 - stepA * 14, -8 - Math.max(0, -stepA) * 16, 24, 13, 0, tint(body, .66));
  ctx.translate(0, -bob); ctx.rotate(tilt + (idle.tilt || 0) + (walk ? .05 : 0)); ctx.scale(idle.sx || 1, idle.sy || 1);
  const arm = (side, a) => { ctx.save(); ctx.translate(...pivot(side)); ctx.rotate(-side * (.5 + a + (walk ? side * stepA * .3 : 0))); rr(-A.w / 2, 0, A.w, A.len, A.w / 2, tint(body, .8)); circ(0, A.len, A.w * .62, tint(body, .8)); ctx.restore(); };
  arm(-1, aL);
  if (S.back) S.back(t, st, body);                                  // things behind the body (hair, tails)
  S.path(t, st); ctx.fillStyle = body; ctx.fill();
  ctx.save(); S.path(t, st); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(S.bodyW * .22, -S.h - 60, S.bodyW, S.h + 60); ctx.restore();   // flat Kurzgesagt shade on the far side
  if (S.under) S.under(t, st, body);
  actorFace(S, { mood, look, blink, talk, body });
  if (S.feature) S.feature(t, st, body);
  if (role && ROLES[role]) ROLES[role](S); else if (role && !CHECKS.some(c => c.includes(`role "${role}"`))) CHECKS.push(`role "${role}" does not exist (roles: ${Object.keys(ROLES).join(', ')})`);
  arm(1, aR);
  ctx.restore();
  // anchors in world coordinates (the hand at the end of each arm)
  const handAt = (side, a) => { const th = -side * (.5 + a), [px, py] = pivot(side), lx = px - A.len * Math.sin(th), ly = py + A.len * Math.cos(th); return [x + face * s * grow * lx, y + s * grow * (ly - bob)]; };
  const out = { name, x, y, s, face, handR: handAt(1, aR), handL: handAt(-1, aL), head: [x, y + s * grow * (S.eye.y - bob)], top: [x, y + s * grow * (S.top - bob)] };
  out.hand = out.handR;
  LAYOUT.push({ kind: 'actor', id: name, x: x - S.bodyW * s / 2, y: y + S.top * s, w: S.bodyW * s, h: -S.top * s, s, col: body });
  return out;
}
function actorFace(S, { mood, look, blink, talk, body }) {
  const E = S.eye, big = mood === 'surprised' || mood === 'excited' ? 1.15 : 1;
  const eye = (side) => { const r = E.r * (side > 0 && E.rR ? E.rR / E.r : 1); ctx.save(); ctx.translate(side * E.dx, E.y);
    if (mood === 'happy') { ctx.strokeStyle = DEEP; ctx.lineWidth = r * .3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, r * .3, r * .6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore(); return; }
    ctx.scale(big, big * Math.max(.08, 1 - blink)); circ(0, 0, r, '#ffffff');
    const lx = look * r * .3, ly = mood === 'think' ? -r * .3 : mood === 'worried' ? r * .15 : 0, pr = r * (mood === 'surprised' ? .36 : .5);
    circ(lx, ly + r * .1, pr, DEEP); circ(lx - r * .17, ly - r * .1, r * .17, '#fff');
    const lid = E.lid && !(mood === 'surprised' || mood === 'excited') ? E.lid : mood === 'sad' ? .45 : 0;   // a calm or sad lid over the top of the eye
    if (lid) { ctx.fillStyle = body; ctx.fillRect(-r - 2, -r - 2, 2 * r + 4, (2 * r + 4) * lid); }
    ctx.restore(); };
  eye(-1); eye(1);
  const brow = { surprised: [0, -.6], worried: [.35, -.15], sad: [.3, 0], think: [0, 0], excited: [0, -.4] }[mood] || (S.brows ? [0, 0] : null);
  if (brow) [-1, 1].forEach(sd => { const up = mood === 'think' && sd > 0 ? -.5 : 0; ctx.save(); ctx.translate(sd * E.dx, E.y - E.r * 1.45 + (brow[1] + up) * E.r); ctx.rotate(sd * brow[0] + (up ? -.15 : 0)); rr(-E.r * .7, -E.r * (S.brows || .14), E.r * 1.4, E.r * (S.brows || .14) * 2, E.r * .14, tint(body, .5)); ctx.restore(); });   // think: one brow raised
  const my = S.mouthY; ctx.fillStyle = DEEP; ctx.strokeStyle = DEEP; ctx.lineWidth = 6; ctx.lineCap = 'round';
  if (talk > .02 || mood === 'surprised') { const o = mood === 'surprised' ? Math.max(.6, talk) : talk; ell(0, my, 12 + 6 * o, 3 + 15 * o, 0, DEEP); }
  else { ctx.beginPath();
    if (mood === 'sad') ctx.arc(0, my + 14, 14, Math.PI * 1.2, Math.PI * 1.8);
    else if (mood === 'think') { ctx.moveTo(-9, my); ctx.lineTo(9, my); }
    else if (mood === 'worried') { ctx.moveTo(-14, my); ctx.quadraticCurveTo(-7, my - 7, 0, my); ctx.quadraticCurveTo(7, my + 7, 14, my); }
    else if (mood === 'excited') { ctx.arc(0, my - 12, 20, Math.PI * .1, Math.PI * .9); ctx.fill(); }
    else ctx.arc(0, my - 12, mood === 'happy' ? 18 : 13, Math.PI * .25, Math.PI * .75);
    ctx.stroke(); }
}

// ---------- things that change hands (colour = the entity's VAR colour) ----------
const ITEM = {
  crate: (x, y, s, col = VAR.gold) => { rr(x - 26 * s, y - 20 * s, 52 * s, 40 * s, 6 * s, col); strokeLine([[x - 26 * s, y], [x + 26 * s, y]], tint(col, .7), 3 * s); },
  coin:  (x, y, s, col = VAR.yellow) => { circ(x, y, 18 * s, col); circ(x, y, 11 * s, tint(col, .85)); },
  cash:  (x, y, s, col = VAR.green) => { rr(x - 30 * s, y - 16 * s, 60 * s, 32 * s, 5 * s, col); circ(x, y, 8 * s, tint(col, .75)); },
  doc:   (x, y, s, col = CARD) => { rr(x - 20 * s, y - 26 * s, 40 * s, 52 * s, 4 * s, col); [-12, -2, 8].forEach(dy => strokeLine([[x - 12 * s, y + dy * s], [x + 12 * s, y + dy * s]], MUTED, 3 * s)); },
  box:   (x, y, s, col = VAR.blue) => { rr(x - 24 * s, y - 24 * s, 48 * s, 48 * s, 8 * s, col); },
  drop:  (x, y, s, col = VAR.blue) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 26 * s); ctx.quadraticCurveTo(x + 22 * s, y, x, y + 16 * s); ctx.quadraticCurveTo(x - 22 * s, y, x, y - 26 * s); ctx.fill(); },
};
function drawItem(it, x, y, s) { LAYOUT.push({ kind: 'item', id: typeof it === 'function' ? it.name || 'item' : (it.id || JSON.stringify(it)), x, y, w: 1, h: 1 });   // check: one thing, one place per frame
  if (typeof it === 'function') return it(x, y, s); const n = it.n || 1; for (let i = 0; i < n; i++) ITEM[it.kind](x + (i - (n - 1) / 2) * 20 * s, y - i * 4 * s, s * (it.size || 1), it.col); }
const nearHand = (a, b) => { const tx = (b.head || b.hand)[0]; return Math.abs(a.handR[0] - tx) <= Math.abs(a.handL[0] - tx) ? a.handR : a.handL; };   // the hand facing the partner
const arcPt = (a, b, p, lift) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p) - Math.sin(p * Math.PI) * lift];

// give(a, b, item, p, o): item travels from a's hand to b's hand (p 0..1). Before 0 it rests in a's hand; after 1 it rests in b's,
// unless o.after === false: set that when the next verb (a later give or trade) carries the same item on, so it is never drawn twice.
// item = { kind: 'crate'|'coin'|'cash'|'doc'|'box'|'drop', col, n, size } or a draw function (x, y, s).
function give(a, b, it, p, o = {}) {
  if (!a || !b || (p >= 1 && o.after === false) || (p <= 0 && o.before === false)) return;
  const from = nearHand(a, b), to = nearHand(b, a);
  const q = ease(clamp(p)), [x, y] = arcPt(from, to, q, (o.lift ?? 90) * a.s);
  drawItem(it, x, y, (o.size || 1) * (a.s + b.s) / 2);
  LAYOUT.push({ kind: 'link', id: `give ${a.name}->${b.name}`, from: a.name, to: b.name, p: clamp(p) });
}
// trade(a, b, goods, money, p, o): goods travel a -> b over the top while money travels b -> a underneath, at the same time.
// o.before / o.after: false hides both at rest; 'money' or 'goods' keeps only that one (e.g. before: 'money' when the goods arrive by an earlier give)
function trade(a, b, goods, money, p, o = {}) {
  if (!a || !b) return; const q = ease(clamp(p)), ha = nearHand(a, b), hb = nearHand(b, a);
  const rest = p <= 0 ? o.before : p >= 1 ? o.after : true, show = w => rest === undefined || rest === true || rest === w;   // false: neither; 'goods' / 'money': only that one
  const [gx, gy] = arcPt(ha, hb, q, 110 * a.s), [mx, my] = arcPt(hb, ha, q, -60 * a.s);
  if (show('goods')) drawItem(goods, gx, gy, a.s); if (show('money')) drawItem(money, mx, my, a.s);
  LAYOUT.push({ kind: 'link', id: `trade ${a.name}<->${b.name}`, from: a.name, to: b.name, p: clamp(p) });
}
// say(a, text, p, o): a speech bubble above a's head (the words are the character's, so keep them short)
function say(a, text, p, o = {}) {
  if (!a || p <= 0) return; const size = (o.size || 34) * U; ctx.save(); ctx.font = SANS(size); const w = ctx.measureText(text).width + size * 1.6; ctx.restore();
  const side = o.side ?? (a.x > W / 2 ? -1 : 1), tx = a.top[0] + side * 30 * a.s, ty = a.top[1] - 16 * a.s;
  ctx.save(); if (side < 0) { ctx.translate(tx, 0); ctx.scale(-1, 1); ctx.translate(-tx, 0); }
  bubble(tx, ty, w, size * 1.7, p, side < 0 ? '' : text, { size, type: o.type ?? p * 1.6, col: o.col || CARD, fg: o.fg || DEEP });
  ctx.restore();
  if (side < 0 && p > .05 && !HIDE_WORDS) { ctx.save(); ctx.font = SANS(size); ctx.fillStyle = o.fg || DEEP; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, Math.round(text.length * clamp(o.type ?? p * 1.6))), tx - w / 2, ty - size * 1.7 / 2 - 28); ctx.restore(); }
  claimText('say ' + a.name + ': ' + text, side < 0 ? tx - w : tx, ty - size * 1.7 - 30, w, size * 1.7, o.fg || DEEP, true, o.col || CARD);
}
// walkTo(t, t0, t1, x0, x1): position and step phase for a character walking from x0 to x1 between t0 and t1
function walkTo(t, t0, t1, x0, x1) { const p = prog(t, t0, t1), x = lerp(x0, x1, ease(p)); return { x, walk: p > 0 && p < 1 ? (t - t0) * 2.2 : 0, face: x1 >= x0 ? 1 : -1 }; }
