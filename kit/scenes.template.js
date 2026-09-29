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
  { from: SC.insight.from, to: SC.limits.from, cam: t => { const e = ease(prog(t, SC.insight.from, SC.insight.from + 1.2)) - ease(prog(t, SC.insight.to - 1, SC.insight.to)); return { cx: lerp(W / 2, 1450, e), cy: lerp(H / 2, 420, e), k: lerp(1, 1.5, e) }; } },
  { from: SC.limits.from, to: DUR, cam: () => still },
];
const EVENTS = [                                                   // [seconds, sfx]: one per visible action, on beats
  [b(1), 'boing'], ...[0, 1, 2, 3, 4, 5].map(g => [b(1.5 + g * .5), 'pop']), [SC.naive.from, 'whoosh'], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [b(8 + i * .5), 'popLow', i % 4]),
  [SC.mechanism.from, 'swish'], [b(19), 'zip'], [SC.build.from, 'swish'], [b(31), 'tick'], [b(36), 'ding'],
  [SC.insight.from, 'whoosh'], [b(45), 'flag'], [SC.limits.from, 'swish'], [b(55), 'clonk'], [SC.loop.from, 'whooshOut'], [b(66), 'notify'],
];

// ---------- the real thing, as functions (reality map rows) ----------
const lin = u => 3 * u, expo = u => Math.pow(1.35, u), cap = 55, logi = u => cap / (1 + (cap / 3 - 1) * Math.pow(1.35, -u));   // logi starts where 3*expo starts
const N = 8, LIN = Array.from({ length: N }, (_, i) => lin(i + 1)), EXP = Array.from({ length: N }, (_, i) => expo(i + 1) * 3);
const AX = axes({ x: 780, y: 250, w: 1040, h: 640, xmax: 16, ymax: 72, xlabel: 'steps', ylabel: 'size', ticks: 8 });
shows('exponential curve visibly bends (ends >= 5x steeper than it starts)', bend(expo, 0, 16) >= 5, `bend = ${bend(expo, 0, 16).toFixed(1)}`);
shows('linear curve stays straight', Math.abs(bend(lin, 0, 16) - 1) < .01);
shows('exponential starts below linear, then overtakes it', expo(1) < lin(1) && expo(16) > lin(16));
shows('with a limit, growth flattens (ends shallower than it was mid-way)', bend(logi, 8, 16) < 1);
shows('the hook doubles: each row of dots is twice the last', [1, 2, 4, 8, 16, 32].every((n, i, a) => !i || n === 2 * a[i - 1]));
fits('bars grow one per half beat', b(8), b(12), SC.naive.from, SC.naive.to);

// ---------- the world ----------
const HERO_AT = { x: 380, y: 1000, s: 1.4 };
function world(t) {
  const { x, y, s } = HERO_AT;
  circ(x, y - 190 * s, 300 * s * back(prog(t, b(.5), b(1.5))), DISC);
  const mood = t > b(45) ? 'happy' : t > SC.build.from ? 'think' : 'plain';
  blob(x, y, s, { grow: back(prog(t, b(1), b(2))), mood, look: t > SC.naive.from ? 1 : 0, blink: blinkAt(t), armR: t > b(45) && t < b(50) ? 2 : 0 });

  // hook: one dot doubles, five times (1 -> 32): a true picture of "grows by a share of itself"
  if (t < SC.naive.from + 1) {
    const out = ease(prog(t, SC.naive.from, SC.naive.from + .8));
    for (let k = 0; k < 32; k++) { const gen = Math.ceil(Math.log2(k + 1)), p = back(prog(t, b(1.5 + gen * .5), b(1.9 + gen * .5)));
      if (p > 0) circ(840 + (k % 8) * 125, 640 + Math.floor(k / 8) * 110 + out * 900, 34 * p, gen === 5 ? VAR.yellow : THREAD); }
  }
  // naive -> mechanism: the same bars, re-grown by a different rule (morph, not a cut)
  if (t > SC.naive.from && t < SC.build.from + 1) {
    const m = prog(t, b(18), b(20)), vals = LIN.map((v, i) => lerp(v, EXP[i], ease(m))), out = ease(prog(t, SC.build.from, SC.build.from + .8));
    ctx.save(); ctx.translate(0, out * 900);
    const top = bars(800, 290, 1000, 600, vals, 60, prog(t, b(7.5), b(12.5)), [m > .5 ? VAR.yellow : VAR.blue]);
    if (t > b(21) && t < SC.build.from) { const [x0, y0] = top(5), [x1, y1] = top(6); arrow(x0, y0 - 30, x1, y1 - 30, prog(t, b(21), b(22)), TEXT, 5); brace(x1 - 40, x1 + 40, 905, prog(t, b(22), b(23)), '×1.35', VAR.yellow); }
    ctx.restore();
  }
  // build: both rules as curves on one set of axes
  if (t > SC.build.from) {
    const k = lerp(1, .62, ease(prog(t, SC.loop.from, SC.loop.from + 1)));   // loop: the chart settles into the lower right, still true
    ctx.save(); ctx.translate(1820, 960); ctx.scale(k, k); ctx.translate(-1820, -890);
    grid(780, 250, 1040, 640, 65, prog(t, SC.build.from, SC.build.from + 1.5));   // 3b1b coordinate plane
    AX.draw(prog(t, SC.build.from + .2, SC.build.from + 1.2));
    plot(AX, lin, 0, 16, prog(t, b(30), b(36)), VAR.blue);
    const tip = plot(AX, t > SC.limits.from ? u => lerp(3 * expo(u), logi(u), ease(prog(t, b(53), b(56)))) : u => 3 * expo(u), 0, lerp(10.5, 16, ease(prog(t, b(53), b(56)))), prog(t, b(30), b(40)), t > b(55) ? VAR.green : VAR.yellow);
    if (tip) thread(tip[0], tip[1], 14);
    ctx.restore();
  }
  // loop: the one shape comes home and orbits the hero
  if (t > SC.loop.from) { const a = (t - SC.loop.from) * 2.2; thread(x + Math.cos(a) * 260, y - 190 * s + Math.sin(a) * 260, 16); }
}

// ---------- words: in empty space next to the action (never across it, never in corners) ----------
function words(t) {
  kine('What grows *slow,*', 800, 330, t, b(2), b(5.6), { size: 110 });
  kine('then *sudden?*', 800, 470, t, b(2.8), b(5.7), { size: 110 });
  kine('Add the {same|#58c4dd} each step.', 800, 170, t, b(6.6), b(15.6), { size: 72 });
  kine('Grow by a {share|#f4d35e} of itself.', 800, 170, t, b(16.6), b(27.6), { size: 72 });
  eq([['s', VAR.yellow], [' = '], ['1.35', TEXT], ['^t', MUTED]], 1000, 190, t, b(29), b(41.6), { size: 84 });
  kine('Slow, then *sudden.*', 1080, 230, t, b(44), b(51.4), { size: 84 });
  kine('Real growth hits {limits.|#83c167}', 800, 170, t, b(56.2), b(61.6), { size: 72 });
  kine('Same rule,', 800, 330, t, b(63), DUR + 5, { size: 110 });
  kine('every *step.*', 800, 470, t, b(63.8), DUR + 5, { size: 110 });
  kine('Until it runs out of room.', 800, 580, t, b(65), DUR + 5, { size: 60, col: MUTED });
}
finish();
