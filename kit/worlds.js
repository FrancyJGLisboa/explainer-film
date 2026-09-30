// ================= explainer-film worlds: environments with depth, light and grain =================
// A film opts in with:  function backdrop(t, cam) { WORLD.landscape(t, cam); }
// Layers use parallax(cam, depth, fn): depth 0 = fixed (sky), 1 = moves with the world camera.
// Backdrops stay dark and flat-banded (no gradient skies): Kurzgesagt depth comes from stacked
// silhouettes that get darker toward the viewer, soft light pools and a fine grain.
// QC hides the backdrop when it measures frame fill and text-over-art (it still counts for contrast).

function hexOf(c) {                                // accepts #rgb, #rrggbb or rgb(a,b,c); returns #rrggbb
  if (c[0] === '#') return c.length === 4 ? '#' + [...c.slice(1)].map(h => h + h).join('') : c.slice(0, 7);
  const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(v => Math.round(+v)); return '#' + m.map(v => v.toString(16).padStart(2, '0')).join('');
}
const shade = (c, k) => hexOf(tint(hexOf(c), k));   // tint that always takes and returns hex
const rgbStr = c => rgbOf(hexOf(c)).join(',');
const mixHex = (a, b2, k) => { const A = rgbOf(hexOf(a)), B = rgbOf(hexOf(b2)); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };
const AIR = '#4a6cb0', NIGHTFALL = '#060a16';          // lighten toward air (blue), darken toward night: never toward grey
function parallax(cam, depth, fn) {
  withCamera({ cx: lerp(W / 2, cam.cx, depth), cy: lerp(H / 2, cam.cy, depth), k: lerp(1, cam.k, depth) }, fn);
}
function bandsFill(y0, cols, h) { cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-W, y0 + i * h, W * 3, i === cols.length - 1 ? H * 3 : h + 1); }); }
function ridge(seed, y, amp, col, o = {}) {        // a silhouette band (hills, dunes, waves at rest)
  const { freq = .0022, x0 = -W, x1 = W * 2, step = 16, bottom = H * 2 } = o;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += step) ctx.lineTo(x, y - amp * (vnoise(x * freq + seed * 17, seed) * .8 + vnoise(x * freq * 3 + seed, seed + 9) * .2));
  ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
}
function sunDisc(x, y, r, col, t = 0) {
  glow(x, y, r * 4, rgbStr(col), .22); glow(x, y, r * 2, rgbStr(col), .3); circ(x, y, r, col);
  ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = .25; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832 + t * .05; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); ctx.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); ctx.stroke(); }
  ctx.restore();
}
function cloud(x, y, s, col) { [[-60, 10, 50], [0, -10, 70], [70, 8, 48], [30, 20, 55], [-30, 22, 45]].forEach(([dx, dy, r]) => circ(x + dx * s, y + dy * s, r * s, col)); }
function cloudsLayer(t, seed, y, col, n = 5, speed = 8) {
  for (let i = 0; i < n; i++) { const x = ((hash2(i, seed) * W * 1.6 + t * speed * (.6 + hash2(i, seed + 1))) % (W * 1.6)) - W * .3;
    cloud(x, y + (hash2(i, seed + 2) - .5) * 120, .6 + hash2(i, seed + 3) * .8, col); }
}
function starsLayer(t, n = 160, seed = 3, col = '245,240,230') {
  for (let i = 0; i < n; i++) { const tw = .5 + .5 * Math.sin(t * (1 + hash2(i, seed + 4) * 3) + i);
    circ(hash2(i, seed) * W, hash2(i, seed + 1) * H, .8 + hash2(i, seed + 2) * 2, `rgba(${col},${(.15 + hash2(i, seed + 3) * .5) * (.5 + .5 * tw)})`); }
}
function planet(x, y, r, col, o = {}) {           // flat planet: lit half, shadow half, optional ring
  const { ring = false, band = null } = o;
  if (ring) { ctx.save(); ctx.strokeStyle = shade(col, 1.3); ctx.globalAlpha = .6; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.ellipse(x, y, r * 1.7, r * .35, -.25, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.restore(); }
  glow(x, y, r * 1.6, rgbStr(col), .18); circ(x, y, r, col);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  if (band) [-.35, .1, .45].forEach((k, i) => { ctx.fillStyle = i % 2 ? band : shade(band, 1.1); ctx.fillRect(x - r, y + k * r, r * 2, r * .16); });
  ctx.fillStyle = 'rgba(5,8,20,.35)'; ctx.beginPath(); ctx.arc(x + r * .45, y + r * .25, r * 1.05, 0, 7); ctx.fill(); ctx.restore();
  if (ring) { ctx.save(); ctx.strokeStyle = shade(col, 1.3); ctx.globalAlpha = .8; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.ellipse(x, y, r * 1.7, r * .35, -.25, 0, Math.PI); ctx.stroke(); ctx.restore(); }
}
function skylineLayer(seed, y, col, winCol = null, t = 0, o = {}) {   // blocks of buildings; lit windows twinkle
  const { x0 = -W * .5, x1 = W * 1.5, minH = 120, maxH = 420 } = o;
  for (let x = x0, i = 0; x < x1; i++) { const w = 70 + hash2(i, seed) * 110, h = minH + hash2(i, seed + 1) * (maxH - minH);
    ctx.fillStyle = col; ctx.fillRect(x, y - h, w - 6, h + H);
    if (winCol) for (let wy = y - h + 24; wy < y - 20; wy += 34) for (let wx = x + 14; wx < x + w - 24; wx += 26) {
      const on = hash2(Math.floor(wx), Math.floor(wy) + seed) > .62 + .1 * Math.sin(t * .7 + wx * .01); if (on) { ctx.fillStyle = winCol; ctx.fillRect(wx, wy, 10, 14); } }
    x += w; }
}
function wavesLayer(t, y, col, amp = 14, speed = 1, seed = 1) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-W, H * 2);
  for (let x = -W; x <= W * 2; x += 14) ctx.lineTo(x, y + Math.sin(x * .006 + t * speed + seed) * amp + Math.sin(x * .017 - t * speed * 1.3 + seed * 2) * amp * .4);
  ctx.lineTo(W * 2, H * 2); ctx.closePath(); ctx.fill();
}
function membrane(x, y, r, col, t = 0, seed = 1, o = {}) {   // a wobbly cell, nucleus optional
  const { nucleus = null, n = 60 } = o, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832, k = 1 + .06 * Math.sin(a * 3 + t * 1.3 + seed) + .04 * Math.sin(a * 5 - t * .9 + seed * 2); pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
  fillPts(pts, col); strokeLine([...pts, pts[0]], shade(col, 1.25), Math.max(2, r * .05));
  if (nucleus) { circ(x + r * .15, y - r * .1, r * .35, nucleus); circ(x + r * .05, y - r * .2, r * .1, shade(nucleus, 1.3)); }
}
let GRAIN = null;                                  // fine film grain, computed once
function grain(alpha = .06) {
  if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = 512; GRAIN.height = 512; const g = GRAIN.getContext('2d'), im = g.createImageData(512, 512), r = rng(41);
    for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}

