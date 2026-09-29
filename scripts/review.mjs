#!/usr/bin/env node
// review.mjs <film-dir>: build the review packet for the independent reviewer.
// Two stills per scene (35% and 80% through), with the words on screen and the narration for that scene,
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
await browser.close();
writeFileSync(join(out, 'packet.md'), md);
console.log(`review packet: ${scenes.length} scenes, ${shots.length} stills -> ${out}`);
