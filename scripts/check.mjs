#!/usr/bin/env node
// check.mjs piece.html [--every 0.25]: the explainer-film rules that a contact sheet can't show you reliably.
//  1. storyboard asserts (window.CHECKS: fits(), beat total = DUR, sounds inside the film)
//  2. contrast: each headline vs what is actually behind it (words hidden, pixels read)
//  3. corners: no text parked in a corner; no text running off the frame
//  4. headline length: 8 words max per line
//  5. text over art: a headline drawn across lines/shapes (not just low contrast)
//  6. frame fill: share of 40 px cells with anything drawn in them (thin 3b1b lines count): median >= 16%, no run of 4 s+ below 8%
// Exit 1 on any failure. Run from ~ so playwright resolves.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
    try { return createRequire(process.cwd() + '/')(name).chromium; } catch {}
  }
  throw new Error('playwright-core not found: run from ~ (where node_modules has playwright)');
}
const args = process.argv.slice(2), file = args[0];
const EVERY = (() => { const i = args.indexOf('--every'); return i < 0 ? .25 : Number(args[i + 1]); })();
if (!file) { console.error('usage: node check.mjs piece.html [--every 0.25]'); process.exit(1); }
const chromium = await loadChromium();
let browser; try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('file://' + resolve(file) + '?render');
const res = await page.evaluate(EVERY => {
  const c = document.querySelector('canvas'), x = c.getContext('2d'), W = c.width, H = c.height;
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const out = { low: {}, corner: {}, off: {}, over: {}, fill: [] };
  const BGC = hex(window.BG_HEX || '#000000'), dist = (d, i) => Math.abs(d[i] - BGC[0]) + Math.abs(d[i + 1] - BGC[1]) + Math.abs(d[i + 2] - BGC[2]),
        isInk = (d, i) => dist(d, i) > 45, isArt = (d, i) => dist(d, i) > 90;   // faint grids count as fill, not as art under text
  let lastFill = -1;
  window.setHideWords(true);
  for (let t = 0; t * window.FPS < window.FRAMES; t += EVERY) {
    window.draw(Math.round(t * window.FPS));
    if (t - lastFill >= 1 - 1e-9) { lastFill = t; const d = x.getImageData(0, 0, W, H).data, CELL = 40, occ = new Set();
      for (let y = 0; y < H; y += 3) for (let xx = 0; xx < W; xx += 3) if (isInk(d, (y * W + xx) * 4)) occ.add(Math.floor(y / CELL) * 1000 + Math.floor(xx / CELL));
      out.fill.push([+t.toFixed(2), occ.size / (Math.ceil(W / CELL) * Math.ceil(H / CELL))]); }
    for (const L of window.LAYOUT || []) {
      if (L.kind !== 'text') continue;
      const cx = L.x + L.w / 2, cy = L.y + L.h / 2, key = L.id, ts = t.toFixed(2);
      if ((cx < W * .12 || cx > W * .88) && (cy < H * .14 || cy > H * .86)) (out.corner[key] ||= []).push(ts);
      const onScreen = L.x + L.w > 0 && L.y + L.h > 0 && L.x < W && L.y < H;
      if (!onScreen) continue;
      if (L.x < -2 || L.y < -2 || L.x + L.w > W + 2 || L.y + L.h > H + 2) (out.off[key] ||= []).push(ts);
      if (L.own || !L.col || !L.col.startsWith('#')) continue;
      const [r0, g0, b0] = hex(L.col), lt = lum(r0, g0, b0);
      const bx = Math.max(0, Math.floor(L.x)), by = Math.max(0, Math.floor(L.y)), bw = Math.min(W - bx, Math.ceil(L.w)), bh = Math.min(H - by, Math.ceil(L.h));
      if (bw <= 0 || bh <= 0) continue;
      const d = x.getImageData(bx, by, bw, bh).data; let n = 0, bad = 0, art = 0;
      for (let i = 0; i < d.length; i += 4 * 5) { const lb = lum(d[i], d[i + 1], d[i + 2]), ratio = (Math.max(lt, lb) + .05) / (Math.min(lt, lb) + .05); n++; if (ratio < 3) bad++; if (isArt(d, i)) art++; }
      if (n && bad / n > .12) (out.low[key] ||= []).push(ts);
      else if (n && art / n > .008) (out.over[key] ||= []).push(ts);
    }
  }
  window.setHideWords(false);
  out.words = window.getWords().filter(s => s.split(' ').length > 8);
  out.checks = window.CHECKS;
  return out;
}, EVERY);
await browser.close();
const span = ts => ts.length > 1 ? `${ts[0]}-${ts[ts.length - 1]}s` : `${ts[0]}s`;
const fails = [];
res.checks.forEach(c => fails.push(`storyboard: ${c}`));
Object.entries(res.low).forEach(([k, ts]) => fails.push(`contrast: "${k}" is hard to read against what is behind it at ${span(ts)}`));
Object.entries(res.corner).forEach(([k, ts]) => fails.push(`corner: "${k}" sits in a corner at ${span(ts)}`));
Object.entries(res.off).forEach(([k, ts]) => fails.push(`off-frame: "${k}" runs off the frame at ${span(ts)}`));
Object.entries(res.over).forEach(([k, ts]) => fails.push(`text over art: "${k}" is drawn across lines or shapes at ${span(ts)}; move it to empty space`));
const fl = res.fill.map(f => f[1]).sort((a, b) => a - b), med = fl[Math.floor(fl.length / 2)] || 0;
if (med < .16) fails.push(`frame fill: the median frame uses only ${(med * 100).toFixed(0)}% of the frame (need >= 16%): scale up the hero and the main visual, spread the diagram across the free two thirds`);
let run = []; for (const [t, v] of [...res.fill, [1e9, 1]]) { if (v < .08) run.push(t); else { if (run.length >= 4) fails.push(`frame fill: nearly empty frames from ${run[0]}s to ${run[run.length - 1]}s`); run = []; } }
res.words.forEach(s => fails.push(`too long: "${s}" (${s.split(' ').length} words; max 8 per line)`));
errors.forEach(e => fails.push(`page error: ${e}`));
if (fails.length) { console.log(fails.join('\n')); console.log(`\n${fails.length} rule failure(s).`); process.exit(1); }
console.log(`CLEAN: storyboard, claims, contrast, text over art, corners, frame edges, headline length and frame fill (median ${(med * 100).toFixed(0)}%) all pass.`);
