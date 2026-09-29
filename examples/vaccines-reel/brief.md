# Brief

**Input:** "make a narrated 30-second Reel about how vaccines train the immune system"

**Core idea:** A vaccine shows your immune system a harmless copy of a germ, so the one cell type that fits it multiplies, makes antibodies and leaves memory cells behind; when the real germ comes, those memory cells stop it early.

**Audience / format:** general, Instagram Reel 9:16 (1080×1920, Reels safe zone), ~40 s, English, narrated (af_heart), burned-in captions

## Kit plan
- World: `WORLD.micro` (inside the body, neutral nuclei)
- Hero: pink blob (`HERO #f4a7b9`, no entity is pink), bottom-right; moods plain → think (learning) → happy (memory) → excited (stopped early) → worried (limits); talks with the voice
- Colour plan (one colour per thing, all scenes): virus = red (`WRONG`), vaccine copy = grey (`VAR.grey`, same spike shape), immune (B) cells = blue (`VAR.blue`), antibodies = gold (`VAR.gold`), memory badge = purple (`VAR.purple`). Teal (`THREAD`) is only the travelling dot.
- Interaction parts: `pathogen` (spikes end in keys), `antibody` / `bindTo` (locks that fit only their key), `burst`, `badge`, `callout`, `pill`
- Equations: none
- Narration: yes, af_heart, speed 0.92

## Reality map
| real thing | on screen | what stays true | test (becomes `shows(...)`) |
|---|---|---|---|
| a virus replicates | true-red (#e8413c) particles: 1 → 2 → 4 → 8 | each round doubles | `virusCount()` (the function that draws the particles), sampled at each round's beat, gives 1, 2, 4, 8 |
| a vaccine antigen is a harmless copy | grey particles with the **same spike keys** as the virus; they never multiply | same key shape; copy count stays constant | `COPY.kind === VIRUS.kind`; `copies(t)` constant through scene 2 |
| only matching immune cells respond (specificity) | 5 blue cells with different lock shapes; only the one whose lock fits the key binds | exactly one cell kind fits (V cups fit triangle keys) | `B_KINDS.filter(k => k === COPY.kind).length === 1` |
| the matching cell multiplies and makes antibodies | that cell becomes 1 → 2 → 4 → 8; gold antibodies fly to the copies' spikes and clamp on; copies burst | division doubles; antibodies bind only matching keys | `clones()` (draws the cells) sampled after the lock and each division gives 1, 2, 4, 8 |
| memory cells remain | 8 cells → 6 fade, 2 stay with a purple star | fewer stay than were made, but not zero | `visibleCells()` (the drawn solid cells) is 8 at the start of scene 5 and between 1 and 7 at its end; the "8 → 2" label is built from those counts |
| second response is faster | real virus: memory cells lock on after 2 beats vs 6 beats the first time; a two-bar timeline compares them | second delay shorter than first | measured from the animation: first = copies arrive (beat 10) → matching cell locks (beat 20.5) = 10.5 beats; second = virus arrives → memory cell locks = 2 beats; `SECOND_DELAY < FIRST_DELAY / 2`, and the timeline bars are drawn in that ratio |
| viruses change / protection fades | a variant with some changed keys: antibodies bind the old-shape spikes, slide off the new ones | partial fit (some, not all) | `VARIANT_FIT` = matching spikes ÷ all spikes of the drawn variant (3 of 8); 0 < fit < 1; after the misses the variant copies once (1 → 2) on screen, then the booster callout |

## Claims on screen
| claim | source | status |
|---|---|---|
| vaccines contain an antigen: a weakened or killed germ, or bits of it; they imitate infection | CDC, *Explaining How Vaccines Work* | sourced |
| immunity takes weeks to develop after vaccination ("~2 weeks" label says "weeks") | CDC, *Explaining How Vaccines Work*; CDC, *COVID-19 Vaccine Basics* ("a few weeks") | sourced |
| the body keeps memory B and T cells that remember how to fight the virus | CDC, *COVID-19 Vaccine Basics* | sourced |
| protection fades over time and is restored with boosters; flu vaccine is reformulated each year | CDC, *Understanding How Vaccines Work* | sourced |
| lock-and-key shapes for antigen and antibody | textbook metaphor for antibody specificity | illustrative |
| counts (1→8 viruses, 5 cell types, 8→2 cells) and the delay bars | chosen for the picture | illustrative |

## Beats (60 beats = 37.5 s at 96 bpm; 1 beat = 0.625 s)
| # | beats | main visual (ZONE.visual) | what happens on screen | words |
|---|---|---|---|---|
| 1 hook | 0–8 | red virus particles | one red virus appears at 0.2 s, then copies: 1 → 2 → 4 → 8 on the beat, a "×2" callout | A virus copies itself fast. |
| 2 vaccine | 8–18 | three grey copies | the red cluster flies off; three grey copies with the same spike keys drift in; one tries to split and gets a ✗; count stays 3 | A vaccine: a harmless copy. |
| 3 select | 18–24 | five blue cells + the copies | five cells with visibly different receptor cups (V, box, arc) rise toward the copies; four don't fit and drop away; the one with V cups (fits the copies' triangle keys) clamps a copy and glows | Only the matching cell fits. |
| 4 multiply | 24–32 | the matching cell + copies | that one cell divides 1 → 2 → 4 → 8; gold antibodies fly to the copies' spikes and clamp on; the copies burst; a "takes weeks" callout | It multiplies and makes antibodies. |
| 5 memory | 32–40 | the 8 blue cells | six shrink to faint outlines (ghosts, so 8 → 2 stays countable); two stay and get a purple star badge; "8 → 2" callout built from the drawn counts | A few stay, as memory. |
| 6 real | 40–50 | real red virus + the 2 memory cells | a red virus arrives from the right; a memory cell clamps one of its spikes after 2 beats (vs 10.5 the first time, both measured from the animation), multiply, antibodies clamp, the virus bursts before copying; a two-bar timeline: "first time" long, "with memory" short | Real virus? Stopped early. |
| 7 limits | 50–60 | a variant virus | a red virus with some changed keys arrives; three antibodies fly in: one clamps a matching spike, two slide off the changed ones; "booster" callout | Changed shape? Some slip past. |
