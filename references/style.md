# Style: Kurzgesagt × 3Blue1Brown, representing the same reality

## The one rule: an isomorphic picture
The film shows a *model* of the real thing, and the model has to keep the thing's structure. A viewer who
reasons with the picture should reach the same conclusions they would reach reasoning about reality.
Before drawing anything, fill in the **reality map** in `brief.md`:

| real thing | on screen | what stays true |
|---|---|---|
| a quantity | a length, area, count of dots, or height on an axis | bigger means bigger, in proportion (never a decorative size) |
| a process, step by step | motion along a path, one step per beat | order and direction |
| cause → effect | an arrow, or one object pushing another | direction, and only when the source says it is causal |
| a rate or growth | a curve drawn on in real time | its shape: linear stays straight, exponential bends |
| a category | a colour (VAR) kept for the whole film | same colour means same kind |
| a person or agent's view | a character (blob or robot) with a mood | what the agent knows or gets wrong |
| uncertainty | a blur, a spread of dots, a range bar | its width (never hidden) |

If a row has no "what stays true", the visual is decoration: cut it or replace it.
Numbers on screen come from the brief's sources. Illustrative data is labelled as such in the README.

## Kurzgesagt half (the world and the characters)
- Flat vector shapes. No outlines on masses; a darker band on the shadow side; soft floor shadows.
- Dark, rich ground (deep navy by default) with slow motes and nothing else. **No gradient backgrounds.**
- One warm hero character (blob for general topics, robot for tech topics) with a mood that tracks the story:
  confused → wrong → effort → insight.
- A circular DISC behind the hero anchors the stage.
- Worlds (`WORLD.*`) give the setting depth: stacked silhouettes that get darker toward the viewer, soft light pools, fine grain. Keep them quiet (mixed toward blue air or night), so the hero and the diagram carry the contrast.
- Characters act: mood follows the story, they walk between places, they talk with the voice. A crowd shows "how many" as creatures.
- Cute, but serious about the facts.

## 3Blue1Brown half (the ideas)
- Math and diagrams are objects: axes draw on, curves trace left to right, equations are real LaTeX written on glyph by glyph (`tex`), and they transform into each other (`texMorph`).
- **Colour is meaning:** each quantity gets one VAR colour, and the symbol, the object and the word all share it. Tie words to objects with `{word|#hex}`.
- **Transform, don't replace.** When a representation changes (dots → bar → curve, circle → star), morph it (`morph`, `SHAPE.*`), or move the thread dot from one to the next.
- Build intuition before the formula: show the behaviour first, then name it with an equation.
- Calm camera: slow pushes, and zoom in when a detail matters (like the chest-panel zoom in examples/how-ai-learns).

## Anti-"AI video" rules (enforced by check.mjs where it can)
1. No text in corners, no frames or borders, no corner logos.
2. No plain fades. Words spring up from a line and leave upward; objects scale, morph, slide or fly.
3. No text over busy art: `check.mjs` measures contrast behind every headline. Put words on the free side of the frame.
4. At most 8 words per line and one idea per beat group. Plain words: a high-schooler should get it.
5. One continuous thread (the THREAD dot, or a shape that morphs), so there are no hard cuts.
6. Every visible action gets a sound on the beat; cuts land on bar lines.

## Composition (checked by frame fill)
- 16:9: hero on the left third (s ≥ 1.1) on its DISC; the main visual fills the right two thirds; words in the empty band above or below it.
- 9:16: hero in the top third, visual in the middle, words at the bottom.
- With the hero and the backdrop hidden, strong marks of the explanation must cover at least 8% of the frame (40 px cells; faint wallpaper doesn't count). A small graph floating in empty space fails, and so does a giant hero standing in for a missing diagram.
- The last scene keeps the story's object on screen. It never ends on a bare character.

## Palette guide
Keep BG/DEEP/DISC/TEXT dark and neutral. Retune HERO and THREAD to the topic (money: gold hero, green thread;
biology: coral hero, teal thread; climate: sand hero, blue thread). VAR colours come from 3b1b and stay fixed.
