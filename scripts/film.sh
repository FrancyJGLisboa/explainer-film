#!/bin/sh
# film.sh: the explainer-film pipeline, one command per stage.
#   film.sh new <slug> ["Title"] [platform]   scaffold ~/films/<slug>; platform: tiktok reels shorts instagram square linkedin youtube x (default youtube)
#   film.sh check <dir>            build + contact sheet (qc/sheet.jpg) + asset audit + layout + rules (contrast, corners, timing)
#   film.sh stills <dir> 4s,12s    full-size stills into qc/
#   film.sh new-long <slug> "Title" <n>   a long film: ~/films/<slug>/outline.md + ch01..chNN (each a normal film)
#   film.sh check-long <dir> / render-long <dir>   check every chapter (+ same look) / render changed chapters and join them
#   film.sh reference <dir> <video|link>  study a reference video's grammar -> refs/ (frames, sheet, cuts, palette, style.md to fill)
#   film.sh plan <dir>             independent review of the plan (brief + narration) before any scene code
#   film.sh review <dir>           independent review: a fresh reviewer (claude CLI, fixed prompt) judges stills of every scene; render needs its approval
#   film.sh voice <dir>            narrate src/narration.json with Kokoro (free, local) -> voice/*.wav + beats each scene needs
#   film.sh render <dir>           build + render <slug>.mp4 (+ .wav, cues) + sync/loudness check (+ voice mix if voice/ exists)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(dirname "$HERE")
JA=$HOME/.agents/skills/javascript-animation/scripts; ST=$HOME/.agents/skills/soundtrack/scripts
[ -d "$HOME/.local/node/bin" ] && export PATH=$HOME/.local/node/bin:$PATH
# node scripts resolve playwright from the working directory: prefer this repo's node_modules, else ~
RUN=$HOME; [ -d "$ROOT/node_modules/playwright-core" ] && RUN=$ROOT
cmd=$1; shift || true
case "$cmd" in
  new)
    slug=$1; title=${2:-$1}; plat=${3:-youtube}; [ -n "$slug" ] || { echo "usage: film.sh new <slug> [title] [platform]"; exit 1; }
    case "$plat" in tiktok|reels|shorts) wh="1080 1920";; instagram|linkedin) wh="1080 1350";; square) wh="1080 1080";; youtube|x) wh="1920 1080";;
      *) echo "unknown platform '$plat': use tiktok reels shorts instagram square linkedin youtube x"; exit 1;; esac
    set -- $wh; fw=$1; fh=$2
    d=${FILMS_DIR:-$HOME/films}/$slug; [ -e "$d" ] && { echo "exists: $d"; exit 1; }
    mkdir -p "$d/src" "$d/qc"
    sed -e "s#{{TITLE}}#$title#" -e "s#{{PLATFORM}}#$plat#" -e "s#{{W}}#$fw#" -e "s#{{H}}#$fh#" "$ROOT/kit/head.template.js" > "$d/src/head.js"
    cp "$ROOT/kit/scenes.template.js" "$d/src/scenes.js"
    cp "$ROOT/references/brief.template.md" "$d/brief.md"
    echo "$d" ;;
  new-long)
    slug=$1; title=${2:-$1}; n=${3:-3}; plat=${4:-youtube}; [ -n "$slug" ] || { echo "usage: film.sh new-long <slug> [title] [chapters] [platform]"; exit 1; }
    d=${FILMS_DIR:-$HOME/films}/$slug; [ -e "$d" ] && { echo "exists: $d"; exit 1; }
    mkdir -p "$d"; printf '# %s\n\n**Core idea:**\n\n| ch | title (must name the topic) | one idea | seconds |\n|---|---|---|---|\n' "$title" > "$d/outline.md"
    i=1; while [ $i -le "$n" ]; do c=$(printf 'ch%02d' $i)
      FILMS_DIR="$d" sh "$0" new "$c" "$title: chapter $i" "$plat" >/dev/null; echo "| $i | $title: ... |  | 45 |" >> "$d/outline.md"; i=$((i+1)); done
    echo "$d" ;;
  check-long)
    d=$(cd "$1" && pwd); s=0
    ref=$(ls -d "$d"/ch*/ | head -1)
    look() { grep -E '^(const (BG|VAR|PAPER|LOOK)|      THREAD)' "$1/src/head.js"; }
    for c in "$d"/ch*/; do c=${c%/}; echo "== $(basename "$c")"
      out=$(sh "$0" check "$c" 5 2>&1) || s=1; echo "$out" | grep -vE '^(contact sheet|CLEAN: /)' | tail -6
      # one look across chapters: palette and LOOK lines must match chapter 1
      [ "$(look "$ref")" = "$(look "$c")" ] || { echo "look: $(basename "$c") palette differs from $(basename "$ref"): keep one look"; s=1; }
    done; exit $s ;;
  render-long)
    d=$(cd "$1" && pwd); slug=$(basename "$d"); list="$d/.chapters.txt"; : > "$list"
    for c in "$d"/ch*/; do c=${c%/}; cs=$(basename "$c")
      if [ ! -f "$c/$cs.mp4" ] || [ -n "$(find "$c/src" "$c/voice" -newer "$c/$cs.mp4" -type f 2>/dev/null | head -1)" ]; then echo "== render $cs"; sh "$0" render "$c" || { echo "REFUSED: $cs fails its checks"; exit 1; }; else echo "== $cs unchanged"; fi
      echo "file '$c/$cs.mp4'" >> "$list"; done
    FF=$(command -v ffmpeg || echo /usr/local/bin/ffmpeg)
    "$FF" -y -loglevel error -f concat -safe 0 -i "$list" -c:v copy -c:a aac -b:a 192k "$d/$slug.mp4"
    echo "joined $(grep -c . "$list") chapters -> $d/$slug.mp4" ;;
  check)
    d=$(cd "$1" && pwd); sh "$HERE/build.sh" "$d" >/dev/null
    cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/qc/sheet.jpg" --sheet "${2:-1.5}" | tail -1
    s=0
    out=$(node "$JA/layout-check.mjs" "$d/piece.html") || s=1; echo "$out" | tail -4
    node "$HERE/check.mjs" "$d/piece.html" || s=1
    # claim tests must test something: a constant condition is a fake pass
    python3 "$HERE/lint.py" "$d/src/scenes.js" || s=1
    # zero assets: nothing loaded, nothing referenced (the upstream audit's verdict counts)
    node "$JA/asset-audit.mjs" "$d/piece.html" | grep -q "NOT zero-asset" && { echo "assets: the page references files; it must compute everything (run asset-audit.mjs for details)"; s=1; }
    # the scaffold is a demo about generic growth: a film must replace it, not re-label it
    sim=$(python3 -c "import difflib,sys; a=open(sys.argv[1]).read().splitlines(); b=open(sys.argv[2]).read().splitlines(); print(round(difflib.SequenceMatcher(None,a,b).ratio()*100))" "$d/src/scenes.js" "$ROOT/kit/scenes.template.js")
    if [ "$sim" -gt 50 ]; then echo "template reuse: src/scenes.js is ${sim}% identical to the demo template; rewrite the scenes for this film's topic (keep the structure, replace the content)"; s=1; fi
    exit $s ;;
  stills)
    d=$(cd "$1" && pwd); sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/qc/still" --stills "$2" ;;
  voice)
    d=$(cd "$1" && pwd); T=$HOME/.cache/explainer-film/tts
    if [ ! -x "$T/.venv/bin/python" ] || [ ! -f "$T/voices-v1.0.bin" ]; then
      echo "first use: installing Kokoro TTS (free, local, ~350 MB) into $T"; mkdir -p "$T"
      uv venv -q --python 3.12 "$T/.venv" && uv pip install -q --python "$T/.venv/bin/python" kokoro-onnx soundfile
      R=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
      curl -sSL -o "$T/kokoro-v1.0.onnx" "$R/kokoro-v1.0.onnx"; curl -sSL -o "$T/voices-v1.0.bin" "$R/voices-v1.0.bin"
    fi
    "$T/.venv/bin/python" "$HERE/voice.py" "$d" ;;
  reference)
    sh "$HERE/reference.sh" "$1" "$2" ;;
  plan)
    # independent review of the PLAN (brief.md + narration) before any scene code; approval is keyed to this exact brief
    d=$(cd "$1" && pwd); slug=$(basename "$d"); V=$HOME/.cache/explainer-film/verdicts; W=$d/qc/plan; rm -rf "$W"; mkdir -p "$W"
    grep -q "^\*\*Core idea[^:]*:\*\* *[^ ]" "$d/brief.md" 2>/dev/null || { echo "REFUSED: fill in brief.md first (core idea, kit plan, reality map with tests, claims, beats)."; exit 1; }
    { echo "# Plan packet: $(sed -n 's#^// TITLE: ##p' "$d/src/head.js")"; echo; cat "$d/brief.md"
      [ -f "$d/src/narration.json" ] && { printf '\n## Narration (src/narration.json)\n\n```json\n'; cat "$d/src/narration.json"; printf '\n```\n'; }
      [ -f "$d/refs/style.md" ] && { printf '\n## Reference style (refs/style.md)\n\n'; cat "$d/refs/style.md"; }
    } > "$W/plan-packet.md"
    h=$(shasum -a 256 "$d/brief.md" | cut -c1-16)
    echo "reviewing the plan with an independent reviewer (about 1 min)..."
    sh "$HERE/judge.sh" "$W" "$ROOT/references/plan-reviewer.md" plan-packet.md "$V/plans/$h.json" "$V/plan_$slug" ;;
  review)
    d=$(cd "$1" && pwd); slug=$(basename "$d"); V=$HOME/.cache/explainer-film/verdicts; mkdir -p "$V"
    # the film review needs an approved plan for the current brief (REVIEW_ANYWAY=1 is for calibrating the reviewer only)
    bh=$(shasum -a 256 "$d/brief.md" 2>/dev/null | cut -c1-16)
    if [ "${REVIEW_ANYWAY:-0}" != 1 ]; then
      python3 -c "import json,sys; sys.exit(0 if json.load(open(sys.argv[1]))['approved'] else 1)" "$V/plans/$bh.json" 2>/dev/null || { echo "REFUSED: the plan for this brief is not approved. Run film.sh plan <dir> first (and again after any brief change)."; exit 1; }
      if ! out=$(sh "$0" check "$d" 5 2>&1); then echo "$out" | grep -vE '^(contact sheet|CLEAN: /)'; echo "REFUSED: review runs only on a film that passes film.sh check."; exit 1; fi
    fi
    sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN" && node "$HERE/review.mjs" "$d" || exit 1
    h=$(shasum -a 256 "$d/piece.html" | cut -c1-16)
    echo "reviewing $(ls "$d/qc/review"/*.jpg | wc -l | tr -d ' ') stills with an independent reviewer (about 1-3 min)..."
    sh "$HERE/judge.sh" "$d/qc/review" "$ROOT/references/reviewer.md" packet.md "$V/$h.json" "$V/film_$slug" ;;
  render)
    d=$(cd "$1" && pwd); slug=$(basename "$d")
    # hard gate: a film that fails its checks is not finished, so it does not render (a person can override with FORCE=1)
    if [ "${FORCE:-0}" != 1 ]; then
      if ! out=$(sh "$0" check "$d" 5 2>&1); then echo "$out" | grep -vE '^(contact sheet|CLEAN: /)'; echo "REFUSED: fix the failures above, then render again. The film is not done while any check fails."; exit 1; fi
      # the independent reviewer must have approved this exact build (any change after review voids the approval)
      h=$(shasum -a 256 "$d/piece.html" | cut -c1-16); V=$HOME/.cache/explainer-film/verdicts/$h.json
      python3 -c "import json,sys; sys.exit(0 if json.load(open(sys.argv[1]))['approved'] else 1)" "$V" 2>/dev/null || { echo "REFUSED: no independent approval for this build. Run film.sh review <dir>, fix what it rejects, and review again."; exit 1; }
    fi
    sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/$slug.mp4" | tail -3
    node "$ST/sync-check.mjs" "$d/$slug.mp4" --cues-file "$d/$slug.cues.json" | tail -12
    if [ -f "$d/voice/timing.json" ]; then
      node "$HERE/narrate-plan.mjs" "$d/piece.html" > "$d/voice/plan.json"
      sh "$HERE/mix.sh" "$d" "$d/voice/plan.json"
    fi ;;
  *) sed -n '2,13p' "$0"; exit 1 ;;
esac
