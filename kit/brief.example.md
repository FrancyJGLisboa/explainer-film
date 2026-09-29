# Brief (example: the scaffold demo film; approved by the independent plan and film reviewers)

**Input:** hunch: "why some things grow slowly and then suddenly"

**Core idea:** Growing by a share of what you already have starts slower than adding a fixed amount, then overtakes it, until real limits make it level off.

**Audience / format:** general, 45 s, 16:9, English, music only

## Kit plan
- World: none (pure maths idea; plain dark ground)
- Hero: blob, pink (no quantity is pink), mood plain -> think -> happy
- Crowd: none
- Equations: s = 3·1.35^t (eq label)
- Narration: none

## Reality map
| real thing | on screen | what stays true | test |
|---|---|---|---|
| doubling | rows of dots 1, 2, 4, 8, 16 | each row is exactly twice the last | ROWS doubles |
| adding a fixed amount | blue bars/line, +2 each step | equal steps, stays under the ceiling | bend(lin) = 1, lin(20) < cap |
| growing by a share | yellow bars, each 1.35x the last | constant ratio | EXP ratio |
| slow, then sudden | yellow curve vs blue line, both start at 3 | below for 4 steps, ends > 2x above, bends | grow < lin at 1-4; grow(10) > 2 lin(10); bend >= 5 |
| limits | green curve (same rate) under a dashed "room" ceiling at 50 (y-axis tops at 60) | never above yellow, rises above the line, levels off, ends within 5% of the ceiling | logi <= grow everywhere; logi(12) > lin(12); bend(logi,10,20) < .2; .95 cap < logi(20) < cap |
| gain per step | bars under each step, chart scale | adding gains exactly 2; sharing gains grow; limited gains grow then shrink | lin gains all 2; EXP gains increase; logi gains peak mid-range then fall below a quarter of the peak |

## Claims on screen
| claim | source | status |
|---|---|---|
| growth by a share is exponential; adding a fixed amount is linear | definition | common knowledge |
| exponential growth eventually overtakes linear growth | mathematics | common knowledge |
| real growth hits limits (logistic growth) | population biology, standard | common knowledge |
| the rate 1.35 | chosen for the picture | illustrative |

## Beats (72 beats = 45 s at 96 bpm; 1 beat = 0.625 s)
| # | beats | main visual (right two thirds) | what happens on screen | words |
|---|---|---|---|---|
| 1 hook | 0–6 | five rows of yellow dots | rows pop in one after another, each row twice the last (1, 2, 4, 8, 16) | What grows slow, then sudden? |
| 2 naive | 6–16 | eight blue bars | bars grow left to right, each exactly +2 taller than the last | Add the same each step. |
| 3 mechanism | 16–28 | the same eight bars | the bars re-grow by a new rule: each is 1.35x the last; a light band on top of each bar shows that step's gain, and the gains visibly grow; an arrow labelled x1.35 spans two bars | Grow by a share of itself. |
| 4 build | 28–42 | axes with numbered ticks (0–20 steps), grid on the ticks | the blue line (+2 each step) and the yellow curve (x1.35 each step) draw on together from the same start (3); yellow stays under blue for steps 1–4, then crosses near step 5 and leaves the chart | s = 3·1.35^t |
| 5 insight | 42–52 | the same chart | a marker walks the yellow curve and one walks the blue line, step 0 to 10; under each step a bar shows that step's gain on the chart's scale: yellow gains grow every step, blue gains stay at exactly +2; then callouts pin "slow" to the flat start and "sudden" to the steep part | Slow, then sudden. |
| 6 limits | 52–62 | the same chart | a dashed neutral "room" ceiling appears at 50; a green curve with the same x1.35 rate draws on under the yellow one, rises above the blue line, then levels off under the ceiling | Real growth hits limits. |
| 7 loop | 62–72 | the full chart | a marker walks the green curve step 0 to 20, leaving its per-step gain bars: they grow like the yellow ones at first, then shrink toward zero as the curve presses under the ceiling at 50; the thread dot returns to the hero | Same x1.35, every step... until room runs out. |
