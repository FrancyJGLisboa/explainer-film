// ================= How vaccines train your immune system (Reel, 9:16, narrated) =================
// Every count and timing below is a function or constant that BOTH draws the picture and feeds the shows() tests.
const BPM = 96, BEAT = 60 / BPM, b = n => n * BEAT;                // 60 beats = 37.5 s = 15 bars
const SC = scenes(['hook', 8], ['vaccine', 10], ['select', 6], ['multiply', 8], ['memory', 8], ['real', 10], ['limits', 10]);
const MUSIC = { kit: 'keys', harmony: 'dreamy', key: 0, sfxGain: .8 };
const SECTIONS = [
  [0, 1, ['pad']], [1, 2, ['pad', 'pluck']], [2, 4, ['pad', 'pluck', 'hat8']], [4, 12, ['pad', 'pluck', 'hat8', 'kick2']],
  [12, 14, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']], [14, 15, ['pad', 'pluck']],
];
const cam = (t, t0, t1) => ({ cx: W / 2, cy: H / 2, k: 1 + .02 * prog(t, t0, t1) });
const SHOTS = Object.values(SC).filter(s => s.beats).map(s => ({ from: s.from, to: s.to, cam: t => cam(t, s.from, s.to) }));
SHOTS[SHOTS.length - 1].to = DUR;

// ---------- the real things, as data the picture is drawn from ----------
const V = ZONE.visual, U2 = U, cx = V.x + V.w / 2, cy = V.y + V.h * .38;
const R = 84 * U;                                                 // particle radius
const VIRUS = { kind: 'tri' }, COPY = { kind: 'tri' };            // the vaccine copy carries the same key as the virus
const SPIKES = 8;
// scene 1: the virus copies itself; ROUND_T are the beats where each round lands
const ROUND_T = [b(.3), b(2), b(3.7), b(5.4)];
const virusCount = t => { let n = 0; ROUND_T.forEach(r => { if (t >= r) n = n ? n * 2 : 1; }); return n; };
const VGRID = [[-.5, -.5], [.5, -.5], [-1.5, -.5], [1.5, -.5], [-.5, .5], [.5, .5], [-1.5, .5], [1.5, .5]];   // a spaced 4x2 grid: every virus countable
const vpos = i => [cx + VGRID[i][0] * 190 * U, cy + VGRID[i][1] * 200 * U];
// scene 2: three harmless copies; they never multiply
const COPY_POS = [[cx - 250 * U, cy - 60 * U], [cx + 240 * U, cy - 90 * U], [cx + 10 * U, cy + 60 * U]];
const COPIES_ARRIVE = SC.vaccine.from + b(2);
const BURST_T = COPY_POS.map((_, c) => b(30.4 + c * .35));   // antibodies stay clamped until late in the scene; then a quick pop
const copiesAlive = t => t < SC.vaccine.from ? 0 : COPY_POS.filter((_, c) => t < BURST_T[c]).length;
// scene 3: five immune cells with different locks; only one kind fits the key
const B_KINDS = ['square', 'round', 'tri', 'flat', 'zig'];     // only one cup shape (V) fits the triangle key
const MATCH = B_KINDS.indexOf(COPY.kind);
const rowY = V.y + V.h * .9, B_POS = B_KINDS.map((_, i) => [V.x + V.w * (.1 + .2 * i), rowY]);
const FIRST_LOCK = b(20.5);                                       // the matching cell has clamped a copy
const DIV_T = [b(24.5), b(25.5), b(26.5)];
const clones = t => t < FIRST_LOCK ? 0 : DIV_T.filter(d => t >= d).length === 0 ? 1 : 2 ** DIV_T.filter(d => t >= d).length;
const CLONE_POS = Array.from({ length: 8 }, (_, i) => [V.x + V.w * (.12 + .253 * (i % 4)), V.y + V.h * (i < 4 ? .78 : 1.0)]);
const AB_SPIKES = [[2, 6], [2, 6], [1, 5]];                       // per copy: the spikes that face sideways (copies are drawn slightly rotated)
// scene 4: most cells retire, a few stay as memory
const MEMORY_IDX = [1, 6], FADE_T = b(33.5), BADGE_T = b(35.5);
const cellVisible = (i, t) => t < SC.multiply.from + b(.4) ? false : i < clones(t) && (t < FADE_T || MEMORY_IDX.includes(i) || t < FADE_T + .8);
const visibleCells = t => CLONE_POS.filter((_, i) => i < clones(t) && (t < FADE_T + .8 || MEMORY_IDX.includes(i))).length;   // ghosts are outlines only, not cells
// scene 5: the real virus; memory cells lock on much sooner
const REAL_ARRIVE = SC.real.from + b(.5), SECOND_LOCK = REAL_ARRIVE + b(2), REAL_BURST = SC.real.from + b(6);
const FIRST_DELAY = (FIRST_LOCK - COPIES_ARRIVE) / BEAT, SECOND_DELAY = (SECOND_LOCK - REAL_ARRIVE) / BEAT;
// scene 6: a variant: some keys changed
const VARIANT_KINDS = ['tri', 'square', 'square', 'tri', 'square', 'round', 'tri', 'square'];   // spikes 0, 3, 6 keep the old key
const VARIANT_FIT = VARIANT_KINDS.filter(k => k === VIRUS.kind).length / VARIANT_KINDS.length;
const LIMIT_AB = [{ spike: 6, t: b(51.5) }, { spike: 2, t: b(52.2) }, { spike: 1, t: b(52.9) }];   // misses slide away to the right   // clamp on an old (tri) spike; misses on changed (square) ones   // fewer antibodies than before: protection fades

shows('the virus doubles each round (counted from what is drawn)', ROUND_T.map(r => virusCount(r + .01)).join() === '1,2,4,8');
shows('the vaccine copy carries the same key as the virus', COPY.kind === VIRUS.kind);
shows('copies never multiply during the vaccine scene', Array.from({ length: 20 }, (_, i) => copiesAlive(lerp(SC.vaccine.from + .01, SC.vaccine.to, i / 19))).every(n => n === COPY_POS.length));
shows('exactly one kind of immune cell fits the key', B_KINDS.filter(k => k === COPY.kind).length === 1 && B_KINDS[MATCH] === COPY.kind);
shows('the matching cell doubles: 1, 2, 4, 8', [FIRST_LOCK + .01, ...DIV_T.map(d => d + .01)].map(clones).join() === '1,2,4,8');
shows('memory: 8 cells at the start of scene 4, 0 < remaining < 8 at its end', visibleCells(SC.memory.from + .01) === 8 && visibleCells(SC.memory.to - .01) > 0 && visibleCells(SC.memory.to - .01) < 8);
shows('the second response locks on in under half the time of the first', SECOND_DELAY < FIRST_DELAY / 2, `${SECOND_DELAY} vs ${FIRST_DELAY} beats`);
shows('the variant fits only partly (some spikes, not all)', VARIANT_FIT > 0 && VARIANT_FIT < 1 && LIMIT_AB.some(a => VARIANT_KINDS[a.spike] === VIRUS.kind) && LIMIT_AB.some(a => VARIANT_KINDS[a.spike] !== VIRUS.kind));
fits('the copies all burst inside the multiply scene', BURST_T[0], BURST_T[BURST_T.length - 1] + .45, SC.multiply.from, SC.multiply.to);

const EVENTS = [
  ...ROUND_T.map((r, i) => [r, 'popLow', i]), [b(2.3), 'tick'],
  [SC.vaccine.from, 'whoosh'], [b(9), 'swish'], [b(13.5), 'alarm'],
  [SC.select.from, 'swish'], [b(20.8), 'thud'], [FIRST_LOCK, 'clonk'], [SC.multiply.from, 'swish'], ...DIV_T.map((d, i) => [d, 'pop', i]),
  [b(27), 'zip'], [b(28), 'zip'], ...BURST_T.map(t => [t, 'flag']), [b(30.6), 'tick'],
  [SC.memory.from, 'swish'], [FADE_T, 'whooshOut'], [BADGE_T, 'ding'],
  [SC.real.from, 'whoosh'], [SECOND_LOCK, 'clonk'], [b(44.5), 'zip'], [REAL_BURST, 'flag'], [b(47), 'tick'],
  [SC.limits.from, 'whoosh'], ...LIMIT_AB.map(a => [a.t + b(.8), VARIANT_KINDS[a.spike] === VIRUS.kind ? 'clonk' : 'boing']), [b(56), 'popLow', 1], [b(57.5), 'notify'],
];

// ---------- drawing helpers for this film ----------
function cup(kind, s, col) {                                        // a receptor tip: a cup shaped to fit one key (V fits tri, box fits square, arc fits round)
  ctx.strokeStyle = col; ctx.lineWidth = 7 * s; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath();
  if (kind === 'tri') { ctx.moveTo(-16 * s, -22 * s); ctx.lineTo(0, 0); ctx.lineTo(16 * s, -22 * s); }
  else if (kind === 'square') { ctx.moveTo(-15 * s, -22 * s); ctx.lineTo(-15 * s, 0); ctx.lineTo(15 * s, 0); ctx.lineTo(15 * s, -22 * s); }
  else if (kind === 'flat') { ctx.moveTo(-17 * s, -4 * s); ctx.lineTo(17 * s, -4 * s); }
  else if (kind === 'zig') { ctx.moveTo(-16 * s, -18 * s); ctx.lineTo(-8 * s, -4 * s); ctx.lineTo(0, -18 * s); ctx.lineTo(8 * s, -4 * s); ctx.lineTo(16 * s, -18 * s); }
  else { ctx.arc(0, -12 * s, 15 * s, Math.PI * .05, Math.PI * .95); }
  ctx.stroke();
}
function bcell(x, y, s, kind, o = {}) {                              // a blue immune cell whose receptors end in cups of its kind
  const { glow: g = 0, grow = 1, ghost = false } = o; if (grow <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(grow, grow);
  if (ghost) { circ(0, 0, 40 * s, null, [tint(VAR.blue, .8), 3 * s]); ctx.restore(); return; }
  if (g > 0) glow(0, 0, 90 * s, rgbOf(VAR.blue).join(','), .5 * g);
  [-.8, 0, .8].forEach(a => { ctx.save(); ctx.rotate(a); strokeLine([[0, -38 * s], [0, -62 * s]], tint(VAR.blue, 1.25), 7 * s); ctx.translate(0, -62 * s); cup(kind, s, tint(VAR.blue, 1.35)); ctx.restore(); });
  circ(0, 0, 40 * s, VAR.blue); circ(-12 * s, -12 * s, 11 * s, tint(VAR.blue, 1.3));
  ctx.restore();
}
function virusCluster(t, dy) {
  const n = virusCount(t);
  for (let i = 0; i < n; i++) {
    const born = ROUND_T[Math.max(0, Math.ceil(Math.log2(i + 1)))], p = back(prog(t, born, born + .35));
    const [px, py] = vpos(Math.max(0, Math.floor((i - 1) / 2))), [x, y] = vpos(i);
    pathogen(lerp(px, x, easeOut(p)), lerp(py, y, easeOut(p)) + dy, R * .78 * (.5 + .5 * p), WRONG, { kind: VIRUS.kind, spikes: SPIKES, t: t + i });
  }
}

// ---------- the world ----------
function backdrop(t, cam) { WORLD.micro(t, cam); }
function world(t) {
  // 1 hook: a virus copies itself: 1 -> 2 -> 4 -> 8
  if (t < SC.vaccine.from + 1) {
    const out = ease(prog(t, SC.vaccine.from, SC.vaccine.from + .9));
    for (let i = 0; i < 8; i++) { const [x, y] = vpos(i); circ(x, y - out * H, R * .78, null, [MUTED, 3]); }   // the 8 places the copies will fill, from frame 0: the first frame is a finished picture
    virusCluster(t, -out * H);
    callout('×2 each round', vpos(0)[0], vpos(0)[1] - R * .82 - out * H, vpos(0)[0], V.y + 10 * U - out * H, prog(t, b(2.2), b(2.6)), { bg: WRONG, size: 30 });
  }
  // 2 vaccine: three harmless grey copies, same keys; one tries to split and can't
  const copyXY = (c, t) => { const [x, y] = COPY_POS[c], p = easeOut(prog(t, SC.vaccine.from + c * .3, COPIES_ARRIVE));
    const wob = c === 2 && t > b(12) && t < b(13.5) ? Math.sin((t - b(12)) * 30) * 8 * U : 0; return [lerp(V.x - 250 * U, x, p) + wob, y]; };
  if (t > SC.vaccine.from && t < SC.multiply.to) {
    COPY_POS.forEach((_, c) => { if (t >= BURST_T[c]) return; const [x, y] = copyXY(c, t);
      pathogen(x, y, R, VAR.grey, { kind: COPY.kind, spikes: SPIKES, t: 1.3 * c, hit: prog(t, BURST_T[c] - .4, BURST_T[c]) }); });
    if (t > b(13.2) && t < SC.select.from) { const [x, y] = copyXY(2, t); stamp(x + R * 1.3, y - R * 1.3, 30 * U, false, prog(t, b(13.5), b(13.8)), VAR.grey);
      callout("can't multiply", x, y + R * 1.6, x + 20 * U, y + R * 3.4, prog(t, b(14), b(14.4)), { bg: VAR.grey, size: 30 }); }
    BURST_T.forEach((bt, c) => burst(COPY_POS[c][0], COPY_POS[c][1], t, bt, VAR.grey, R * .7, .45));
  }
  // 3 learn: five cells try; only the matching one clamps a copy, glows and divides; antibodies clamp the copies' spikes
  if (t > SC.select.from && t < SC.multiply.from + b(.5)) {
    B_POS.forEach(([x, y], i) => {
      const up = Math.sin(Math.PI * prog(t, SC.select.from + b(.3 + i * .15), SC.select.from + b(2.2 + i * .15))) * 90 * U;
      if (i !== MATCH) { bcell(x, y - up, 1.0 * U, B_KINDS[i], { grow: 1 - ease(prog(t, SC.select.from + b(2.8), SC.select.from + b(3.6))) }); return; }
      const [tx, ty] = [COPY_POS[2][0], COPY_POS[2][1] + R * 2.2], [lx, ly] = lockOn(x, y, tx, ty, prog(t, SC.select.from + b(1), FIRST_LOCK));
      const back2 = ease(prog(t, SC.multiply.from, SC.multiply.from + b(.4)));   // held on the copy through the whole select scene
      bcell(lerp(lx, CLONE_POS[0][0], back2), lerp(ly, CLONE_POS[0][1], back2), 1.0 * U, B_KINDS[i], { glow: prog(t, FIRST_LOCK, FIRST_LOCK + .3) });
      if (t > FIRST_LOCK) thread(lerp(lx, CLONE_POS[0][0], back2), lerp(ly, CLONE_POS[0][1], back2) - 70 * U, 12 * U);
    });
  }
  if (t >= SC.multiply.from + b(.4) && t < SC.limits.to) {
    CLONE_POS.forEach(([x, y], i) => {
      if (i >= clones(t)) return;
      const born = i === 0 ? 0 : DIV_T[Math.ceil(Math.log2(i + 1)) - 1], par = CLONE_POS[Math.floor((i - 1) / 2)] || CLONE_POS[0], p = easeOut(prog(t, born, born + .4));
      const fade = MEMORY_IDX.includes(i) ? 0 : ease(prog(t, FADE_T, FADE_T + .8));
      let px = i === 0 ? x : lerp(par[0], x, p), py = i === 0 ? y : lerp(par[1], y, p), big = 1;
      if (MEMORY_IDX.includes(i) && t > REAL_ARRIVE && t < REAL_BURST + .5 && MEMORY_IDX.indexOf(i) === 0) return;   // that one is busy clamping the virus
      if (MEMORY_IDX.includes(i)) { const m = ease(prog(t, FADE_T + .8, FADE_T + 1.8)), k = MEMORY_IDX.indexOf(i); [px, py] = [lerp(px, cx + (k ? 210 : -210) * U, m), lerp(py, V.y + V.h * .6, m)]; big = 1 + .8 * m; py = lerp(py, V.y + V.h * .95, ease(prog(t, SC.real.from, SC.real.from + .6))); }
      if (fade > .99 && t < SC.real.from) bcell(px, py, .95 * U, COPY.kind, { ghost: true });
      bcell(px, py, .95 * U * big, COPY.kind, { grow: (i === 0 ? 1 : .4 + .6 * p) * (1 - fade), glow: t > SC.real.from && MEMORY_IDX.includes(i) ? .6 : 0 });
      if (MEMORY_IDX.includes(i)) badge(px + 40 * U * big, py - 40 * U * big, 20 * U * big, prog(t, BADGE_T, BADGE_T + .4), { icon: 'star', col: VAR.purple, fg: TEXT });
    });
  }
  if (t > b(26.6) && t < SC.memory.from) COPY_POS.forEach(([x, y], c) => AB_SPIKES[c].forEach((sp, k) => {
    if (t < BURST_T[c]) bindTo(x, y, R, sp, prog(t, b(26.6 + c * .3 + k * .15), b(27.4 + c * .3 + k * .15)), VAR.gold, { kind: COPY.kind, spikes: SPIKES, t: 1.3 * c, s: 1.0 * U, from: 170 * U });
  }));
  if (t > SC.select.from) callout('takes weeks', CLONE_POS[5][0], CLONE_POS[5][1] + 45 * U, CLONE_POS[5][0] + 20 * U, V.y + V.h + 80 * U, inOut(t, b(28.3), SC.multiply.to), { bg: VAR.blue, size: 30 });
  // 4 memory: the "8 -> 2" callout is built from the drawn counts
  if (t > SC.memory.from && t < SC.real.from) callout(`${visibleCells(SC.memory.from + .01)} → ${visibleCells(SC.memory.to - .01)} cells`, cx - 210 * U, V.y + V.h * .6 - 110 * U, cx, V.y + V.h * .25, inOut(t, b(36), SC.memory.to), { bg: VAR.purple, size: 34 });
  // 5 real: a red virus arrives; memory cells clamp it at once, antibodies swarm, it bursts before copying
  if (t > SC.real.from && t < SC.real.to) {
    const vx = cx, vy = V.y + V.h * .4, arr = easeOut(prog(t, SC.real.from, REAL_ARRIVE));
    if (t < REAL_BURST) pathogen(lerp(W + 200 * U, vx, arr), vy, R * 1.5, WRONG, { kind: VIRUS.kind, spikes: SPIKES, t: 0, hit: prog(t, REAL_BURST - .4, REAL_BURST) });
    burst(vx, vy, t, REAL_BURST, WRONG, R, .5);
    if (t < REAL_BURST) {                                            // a memory cell clamps a bottom spike first (the fast recognition)
      const [sx, sy, sa] = spikeTip(vx, vy, R * 1.5, 5, { spikes: SPIKES, t: 0 }), [mx, my] = lockOn(cx - 210 * U, V.y + V.h * .95, sx + Math.cos(sa) * 100 * U, sy + Math.sin(sa) * 100 * U, prog(t, REAL_ARRIVE, SECOND_LOCK));
      ctx.save(); ctx.translate(mx, my); ctx.rotate(sa - Math.PI / 2); ctx.translate(-mx, -my);
      bcell(mx, my, 1.5 * U, COPY.kind, { glow: prog(t, SECOND_LOCK, SECOND_LOCK + .3) }); ctx.restore(); badge(mx - 70 * U, my + 10 * U, 28 * U, 1, { icon: 'star', col: VAR.purple, fg: TEXT });
      [2, 6, 1, 7].forEach((sp, k) => bindTo(vx, vy, R * 1.5, sp, prog(t, SECOND_LOCK + b(.3 + k * .25), SECOND_LOCK + b(1.3 + k * .25)), VAR.gold, { kind: VIRUS.kind, spikes: SPIKES, t: 0, s: 1.1 * U, from: 320 * U }));
    }
    // timeline: bar lengths in the measured ratio of the two lock-on delays
    const tp = prog(t, b(46.5), b(47.3)); if (tp > 0) { const bx = V.x + 10 * U, by = V.y + 10 * U, full = V.w * .55;
      rr(bx - 14 * U, by - 50 * U, 170 * U + full + 28 * U, 128 * U, 18 * U, DEEP);
      if (!HIDE_WORDS) { ctx.font = SANS(28 * U, 700); ctx.fillStyle = MUTED; ctx.textBaseline = 'middle'; ctx.fillText('time to lock on', bx, by - 28 * U); }
      rr(bx + 170 * U, by, full * easeOut(tp), 20 * U, 10 * U, VAR.blue); rr(bx + 170 * U, by + 40 * U, full * SECOND_DELAY / FIRST_DELAY * easeOut(tp), 20 * U, 10 * U, VAR.purple);
      if (!HIDE_WORDS) { ctx.font = SANS(22 * U, 700); ctx.fillStyle = TEXT; ctx.textBaseline = 'middle'; ctx.fillText('first time', bx, by + 10 * U); ctx.fillText('with memory', bx, by + 50 * U); }
      claimText('timeline', bx, by - 4 * U, 170 * U + full, 72 * U, TEXT, true, DEEP); }
  }
  // 6 limits: a variant with changed keys: fewer antibodies, one clamps a matching spike, two slide off; it copies once
  if (t > SC.limits.from) {
    const vx = cx - 60 * U, vy = V.y + V.h * .2, arr = easeOut(prog(t, SC.limits.from, SC.limits.from + b(1.2))), RL = R * 1.3;
    const twin = back(prog(t, b(56), b(56.6)));
    pathogen(lerp(W + 200 * U, vx, arr), vy, RL, WRONG, { kind: VARIANT_KINDS, spikes: SPIKES, t: 0 });
    if (twin > 0) pathogen(vx + 320 * U * twin, vy + 150 * U * twin, R * 1.1 * twin, WRONG, { kind: VARIANT_KINDS, spikes: SPIKES, t: 0 });
    LIMIT_AB.forEach(a => {
      const fitsIt = VARIANT_KINDS[a.spike] === VIRUS.kind, p = prog(t, a.t, a.t + b(1));
      if (fitsIt) { bindTo(vx, vy, RL, a.spike, p, VAR.gold, { kind: VIRUS.kind, spikes: SPIKES, t: 0, s: 1.1 * U }); return; }
      const [tx, ty, ang] = spikeTip(vx, vy, RL, a.spike, { spikes: SPIKES }), slide = prog(t, a.t + b(.9), a.t + b(2));
      const [x, y] = lockOn(tx + Math.cos(ang) * 320 * U, ty + Math.sin(ang) * 320 * U, tx + Math.cos(ang) * 60 * U, ty + Math.sin(ang) * 60 * U, Math.min(p, .92));
      if (p > 0) antibody(x + slide * 200 * U, y - slide * 40 * U, 1.1 * U, ang - Math.PI / 2 + slide * 1.2, VAR.gold, { kind: VIRUS.kind });
    });
    callout(`fits ${Math.round(VARIANT_FIT * 8)} of 8 spikes`, vx - RL * 1.1, vy - RL * 1.1, V.x + V.w * .2, V.y + 20 * U, inOut(t, b(54.5), b(57)), { bg: WRONG, size: 28 });
    callout('boosters refresh it', cx - 210 * U, V.y + V.h * .95 - 110 * U, V.x + V.w * .25, V.y + V.h * .62, prog(t, b(57.5), b(58)), { bg: VAR.purple, size: 30 });
  }
  // the hero reacts
  const { x, y, s } = ZONE.hero;
  circ(x, y - 190 * s, 240 * s, DISC);
  const mood = t > SC.limits.from + b(2) ? 'worried' : t > REAL_BURST ? 'excited' : t > BADGE_T ? 'happy' : t > SC.select.from ? 'think' : 'plain';
  blob(x, y, s, { mood, talk: voiceLevel(t), blink: blinkAt(t), look: -1, grow: back(prog(t, 0, .5)) });
}

// ---------- words: headline band ----------
function words(t) {
  const hx = ZONE.head.x, hy = ZONE.head.y, S = 70 * U;
  kine('A virus copies itself {fast.|#e8413c}', hx, hy, t, b(.3), SC.vaccine.from - .2, { size: S });
  kine('A vaccine: a {harmless copy.|#9aa3b5}', hx, hy, t, SC.vaccine.from + .3, SC.select.from - .2, { size: S });
  kine('Only the {matching cell|#58c4dd} fits.', hx, hy, t, SC.select.from + .3, SC.multiply.from - .2, { size: S });
  kine('It multiplies and makes {antibodies.|#f0ac5f}', hx, hy, t, SC.multiply.from + .3, SC.memory.from - .2, { size: S });
  kine('A few stay, as {memory.|#9a72ac}', hx, hy, t, SC.memory.from + .3, SC.real.from - .2, { size: S });
  kine('Real virus? {Stopped early.|#2ec4b6}', hx, hy, t, SC.real.from + .3, SC.limits.from - .2, { size: S });
  kine('Changed shape? Some {slip past.|#e8413c}', hx, hy, t, SC.limits.from + .3, DUR + 5, { size: S });
}
finish();
