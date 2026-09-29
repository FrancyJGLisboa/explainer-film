---
name: explainer-film
description: Turn a hunch about a topic, or a pasted transcript/article, into a finished animated explainer MP4 (default 45 s, 16:9, music only) in a Kurzgesagt x 3Blue1Brown style whose pictures keep the structure of the real thing, so viewers can reason with them. Use when someone says "make an explainer/animation/video about X", "explain X visually", "animate this transcript/text/article", "turn this into a motion-graphics video", or gives a one-line hunch and wants it animated. Plain natural language is enough; no config. NOT for B-roll over an existing talking-head video (use motion-broll) or product ads (product-video pipeline).
---

# explainer-film

The user gives one of two things: a **hunch** ("why compound interest feels slow then explodes") or a **transcript/text**
(pasted, or a file path). They get back an MP4 that has passed every check. Everything below runs without asking the user anything.

Tools: `scripts/film.sh` (this folder). The parts kit is `kit/kit.js`. The style rules are `references/style.md`; read them once per film.
The API reference is `kit/KIT.md`. The scaffolded `src/scenes.js` is a complete 7-scene film that passes every check: copy its structure and composition.
A second worked example is `examples/how-ai-learns/` (made before the kit existed).

## Defaults (change only when the user's words say so)
- 45 s, 16:9 1920×1080, 60 fps, music only (no narrator), in the language of the input.
- Time grid: 1 beat = 60 / BPM s, 1 bar = 4 beats. 45 s at 96 bpm = 72 beats = 18 bars. SC counts beats, SECTIONS counts bars.
- "vertical" / "reels" / "tiktok" → W = 1080, H = 1920 (hero on top, visual below). "60 seconds" → DUR = 60 = 96 beats = 24 bars (beats = DUR × BPM / 60).
- Films go in `~/films/<slug>/`.

## Pipeline

**1. Scaffold.** `film.sh new <slug> "<Title>"` prints the folder.

**2. Brief (`brief.md`).** Fill in the template:
- **Core idea:** one sentence.
- **Hunch:** research the mechanism first. If facts or numbers matter, use web search, and prefer primary sources.
- **Transcript:** condense to its 1 core idea and 6–8 beats. Keep the speaker's claims and add none of your own.
- **Reality map:** for every picture, record the real thing → what's on screen → what stays true → **test** (`references/style.md`). A picture with no "what stays true" gets cut. The test is a check the code can run on the numbers it draws, like "ends ≥ 5× steeper than it starts" (`bend`) or "each row doubles". It becomes a `shows(...)` line in scenes.js.
- **Claims table:** every number or factual claim on screen gets a source. Anything unsourced becomes "illustrative" (listed as such in the README) or is DROPPED. Never put a refuted or unsourced number on screen as fact.
- **Beats table:** 72 beats (for 45 s), 6–8 scenes, at most 8 words per line. Arc: hook → the naive picture → the mechanism, step by step → the surprise or insight → the limits (what it isn't) → a loop or recap.

**3. Look (`src/head.js`).** Retune HERO and THREAD to the topic (palette guide in style.md). Keep the ground dark and flat. Give each quantity one VAR colour.

**4. Scenes (`src/scenes.js`).** Replace the demo, keeping its shape:
- `SC = scenes([name, beats], ...)` summing to DUR, plus `MUSIC`, `SECTIONS` (bars), one `SHOTS` camera per scene, and `EVENTS` (one sfx per visible action, on beats).
- Scene names are identifiers (letters, digits, `_`): they become `SC.name`.
- `shows(label, condition)` for every reality-map test. Draw from the same functions you test (the template's `lin`/`expo`/`logi`), so the check is about the picture itself.
- `fits(label, start, end, SC.x.from, SC.x.to)` for every timed list (montages, staggered items). This catches actions that overrun their scene.
- **Composition** (checked by frame fill):
  - 16:9: hero on the left third at s ≥ 1.1, on its DISC; the main visual fills the right two thirds (about x 780–1820, y 250–900).
  - Words go in the empty band above or below the visual, never across it.
  - Every scene has one big thing on screen. No empty tail: the last scene keeps the story's object in view.
- `world(t)` draws in world coordinates under the camera; `words(t)` draws in screen space. The file ends with `finish()`.

Kit parts:
- Words: `kine` (headline, `*accent*`, `{word|#hex}`), `pill`, `bubble`.
- 3b1b: `eq` (coloured, `^`/`_`), `axes` + `plot`, `arrow`, `brace`, `grid`, `numberLine`, `bars`, `SHAPE.*` + `morph` + `fillPts` + `writeOn`, `pathAlong`, `counter`.
- Kurzgesagt: `blob` / `robot` (state: grow, mood, look, blink, tilt, squash, arms), `card`, `stamp`, `glove`, `confetti`, `thread` (the one continuous shape), `motes`.
- Sfx names: pop, popLow, boing, ding, tick, click, clack, swish, whoosh, whooshIn, whooshOut, thud, clonk, zip, blip, flag, alarm, notify, drip, step, creak, clank, switch.

**5. QC loop (up to 3 rounds).** Run `film.sh check <dir>`. It must exit 0. It checks:
- collisions and contrast behind text
- text over art (lines or shapes crossing a headline)
- corners and off-frame text
- overruns (`fits`), claims (`shows`) and storyboard/music coverage
- lines over 8 words
- frame fill (the median frame uses at least 16% of the frame)

Then open `qc/sheet.jpg` and answer this in writing, scene by scene, fixing every "no":
1. Does the picture show what the words say? (If the words say "explodes", does the curve visibly explode?)
2. Is one big thing on screen, filling its two thirds?
3. Could a viewer with the sound off tell what changed from the last scene?
4. Is the thread dot, or a morph, carrying the eye from the last scene? (no hard cuts)
5. Do the words and the picture agree on colour (same quantity, same VAR colour)?

Use `film.sh stills <dir> 12s,20s` to look closer. Don't render until the check passes and all five answers are yes.

**6. Render.** `film.sh render <dir>`, about 2.5 min. Cues are the scene starts (SHOTS). If sync-check reports:
- **STARTLE** (loudness jump > 6 dB): bring the music layers in more gradually around that cut (1–2 new layers per bar, never kick and bass together) or use a softer sfx.
- **OFF-BEAT** (no strong onset near the cut): the music around it is too thin. Keep a `kick2` (or a pluck and an sfx) going in the bars around that scene start, and put an EVENT exactly on the scene start.

Then render again.

**7. Deliver.**
- Write `README.md` in the film folder from `references/readme.template.md`.
- `open` the mp4.
- Tell the user in a few lines: what it shows, what was checked, and anything dropped for lack of a source.

## Hard rules
- Don't ask the user questions unless the input is empty. Pick sensible defaults and state them at the end.
- No voice-over unless the user asks for one.
- No brand names or logos of real companies on screen unless the input is about them.
- Keep scripts, kit and references generic; film-specific code lives only in the film folder.
