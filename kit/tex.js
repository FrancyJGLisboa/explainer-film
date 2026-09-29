// ================= explainer-film tex: LaTeX drawn like 3Blue1Brown =================
// src/tex.json holds the LaTeX ({"growth": "A = P(1 + {\\color{#83c167} r})^{n}"}); film.sh typesets it at build time
// into glyph outlines (TEXPATHS). Colour symbols with \color{#hex}{...} and keep each quantity's VAR colour.
const P2D = new Map(); const p2d = d => { let p = P2D.get(d); if (!p) { p = new Path2D(d); P2D.set(d, p); } return p; };
function texBox(key, size = 80) { const e = TEXPATHS && TEXPATHS[key]; return e ? { w: e.w * size, h: e.h * size } : { w: 0, h: 0 }; }
function texOrigin(key, x, y, size, align) { const { w, h } = texBox(key, size); return [align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y - h / 2]; }
const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
function drawGlyph(g, M, col, p = 1) {            // p < 1: outline being drawn, fill arriving (3b1b "Write")
  ctx.save(); ctx.transform(...M);                // M: glyph units -> current space
  const path = p2d(g.d), c = g.fill || col;
  if (p < 1) { ctx.strokeStyle = c; ctx.lineWidth = 22; ctx.lineJoin = 'round'; ctx.setLineDash([4000 * clamp(p / .6), 4000]); ctx.stroke(path); ctx.setLineDash([]); }
  if (p > .5) { ctx.globalAlpha *= prog(p, .5, 1); ctx.fillStyle = c; ctx.fill(path); }
  ctx.restore();
}
// tex(key, x, y, t, at, out, {size, align, col}): y is the vertical centre. Glyphs write on one after another;
// at `out` they slide up out of their line (no plain fade).
function tex(key, x, y, t, at, out, o = {}) {
  const { size = 80, align = 'left', col = TEXT, stagger = .045, write = .55, id = 'tex ' + key } = o;
  const e = TEXPATHS && TEXPATHS[key];
  if (!e) { if (!CHECKS.some(c => c.includes(`tex "${key}"`))) CHECKS.push(`tex "${key}" is not in src/tex.json (or film.sh could not typeset it)`); return; }
  if (t < at || t > out + 1) return;
  const [x0, y0] = texOrigin(key, x, y, size, align), w = e.w * size, h = e.h * size;
  if (!HIDE_WORDS) {
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 30, y0 - h * .4, w + 60, h * 1.8); ctx.clip();
    e.glyphs.forEach((g, i) => {
      const p = prog(t, at + i * stagger, at + i * stagger + write), q = ease(prog(t, out + i * stagger * .4, out + i * stagger * .4 + .4));
      if (p <= 0) return;
      drawGlyph(g, mulM([size, 0, 0, size, x0, y0 - q * h * 1.6], g.m), col, p);
    });
    ctx.restore();
  }
  if (t > at + .3 && t < out) claimText(id, x0, y0, w, h, col);
}
// texMorph(a, b, x, y, p, {size, align}): equation a becomes equation b. Glyphs with the same outline travel to their new place;
// the rest shrink away (from a) or grow in (from b). The 3b1b "transform matching" move.
function texMorph(a, b2, x, y, p, o = {}) {
  const { size = 80, align = 'left', col = TEXT, id = 'tex ' + b2 } = o;
  const A = TEXPATHS && TEXPATHS[a], B = TEXPATHS && TEXPATHS[b2]; if (!A || !B) { CHECKS.push(`texMorph: "${a}" or "${b2}" missing from src/tex.json`); return; }
  const [ax, ay] = texOrigin(a, x, y, size, align), [bx, by] = texOrigin(b2, x, y, size, align), e = ease(p);
  const MA = g => mulM([size, 0, 0, size, ax, ay], g.m), MB = g => mulM([size, 0, 0, size, bx, by], g.m);
  const used = new Set(), pairs = [], born = [];
  B.glyphs.forEach(g => { const j = A.glyphs.findIndex((h, k) => !used.has(k) && h.d === g.d); if (j >= 0) { used.add(j); pairs.push([A.glyphs[j], g]); } else born.push(g); });
  if (!HIDE_WORDS) {
    A.glyphs.forEach((g, k) => { if (used.has(k)) return; const s = 1 - ease(prog(p, 0, .5)); if (s <= 0) return; ctx.save(); ctx.globalAlpha *= s; drawGlyph(g, MA(g), col); ctx.restore(); });
    pairs.forEach(([ga, gb]) => { const ma = MA(ga), mb = MB(gb); drawGlyph(e < .5 ? ga : gb, ma.map((v, i) => lerp(v, mb[i], e)), col); });
    born.forEach(g => { const s = ease(prog(p, .5, 1)); if (s <= 0) return; ctx.save(); ctx.globalAlpha *= s; drawGlyph(g, MB(g), col); ctx.restore(); });
  }
  if (p > .95) claimText(id, bx, by, B.w * size, B.h * size, col);
}
