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
  [b(1), 'boing'], ...[0, 1, 2, 3, 4, 5].map(g => [b(1.5 + g * .5), 'pop']), [SC.naive.from, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [b(8 + i * .5), 'popLow', i % 4]),
  [SC.mechanism.from, 'swish'], [b(19), 'zip'], [SC.build.from, 'swish'], [b(31), 'tick'], [b(36), 'ding'],
  [SC.insight.from, 'whoosh'], [b(45), 'flag'], [SC.limits.from, 'swish'], [b(55), 'clonk'], [SC.loop.from, 'whooshOut'], [b(66), 'notify'],
];

// ---------- the real thing, as functions (reality map rows) ----------
const lin = u => 3 + 2 * u, grow = u => 3 * Math.pow(1.35, u), cap = 50, logi = u => cap / (1 + (cap / 3 - 1) * Math.pow(1.35, -u));
const X_END = 20, GROW_END = 10;                                   // grow leaves the chart (60) at step 10
// all three start at 3; logi has the SAME rate as grow, so it can never run above it: it tracks grow, then levels off under the ceiling
const ROWS = [1, 2, 4, 8, 16];                                     // hook: each row of dots is the last row doubled
const N = 8, LIN = Array.from({ length: N }, (_, i) => lin(i + 1)), EXP = Array.from({ length: N }, (_, i) => grow(i + 1));
const AX = axes({ x: 780, y: 250, w: 1040, h: 640, xmax: X_END, ymax: 60, xlabel: 'steps', ylabel: 'size', ticks: 10, numbers: true });
shows('the growing curve visibly bends over the drawn range (ends >= 5x steeper than it starts)', bend(grow, 0, GROW_END) >= 5, `bend = ${bend(grow, 0, GROW_END).toFixed(1)}`);
shows('linear curve stays straight, under the ceiling', Math.abs(bend(lin, 0, X_END) - 1) < .01 && lin(X_END) < cap);
shows('slow first: sharing stays below adding for the first 4 steps', [1, 2, 3, 4].every(u => grow(u) < lin(u)));
shows('then sudden: sharing ends far above adding', grow(GROW_END) > 2 * lin(GROW_END));
shows('growing by a share: each step adds more than the last', EXP.every((v, i) => i < 2 || v - EXP[i - 1] > EXP[i - 1] - EXP[i - 2]));
shows('with a limit, growth levels off (end slope under a fifth of its mid slope)', bend(logi, 10, X_END) < .2);
shows('the hook doubles: each row of dots is twice the last', ROWS.every((n, i, a) => !i || n === 2 * a[i - 1]));
shows('the limited curve never runs above the unlimited one, rises above the line, and stays under the ceiling', Array.from({ length: 41 }, (_, i) => i / 2).every(u => logi(u) <= grow(u) + 1e-9) && logi(12) > lin(12) && logi(X_END) < cap);
fits('bars grow one per half beat', b(8), b(12), SC.naive.from, SC.naive.to);

