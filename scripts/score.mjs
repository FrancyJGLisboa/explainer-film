#!/usr/bin/env node
// score.mjs piece.html out.wav: render the film's soundtrack alone (the SCORE, no voice, no video) in seconds,
// so music changes can be sync-checked without a full render: node sync-check.mjs out.mp4 --cues-file out.cues.json
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
    try { return createRequire(process.cwd() + '/')(name).chromium; } catch {}
  }
  throw new Error('playwright-core not found');
}
const [file, out] = process.argv.slice(2);
const chromium = await loadChromium();
let browser; try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage(); await page.goto('file://' + resolve(file) + '?render');
const { b64, cues } = await page.evaluate(async () => {
  const sr = 48000, n = Math.ceil(sr * window.FRAMES / window.FPS), ac = new OfflineAudioContext(2, n, sr); window.SCORE(ac);
  const buf = await ac.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), pcm = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let s = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768));
  return { b64: btoa(s), cues: window.CUES };
});
await browser.close();
const data = Buffer.from(b64, 'base64'), h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
h.writeUInt32LE(48000, 24); h.writeUInt32LE(48000 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
writeFileSync(out, Buffer.concat([h, data])); writeFileSync(out.replace(/\.wav$/, '.cues.json'), JSON.stringify(cues));
const mp4 = out.replace(/\.wav$/, '.mp4');   // sync-check wants a video stream: a tiny blank one
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=black:s=64x36:r=60', '-i', out, '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', mp4]);
console.log(`score: ${out} + ${mp4} (${(data.length / 192000).toFixed(1)} s)`);
