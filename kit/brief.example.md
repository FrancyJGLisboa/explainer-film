# Brief (example: the scaffold demo film, approved by the independent reviewer)

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
| limits | green curve (same rate) under a dashed "room" ceiling | never above yellow, rises above the line, levels off | logi <= grow everywhere; logi(12) > lin(12); bend(logi,10,20) < .2 |

## Claims on screen
| claim | source | status |
|---|---|---|
| growth by a share is exponential; adding a fixed amount is linear | definition | common knowledge |
| exponential growth eventually overtakes linear growth | mathematics | common knowledge |
| real growth hits limits (logistic growth) | population biology, standard | common knowledge |
| the rate 1.35 | chosen for the picture | illustrative |
