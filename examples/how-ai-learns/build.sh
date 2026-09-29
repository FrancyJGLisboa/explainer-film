#!/bin/sh
# Assemble piece.html: starter header + this piece's look + starter library + scenes + groove score + live preview
set -e
cd "$(dirname "$0")"
S=$HOME/.agents/skills/javascript-animation/templates/starter.html
G=$HOME/.agents/skills/soundtrack/templates/groove.js
{
  sed -n '1,16p' "$S" | sed -e 's/<title>Untitled animation<\/title>/<title>How AI Learns<\/title>/' -e 's/width:min(100vw,100vh)/width:min(100vw,177.78vh)/'
  cat src/head.js
  sed -n '37,262p' "$S"
  cat src/scenes.js
  cat "$G"
  echo "window.SCORE = ac => buildGroove(ac, { dur: DUR, bpm: BPM, sections: SECTIONS, events: EVENTS, kit: 'percussion', harmony: 'bright', key: 2, sfxGain: .85 });"
  echo
  sed -n '300,$p' "$S"
} > piece.html
echo built piece.html
