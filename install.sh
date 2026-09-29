#!/bin/sh
# install.sh: set up explainer-film for Claude Code and other agent CLIs (Codex, Cursor, Gemini read ~/.agents/skills).
# Safe to run again. It never uses sudo; for missing system tools it prints the command to run.
set -e
ROOT=$(cd "$(dirname "$0")" && pwd)
[ -d "$HOME/.local/node/bin" ] && export PATH=$HOME/.local/node/bin:$PATH
command -v node >/dev/null || { echo "Please install Node.js 18+ first (brew install node, or https://nodejs.org), then run ./install.sh again."; exit 1; }
command -v ffmpeg >/dev/null || [ -x /usr/local/bin/ffmpeg ] || { echo "Please install ffmpeg first (brew install ffmpeg / sudo apt install ffmpeg), then run ./install.sh again."; exit 1; }
echo "1/4 upstream skills (javascript-animation + soundtrack)"
[ -f "$HOME/.agents/skills/javascript-animation/templates/starter.html" ] || npx -y skills add iart-ai/javascript-animation-skills -g -y -s '*'
echo "2/4 node packages"
(cd "$ROOT" && npm i --silent)
echo "3/4 browser"
(cd "$ROOT" && node -e "const {chromium}=require('playwright-core');(async()=>{let b;try{b=await chromium.launch({channel:'chrome'})}catch{b=await chromium.launch()};await b.close()})().catch(()=>process.exit(1))" 2>/dev/null) \
  || (cd "$ROOT" && npx -y playwright install chromium)
echo "4/4 linking the skill"
for d in "$HOME/.claude/skills" "$HOME/.agents/skills"; do mkdir -p "$d"; [ -e "$d/explainer-film" ] || ln -s "$ROOT" "$d/explainer-film"; done
sh "$ROOT/scripts/doctor.sh"
