# Kit API

Every function draws on the current canvas `ctx`, under whatever camera is active. `t` is in seconds, and `b(n)` turns beats into seconds.
`p` is a progress value from 0 to 1 (use `prog(t, start, end)`). Easing comes from the starter library: `ease`, `easeOut`, `back` (overshoot), `lerp`, `clamp`, `prog`, `hash2` (deterministic noise).

## Layout (platform-aware)
| name | notes |
|---|---|
| `PLATFORM`, `W`, `H` | set by `film.sh new ... <platform>` in src/head.js |
| `SAFE` | `{x0, y0, x1, y1}`: the area clear of the app's own buttons, captions and progress bar. Words must stay inside |
| `ZONE.head / visual / hero / caption` | where the headline band, the main visual (`{x, y, w, h}`), the hero (`{x, y, s}`) and captions go on this platform |
| `U` | one unit: 1 at 1080 px on the short side; multiply sizes by it |
| `kine(..., {maxW})` | a headline shrinks a little, or wraps into two balanced lines, to stay inside the safe zone |

## Storyboard
| call | what it does |
|---|---|
| `scenes([name, beats], ...)` | returns `SC.name = {from, to}` in seconds. Names must be identifiers, and the beats must add up to DUR |
| `fits(label, start, end, lo, hi)` | fails the check if the action `[start, end]` runs outside its scene `[lo, hi]` |
| `shows(label, ok, detail?)` | fails the check if a reality-map test is false |
| `bend(fn, u0, u1)` | end slope divided by start slope: 1 is a straight line, ≥ 5 reads as "explodes", < 1 is flattening |
| `finish()` | last line of scenes.js: validates SECTIONS/SHOTS/EVENTS and wires up draw and score |

The film defines `BPM, BEAT, b`, `SC`, `MUSIC {kit, harmony, key, sfxGain}`, `SECTIONS [[fromBar, toBar, layers]]` (contiguous, 1 bar = 4 beats),
`SHOTS [{from, to, cam: t => ({cx, cy, k})}]` (contiguous, one per scene), `EVENTS [[seconds, sfx, arg?]]`, `world(t)` and `words(t)`.
It can also define `backdrop(t)` to replace the default `motes(t)`.
Music layers: pad, pluck, hat8, kick2, kick4, bassHalf, clap. Harmonies: bright, wistful, dreamy, tense, folk, blues.

## Narration (only when `src/narration.json` exists and `film.sh voice` has run)
| call | notes |
|---|---|
| `said(scene, i=0)` | `{at, to}`: when line i of that scene is spoken. Use it to time visuals and words to the voice |
| `speaking(t)` | true while any line is playing (e.g. `mood` / `squash` on the hero) |
| `NARRATION` | the timing.json (null for a music-only film). `finish()` fails the check if a line overruns its scene |

## Worlds (backdrops; define `backdrop(t, cam)` in scenes.js)
| call | notes |
|---|---|
| `WORLD.landscape / space / city / ocean / micro(t, cam, o?)` | ready-made environments with parallax depth. `o` overrides colours (e.g. `{sunCol}`, `{planetCol}`, `{cellCol}`) |
| `parallax(cam, depth, fn)` | draw your own layer: depth 0 is fixed, 1 moves with the world |
| `ridge`, `sunDisc`, `cloudsLayer`, `starsLayer`, `planet`, `skylineLayer`, `wavesLayer`, `membrane` | building blocks for custom worlds |
| `mixHex(a, b, k)`, `AIR`, `NIGHTFALL` | lighten toward blue air or darken toward night (never toward grey) |
| `LOOK.grain` | film-grain strength (default .06; 0 turns it off) |

## Maths typesetting (src/tex.json → typeset at build time)
| call | notes |
|---|---|
| `tex(key, x, y, t, at, out, {size=80, align, col})` | real LaTeX, drawn on glyph by glyph (outline, then fill). `y` is the vertical centre |
| `texMorph(a, b, x, y, p, {size, align})` | glyphs shared by both equations travel to their new places; the rest shrink out or grow in |
| `texBox(key, size)` | `{w, h}` for layout |

## Interaction (show contact, then the result)
| call | notes |
|---|---|
| `pathogen(x, y, r, col, {kind, spikes, t, hit})` | spiky particle; each spike ends in a key of `kind` ('tri' / 'square' / 'round'); `hit` 0..1 squashes it |
| `spikeTip(x, y, r, i, {spikes, t})` | `[x, y, angle]` where spike i ends: aim things at it |
| `antibody(x, y, s, rot, col, {kind})` | a Y whose tips are locks that fit keys of the same `kind` (a true "fits only its match") |
| `bindTo(px, py, r, i, p, col, {kind, spikes, t, from, s})` | the whole contact move: an antibody flies in and locks its arms onto spike i. Returns true once locked |
| `lockOn(x0, y0, x1, y1, p)` | `[x, y, locked]`: travel and snap on at p = 1 (for your own shapes) |
| `burst(x, y, t, at, col, r)` | destroyed: pieces fly out and shrink |
| `badge(x, y, r, p, {icon: 'star' / 'check' / text, col})` | mark a changed state (memory, trained, infected) |

