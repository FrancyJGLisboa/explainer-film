#!/bin/sh
# film.sh: the explainer-film pipeline, one command per stage.
#   film.sh new <slug> ["Title"]   scaffold ~/films/<slug> (brief.md, src/head.js, src/scenes.js)
#   film.sh check <dir>            build + contact sheet (qc/sheet.jpg) + asset audit + layout + rules (contrast, corners, timing)
#   film.sh stills <dir> 4s,12s    full-size stills into qc/
#   film.sh render <dir>           build + render <slug>.mp4 (+ .wav, cues) + sync/loudness check
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
  render)
    d=$(cd "$1" && pwd); slug=$(basename "$d"); sh "$HERE/build.sh" "$d" >/dev/null; cd "$RUN"
    node "$JA/render.mjs" "$d/piece.html" "$d/$slug.mp4" | tail -3
    node "$ST/sync-check.mjs" "$d/$slug.mp4" --cues-file "$d/$slug.cues.json" | tail -12 ;;
  *) sed -n '2,7p' "$0"; exit 1 ;;
esac
