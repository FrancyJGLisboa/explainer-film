#!/usr/bin/env node
// review.mjs <film-dir>: build the review packet for the independent reviewer.
// Two stills per scene (35% and 80% through), a 5-frame strip around every cut, with the words on screen and the narration for that scene,
// plus the brief. Output: <film>/qc/review/{NN_scene_a.jpg, NN_scene_b.jpg, packet.md}
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
    try { return createRequire(process.cwd() + '/')(name).chromium; } catch {}
  }
  throw new Error('playwright-core not found');
}
const film = resolve(process.argv[2]), out = join(film, 'qc/review');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const chromium = await loadChromium();
let browser; try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage();
await page.goto('file://' + join(film, 'piece.html') + '?render');
const scenes = await page.evaluate(() => window.SCENE_LIST || []);
const narr = existsSync(join(film, 'voice/timing.json')) ? JSON.parse(readFileSync(join(film, 'voice/timing.json'), 'utf8')).lines : [];
const title = await page.evaluate(() => document.title);
let md = `# Review packet: ${title}\n\n`;
md += `## Brief (from the maker)\n\n${existsSync(join(film, 'brief.md')) ? readFileSync(join(film, 'brief.md'), 'utf8') : '(no brief.md)'}\n\n`;
if (existsSync(join(film, 'refs/style.md'))) md += `## Reference style the film should follow (grammar only)\n\n${readFileSync(join(film, 'refs/style.md'), 'utf8')}\n\n`;
md += `## Scenes\n\n`;
const shots = [];
for (const [i, s] of scenes.entries()) {
  const lines = narr.filter(l => l.scene === s.name).map(l => `"${l.text}"`).join(' ') || '(no narration)';
  md += `### ${i + 1}. ${s.name} (${s.from.toFixed(1)}–${s.to.toFixed(1)} s)\nNarration: ${lines}\n`;
  for (const [tag, k] of [['a', .35], ['b', .8]]) {
    const t = s.from + (s.to - s.from) * k, f = Math.round(t * await page.evaluate(() => window.FPS));
    const res = await page.evaluate(f => { window.draw(f); return { img: document.querySelector('canvas').toDataURL('image/jpeg', .85).split(',')[1], text: (window.LAYOUT || []).filter(L => L.kind === 'text').map(L => L.id) }; }, f);
    const name = `${String(i + 1).padStart(2, '0')}_${s.name}_${tag}.jpg`;
    writeFileSync(join(out, name), Buffer.from(res.img, 'base64'));
    md += `- \`${name}\` at ${t.toFixed(1)} s. Words on screen: ${res.text.length ? res.text.map(x => `"${x}"`).join(', ') : '(none)'}\n`;
    shots.push(name);
  }
  md += '\n';
}
// transitions: a strip of 5 frames 0.2 s apart around every cut (and the opening), so the reviewer sees the motion, not just held states
md += `## Transitions (5 frames, 0.2 s apart, left to right)\n\n`;
const FPS = await page.evaluate(() => window.FPS);
const cuts = [[0, 'opening'], ...scenes.slice(1).map((s, i) => [s.from, `${scenes[i].name} -> ${s.name}`])];
for (const [i, [at, label]] of cuts.entries()) {
  const ts = (at === 0 ? [0, .2, .4, .6, .8] : [-.4, -.2, 0, .2, .4].map(d => at + d));
  const img = await page.evaluate(({ ts, FPS }) => {
    const c = document.querySelector('canvas'), k = 360 / c.height, w = Math.round(c.width * k), pad = 8;
    const o = document.createElement('canvas'); o.width = ts.length * (w + pad) - pad; o.height = 360; const g = o.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, o.width, o.height);
    ts.forEach((t, j) => { window.draw(Math.round(t * FPS)); g.drawImage(c, j * (w + pad), 0, w, 360); });
    return o.toDataURL('image/jpeg', .8).split(',')[1];
  }, { ts, FPS });
  const name = `t${String(i).padStart(2, '0')}_${label.replace(/\W+/g, '_')}.jpg`;
  writeFileSync(join(out, name), Buffer.from(img, 'base64'));
  md += `- \`${name}\`: ${label}, ${ts.map(t => t.toFixed(1) + ' s').join(', ')}\n`; shots.push(name);
}
md += '\n';
await browser.close();
writeFileSync(join(out, 'packet.md'), md);
console.log(`review packet: ${scenes.length} scenes, ${shots.length} stills -> ${out}`);