## Chapters
| call | notes |
|---|---|
| `chapterCard(n, title, t, at, out)` | a big number in a THREAD disc, plus the title |

## Words (screen space, inside `words(t)`)
| call | notes |
|---|---|
| `kine(str, x, y, t, at, out, {size=72, col=TEXT, align='left', w=800})` | a headline. Words spring up at `at` and leave upward at `out`. `*word*` uses the THREAD colour; `{word\|#hex}` uses any colour |
| `callout(str, px, py, lx, ly, p, {bg, fg, size, align})` | label something without covering it: the pill sits in empty space at (lx, ly) with a leader line and dot at the point it names (px, py) |
| `pill(str, x, y, p, {bg, fg, size=28, align, id})` | a small label on its own background. Use `inOut(t, a, z)` to open and close it |
| `bubble(x, y, w, h, p, txt, {size, type})` | a speech bubble growing from its tail tip at (x, y). `type` is 0..1 typing progress |
| `eq(parts, x, y, t, at, out, {size=72, align})` | coloured maths. Parts look like `[['A', VAR.yellow], [' = '], ['^n', VAR.red], ['_0']]`: `^` raises a part, `_` lowers it |

## 3Blue1Brown parts
| call | notes |
|---|---|
| `axes({x, y, w, h, xmax, ymax, xlabel, ylabel, ticks})` | returns `{X(u), Y(v), draw(p)}`: map data to pixels, then draw the axes on |
| `plot(ax, fn, u0, u1, p, col, lw)` | draws the curve on from left to right and returns its tip `[x, y]` (put `thread` there) |
| `arrow(x0, y0, x1, y1, p, col, lw, head)` | grows from its tail |
| `brace(x0, x1, y, p, label, col, {size, dir})` | curly brace under a span (`dir: -1` puts it above) |
| `grid(x, y, w, h, step, p)` | faint coordinate plane |
| `numberLine(x, y, w, min, max, p, {step})` | returns `X(u)` |
| `bars(x, y, w, h, values, max, p, cols)` | bars grow one after another. Returns `top(i) → [x, y]`. To morph, interpolate `values` |
| `SHAPE.circle/rect/star/poly(...)` + `morph(a, b, p)` + `fillPts(pts, col)` | one shape becomes the next (same point count) |
| `writeOn(pts, p, col, fillCol)` | draws the outline, then fills it |
| `pathAlong(pts, u)` | the point a fraction `u` of the way along a polyline, for a dot travelling a route |
| `counter(n)` | 1,000,000 formatting |

## Kurzgesagt parts (world space, inside `world(t)`)
| call | notes |
|---|---|
| `blob(x, y, s, st)` | round creature standing on (x, y), about 300·s tall. Extra state: `walk` (step phase, e.g. `t * 2`), `talk` (0..1, `voiceLevel(t)`), `waveR` (pass `t`), moods surprised/worried/excited with brows |
| `crowd(x, y, w, h, n, t, {mark, markCol, cols, p})` | n small creatures; `mark` of them in `markCol` at scattered positions (a true proportion) |
| `robot(x, y, s, st)` | Bit, about 530·s tall. Extra state: `dials[5]` (−1..1), `meter` (0..1), `dialGlow`, `antenna`, `eyeR` |
| state `st` | `grow` (0..1, use `back`), `mood` plain\|happy\|sad\|think, `look` −1..1, `blink` (`blinkAt(t)`), `tilt`, `squash`, `armL`/`armR` (0 is down, about 2.4 is up), `winkR`, `body` colour |
| `card(x, y, s, pic, {face, rot, blur, mark:'ok'\|'no', markP})` | a 260×320 card. `pic()` draws centred on 0,0. `face` 0→1 flips it over |
| `stamp(x, y, r, ok, p)` | ✓ or ✗ landing like a stamp |
| `glove(x, y, rot)` | a helper's hand |
| `confetti(t, at, x, y)` | a burst that shrinks away |
| `thread(x, y, r)` | the one continuous shape: a glowing dot |
| `circ(x, y, r, col)`, `ell(x, y, rx, ry, rot, col)`, `rr(x, y, w, h, radius, col)`, `tri(x1, y1, x2, y2, x3, y3, col)` | flat filled shapes |
| `strokeLine([[x, y], ...], col, width)` | a round-capped polyline (use it for antibody Y-shapes, rays, links) |
| `glow(x, y, r, 'r,g,b', alpha)` | soft light |
| `ctx.roundRect(...)` | the standard canvas API: works in every browser the renderer uses |

## Palette (src/head.js)
`BG, DEEP, DISC, TEXT, MUTED, THREAD, WRONG, HERO, CARD`, plus `VAR.{blue, yellow, green, gold, red, purple, teal}` (3b1b colours).
The QC contrast and fill checks read `BG`.
