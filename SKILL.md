---
name: explainer-film
description: Turn a hunch about a topic, or a pasted transcript/article, into a finished animated explainer MP4 for any platform (TikTok, Reels, Shorts, Instagram, LinkedIn, YouTube, X; right size and safe zones; narrated with captions by default, free local voices including a soft ASMR one, or music only), built from one validated model in the john-tuld way (finding first, mechanism, boundary, repeatable takeaway) in a Kurzgesagt x 3Blue1Brown style whose pictures keep the structure of the real thing, so viewers can reason with them. Use when someone says "make an explainer/animation/video about X", "explain X visually", "animate this transcript/text/article", "turn this into a motion-graphics video", or gives a one-line hunch and wants it animated. Plain natural language is enough; no config. NOT for B-roll over an existing talking-head video (use motion-broll) or product ads (product-video pipeline).
---

# explainer-film

The user gives one of two things: a **hunch** ("why compound interest feels slow then explodes") or a **transcript/text**
(pasted, or a file path). They get back an MP4 that has passed every check. Everything below runs without asking the user anything.

Tools: `scripts/film.sh` (this folder). The parts kit is `kit/kit.js`. The style rules are `references/style.md`; read them once per film.
The API reference is `kit/KIT.md`. The scaffolded `src/scenes.js` is a complete 7-scene film that passes every check: copy its structure and composition.
A second worked example is `examples/how-ai-learns/` (made before the kit existed).

