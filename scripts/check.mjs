#!/usr/bin/env node
// check.mjs piece.html [--every 0.25]: the explainer-film rules that a contact sheet can't show you reliably.
//  1. storyboard asserts (window.CHECKS: fits(), beat total = DUR, sounds inside the film)
//  2. contrast: each headline vs what is actually behind it (words hidden, pixels read)
//  3. corners: no text parked in a corner; no text running off the frame
//  4. headline length: 8 words max per line
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
  const out = { low: {}, corner: {}, off: {} };
  window.setHideWords(true);
  for (let t = 0; t * window.FPS < window.FRAMES; t += EVERY) {
    window.draw(Math.round(t * window.FPS));
    for (const L of window.LAYOUT || []) {
      if (L.kind !== 'text') continue;
      const cx = L.x + L.w / 2, cy = L.y + L.h / 2, key = L.id, ts = t.toFixed(2);
      if ((cx < W * .12 || cx > W * .88) && (cy < H * .14 || cy > H * .86)) (out.corner[key] ||= []).push(ts);
      if (L.x < -2 || L.y < -2 || L.x + L.w > W + 2 || L.y + L.h > H + 2) (out.off[key] ||= []).push(ts);
      if (L.own || !L.col || !L.col.startsWith('#')) continue;
      const [r0, g0, b0] = hex(L.col), lt = lum(r0, g0, b0);
      const bx = Math.max(0, Math.floor(L.x)), by = Math.max(0, Math.floor(L.y)), bw = Math.min(W - bx, Math.ceil(L.w)), bh = Math.min(H - by, Math.ceil(L.h));
      if (bw <= 0 || bh <= 0) continue;
      const d = x.getImageData(bx, by, bw, bh).data; let n = 0, bad = 0;
      for (let i = 0; i < d.length; i += 4 * 5) { const lb = lum(d[i], d[i + 1], d[i + 2]), ratio = (Math.max(lt, lb) + .05) / (Math.min(lt, lb) + .05); n++; if (ratio < 3) bad++; }
      if (n && bad / n > .12) (out.low[key] ||= []).push(ts);
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
res.words.forEach(s => fails.push(`too long: "${s}" (${s.split(' ').length} words; max 8 per line)`));
errors.forEach(e => fails.push(`page error: ${e}`));
if (fails.length) { console.log(fails.join('\n')); console.log(`\n${fails.length} rule failure(s).`); process.exit(1); }
console.log('CLEAN: storyboard, contrast, corners, frame edges and headline length all pass.');
