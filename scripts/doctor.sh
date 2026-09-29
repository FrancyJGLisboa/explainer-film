#!/bin/sh
# doctor.sh: can explainer-film run here? Prints OK / MISSING with the fix for each part. Exit 1 if something required is missing.
ROOT=$(cd "$(dirname "$0")/.." && pwd); S=$HOME/.agents/skills
[ -d "$HOME/.local/node/bin" ] && export PATH=$HOME/.local/node/bin:$PATH
bad=0; ok() { printf '  OK       %s\n' "$1"; }; miss() { printf '  MISSING  %s\n           fix: %s\n' "$1" "$2"; [ "$3" = opt ] || bad=1; }
os=$(uname -s); pm="brew install"; [ "$os" = Linux ] && pm="sudo apt install"
echo "Required"
if command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ]; then ok "node $(node -v)"; else miss "node >= 18" "$pm node   (or https://nodejs.org)"; fi
command -v python3 >/dev/null && ok "python3" || miss "python3" "$pm python3"
if command -v ffmpeg >/dev/null || [ -x /usr/local/bin/ffmpeg ]; then FF=$(command -v ffmpeg || echo /usr/local/bin/ffmpeg)
  "$FF" -hide_banner -encoders 2>/dev/null | grep -q libx264 && ok "ffmpeg (with libx264)" || miss "ffmpeg with libx264" "$pm ffmpeg"; else miss "ffmpeg" "$pm ffmpeg"; fi
[ -f "$S/javascript-animation/templates/starter.html" ] && [ -f "$S/soundtrack/templates/groove.js" ] && ok "javascript-animation + soundtrack skills" \
  || miss "javascript-animation + soundtrack skills" "npx -y skills add iart-ai/javascript-animation-skills -g -y -s '*'"
[ -d "$ROOT/node_modules/playwright-core" ] && [ -d "$ROOT/node_modules/mathjax-full" ] && ok "node packages (playwright-core, mathjax-full)" || miss "node packages" "cd $ROOT && npm i"
if [ -d "$ROOT/node_modules/playwright-core" ]; then
  if (cd "$ROOT" && node -e "const {chromium}=require('playwright-core');(async()=>{let b;try{b=await chromium.launch({channel:'chrome'})}catch{b=await chromium.launch()};await b.close()})().catch(()=>process.exit(1))" 2>/dev/null); then ok "a browser to render with"
  else miss "a browser to render with (Chrome or Playwright's Chromium)" "install Google Chrome, or: cd $ROOT && npx -y playwright install chromium"; fi
fi
command -v claude >/dev/null && ok "claude CLI (independent plan and film reviewers)" || miss "claude CLI (the reviewers; without it render needs a person's FORCE=1)" "npm i -g @anthropic-ai/claude-code, then run claude once to log in"
echo "Optional"
command -v uv >/dev/null && ok "uv (narration: free Kokoro voices)" || miss "uv (only for narration)" "$pm uv   (or https://docs.astral.sh/uv/)" opt
[ -f "$HOME/.cache/explainer-film/tts/voices-v1.0.bin" ] && ok "Kokoro voices downloaded" || printf '  LATER    Kokoro voices (downloaded on the first narrated film, ~350 MB)\n'
command -v yt-dlp >/dev/null && ok "yt-dlp (reference videos from links)" || miss "yt-dlp (only for 'in the style of <link>')" "$pm yt-dlp" opt
for d in "$HOME/.claude/skills/explainer-film" "$HOME/.agents/skills/explainer-film"; do [ -e "$d" ] && ok "skill installed at $d" || printf '  NOTE     not linked at %s (./install.sh links it)\n' "$d"; done
[ $bad = 0 ] && echo "Ready: ask your agent for an explainer." || echo "Fix the MISSING items above, then run film.sh doctor again."
exit $bad
