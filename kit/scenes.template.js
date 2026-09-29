// ================= storyboard: the single source of truth =================
// A complete 7-scene demo ("slow, then sudden"). Replace the content with the film in brief.md, but keep the shape:
// beat grid -> SC -> MUSIC/SECTIONS/SHOTS/EVENTS -> asserts (fits, shows) -> world/words -> finish().
// Composition: hero on the left third (s >= 1.1, on its DISC), the main visual fills the right two thirds,
// words sit in empty space above or below the visual, never across it.
const BPM = 96, BEAT = 60 / BPM, b = n => n * BEAT;               // 1 beat = 0.625 s, 1 bar = 4 beats; 45 s = 72 beats = 18 bars
const SC = scenes(                                                 // [name, beats]; names are identifiers; beats sum to DUR
  ['hook', 6], ['naive', 10], ['mechanism', 12], ['build', 14], ['insight', 10], ['limits', 10], ['loop', 10]);
const MUSIC = { kit: 'percussion', harmony: 'bright', key: 2, sfxGain: .85 };   // kits: electro | acoustic | keys | percussion
const SECTIONS = [                                                 // [fromBar, toBar, layers], contiguous 0..18; add 1-2 layers per bar
  [0, 1, ['pad']], [1, 2, ['pad', 'pluck']], [2, 4, ['pad', 'pluck', 'hat8']], [4, 8, ['pad', 'pluck', 'hat8', 'kick2']],
  [8, 10, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']], [10, 13, ['pad', 'pluck', 'hat8', 'kick4', 'bassHalf', 'clap']],
  [13, 15, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']], [15, 17, ['pad', 'pluck', 'hat8', 'kick2']], [17, 18, ['pad', 'pluck', 'kick2']],
];
const still = { cx: W / 2, cy: H / 2, k: 1 };
const SHOTS = [                                                    // one camera per scene, contiguous; every cut is a scene start
  { from: SC.hook.from, to: SC.naive.from, cam: t => ({ ...still, k: 1 + .03 * prog(t, 0, SC.naive.from) }) },
  { from: SC.naive.from, to: SC.build.from, cam: () => still },
  { from: SC.build.from, to: SC.insight.from, cam: () => still },
  { from: SC.insight.from, to: SC.limits.from, cam: () => still },   // no zoom: the whole curve, slow part included, stays in frame
  { from: SC.limits.from, to: DUR, cam: () => still },
];
const EVENTS = [                                                   // [seconds, sfx]: one per visible action, on beats
  [b(1), 'boing'], ...[0, 1, 2, 3, 4].map(g => [b(.4 + g * .4), 'pop']), [SC.naive.from, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [b(8 + i * .5), 'popLow', i % 4]),
  [SC.mechanism.from, 'swish'], [b(19), 'zip'], [SC.build.from, 'swish'], [b(31), 'tick'], [b(36), 'ding'],
  [SC.insight.from, 'whoosh'], [b(45), 'flag'], [SC.limits.from, 'swish'], [b(55), 'clonk'], [SC.loop.from, 'whooshOut'], [b(66), 'notify'],
];

// ---------- the real thing, as functions (reality map rows) ----------
const lin = u => 3 + 2 * u, grow = u => 3 * Math.pow(1.35, u), cap = 50, logi = u => cap / (1 + (cap / 3 - 1) * Math.pow(1.35, -u));
const X_END = 20, GROW_END = 10;                                   // grow leaves the chart (60) at step 10
// all three start at 3; logi has the SAME rate as grow, so it can never run above it: it tracks grow, then levels off under the ceiling
const ROWS = [1, 2, 4, 8, 16];                                     // hook: each row of dots is the last row doubled
const N = 8, LIN = Array.from({ length: N }, (_, i) => lin(i + 1)), EXP = Array.from({ length: N }, (_, i) => grow(i + 1));
// layout comes from the platform's zones (kit: ZONE, SAFE, U), so the same film works in 16:9, 9:16, 1:1 and 4:5
const V = ZONE.visual, kx = V.w / 1040, ky = V.h / 640;           // kx, ky: scale from the 16:9 design
const AX = axes({ x: V.x, y: V.y, w: V.w, h: V.h, xmax: X_END, ymax: 60, xlabel: 'steps', ylabel: 'size', ticks: 10, numbers: true });
shows('the growing curve visibly bends over the drawn range (ends >= 5x steeper than it starts)', bend(grow, 0, GROW_END) >= 5, `bend = ${bend(grow, 0, GROW_END).toFixed(1)}`);
shows('linear curve stays straight, under the ceiling', Math.abs(bend(lin, 0, X_END) - 1) < .01 && lin(X_END) < cap);
shows('slow first: sharing stays below adding for the first 4 steps', [1, 2, 3, 4].every(u => grow(u) < lin(u)));
shows('then sudden: sharing ends far above adding', grow(GROW_END) > 2 * lin(GROW_END));
shows('growing by a share: each step adds more than the last', EXP.every((v, i) => i < 2 || v - EXP[i - 1] > EXP[i - 1] - EXP[i - 2]));
shows('adding: every step gains exactly 2', Array.from({ length: GROW_END }, (_, u) => lin(u + 1) - lin(u)).every(g => Math.abs(g - 2) < 1e-9));
shows('limited: gains grow, then shrink toward zero under the ceiling', (() => { const g = Array.from({ length: X_END }, (_, u) => logi(u + 1) - logi(u)); const m = g.indexOf(Math.max(...g)); return m > 2 && m < X_END - 3 && g[X_END - 1] < g[m] / 4; })());
shows('the green curve ends within 5% of the ceiling', logi(X_END) > .95 * cap && logi(X_END) < cap);
shows('with a limit, growth levels off (end slope under a fifth of its mid slope)', bend(logi, 10, X_END) < .2);
shows('the hook doubles: each row of dots is twice the last', ROWS.every((n, i, a) => !i || n === 2 * a[i - 1]));
shows('the limited curve never runs above the unlimited one, rises above the line, and stays under the ceiling', Array.from({ length: 41 }, (_, i) => i / 2).every(u => logi(u) <= grow(u) + 1e-9) && logi(12) > lin(12) && logi(X_END) < cap);
fits('bars grow one per half beat', b(8), b(12), SC.naive.from, SC.naive.to);

// ---------- the world ----------
const HERO_AT = ZONE.hero;                                          // a small presence; the explanation gets the frame
function world(t) {
  const { x, y, s } = HERO_AT;
  circ(x, y - 190 * s, 260 * s * back(prog(t, b(.5), b(1.5))), DISC);
  const mood = t > b(45) ? 'happy' : t > SC.build.from ? 'think' : 'plain';
  blob(x, y, s, { grow: back(prog(t, b(1), b(2))), mood, look: t > SC.naive.from ? 1 : 0, blink: blinkAt(t), armR: t > b(45) && t < b(50) ? 2 : 0 });

  // hook: rows of dots, each row the last one doubled (1, 2, 4, 8, 16): a still frame already shows "doubling"
  if (t < SC.naive.from + 1) {
    const out = ease(prog(t, SC.naive.from, SC.naive.from + .8)), gap = Math.min(60 * U, V.w / 16.5), rowH = V.h / 5.2;
    ROWS.forEach((n, g) => { const p = back(prog(t, b(.4 + g * .4), b(.8 + g * .4)));   // all rows up by 1.3 s: feeds decide fast
      for (let k = 0; k < n; k++) if (p > 0) circ(V.x + V.w / 2 + (k - (n - 1) / 2) * gap, V.y + rowH * (g + .5) + out * H, gap * .4 * p, VAR.yellow); });
  }
  // naive -> mechanism: the same bars, re-grown by a different rule (morph, not a cut)
  if (t > SC.naive.from && t < SC.build.from + 1) {
    const m = prog(t, b(18), b(20)), vals = LIN.map((v, i) => lerp(v, EXP[i], ease(m))), out = ease(prog(t, SC.build.from, SC.build.from + .8));
    const B = { x: V.x - 20 * kx, y: V.y + 40 * ky, w: V.w + 40 * kx, h: V.h - 40 * ky };
    ctx.save(); ctx.translate(0, out * H);
    const top = bars(B.x, B.y, B.w, B.h, vals, 36, prog(t, b(7.5), b(12.5)), [m > .5 ? VAR.yellow : VAR.blue]);
    if (m > .99 && t < SC.build.from) {                              // each step's gain (bar i minus bar i-1), drawn on top of the bar: the gains grow
      const bw = B.w / (N + (N - 1) * .25), gp = prog(t, b(20), b(21.5));
      for (let i = 1; i < N; i++) { const q = back(prog(gp, (i - 1) / N, (i - 1) / N + .3)); if (q <= 0) continue; const [cx, ty] = top(i), gh = B.h * (EXP[i] - EXP[i - 1]) / 36;
        rr(cx - bw / 2, ty, bw, gh * q, 6, tint(VAR.yellow, 1.35)); }
    }
    if (t > b(21) && t < SC.build.from) { const [x0, y0] = top(5), [x1, y1] = top(6); arrow(x0, y0 - 30 * ky, x1, y1 - 30 * ky, prog(t, b(21), b(22)), TEXT, 5);
      pill('×1.35', (x0 + x1) / 2, Math.min(y0, y1) - 80 * ky, prog(t, b(22), b(22.5)), { align: 'center', bg: VAR.yellow, id: 'ratio' }); }
    ctx.restore();
  }
  // build: both rules as curves on one set of axes; limits adds the ceiling and the curve that levels off under it
  if (t > SC.build.from) {
    ctx.save();                                                    // loop keeps the full chart: the recap points at the real picture
    grid(V.x, V.y, V.w, V.h, V.w / 10, prog(t, SC.build.from, SC.build.from + 1.5));   // 3b1b coordinate plane: grid lines on the ticks
    AX.draw(prog(t, SC.build.from + .2, SC.build.from + 1.2));
    plot(AX, lin, 0, X_END, prog(t, b(30), b(36)), VAR.blue);
    let tip = plot(AX, grow, 0, GROW_END, prog(t, b(30), b(40)), VAR.yellow);
    callout('+2 each step', AX.X(16), AX.Y(lin(16)), AX.X(16), AX.Y(lin(16)) + 110 * ky, prog(t, b(35), b(35.5)), { bg: VAR.blue, size: 24 });   // after the line has passed step 16
    callout('×1.35 each step', AX.X(9.6), AX.Y(grow(9.6)), AX.X(9.6) - 300 * kx, AX.Y(grow(9.6)) + 135 * ky, prog(t, b(40), b(40.5)), { bg: VAR.yellow, size: 24 });
    // gain per step, on the chart's own scale: a marker walks the curve and leaves a bar for each step's gain
    const gains = (fn, u0, u1, t0, t1, col, dx) => { const st = Math.floor(lerp(u0, u1, prog(t, t0, t1)) + 1e-9), bw = 14 * kx;
      for (let u = u0; u < st && u < u1; u++) { const g = fn(u + 1) - fn(u), q = back(prog(t, lerp(t0, t1, (u - u0) / (u1 - u0)), lerp(t0, t1, (u - u0) / (u1 - u0)) + .3));
        rr(AX.X(u + .5) + dx * kx - bw / 2, AX.Y(0) - (AX.Y(0) - AX.Y(g)) * q, bw, (AX.Y(0) - AX.Y(g)) * q, 4, col); }
      if (t > t0 && t < t1 + .6) { const u = lerp(u0, u1, prog(t, t0, t1)); circ(AX.X(u), AX.Y(fn(u)), 12 * U, col); } };
    if (t > SC.insight.from && t < SC.limits.from + .5) { gains(grow, 0, GROW_END, b(42.5), b(47.5), VAR.yellow, -9); gains(lin, 0, GROW_END, b(42.5), b(47.5), VAR.blue, 9); }
    if (t > SC.loop.from) gains(logi, 0, X_END, b(62.5), b(68.5), VAR.green, 0);
    if (t > SC.insight.from && t < SC.limits.from) {                 // name the two phases on the curve itself
      callout('slow', AX.X(3), AX.Y(grow(3)), AX.X(3), AX.Y(grow(3)) - 170 * ky, prog(t, b(48), b(48.5)), { bg: MUTED });
      callout('sudden', AX.X(8.2), AX.Y(grow(8.2)), AX.X(11.5), AX.Y(30), prog(t, b(49), b(49.5)), { bg: VAR.yellow });
    }
    if (t > SC.limits.from) {
      const c = prog(t, b(52.5), b(53.5)); ctx.save(); ctx.setLineDash([14, 12]); strokeLine([[AX.X(0), AX.Y(cap)], [AX.X(X_END) * c + AX.X(0) * (1 - c), AX.Y(cap)]], MUTED, 4); ctx.restore();
      pill('room', AX.X(0) + 16, AX.Y(cap) - 36 * ky, prog(t, b(53.5), b(54)), { bg: MUTED, id: 'room' });
      tip = plot(AX, logi, 0, X_END, prog(t, b(54), b(57.5)), VAR.green) || tip;
      callout('real growth', AX.X(18), AX.Y(logi(18)), AX.X(16.5), AX.Y(cap) - 60 * ky, prog(t, b(57.5), b(58)), { bg: VAR.green });
    }
    if (tip && t < SC.loop.from) thread(tip[0], tip[1], 14 * U);   // one thread dot at a time: in the loop it lives with the hero
    ctx.restore();
  }
  // loop: the one shape comes home and orbits the hero
  if (t > SC.loop.from) { const a = (t - SC.loop.from) * 2.2, r = 270 * s; thread(x + Math.cos(a) * r, y - 190 * s + Math.sin(a) * r, 16 * U); }
}

// ---------- words: in the headline band (ZONE.head), never across the visual; kine shrinks a line to fit the safe zone ----------
function words(t) {
  const hx = ZONE.head.x, hy = ZONE.head.y, S = 72 * U;
  kine('What grows {slow,|#8d9bbd} then {sudden?|#f4d35e}', hx, hy, t, b(.6), b(5.6), { size: 88 * U });
  kine('Add the {same|#58c4dd} each step.', hx, hy, t, b(6.6), b(15.6), { size: S });
  kine('Grow by a {share|#f4d35e} of itself.', hx, hy, t, b(16.6), b(27.6), { size: S });
  eq([['s', VAR.yellow], [' = 3 · '], ['1.35', VAR.yellow], ['^t', MUTED]], hx, hy + 10 * U, t, b(29), b(41.6), { size: 84 * U });
  kine('Slow, then {sudden.|#f4d35e}', hx, hy, t, b(44), b(51.4), { size: S });
  kine('Real growth hits {limits.|#83c167}', hx, hy, t, b(57.6), b(61.6), { size: S });
  kine('Same {×1.35,|#f4d35e} every step...', hx, hy - 10 * U, t, b(63), DUR + 5, { size: S });
  kine('...until room runs out.', hx + 160 * U, hy + 62 * U, t, b(64.5), DUR + 5, { size: 44 * U, col: MUTED });
}
finish();
