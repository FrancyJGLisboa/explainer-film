#!/bin/sh
# film.sh: the explainer-film pipeline, one command per stage.
#   film.sh new <slug> ["Title"]   scaffold ~/films/<slug> (brief.md, src/head.js, src/scenes.js)
#   film.sh check <dir>            build + contact sheet (qc/sheet.jpg) + asset audit + layout + rules (contrast, corners, timing)
#   film.sh stills <dir> 4s,12s    full-size stills into qc/
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
  check)
    d=$(cd "$1" && pwd); sh "$HERE/build.sh" "$d" >/dev/null
    cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/qc/sheet.jpg" --sheet "${2:-1.5}" | tail -1
    node "$JA/asset-audit.mjs" "$d/piece.html" | tail -1
    s=0
    out=$(node "$JA/layout-check.mjs" "$d/piece.html") || s=1; echo "$out" | tail -4
    node "$HERE/check.mjs" "$d/piece.html" || s=1
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
  render)
    d=$(cd "$1" && pwd); slug=$(basename "$d"); sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/$slug.mp4" | tail -3
    node "$ST/sync-check.mjs" "$d/$slug.mp4" --cues-file "$d/$slug.cues.json" | tail -12
    if [ -f "$d/voice/timing.json" ]; then
      node "$HERE/narrate-plan.mjs" "$d/piece.html" > "$d/voice/plan.json"
      sh "$HERE/mix.sh" "$d" "$d/voice/plan.json"
    fi ;;
  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
