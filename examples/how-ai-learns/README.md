# How AI Learns: 45-second motion-graphic explainer

![preview](preview.gif)

The film this skill came from. It was built by hand before the kit existed; the kit's `robot()` is its Bit.

Zero-asset film: every frame and sound is computed in `piece.html` (canvas + Web Audio). There is no voice; the text on screen carries the story.
Edit `src/scenes.js` (storyboard, characters, scenes) or `src/head.js` (size, palette, look), then run `./build.sh`.

Build and render: `sh build.sh`, then from a folder where `playwright-core` is installed:
- Video: `node ~/.agents/skills/javascript-animation/scripts/render.mjs piece.html how-ai-learns.mp4`
- Contact sheet: add `qc/sheet.jpg --sheet 1.5` in place of the mp4 path
- Checks: `layout-check.mjs piece.html` and `asset-audit.mjs piece.html` (same scripts folder), plus `~/.agents/skills/soundtrack/scripts/sync-check.mjs`

## Characters
- **Bit**: yellow robot, the learner. Its chest has a mistake bar and 5 knobs (the weights).
- **Coach Ada**: a white glove that holds up the example cards.
- **The teal dot**: the thread running through the whole film. It becomes Bit's eye, the point on the mistake curve, the feature rings, and finally the dot that loops the recap circle.

## Storyboard (96 bpm, 1 beat = 0.625 s)
| # | beats | idea | text |
|---|---|---|---|
| 1 | 0–6 | the dot bounces in and becomes Bit | Meet Bit. / It knows nothing. |
| 2 | 6–14 | Ada flips a cat card; Bit guesses "dog?"; ✗ | STEP 1 Guess. |
| 3 | 14–22 | zoom into the chest: mistake bar, knobs nudge | STEP 2 Measure the mistake. / Then nudge the knobs. |
| 4 | 22–34 | practice montage, the mistake curve falls, counter runs to 1,000,000 | STEP 3 Repeat. / Millions of times. |
| 5 | 34–42 | knobs wired to ears, whiskers, eyes | Not memorizing pictures. / Learning patterns. |
| 6 | 42–52 | a cat in a hat it has never seen; music break; "cat!" ✓ | A picture it has never seen. / Right answer. |
| 7 | 52–62 | a blurry cat labelled "dog"; Bit wobbles | Bad examples, bad lessons. / AI is only as good as its data. |
| 8 | 62–72 | loop: Guess → Nudge → Repeat | That's how AI learns. |

## Look and sound
- Kurzgesagt-style flat vector on deep navy. Yellow is Bit, teal means learning, coral means wrong. Avenir Next Heavy for the words, Menlo for the numbers.
- Inspired by the Opus 5.5 motion-video posts on X: one continuous shape, nothing in the corners, no gradient background, and words that spring in and slide out instead of fading.
- Score: groove.js with the `percussion` (marimba) kit, `bright` harmony, key +2. The music drops out for one bar (bar 11) before the right answer.
