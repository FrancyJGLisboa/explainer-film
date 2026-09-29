---
name: explainer-film
description: Turn a hunch about a topic, or a pasted transcript/article, into a finished animated explainer MP4 (default 45 s, 16:9, music only) in a Kurzgesagt x 3Blue1Brown style whose pictures keep the structure of the real thing, so viewers can reason with them. Use when someone says "make an explainer/animation/video about X", "explain X visually", "animate this transcript/text/article", "turn this into a motion-graphics video", or gives a one-line hunch and wants it animated. Plain natural language is enough; no config. NOT for B-roll over an existing talking-head video (use motion-broll) or product ads (product-video pipeline).
---

# explainer-film

The user gives one of two things: a **hunch** ("why compound interest feels slow then explodes") or a **transcript/text**
(pasted, or a file path). They get back an MP4 that has passed every check. Everything below runs without asking the user anything.

Tools: `scripts/film.sh` (this folder). The parts kit is `kit/kit.js`. The style rules are `references/style.md`; read them once per film.
The worked example is `~/projects/how-ai-learns` (src/scenes.js), which was made before this kit existed and shows the same patterns.

## Defaults (change only when the user's words say so)
- 45 s, 16:9 1920×1080, 60 fps, music only (no narrator), in the language of the input.
- "vertical" / "reels" / "tiktok" → W = 1080, H = 1920. "60 seconds" → DUR = 60, which is 96 beats at 96 bpm (beats = DUR × BPM / 60).
- Films go in `~/films/<slug>/`.

## Pipeline

**1. Scaffold.** `film.sh new <slug> "<Title>"` prints the folder.

**2. Brief (`brief.md`).** Fill in the template:
- **Core idea:** one sentence.
- **Hunch:** research the mechanism first. If facts or numbers matter, use web search, and prefer primary sources.
- **Transcript:** condense to its 1 core idea and 6–8 beats. Keep the speaker's claims and add none of your own.
- **Reality map:** for every picture, record the real thing → what's on screen → what stays true (`references/style.md`). A picture with no "what stays true" gets cut.
- **Claims table:** every number or factual claim on screen gets a source. Anything unsourced becomes "illustrative" (listed as such in the README) or is DROPPED. Never put a refuted or unsourced number on screen as fact.
- **Beats table:** 72 beats (for 45 s), 6–8 scenes, at most 8 words per line. Arc: hook → the naive picture → the mechanism, step by step → the surprise or insight → the limits (what it isn't) → a loop or recap.

**3. Look (`src/head.js`).** Retune HERO and THREAD to the topic (palette guide in style.md). Keep the ground dark and flat. Give each quantity one VAR colour.

**4. Scenes (`src/scenes.js`).** Replace the demo, keeping its shape:
- `SC = scenes([name, beats], ...)` summing to DUR, plus `MUSIC`, `SECTIONS` (bars), one `SHOTS` camera per scene, and `EVENTS` (one sfx per visible action, on beats).
- Call `fits(label, start, end, SC.x.from, SC.x.to)` for every timed list (montages, staggered items). This catches actions that overrun their scene.
- `world(t)` draws in world coordinates under the camera; `words(t)` draws in screen space. The file ends with `finish()`.

Kit parts:
- Words: `kine` (headline, `*accent*`, `{word|#hex}`), `pill`, `bubble`.
- 3b1b: `eq` (coloured, `^`/`_`), `axes` + `plot`, `arrow`, `brace`, `grid`, `numberLine`, `bars`, `SHAPE.*` + `morph` + `fillPts` + `writeOn`, `pathAlong`, `counter`.
- Kurzgesagt: `blob` / `robot` (state: grow, mood, look, blink, tilt, squash, arms), `card`, `stamp`, `glove`, `confetti`, `thread` (the one continuous shape), `motes`.
- Sfx names: pop, popLow, boing, ding, tick, click, clack, swish, whoosh, whooshIn, whooshOut, thud, clonk, zip, blip, flag, alarm, notify, drip, step, creak, clank, switch.

**5. QC loop (up to 3 rounds).** `film.sh check <dir>`:
- Read `qc/sheet.jpg` and judge it against the six anti-giveaway rules and the reality map. Is each picture true to the thing?
- Fix everything the script reports: layout collisions, contrast behind text, corners, off-frame text, overruns, too-long lines.
- Use `film.sh stills <dir> 12s,20s` to look closer. Don't render until check exits 0 and the sheet looks right.

**6. Render.** `film.sh render <dir>`, about 2.5 min. If sync-check reports a STARTLE, bring the music layers in more gradually around that cut (1–2 new layers per bar, never kick and bass together) or use a softer sfx, then render again.

**7. Deliver.**
- Write a README in the film folder: storyboard, reality map, sources, and what was illustrative or dropped.
- `open` the mp4.
- Tell the user in a few lines: what it shows, what was checked, and anything dropped for lack of a source.

## Hard rules
- Don't ask the user questions unless the input is empty. Pick sensible defaults and state them at the end.
- No voice-over unless the user asks for one.
- No brand names or logos of real companies on screen unless the input is about them.
- Keep scripts, kit and references generic; film-specific code lives only in the film folder.
