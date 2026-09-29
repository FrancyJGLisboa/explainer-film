#!/usr/bin/env node
// tex.mjs <film-dir>: typeset src/tex.json with MathJax at build time -> tex/paths.json (glyph outlines, no fonts at runtime)
// src/tex.json: { "growth": "A = P\\,(1 + {\\color{#83c167} r})^{\\color{#fc6255} n}", ... }
// Output per key: { w, h, depth, glyphs: [{ d, m: [a,b,c,d,e,f], fill }] } in em units (1 = font size).
// The kit's tex()/texMorph() draw these as 3Blue1Brown does: each glyph outlined, then filled; matching glyphs move between equations.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

const film = resolve(process.argv[2] || '.'), src = join(film, 'src/tex.json');
if (!existsSync(src)) { console.log('no src/tex.json: nothing to typeset'); process.exit(0); }
const adaptor = liteAdaptor(); RegisterHTMLHandler(adaptor);
const doc = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: 'none' }) });

const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
function parseTransform(s) {
  let M = [1, 0, 0, 1, 0, 0]; if (!s) return M;
  for (const [, fn, args] of s.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === 'translate') M = mul(M, [1, 0, 0, 1, v[0], v[1] || 0]);
    else if (fn === 'scale') M = mul(M, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else if (fn === 'matrix') M = mul(M, v);
  }
  return M;
}
const out = {};
for (const [key, tex] of Object.entries(JSON.parse(readFileSync(src, 'utf8')))) {
  const node = doc.convert(tex, { display: true, em: 16, ex: 8, containerWidth: 1280 });
  const svg = adaptor.firstChild(node);
  const [vx, vy, vw, vh] = adaptor.getAttribute(svg, 'viewBox').split(/\s+/).map(Number);
  const glyphs = [];
  (function walk(n, M, fill) {
    if (adaptor.kind(n) === '#text') return;
    const tag = adaptor.kind(n), tr = adaptor.getAttribute(n, 'transform'), f = adaptor.getAttribute(n, 'fill');
    const M2 = mul(M, parseTransform(tr)), fill2 = f && f !== 'currentColor' && f !== 'none' ? f : fill;
    if (tag === 'path' && adaptor.getAttribute(n, 'd')) glyphs.push({ d: adaptor.getAttribute(n, 'd'), m: M2.map(v => +v.toFixed(3)), fill: fill2 });
    if (tag === 'rect') { const x = +adaptor.getAttribute(n, 'x'), y = +adaptor.getAttribute(n, 'y'), w = +adaptor.getAttribute(n, 'width'), h = +adaptor.getAttribute(n, 'height');
      glyphs.push({ d: `M${x} ${y}H${x + w}V${y + h}H${x}Z`, m: M2.map(v => +v.toFixed(3)), fill: fill2 }); }
    for (const c of adaptor.childNodes(n)) walk(c, M2, fill2);
  })(svg, [1, 0, 0, 1, -vx, -vy], null);
  // viewBox units are 1/1000 em
  out[key] = { w: vw / 1000, h: vh / 1000, glyphs: glyphs.map(g => ({ ...g, m: [g.m[0] / 1000, g.m[1] / 1000, g.m[2] / 1000, g.m[3] / 1000, g.m[4] / 1000, g.m[5] / 1000] })) };
}
mkdirSync(join(film, 'tex'), { recursive: true });
writeFileSync(join(film, 'tex/paths.json'), JSON.stringify(out));
console.log(`typeset ${Object.keys(out).length} expression(s): ${Object.entries(out).map(([k, v]) => `${k} (${v.glyphs.length} glyphs)`).join(', ')}`);
