#!/bin/sh
# film.sh: the explainer-film pipeline, one command per stage.
#   film.sh new <slug> ["Title"]   scaffold ~/films/<slug> (brief.md, src/head.js, src/scenes.js)
#   film.sh check <dir>            build + contact sheet (qc/sheet.jpg) + asset audit + layout + rules (contrast, corners, timing)
#   film.sh stills <dir> 4s,12s    full-size stills into qc/
#   film.sh new-long <slug> "Title" <n>   a long film: ~/films/<slug>/outline.md + ch01..chNN (each a normal film)
#   film.sh check-long <dir> / render-long <dir>   check every chapter (+ same look) / render changed chapters and join them
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
    slug=$1; title=${2:-$1}; [ -n "$slug" ] || { echo "usage: film.sh new <slug> [title]"; exit 1; }
    d=${FILMS_DIR:-$HOME/films}/$slug; [ -e "$d" ] && { echo "exists: $d"; exit 1; }
    mkdir -p "$d/src" "$d/qc"
    sed "s#{{TITLE}}#$title#" "$ROOT/kit/head.template.js" > "$d/src/head.js"
    cp "$ROOT/kit/scenes.template.js" "$d/src/scenes.js"
    cp "$ROOT/references/brief.template.md" "$d/brief.md"
    echo "$d" ;;
  new-long)
    slug=$1; title=${2:-$1}; n=${3:-3}; [ -n "$slug" ] || { echo "usage: film.sh new-long <slug> [title] [chapters]"; exit 1; }
    d=${FILMS_DIR:-$HOME/films}/$slug; [ -e "$d" ] && { echo "exists: $d"; exit 1; }
    mkdir -p "$d"; printf '# %s\n\n**Core idea:**\n\n| ch | title (must name the topic) | one idea | seconds |\n|---|---|---|---|\n' "$title" > "$d/outline.md"
    i=1; while [ $i -le "$n" ]; do c=$(printf 'ch%02d' $i)
      FILMS_DIR="$d" sh "$0" new "$c" "$title: chapter $i" >/dev/null; echo "| $i | $title: ... |  | 45 |" >> "$d/outline.md"; i=$((i+1)); done
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
  review)
    d=$(cd "$1" && pwd); V=$HOME/.cache/explainer-film/verdicts; mkdir -p "$V"
    # review costs a model call, so it runs on films that pass the checks (REVIEW_ANYWAY=1 is for calibrating the reviewer;
    # it cannot unlock a render, which re-runs every check itself)
    if [ "${REVIEW_ANYWAY:-0}" != 1 ] && ! out=$(sh "$0" check "$d" 5 2>&1); then echo "$out" | grep -vE '^(contact sheet|CLEAN: /)'; echo "REFUSED: review runs only on a film that passes film.sh check."; exit 1; fi
    # round cap: after 3 rejections of this film, stop and hand it to a person (the counter resets on approval)
    slug=$(basename "$d"); R=$V/rounds_$slug; n=$(cat "$R" 2>/dev/null || echo 0)
    if [ "$n" -ge 3 ] && [ "${REVIEW_MORE:-0}" != 1 ]; then echo "STOP: the reviewer has rejected this film 3 times. Report the latest verdict (qc/review/verdict.json) to the user and let them decide; do not keep looping."; exit 1; fi
    prev=$V/last_$slug.json
    sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN" && node "$HERE/review.mjs" "$d" || exit 1
    [ -f "$prev" ] && { printf '\n## Previous review (check each required fix)\n\n```json\n'; cat "$prev"; printf '\n```\n'; } >> "$d/qc/review/packet.md"
    h=$(shasum -a 256 "$d/piece.html" | cut -c1-16)
    command -v claude >/dev/null || { echo "reviewer unavailable: the claude CLI is not installed; a person must review qc/review/ and render with FORCE=1"; exit 1; }
    SCHEMA='{"type":"object","properties":{"approved":{"type":"boolean"},"summary":{"type":"string"},"suggestions":{"type":"array","items":{"type":"string"}},"scenes":{"type":"array","items":{"type":"object","properties":{"scene":{"type":"string"},"verdict":{"type":"string","enum":["pass","fail"]},"problems":{"type":"array","items":{"type":"string"}}},"required":["scene","verdict","problems"]}},"required_fixes":{"type":"array","items":{"type":"string"}}},"required":["approved","summary","scenes","required_fixes"]}'
    echo "reviewing $(ls "$d/qc/review"/*.jpg | wc -l | tr -d ' ') stills with an independent reviewer (about 1-3 min)..."
    ( cd "$d/qc/review" && claude -p "$(cat "$ROOT/references/reviewer.md")

The review folder is the current directory: read packet.md, then every .jpg it lists. Return the verdict." \
        --allowedTools Read --output-format json --json-schema "$SCHEMA" ${REVIEW_MODEL:+--model "$REVIEW_MODEL"} < /dev/null ) > "$d/qc/review/raw.json" 2>"$d/qc/review/raw.err"
    if python3 -c "import json,sys; j=json.load(open(sys.argv[1])); sys.exit(0 if j.get('is_error') else 1)" "$d/qc/review/raw.json" 2>/dev/null || [ ! -s "$d/qc/review/raw.json" ]; then
      echo "reviewer error (not a verdict): $(python3 -c "import json,sys; print(json.load(open(sys.argv[1])).get('result','no output'))" "$d/qc/review/raw.json" 2>/dev/null || tail -2 "$d/qc/review/raw.err"). Run film.sh review again."; exit 1; fi
    python3 - "$d/qc/review/raw.json" "$V/$h.json" "$d/qc/review/verdict.json" <<'PY' || exit 1
import json, sys
raw = json.load(open(sys.argv[1]))
v = raw.get("structured_output")
if v is None:
    r = raw.get("result", ""); v = json.loads(r[r.find("{"):r.rfind("}") + 1])
for p in sys.argv[2:]: json.dump(v, open(p, "w"), indent=1)
import os, pathlib
slug = pathlib.Path(sys.argv[3]).parents[2].name; V = pathlib.Path(sys.argv[2]).parent
json.dump(v, open(V / f"last_{slug}.json", "w"), indent=1)
rf = V / f"rounds_{slug}"; n = int(rf.read_text()) if rf.exists() else 0
rf.write_text("0" if v["approved"] else str(n + 1))
print(("APPROVED" if v["approved"] else "REJECTED") + ": " + v["summary"])
for s in v["scenes"]:
    if s["verdict"] == "fail": print(f"  x {s['scene']}: " + " | ".join(s["problems"]))
for f in v["required_fixes"]: print("  fix: " + f)
for f in v.get("suggestions", []): print("  suggestion (not blocking): " + f)
sys.exit(0 if v["approved"] else 1)
PY
    ;;
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
  *) sed -n '2,11p' "$0"; exit 1 ;;
esac