## Defaults (change only when the user's words say so)
- **Platform from the user's words:** TikTok → `tiktok`, Reels / Instagram story → `reels`, Shorts → `shorts`, Instagram post → `instagram` (4:5),
  LinkedIn → `linkedin` (4:5), a square post / Facebook → `square`, YouTube / X / "widescreen" / nothing said → `youtube` (16:9).
  Pass it to `film.sh new <slug> "<Title>" <platform>`: it sets the canvas and the **safe zone** (clear of the app's own buttons and captions).
  Lay everything out from `ZONE` (head, visual, hero, caption) and `SAFE`, never from fixed pixels, so the film fits its platform;
  `film.sh check` fails words that fall outside the safe zone. For several platforms, make one film per platform.
- **Style from the user's words** (4th argument of `film.sh new`; each sets colours, font, how words enter, backdrop and a music mood):
  - `night` (default): dark navy, bold rounded type, words spring in. General explainers.
  - `paper`: cream paper, ink colours, book serif, words written on; calm music. History, health, anything that should feel trustworthy.
  - `chalkboard`: green slate, chalk type, pastel chalk, words written on; warm strummed music. Maths, science, "a lesson".
  - `neon`: black, glowing lines, condensed type typed on, grid floor; fast synth music. Tech, AI, startups.
  - `newsroom`: white and navy, red rule, words revealed by a sweeping bar; serious pulse. Business, finance, policy, markets.

  If the user names none, pick the one that fits the topic (and say which in the delivery message). "In the style of <video>" still uses `film.sh reference`.
- **Music from the mood**, not a fixed track: the style picks a default mood; change `MOOD` in scenes.js when the topic's feeling differs.
  Moods (kit/music.js): `curious` (marimba, 96 bpm), `calm` (electric piano and bells, 84), `warm` (nylon strum, swung shaker, 92), `drive` (synth arpeggio, 112), `news` (ticking pulse, minor, 104), `playful` (swung marimba, blues, 104), `wonder` (slow arpeggio and bells, 80).
  `SECTIONS = musicArc(MOOD, bars)` builds the arc (intro, build, peak, settle). `film.sh check` fails a film whose music is identical to the last film rendered.
- 45 s of pictures, 60 fps, in the language of the input. **Narrated with burned-in captions by default** (muted viewers read, others listen); "music only" / "no voice" turns narration off. With narration, films usually run 50–60 s.
- The narrator is the **analyst's voice** explaining to the viewer: never a named person, never the source's speaker impersonated, and never John Tuld (he is the audience model). Voice choice:
  - "ASMR" / "whisper" / "calm" → `af_nicole`
  - otherwise `af_heart`
  - British → `bf_emma`
  - Portuguese → `pf_dora` (female) or `pm_alex` (male) with lang `pt-br`

  All voices are free and run locally (Kokoro, Apache 2.0).
  - "in my voice" / "with my voice" → `"voice": "own"`: the creator's cloned voice from a local tool at `~/voz` (PT or EN; about 12 s of computing per second of speech, cached). Only when the user asks for it.
- Time grid: 1 beat = 60 / BPM s (BPM comes from the mood), 1 bar = 4 beats. At 96 bpm, 45 s = 72 beats = 18 bars; at 84 bpm, 72 beats = 51.4 s. SC counts beats, SECTIONS counts bars; DUR = beats × 60 / BPM exactly.
- "60 seconds" → beats = DUR × BPM / 60 (96 beats at 96 bpm), rounded to whole beats, then DUR = beats × 60 / BPM. Social feeds reward short: 15–30 s for TikTok/Reels/Shorts works well.
- Films go in `~/films/<slug>/`.
- **Longer than 60 s** ("3 minutes", "a longer video", "in chapters") → a chapter film:
  - `film.sh new-long <slug> "<Title>" <n>` makes `outline.md` plus `ch01..chNN`. Each chapter is a normal film of 30–60 s with one idea, and its title names the topic.
  - Fill `outline.md` first (core idea; one row per chapter), then make each chapter with steps 2–5.
  - Keep one look: `head.js` palette identical in every chapter. Keep the same hero and thread. Open each chapter with `chapterCard(n, title, t, 0, b(5))`, and end it on a quiet last bar.
  - `film.sh check-long <dir>` checks every chapter and the shared look; `film.sh render-long <dir>` renders the chapters that changed and joins them into `<slug>.mp4`.
  - **Build the chapters in parallel** (about 40% faster for 2 chapters, more for 3+). The order:
    1. You write `outline.md`, then every chapter's `brief.md` and `src/narration.json` yourself, so the story, voice and claims stay one piece. Run `film.sh voice` on each chapter.
    2. `film.sh plan-long <dir>` plan-reviews all chapters at once. Fix and rerun until every chapter is APPROVED.
    3. Start one agent per chapter at the same time (the Agent tool; a forked agent keeps this context). If agents aren't available, build the chapters one after another. Give each agent exactly:
       - its chapter folder, and the goal: `film.sh check` exits 0, then `film.sh review` until APPROVED (at most 3 rejections; if capped, report the verdict);
       - its beats (`SC`), and `DUR` = beats × BEAT (the only line it may change in head.js; the palette stays identical across chapters);
       - the plan's conditions (in its `critique.md`), the colour plan, and the shared opener (a small chapter tag in the headline band);
       - don't render, don't touch other chapters, the kit or brief.md (the plan approval is keyed to it).
    4. When every agent reports APPROVED, run `film.sh check-long` then `film.sh render-long` yourself.

## Pipeline

**0. Input from a link.** If the user gives a URL (an article, or a YouTube/Vimeo/TikTok video), run `film.sh fetch <url> <dir>` after scaffolding. It saves the article text or the video's transcript as `<dir>/source.md`; treat it as the transcript. Never pull footage or clips, only words.

**Watermark.** Every film carries the creator's handle, set once with `film.sh brand "@handle"` (a film can override it with `src/brand.json`). It moves between the edges of the frame every 6 s, avoids words and the hero, becomes a signature for the last 2.5 s, and goes into the file's metadata. If `film.sh check` notes that no handle is set, tell the user in the delivery message; never invent a handle.

**1. Scaffold.** `film.sh new <slug> "<Title>" <platform> <style>` prints the folder.

**1b. Reference (only when the user gives one: "in the style of <video or link>").** Run `film.sh reference <dir> <file|link>`. It measures the reference into `refs/`: frames every 0.5 s, a contact sheet, cuts and shot lengths, and the dominant palette. Look at `refs/sheet.jpg` and a few frames, then fill in `refs/style.md`. Take the **grammar** (palette roles, type, shot length, transitions, camera, motion feel, texture, how text enters and exits), **never the content**: no copied characters, logos, text or scenes. Set `src/head.js` from it. Both reviewers read `refs/style.md`.

**2. Model, then brief (`brief.md`).** The brief opens with the **model**: john-tuld's shared representation contract (core finding, causal sequence, crucial distinctions, concrete example, boundary or falsifier, hero transformation, executive takeaway, forbidden misinterpretations, intentionally omitted). The film is a projection of that one model; no scene, headline or narration line may add a claim the model lacks. Check the model against john-tuld's gates G1–G9 before writing beats (if `~/.claude/skills/john-tuld` exists, read its `references/gates.md` and `references/representation-protocol.md`). Then fill the rest of the template (`kit/brief.example.md` is a filled one, for the demo film):
- **Arc:** finding → mechanism, step by step → a concrete example → the boundary (when it breaks) → the takeaway.
  - The first scene **states the core finding**, not a teaser question.
  - The boundary gets its own scene.
  - The last scene shows the **executive takeaway verbatim** (≤ 8 words; `film.sh check` looks for it).
  - The intentionally omitted items are stated briefly on screen or in the narration.
- **Hunch:** research the mechanism first. If facts or numbers matter, use web search, and prefer primary sources.
- **Transcript:** condense to its 1 core idea and 6–8 beats. Keep the speaker's claims and add none of your own.
- **Reality map:** for every picture, record the real thing → what's on screen → what stays true → **test** (`references/style.md`). A picture with no "what stays true" gets cut. The test is a check the code can run on the numbers it draws, like "ends ≥ 5× steeper than it starts" (`bend`) or "each row doubles". It becomes a `shows(...)` line in scenes.js.
- **Claims table:** every number or factual claim on screen gets a source. Anything unsourced becomes "illustrative" (listed as such in the README) or is DROPPED. Never put a refuted or unsourced number on screen as fact.
- **Beats table:** 6–8 scenes, at most 8 words per line, with the narration line per scene.

**2b. Narration (default; skip only for "music only"): voice first, then the storyboard.**
- Write `src/narration.json` with one or two lines per scene: `{voice, speed: 0.9, lang, lines: [{scene, text, delay?}]}`.
- Writing rules:
  - Narrate like a good university lecturer explaining to a smart colleague: full, connected sentences that carry the reasoning (because, so, which means). Avoid the AI tells: strings of short punchy fragments, stacked numbers, rhetorical questions answered in the next line, "here's the thing".
  - The voice explains and the on-screen words label. Never read the headline aloud word for word.
  - One idea per sentence; "..." gives a breath.
  - For ASMR, keep `speed` at 0.85–0.9 and use fewer, calmer lines.
  - Keep the same claims discipline as the brief: the narration explains causal transitions that are hard to see and adds no claim the model lacks (john-tuld parity).
- Narration makes films longer: 45 s of pictures with a voice usually needs 80–90 beats (50–56 s). Set DUR = beats × BEAT exactly (the check prints the value).
- Run `film.sh voice <dir>`. The first use installs Kokoro (about 350 MB, once). It prints the beats each scene needs; set the `SC` beats to at least that, and set DUR to beats × BEAT.
- Narrated films get **burned-in captions automatically** (most social video is watched muted): 3–4 words at a time in `ZONE.caption`, the current word highlighted. Set `LOOK.captions = false` only if the user asks for no captions.
- In scenes.js, time visuals to the voice with `said('scene').at / .to`, and use `speaking(t)` to animate a character while the voice talks.
- `film.sh check` fails if a line runs past its scene. `film.sh render` mixes the voice in, lowers the music under it and normalises loudness to −16 LUFS. It keeps `<slug>.music-only.mp4` too.

**2b-cast. Casting (when the model has actors who act on each other).** Run `film.sh cast`: it lists the recurring characters, their personalities and what each is best cast as. For every actor in the model's causal sequence, cast the character whose personality fits that actor's part in *this* story (the curious newcomer asks, the careful one checks, the dealmaker trades, the maker produces, the institution sets rules, the risk character is what goes wrong). Give each a role for this topic: an existing costume, or a new one made with `makeRole` (a judge, a pilot, a nurse). The same character plays different roles in different films; within one film it plays one actor. Write the brief's Cast table (character | role | the real actor | links). Leave characters out when the model has no actors (a film about one curve needs none).

**2c. Plan review (before any scene code).** Run `film.sh plan <dir>`. The independent reviewer judges the brief: a mechanism happening in every scene, correct science, a colour plan that tells the truth, real tests, sourced claims, one big visual per scene, and a full arc. Fix what it blocks and run it again (5 rejections stop the loop). It may approve **with conditions**: small fixes you must make in the scenes, which the film reviewer then checks. The film review later refuses to run unless the current brief has an approved plan, so any later brief change means another plan review.

**3. Look (`src/head.js`).** The style pack wrote the palette, font and `LOOK` into head.js; keep its character. Retune HERO and THREAD to the topic (palette guide in style.md). Give each quantity one VAR colour.
- **World:** pick the environment that matches the topic's real setting: `WORLD.landscape` (nature, land, farming), `space` (astronomy, scale), `city` (people, economy), `ocean` (water, climate), `micro` (biology, chemistry). Use `function backdrop(t, cam) { WORLD.x(t, cam); }`, or none (plain dark ground) for pure maths.
- A world is the setting, never the explanation: the checks ignore it for frame fill.

**4. Scenes (`src/scenes.js`).** The scaffold is a demo about generic growth. **Rewrite every scene for this film's topic**: keep the structure (grid, composition, checks), replace all the content. `film.sh check` fails a film that is more than 50% identical to the template, or whose headlines never mention the title's topic.
- `SC = scenes([name, beats], ...)` summing to DUR, plus `MUSIC`, `SECTIONS` (bars), one `SHOTS` camera per scene, and `EVENTS` (one sfx per visible action, on beats).
- Scene names are identifiers (letters, digits, `_`): they become `SC.name`.
- `shows(label, condition)` for every reality-map test. Draw from the same functions you test (the template's `lin`/`expo`/`logi`). `film.sh check` rejects constant conditions (`true`) and conditions that use nothing `world()` draws: "checked visually" is not a test.
- Don't game the checks: shrinking the explanation while text shows, parking words at the frame edge, or blowing up the hero to fill the frame are failures of the film even if a check passes. Frame fill is measured with the hero hidden: the explanation itself must fill the frame.
- `fits(label, start, end, SC.x.from, SC.x.to)` for every timed list (montages, staggered items). This catches actions that overrun their scene.
- **Hook** (checked): by 1.5 s the question or claim is on screen and the picture has started. Feeds decide in about a second, so no slow intros, logos or titles first.
- **Composition** (checked by frame fill):
  - 16:9: hero on the left third at s ≥ 1.1, on its DISC; the main visual fills the right two thirds (about x 780–1820, y 250–900).
  - Words go in the empty band above or below the visual, never across it.
  - Cuts: the old scene is gone by the cut (it exits in the 0.4 s before it) and the new one starts on the cut. Never draw both at once: the review's transition strips catch overlapping scenes.
  - Every scene has one big thing on screen. No empty tail: the last scene keeps the story's object in view.
- `world(t)` draws in world coordinates under the camera; `words(t)` draws in screen space. The file ends with `finish()`.
- **Cast (characters that interact).** When the model has actors who do things to each other (buyers and sellers, a regulator and a firm, a cell and a virus), cast characters: `actor(name, x, y, s, {t, mood, role, hold, pointAt, walk, face, talk})` returns hands and head, and the verbs connect them: `give(a, b, item, p)`, `trade(a, b, goods, money, p)`, `say(a, text, p)`, `walkTo(...)` (kit/KIT.md). The kit has one plain figure, `person`; a private named cast plugs in from `~/.config/explainer-film/cast/` (its README lists who plays what). Fill the brief's Cast table first: every character on screen must be listed there, at most 3 at once, and the same item never drawn twice in one frame (`film.sh check` fails all three). Use the cast where it adds the mechanism, not in every scene; a film about one quantity needs no cast.
- **The presenter.** Draw the host with `presenter(x, y, s, {t, mood, look, talk: voiceLevel(t), armR, walk, samba})`: it draws the private cast's presenter when one is installed (`film.sh cast` names them), else the default blob. Use `samba: true` for the one moment in the film where the idea clicks.
- **Characters act.** Use the hero's mood to track the story (`plain → think → surprised/worried → happy/excited`). Use `walk` to move between places, `talk: voiceLevel(t)` when narrated, and `waveR: t` to greet.
- **Counts and shares:** `crowd(..., n, t, {mark})` shows "k out of n" as real creatures, never as a pie of made-up size.
- **Maths:** put the LaTeX in `src/tex.json` (colour symbols with `\color{#hex}{…}` in their VAR colour). Draw it with `tex(key, …)`, and use `texMorph(a, b, …)` when one form becomes another (expand, simplify, substitute). Keep `eq()` for tiny labels only.

Kit parts:
- Words: `kine` (headline, `*accent*`, `{word|#hex}`), `pill`, `bubble`.
- 3b1b: `tex` / `texMorph` (real LaTeX), `eq` (tiny labels), `axes` + `plot`, `arrow`, `brace`, `grid`, `numberLine`, `bars`, `SHAPE.*` + `morph` + `fillPts` + `writeOn`, `pathAlong`, `counter`.
- Kurzgesagt: `WORLD.*` backdrops, `blob` / `robot` (state: grow, mood, look, blink, tilt, squash, arms, walk, talk, waveR), `crowd`, `chapterCard`, `card`, `stamp`, `glove`, `confetti`, `thread` (the one continuous shape), `motes`.
- Sfx names: pop, popLow, boing, ding, tick, click, clack, swish, whoosh, whooshIn, whooshOut, thud, clonk, zip, blip, flag, alarm, notify, drip, step, creak, clank, switch.

**5. QC loop (up to 3 rounds).** Run `film.sh check <dir>`. It must exit 0. It checks:
- collisions and contrast behind text (4.5:1)
- first frame: frame 0 is a finished picture (≥ 1% of the frame drawn, backdrop aside), since feeds autoplay and thumbnail from it
- motion: the explanation moves at least 1% at the median and is nearly still at most 30% of the time (a slow camera move per scene, processes that keep running, a presenter who points)
- still stretches: no more than 2 s where nothing moves (keep a held state alive: the hero reacts, a highlight travels, a number ticks)
- text over art (lines or shapes crossing a headline)
- corners and off-frame text
- overruns (`fits`), claims (`shows`) and storyboard/music coverage
- lines over 8 words
- frame fill (with the hero hidden, strong marks of the explanation cover at least 8% of the frame; faint wallpaper doesn't count)

Then open `qc/sheet.jpg` and answer this in writing, scene by scene, fixing every "no":
1. Does the picture show what the words say? (If the words say "explodes", does the curve visibly explode?)
2. Is one big thing on screen, filling its two thirds?
3. Could a viewer with the sound off tell what changed from the last scene?
4. Is the thread dot, or a morph, carrying the eye from the last scene? (no hard cuts)
5. Do the words and the picture agree on colour (same quantity, same VAR colour)?

Use `film.sh stills <dir> 12s,20s` to look closer. Don't render until the check passes and all five answers are yes.

**5b. Independent review.** When `film.sh check` passes, run `film.sh review <dir>`. A fresh reviewer that did not make the film judges stills of every scene against fixed rules you cannot change. Fix every blocking problem it lists, then check and review again. Suggestions are optional. After 3 rejections the script stops: report the verdict to the user and let them decide. Render needs an approval of the exact current build, so any change after approval means reviewing again.
  The reviewer also sees 5-frame strips (0.2 s apart) around every cut and the opening. Every verdict is appended to `critique.md` in the film folder as a checklist: after fixing, tick each item (`[x]`) and add a short note of what you changed. The next review reads the log, so settled items stay settled and "claimed fixed but not" gets caught. Plan reviews log there too.

**6. Render.** `film.sh render <dir>`, about 2.5 min. Cues are the scene starts (SHOTS). If sync-check reports:
- **STARTLE** (loudness jump > 6 dB): bring the music layers in more gradually around that cut (1–2 new layers per bar, never kick and bass together) or use a softer sfx.
- **OFF-BEAT** (no strong onset near the cut): first make sure the scene starts on a beat where the drums hit (with `kick2`, the even beats; bar lines are safest). A scene starting between kicks leaves only its sfx to carry the cut. Otherwise the music around it is too thin. Keep a `kick2` (or a pluck and an sfx) going in the bars around that scene start, and put an EVENT exactly on the scene start.

Then render again. To test music changes fast, render the soundtrack alone: `node scripts/score.mjs <dir>/piece.html /tmp/s.wav` (about 15 s; it also writes /tmp/s.mp4 and /tmp/s.cues.json), then run sync-check on /tmp/s.mp4.

**6b. Listen (narrated films; render runs it).** `film.sh listen <dir>` transcribes the finished film with local Whisper and compares it with the script: each line must be heard as written (≥ 80% match) and the captions must keep time with the voice. A mismatch usually means a word the voice mispronounces: respell it the way it should sound ("A D M", "eighty dollars"), run `film.sh voice`, and render again. The report is `voice/listen.md`.

**7. Deliver.**
- Write `README.md` in the film folder from `references/readme.template.md` (with narration, add the voice name and the lines).
- `open` the mp4.
- Tell the user in a few lines: what it shows, what was checked, and anything dropped for lack of a source.

## Keep going (failing is normal; quitting early is not)
- A failing check or a rejection is the normal middle of the job, not a reason to stop. Redesigning a scene (bigger visual, new layout, words moved to the empty band) is ordinary work: do it.
- Work the failures in this order: fill and layout first (make the explanation big: one large labelled diagram per scene, built from the template's composition), then words over art, then claim tests, then everything else.
- Only stop and report when (a) the reviewer has rejected the film 3 times (the script stops you), or (b) 8 rounds of `film.sh check` have made no progress on the same failure. Then report exactly what still fails.

## Hard rules
- **A film is not done while any check fails.** `film.sh render` refuses to run until `film.sh check` passes. Never set FORCE=1 yourself (it is for a person), and never report a film as finished with failures.
- The hero's colour is not any entity's colour: if red means "virus" or "wrong", the hero is not red.
- Don't ask the user questions unless the input is empty. Pick sensible defaults and state them at the end.
- Narration is on by default (analyst voice + captions); "music only" turns it off.
- No brand names or logos of real companies on screen unless the input is about them.
- Keep scripts, kit and references generic; film-specific code lives only in the film folder.