// ---------- the world ----------
const HERO_AT = { x: 300, y: 1010, s: .85 };                     // hero: a small presence bottom-left; the explanation gets the frame
function world(t) {
  const { x, y, s } = HERO_AT;
  circ(x, y - 190 * s, 300 * s * back(prog(t, b(.5), b(1.5))), DISC);
  const mood = t > b(45) ? 'happy' : t > SC.build.from ? 'think' : 'plain';
  blob(x, y, s, { grow: back(prog(t, b(1), b(2))), mood, look: t > SC.naive.from ? 1 : 0, blink: blinkAt(t), armR: t > b(45) && t < b(50) ? 2 : 0 });

  // hook: rows of dots, each row the last one doubled (1, 2, 4, 8, 16): a still frame already shows "doubling"
  if (t < SC.naive.from + 1) {
    const out = ease(prog(t, SC.naive.from, SC.naive.from + .8));
    ROWS.forEach((n, g) => { const p = back(prog(t, b(1.5 + g * .5), b(1.9 + g * .5)));
      for (let k = 0; k < n; k++) if (p > 0) circ(1250 + (k - (n - 1) / 2) * 60, 150 + g * 100 + out * 900, 24 * p, VAR.yellow); });
  }
  // naive -> mechanism: the same bars, re-grown by a different rule (morph, not a cut)
  if (t > SC.naive.from && t < SC.build.from + 1) {
    const m = prog(t, b(18), b(20)), vals = LIN.map((v, i) => lerp(v, EXP[i], ease(m))), out = ease(prog(t, SC.build.from, SC.build.from + .8));
    ctx.save(); ctx.translate(0, out * 900);
    const top = bars(760, 290, 1080, 600, vals, 36, prog(t, b(7.5), b(12.5)), [m > .5 ? VAR.yellow : VAR.blue]);
    if (m > .99 && t < SC.build.from) {                              // each step's gain (bar i minus bar i-1), drawn on top of the bar: the gains grow
      const bw = 1080 / (N + (N - 1) * .25), gp = prog(t, b(20), b(21.5));
      for (let i = 1; i < N; i++) { const q = back(prog(gp, (i - 1) / N, (i - 1) / N + .3)); if (q <= 0) continue; const [cx, ty] = top(i), gh = 600 * (EXP[i] - EXP[i - 1]) / 36;
        rr(cx - bw / 2, ty, bw, gh * q, 6, tint(VAR.yellow, 1.35)); }
    }
    if (t > b(21) && t < SC.build.from) { const [x0, y0] = top(5), [x1, y1] = top(6); arrow(x0, y0 - 30, x1, y1 - 30, prog(t, b(21), b(22)), TEXT, 5);
      pill('×1.35', (x0 + x1) / 2, Math.min(y0, y1) - 80, prog(t, b(22), b(22.5)), { align: 'center', bg: VAR.yellow, id: 'ratio' }); }
    ctx.restore();
  }
  // build: both rules as curves on one set of axes; limits adds the ceiling and the curve that levels off under it
  if (t > SC.build.from) {
    ctx.save();                                                    // loop keeps the full chart: the recap points at the real picture
    grid(780, 250, 1040, 640, 104, prog(t, SC.build.from, SC.build.from + 1.5));   // 3b1b coordinate plane: grid lines on the ticks (every 2 steps)
    AX.draw(prog(t, SC.build.from + .2, SC.build.from + 1.2));
    plot(AX, lin, 0, X_END, prog(t, b(30), b(36)), VAR.blue);
    let tip = plot(AX, grow, 0, GROW_END, prog(t, b(30), b(40)), VAR.yellow);
    callout('+2 each step', AX.X(16), AX.Y(lin(16)), AX.X(16), AX.Y(lin(16)) + 110, prog(t, b(35), b(35.5)), { bg: VAR.blue, size: 24 });   // after the line has passed step 16 (it reaches it at b(34.8))
    callout('×1.35 each step', AX.X(9.6), AX.Y(grow(9.6)), AX.X(9.6) - 300, AX.Y(grow(9.6)) + 135, prog(t, b(40), b(40.5)), { bg: VAR.yellow, size: 24 });
    if (t > SC.insight.from && t < SC.limits.from) {                 // name the two phases on the curve itself
      callout('slow', AX.X(3), AX.Y(grow(3)), AX.X(3), AX.Y(grow(3)) - 170, prog(t, b(43), b(43.5)), { bg: MUTED });
      callout('sudden', AX.X(8.2), AX.Y(grow(8.2)), AX.X(11.5), AX.Y(30), prog(t, b(45), b(45.5)), { bg: VAR.yellow });
    }
    if (t > SC.limits.from) {
      const c = prog(t, b(52.5), b(53.5)); ctx.save(); ctx.setLineDash([14, 12]); strokeLine([[AX.X(0), AX.Y(cap)], [AX.X(X_END) * c + AX.X(0) * (1 - c), AX.Y(cap)]], MUTED, 4); ctx.restore();
      pill('room', AX.X(0) + 16, AX.Y(cap) - 36, prog(t, b(53.5), b(54)), { bg: MUTED, id: 'room' });
      tip = plot(AX, logi, 0, X_END, prog(t, b(54), b(57.5)), VAR.green) || tip;
      callout('real growth', AX.X(18), AX.Y(logi(18)), AX.X(16.5), AX.Y(cap) - 60, prog(t, b(57.5), b(58)), { bg: VAR.green });
    }
    if (tip && t < SC.loop.from) thread(tip[0], tip[1], 14);        // one thread dot at a time: in the loop it lives with the hero
    ctx.restore();
  }
  // loop: the one shape comes home and orbits the hero
  if (t > SC.loop.from) { const a = (t - SC.loop.from) * 2.2; thread(x + Math.cos(a) * 230, y - 190 * s + Math.sin(a) * 230, 16); }
}

// ---------- words: in empty space next to the action (never across it, never in corners) ----------
function words(t) {
  kine('What grows {slow,|#8d9bbd}', 640, 760, t, b(2), b(5.6), { size: 96 });
  kine('then {sudden?|#f4d35e}', 640, 885, t, b(2.8), b(5.7), { size: 96 });
  kine('Add the {same|#58c4dd} each step.', 760, 170, t, b(6.6), b(15.6), { size: 72 });
  kine('Grow by a {share|#f4d35e} of itself.', 760, 170, t, b(16.6), b(27.6), { size: 72 });
  eq([['s', VAR.yellow], [' = 3 · '], ['1.35', VAR.yellow], ['^t', MUTED]], 1000, 190, t, b(29), b(41.6), { size: 84 });
  kine('Slow, then {sudden.|#f4d35e}', 760, 170, t, b(44), b(51.4), { size: 72 });
  kine('Real growth hits {limits.|#83c167}', 760, 170, t, b(57.6), b(61.6), { size: 72 });
  kine('Same {×1.35,|#f4d35e} every step...', 760, 150, t, b(63), DUR + 5, { size: 72 });
  kine('...until room runs out.', 920, 222, t, b(64.5), DUR + 5, { size: 44, col: MUTED });
}
finish();
