# Kit API

Every function draws on the current canvas `ctx`, under whatever camera is active. `t` is in seconds, and `b(n)` turns beats into seconds.
`p` is a progress value from 0 to 1 (use `prog(t, start, end)`). Easing comes from the starter library: `ease`, `easeOut`, `back` (overshoot), `lerp`, `clamp`, `prog`, `hash2` (deterministic noise).

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

## Words (screen space, inside `words(t)`)
| call | notes |
|---|---|
| `kine(str, x, y, t, at, out, {size=72, col=TEXT, align='left', w=800})` | a headline. Words spring up at `at` and leave upward at `out`. `*word*` uses the THREAD colour; `{word\|#hex}` uses any colour |
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
| `blob(x, y, s, st)` | round creature standing on (x, y), about 300·s tall |
| `robot(x, y, s, st)` | Bit, about 530·s tall. Extra state: `dials[5]` (−1..1), `meter` (0..1), `dialGlow`, `antenna`, `eyeR` |
| state `st` | `grow` (0..1, use `back`), `mood` plain\|happy\|sad\|think, `look` −1..1, `blink` (`blinkAt(t)`), `tilt`, `squash`, `armL`/`armR` (0 is down, about 2.4 is up), `winkR`, `body` colour |
| `card(x, y, s, pic, {face, rot, blur, mark:'ok'\|'no', markP})` | a 260×320 card. `pic()` draws centred on 0,0. `face` 0→1 flips it over |
| `stamp(x, y, r, ok, p)` | ✓ or ✗ landing like a stamp |
| `glove(x, y, rot)` | a helper's hand |
| `confetti(t, at, x, y)` | a burst that shrinks away |
| `thread(x, y, r)` | the one continuous shape: a glowing dot |
| `circ`, `ell`, `rr`, `tri`, `strokeLine`, `glow` | flat primitives |

## Palette (src/head.js)
`BG, DEEP, DISC, TEXT, MUTED, THREAD, WRONG, HERO, CARD`, plus `VAR.{blue, yellow, green, gold, red, purple, teal}` (3b1b colours).
The QC contrast and fill checks read `BG`.
