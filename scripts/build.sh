#!/bin/sh
# build.sh <film-dir>: assemble <film-dir>/piece.html from the starter library + kit + the film's head/scenes + score
set -e
F=$(cd "$1" && pwd); K=$(cd "$(dirname "$0")/../kit" && pwd)
S=$HOME/.agents/skills/javascript-animation/templates/starter.html
G=$HOME/.agents/skills/soundtrack/templates/groove.js
[ -f "$S" ] && [ -f "$G" ] || { echo "missing javascript-animation / soundtrack skills in ~/.agents/skills"; exit 1; }
sed -n '38p' "$S" | grep -q '^// ---------- math' || { echo "starter.html layout changed (line 38 is not the math block): update build.sh line ranges"; exit 1; }
sed -n '261p' "$S" | grep -q '^}' || { echo "starter.html layout changed (line 261): update build.sh line ranges"; exit 1; }
TITLE=$(sed -n 's#^// TITLE: ##p' "$F/src/head.js" | head -1)
{
  sed -n '1,16p' "$S" | sed -e "s#<title>Untitled animation</title>#<title>${TITLE:-Explainer}</title>#" -e 's#canvas{width:min(100vw,100vh);height:auto;max-height:100vh}#canvas{max-width:100vw;max-height:100vh}#'
  cat "$F/src/head.js"
  sed -n '37,262p' "$S"
  # narration timing; file names lose their extension so the page references no files
  if [ -f "$F/voice/timing.json" ]; then printf "const NARRATION = "; sed 's/\.wav"/"/' "$F/voice/timing.json"; echo ";"; else echo "const NARRATION = null;"; fi
  # watermark: the film's own src/brand.json, else the user's ~/.config/explainer-film/brand.json (film.sh brand @handle)
  B="$F/src/brand.json"; [ -f "$B" ] || B="$HOME/.config/explainer-film/brand.json"
  if [ -f "$B" ]; then printf "const BRAND = "; cat "$B"; echo ";"; else echo "const BRAND = null;"; fi
  if [ -f "$F/src/tex.json" ]; then node "$(dirname "$0")/tex.mjs" "$F" >&2; printf "const TEXPATHS = "; cat "$F/tex/paths.json"; echo ";"; else echo "const TEXPATHS = null;"; fi
  cat "$K/kit.js" "$K/worlds.js" "$K/tex.js" "$K/music.js"
  cat "$F/src/scenes.js"
  cat "$G"
  sed -n '300,$p' "$S"
} > "$F/piece.html"
echo "built $F/piece.html"
