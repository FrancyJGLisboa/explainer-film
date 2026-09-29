#!/usr/bin/env node
// narrate-plan.mjs piece.html -> prints [{file, at}] (seconds) for the mix step
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
    try { return createRequire(process.cwd() + '/')(name).chromium; } catch {}
  }
  throw new Error('playwright-core not found');
}
const chromium = await loadChromium();
let browser; try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const page = await browser.newPage(); await page.goto('file://' + resolve(process.argv[2]) + '?render');
console.log(JSON.stringify(await page.evaluate(() => window.NARRATION_PLAN || [])));
await browser.close();
