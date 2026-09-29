# explainer-film

**Give it a hunch or a transcript. Get back an animated explainer that has passed its own checks.**

![How AI Learns, made with the pipeline this skill packages](examples/how-ai-learns/preview.gif)

An agent skill (Claude Code, Codex, Cursor, Gemini CLI: anything that reads `SKILL.md`) that turns a topic into a
45-second motion-graphics film. The look is **Kurzgesagt flat vector** for the world and characters, with the ideas drawn in **3Blue1Brown** style:
equations spring in part by part, curves draw themselves, colour carries meaning, and shapes morph instead of cutting.

Every frame and every sound is computed in code: canvas plus Web Audio, with no image, video or audio assets.

## The idea: show the same reality
Most AI-made explainers are decoration: a nice picture that sits next to the words. This skill forces a **reality map** before anything gets drawn:

| real thing | on screen | what stays true |
|---|---|---|
| a quantity | a length, area or dot count | bigger means bigger, in proportion |
| a process | motion along a path, one step per beat | order and direction |
| growth | a curve drawn in real time | its shape |
| uncertainty | a spread or a blur | its width |

A picture with no "what stays true" gets cut. Every number on screen has a source, or is marked illustrative, or is dropped.
The aim is a picture people can *reason with*, and one that doesn't mislead when they do.

## Use it
Just ask your agent:

> make an explainer about why the sky is blue
>
> animate this transcript: …
>
> vertical, 60 seconds, about how vaccines train the immune system

The agent writes a brief (core idea, reality map, claims with sources, beats), codes the scenes with the kit, and runs
the checks until they pass. Then it renders the MP4 and checks that the music lands on the cuts without sudden jumps in loudness.

## Narration, free and local
Say "narrated" or "with an ASMR voice" and the film gets a voice-over from [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)
(Apache 2.0, runs on your machine, no account, no API key): `af_heart` (soft, natural), `af_nicole` (whispery ASMR),
`af_bella`, `bf_emma` (British), `pf_dora` / `pm_alex` (Brazilian Portuguese). The voice is made first and the scenes are sized to
fit it. The music is lowered under the voice automatically, and a music-only cut is kept too.

## What the checks catch
`scripts/check.mjs`, run by `film.sh check`, fails the build on:
- **pictures that contradict their words**: each reality-map row has a test the code runs on what it draws (`shows(...)`). "It explodes" has to mean the curve ends at least 5× steeper than it starts
- **empty frames**: a small graph floating in empty space fails (median frame fill ≥ 16%)
- **text over art**: a headline drawn across a curve or a shape
- text that is hard to read against what is actually behind it (it hides the words and measures the pixels behind them)
- text in corners, or running off the frame
- an action or a narration line that runs past the end of its scene (`fits()`), music with gaps, a storyboard whose length doesn't match the film's
- headlines longer than 8 words

The checks earn their keep. The first end-to-end test, a film about compound interest, passed the original checks and still looked weak: the "exploding" curve was nearly straight, the frame was mostly empty, and text crossed the curve. The new checks fail that film on two of those: the empty frame and the text over the curve. The third, a curve that doesn't explode, is caught once a film declares its tests, which the brief now requires. That test also caught a curve in the kit's own template that was supposed to flatten and didn't.

On top of that, it runs the upstream checks: overlapping text (layout-check), a check that nothing external is loaded (asset-audit), and on render, cuts that miss the beat or jump in loudness (sync-check).

## Install
Requirements: node ≥ 18, ffmpeg, Chrome or Chromium, `uv` (only for narration), and the two upstream skills this builds on:

```sh
npx skills add iart-ai/javascript-animation-skills -g -y -s '*'   # javascript-animation + soundtrack
git clone https://github.com/FrancyJGLisboa/explainer-film ~/.agents/skills/explainer-film
cd ~/.agents/skills/explainer-film && npm i playwright-core
ln -s ~/.agents/skills/explainer-film ~/.claude/skills/explainer-film   # Claude Code
```

## By hand
```sh
scripts/film.sh new sky-blue "Why the Sky Is Blue"   # -> ~/films/sky-blue (brief.md, src/head.js, src/scenes.js)
scripts/film.sh check ~/films/sky-blue                # contact sheet + all checks
scripts/film.sh stills ~/films/sky-blue 12s,20s       # look closer
scripts/film.sh voice ~/films/sky-blue                # optional: narrate src/narration.json, prints beats per scene
scripts/film.sh render ~/films/sky-blue               # MP4 + sync/loudness check (+ voice mix)
```

## Layout
- `SKILL.md`: the pipeline the agent follows
- `kit/kit.js`: the parts
  - words: `kine`, `pill`, `bubble`
  - 3b1b: `eq`, `axes`/`plot`, `arrow`, `brace`, `grid`, `numberLine`, `bars`, `morph`, `writeOn`
  - Kurzgesagt: `blob`, `robot`, `card`, `stamp`, `glove`, `confetti`, `thread`
- `kit/*.template.js`: a new film's starting files
- `references/style.md`: the style and the reality-map rule
- `examples/how-ai-learns/`: the film the kit was taken from

## Credits
Built on [iart-ai/javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills) (starter library, renderer, groove score, checks).
Style after Kurzgesagt and 3Blue1Brown; no affiliation with either.

MIT licence.
