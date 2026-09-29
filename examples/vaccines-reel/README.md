# Example: How vaccines train your immune system (Instagram Reel, 9:16, narrated)

![preview](preview.gif)

37.5 s, 1080×1920, Reels safe zone, narrated (Kokoro `af_heart`) with burned-in captions. Made with the explainer-film pipeline and approved by both independent reviewers (plan and film).

**Why it's a good one to copy:** every scene shows a mechanism as contact (the matching cell's cup clamps a copy's key, antibodies clamp spikes, copies burst), the key states are *held* on screen, and every count or timing on screen comes from the same functions its `shows()` tests read (virus doubling, cells 8 → 2, lock-on delays 10.5 vs 2 beats drawn as the timeline ratio, the variant fitting 3 of 8 spikes).

What the reviewers caught while it was being made:
- the selection moment was too short to see, so the scene was split into "select" and "multiply"
- the receptors all looked alike; now only the matching cell has V cups
- the variant scene clamped a changed spike, which reversed the mechanism
- labels and antibodies overlapped the cells they named

Sources: CDC, *Explaining How Vaccines Work*; CDC, *Understanding How Vaccines Work*; CDC, *COVID-19 Vaccine Basics* (see `brief.md`).

Rebuild: copy this folder to `~/films/<slug>`, then `film.sh voice`, `film.sh check`, `film.sh plan`, `film.sh review`, `film.sh render`.
