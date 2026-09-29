# explainer-film

A skill: hunch or transcript in, checked MP4 out. Kurzgesagt x 3Blue1Brown style, where every picture keeps the structure of the real thing.

Use it by just asking: "make an explainer about why the sky is blue", "animate this transcript: ...", "vertical 60-second version".

- `SKILL.md`: the pipeline the agent follows
- `kit/`: parts kit (`kit.js`) + head/scenes templates
- `scripts/film.sh`: `new` / `check` / `stills` / `render`
- `scripts/check.mjs`: contrast behind text, corners, off-frame, storyboard overruns, line length
- `references/style.md`: the style and the "reality map" rule

Needs the `javascript-animation` and `soundtrack` skills in `~/.agents/skills`, node at `~/.local/node`, playwright in `~/node_modules`, and ffmpeg.