// ---------- ready-made worlds; o overrides colours. All keep the frame dark so words stay readable ----------
const WORLD = {
  space(t, cam, o = {}) {
    const { planetCol = VAR.blue, far = VAR.purple } = o;
    parallax(cam, 0, () => starsLayer(t, 180, 3));
    parallax(cam, .15, () => planet(W * .82, H * .22, 90, far, { ring: true }));
    parallax(cam, .35, () => planet(W * .5, H * 1.45, 620, mixHex(planetCol, BG, .55), { band: mixHex(planetCol, BG, .62) }));
  },
  landscape(t, cam, o = {}) {                      // dusk hills: flat sky bands, sun, clouds, three ridges
    const { sky = [mixHex(BG, AIR, .06), mixHex(BG, AIR, .13), mixHex(BG, AIR, .2)], sunCol = HERO, hills = [mixHex(BG, AIR, .1), mixHex(BG, NIGHTFALL, .3), mixHex(BG, NIGHTFALL, .55)] } = o;
    parallax(cam, 0, () => { bandsFill(-H, sky, H * .55); starsLayer(t, 60, 8); if (sunCol) sunDisc(W * .9, H * .6, 60, sunCol, t); });   // sunCol: null = no sun (when it would sit behind the explanation)
    if (o.clouds !== false) parallax(cam, .1, () => cloudsLayer(t, 5, H * .28, 'rgba(245,240,230,.07)', 5, 6));   // clouds: false when they sit behind panels
    parallax(cam, .25, () => ridge(1, H * .72, 160, hills[0]));
    parallax(cam, .5, () => ridge(2, H * .84, 120, hills[1], { freq: .003 }));
    parallax(cam, .8, () => ridge(3, H * .95, 70, hills[2], { freq: .004 }));
  },
  city(t, cam, o = {}) {
    const { win = 'rgba(244,211,94,.3)' } = o;
    parallax(cam, 0, () => { starsLayer(t, 80, 11); planet(W * .15, H * .2, 55, shade(TEXT, .9)); });
    parallax(cam, .2, () => skylineLayer(4, H * .86, mixHex(BG, AIR, .08), null, t, { minH: 160, maxH: 380 }));
    parallax(cam, .45, () => skylineLayer(7, H * .94, mixHex(BG, NIGHTFALL, .3), win, t, { minH: 90, maxH: 260 }));
    parallax(cam, .8, () => { ctx.fillStyle = mixHex(BG, NIGHTFALL, .55); ctx.fillRect(-W, H * .95, W * 3, H); });
  },
  ocean(t, cam, o = {}) {
    const { moon = TEXT } = o;
    parallax(cam, 0, () => { starsLayer(t, 90, 21); if (moon) sunDisc(W * .7, H * .25, 50, moon, 0); });   // moon: null = none
    parallax(cam, .2, () => wavesLayer(t, H * .72, mixHex(BG, AIR, .14), 10, .5, 1));
    parallax(cam, .45, () => wavesLayer(t, H * .82, mixHex(BG, AIR, .06), 16, .7, 2));
    parallax(cam, .8, () => wavesLayer(t, H * .92, mixHex(BG, NIGHTFALL, .35), 22, .9, 3));
  },
  paper(t, cam, o = {}) {                          // paper style: fibres, a soft vignette, faint ruled lines
    parallax(cam, 0, () => {
      ctx.save(); ctx.strokeStyle = mixHex(BG, TEXT, .06); ctx.lineWidth = 2; for (let y = H * .12; y < H; y += 64 * U) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore();
      for (let i = 0; i < 140; i++) { const x = hash2(i, 31) * W, y = hash2(i, 32) * H, l = 6 + hash2(i, 33) * 18, a = hash2(i, 34) * 6.28; strokeLine([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]], mixHex(BG, TEXT, .08), 1.5); }
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,.12)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
  },
  board(t, cam, o = {}) {                          // chalkboard style: old erased chalk smudges, a dusty ledge
    parallax(cam, 0, () => {
      ctx.save(); ctx.filter = 'blur(18px)'; for (let i = 0; i < 9; i++) ell(hash2(i, 41) * W, hash2(i, 42) * H, 120 + hash2(i, 43) * 260, 30 + hash2(i, 44) * 50, hash2(i, 45) * 3, 'rgba(240,240,230,.035)'); ctx.restore();
      ctx.fillStyle = mixHex(BG, '#000000', .35); ctx.fillRect(0, H - 22 * U, W, 22 * U);
      for (let i = 0; i < 60; i++) circ(hash2(i, 46) * W, H - 26 * U - hash2(i, 47) * 8 * U, 1 + hash2(i, 48) * 2, 'rgba(240,240,230,.18)');
    });
  },
  studio(t, cam, o = {}) {                         // newsroom style: a quiet grid, a lit top band, a thin rule
    parallax(cam, 0, () => {
      ctx.save(); ctx.strokeStyle = mixHex(BG, TEXT, .05); ctx.lineWidth = 1.5; for (let x = 0; x < W; x += 80 * U) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 80 * U) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore();
      ctx.fillStyle = mixHex(BG, TEXT, .04); ctx.fillRect(0, 0, W, SAFE.y0 + 8 * U);
      ctx.fillStyle = o.rule || WRONG; ctx.fillRect(0, SAFE.y0 + 8 * U, W * (.3 + .7 * clamp(t / 1.2)), 4 * U);
    });
  },
  grid(t, cam, o = {}) {                           // neon style: a perspective floor grid under a dark sky
    const col = o.col || VAR.purple;
    parallax(cam, 0, () => {
      const hy = H * .7; ctx.save(); ctx.globalAlpha = .22; ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 40 * U, hy); ctx.lineTo(W / 2 + i * 260 * U, H); ctx.stroke(); }
      for (let k = 0; k < 10; k++) { const y = hy + (H - hy) * Math.pow(((k + t * .4) % 10) / 10, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore(); starsLayer(t, 70, 51);
    });
  },
  micro(t, cam, o = {}) {                          // microscopic: drifting cells at three depths, soft focus behind
    const { cellCol = mixHex(BG, AIR, .18), nucleus = mixHex(BG, AIR, .38) } = o;   // neutral nuclei: red is reserved for what the film calls dangerous
    parallax(cam, .1, () => { ctx.save(); ctx.filter = 'blur(6px)'; for (let i = 0; i < 9; i++) membrane(hash2(i, 1) * W, (hash2(i, 2) * H + t * 6) % (H + 200) - 100, 60 + hash2(i, 3) * 90, shade(cellCol, .8), t, i); ctx.restore(); });
    parallax(cam, .35, () => { for (let i = 0; i < 6; i++) membrane(hash2(i, 5) * W, (hash2(i, 6) * H - t * 10 + H * 5) % (H + 300) - 150, 80 + hash2(i, 7) * 70, cellCol, t, i + 20, { nucleus }); });
    parallax(cam, .6, () => { for (let i = 0; i < 40; i++) circ((hash2(i, 9) * W + t * 12) % W, (hash2(i, 10) * H + t * 4) % H, 3 + hash2(i, 11) * 5, 'rgba(245,240,230,.08)'); });
  },
};
