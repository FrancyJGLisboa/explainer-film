// ================= storyboard: the single source of truth =================
// Replace this demo with the film from brief.md. Keep the shape: beat grid -> SC -> SHOTS/SECTIONS/EVENTS -> world/words -> finish().
const BPM = 96, BEAT = 60 / BPM, b = n => n * BEAT;               // 72 beats = 45 s at 96 bpm
const SC = scenes(['meet', 8], ['idea', 32], ['close', 32]);       // [name, beats]; must sum to DUR
const MUSIC = { kit: 'percussion', harmony: 'bright', key: 2, sfxGain: .85 };   // kits: electro | acoustic | keys | percussion
const SECTIONS = [                                                 // [fromBar, toBar, layers]; add 1-2 layers per bar, never kick+bass together
  [0, 1, ['pad']], [1, 2, ['pad', 'pluck']], [2, 4, ['pad', 'pluck', 'hat8']],
  [4, 10, ['pad', 'pluck', 'hat8', 'kick2']], [10, 16, ['pad', 'pluck', 'hat8', 'kick2', 'bassHalf']], [16, 18, ['pad', 'pluck']],
];
const SHOTS = [                                                    // one camera per scene; world = screen at k 1
  { from: SC.meet.from, to: SC.idea.from, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 + .03 * prog(t, 0, SC.idea.from) }) },
  { from: SC.idea.from, to: SC.close.from, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 }) },
  { from: SC.close.from, to: DUR, cam: t => ({ cx: W / 2, cy: H / 2, k: 1 + .04 * prog(t, SC.close.from, DUR) }) },
];
const EVENTS = [                                                   // [seconds, sfx]: one sound per visible action
  [b(1), 'pop'], [SC.idea.from, 'whoosh'], [b(12), 'tick'], [b(20), 'ding'], [SC.close.from, 'swish'], [b(44), 'pop'], [b(64), 'notify'],
];
fits('curve draw', b(10), b(30), SC.idea.from, SC.idea.to);

// ---------- the world ----------
const AX = axes({ x: 900, y: 260, w: 800, h: 500, xmax: 10, ymax: 100, xlabel: 'time', ylabel: 'size', ticks: 10 });
const grow = u => Math.pow(1.5, u) * 100 / Math.pow(1.5, 10);
function world(t) {
  blob(500, 880, 1, { grow: back(prog(t, b(1), b(2))), mood: t > b(20) ? 'happy' : 'plain', look: t > SC.idea.from ? 1 : 0, blink: blinkAt(t) });
  if (t > SC.idea.from && t < SC.close.from + 1) {
    const out = ease(prog(t, SC.close.from, SC.close.from + .8));
    ctx.save(); ctx.translate(0, out * 1200);
    AX.draw(prog(t, b(9), b(11)));
    const tip = plot(AX, grow, 0, 10, prog(t, b(12), b(30)), VAR.yellow);
    if (tip) thread(tip[0], tip[1], 14);
    ctx.restore();
  }
  if (t > SC.close.from) {                                         // one shape becomes the next
    const a = SHAPE.circle(1300, 520, 180), s2 = SHAPE.star(1300, 520, 220);
    fillPts(morph(a, s2, prog(t, b(44), b(46))), VAR.blue);
  }
}

// ---------- words, next to the action (never in corners) ----------
function words(t) {
  kine('Meet *Blob.*', 820, 480, t, b(2), b(7.4), { size: 110 });
  eq([['s', VAR.yellow], [' = '], ['1.5', TEXT], ['^t', VAR.blue]], 900, 190, t, b(13), b(39.4), { size: 80 });
  kine('Slow, then *sudden.*', 900, 900, t, b(22), b(39.4), { size: 64 });
  kine('Same idea, *new shape.*', 1300, 900, t, b(46), DUR + 5, { size: 72, align: 'center' });
}
finish();
