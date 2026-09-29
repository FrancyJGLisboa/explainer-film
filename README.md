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

> make a TikTok explaining why the sky is blue
>
> animate this transcript for LinkedIn: …
>
> a narrated 30-second Reel about how vaccines train the immune system, ASMR voice
>
> a YouTube explainer on compound interest in the style of <link>

The agent writes a brief (core idea, reality map, claims with sources, beats), codes the scenes with the kit, and runs
the checks until they pass. Then it renders the MP4 and checks that the music lands on the cuts without sudden jumps in loudness.

## What's in the kit
- **Worlds:** landscape, space, city, ocean and microscopic backdrops, with parallax depth, soft light and film grain.
- **Characters:** a round hero with seven moods, eyebrows, a walk cycle, waving, and lip-sync driven by the voice's real loudness. Crowds show "k out of n" as actual creatures.
- **Real maths:** LaTeX typeset at build time (MathJax → glyph outlines, nothing loaded at runtime). It's written on stroke-then-fill, and equations morph into each other with matching symbols travelling.
- **Long films:** 2–5 minute films in chapters. Each chapter is checked on its own and must keep the shared look; changed chapters re-render and everything joins into one MP4.

## Made for feeds
- **Every platform:** `tiktok`, `reels`, `shorts`, `instagram` (4:5), `linkedin` (4:5), `square`, `youtube`, `x`. Each gets the right canvas and a safe zone clear of the app's own buttons and captions, and the layout adapts, so one film design works in 9:16, 1:1, 4:5 and 16:9.
- **Works muted:** narrated films get burned-in captions, word by word.
- **Hook:** the check fails a film that hasn't shown its question and started its picture by 1.5 s.

## Narration, free and local
Say "narrated" or "with an ASMR voice" and the film gets a voice-over from [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M)
(Apache 2.0, runs on your machine, no account, no API key): `af_heart` (soft, natural), `af_nicole` (whispery ASMR),
`af_bella`, `bf_emma` (British), `pf_dora` / `pm_alex` (Brazilian Portuguese). The voice is made first and the scenes are sized to
fit it. The music is lowered under the voice automatically, and a music-only cut is kept too.

## In the style of a video you like
`film.sh reference <film> <video or link>` measures a reference (frames every 0.5 s, contact sheet, cuts and shot lengths, dominant palette) and starts a style guide. The film takes the reference's grammar, never its content, and both reviewers check it.

## Plan first, then film
Before any scene is coded, `film.sh plan` has the independent reviewer approve the brief: a mechanism happening in every scene, correct science, an honest colour plan, real tests. In our tests the plan review caught, from text alone and in about a minute, everything the film reviewer later found in a weak vaccines film, plus two science errors.

## Maker is not the judge
Automated checks can be gamed, and in our tests agents gamed every one: a giant hero to fill the frame, faint wallpaper, claim tests that test nothing, scene lengths posing as facts.
So once `film.sh check` passes, `film.sh review` hands stills of every scene to a **fresh reviewer that didn't make the film** (the `claude` CLI, with fixed instructions in `references/reviewer.md` that the maker can't edit).
- It blocks only on real failures (the picture contradicts the words, the mechanism is wrong, filler, visible bugs, colour lies, cheap framing); everything else becomes a non-blocking suggestion.
- It sees its previous verdict, so it converges instead of moving the goalposts. After 3 rejections the pipeline stops and hands the film to a person.
- `render` needs an approval of the exact current build; any edit voids it.

Calibration: it rejected all 7 scenes of a gamed agent film. On the demo template it caught a limits curve that grew *faster* than the unlimited one (a real maths error the automated checks missed), bars that never finished growing (a kit bug), and colour clashes. It approved the template after the fixes.

## What the checks catch
`scripts/check.mjs`, run by `film.sh check`, fails the build on:
- **pictures that contradict their words**: each reality-map row has a test the code runs on what it draws (`shows(...)`). "It explodes" has to mean the curve ends at least 5× steeper than it starts
- **empty frames**: a small graph floating in empty space fails. Fill is measured with the hero hidden, so a giant character can't stand in for a missing diagram
- **text over art**: a headline drawn across a curve or a shape
- text that is hard to read against what is actually behind it (it hides the words and measures the pixels behind them)
- text in corners, or running off the frame
- an action or a narration line that runs past the end of its scene (`fits()`), music with gaps, a storyboard whose length doesn't match the film's
- headlines longer than 8 words

The checks earn their keep. The first end-to-end test, a film about compound interest, passed the original checks and still looked weak: the "exploding" curve was nearly straight, the frame was mostly empty, and text crossed the curve. The new checks fail that film on two of those: the empty frame and the text over the curve. The third, a curve that doesn't explode, is caught once a film declares its tests, which the brief now requires. That test also caught a curve in the kit's own template that was supposed to flatten and didn't.

On top of that, it runs the upstream checks: overlapping text (layout-check), a check that nothing external is loaded (asset-audit), and on render, cuts that miss the beat or jump in loudness (sync-check).

## Install
You need Node.js 18+ and ffmpeg (`brew install node ffmpeg`, or your system's package manager). Then:

```sh
git clone https://github.com/FrancyJGLisboa/explainer-film
cd explainer-film && ./install.sh
```

`install.sh` adds the two upstream skills, the node packages and a browser, links the skill for Claude Code (`~/.claude/skills`) and for the other agent CLIs (`~/.agents/skills`), then runs `film.sh doctor`, which lists anything still missing with the exact fix. The independent reviewers use the `claude` CLI. Narration (optional) uses `uv` and downloads the free Kokoro voices on first use.

## By hand
```sh
scripts/film.sh doctor                                 # can it run here?
scripts/film.sh new sky-blue "Why the Sky Is Blue" tiktok   # -> ~/films/sky-blue (brief.md, src/head.js, src/scenes.js)
scripts/film.sh plan ~/films/sky-blue                  # independent review of the plan, before any scene code
scripts/film.sh check ~/films/sky-blue                # contact sheet + all checks
scripts/film.sh stills ~/films/sky-blue 12s,20s       # look closer
scripts/film.sh voice ~/films/sky-blue                # optional: narrate src/narration.json, prints beats per scene
scripts/film.sh review ~/films/sky-blue                # independent review of the film
scripts/film.sh render ~/films/sky-blue                # MP4 + sync check (+ voice mix) -> sky-blue.tiktok.mp4 (-14 LUFS) + cover
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
