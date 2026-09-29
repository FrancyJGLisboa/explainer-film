#!/bin/sh
# judge.sh <workdir> <rules.md> <packet-name> <verdict-file> <state-prefix>
# Run the independent reviewer (a fresh claude CLI with fixed rules the maker cannot edit) in <workdir>, where
# <packet-name> is waiting. Writes the verdict to <verdict-file> and <workdir>/verdict.json.
# <state-prefix> (e.g. ~/.cache/explainer-film/verdicts/film_<slug>) keeps: <prefix>.rounds (rejections so far; 3 stops the loop)
# and <prefix>.last.json (previous verdict, appended to the packet so the reviewer checks its own earlier fixes).
# Exit 0 approved, 1 rejected or error.
set -e
W=$1; RULES=$2; PACKET=$3; OUT=$4; P=$5
n=$(cat "$P.rounds" 2>/dev/null || echo 0)
if [ "$n" -ge 3 ] && [ "${REVIEW_MORE:-0}" != 1 ]; then
  echo "STOP: the reviewer has rejected this 3 times. Report the latest verdict ($W/verdict.json) to the user and let them decide; do not keep looping."; exit 1; fi
[ -f "$P.last.json" ] && { printf '\n## Previous review (check each required fix first)\n\n```json\n'; cat "$P.last.json"; printf '\n```\n'; } >> "$W/$PACKET"
command -v claude >/dev/null || { echo "reviewer unavailable: the claude CLI is not installed; a person must review $W and override with FORCE=1"; exit 1; }
SCHEMA='{"type":"object","properties":{"approved":{"type":"boolean"},"summary":{"type":"string"},"suggestions":{"type":"array","items":{"type":"string"}},"scenes":{"type":"array","items":{"type":"object","properties":{"scene":{"type":"string"},"verdict":{"type":"string","enum":["pass","fail"]},"problems":{"type":"array","items":{"type":"string"}}},"required":["scene","verdict","problems"]}},"required_fixes":{"type":"array","items":{"type":"string"}}},"required":["approved","summary","scenes","required_fixes"]}'
( cd "$W" && claude -p "$(cat "$RULES")

The review folder is the current directory: read $PACKET (and every image it lists, if any). Return the verdict." \
    --allowedTools Read --output-format json --json-schema "$SCHEMA" ${REVIEW_MODEL:+--model "$REVIEW_MODEL"} < /dev/null ) > "$W/raw.json" 2> "$W/raw.err" || true
python3 - "$W/raw.json" "$OUT" "$W/verdict.json" "$P" <<'PY'
import json, sys, pathlib
raw_p, out, local, prefix = sys.argv[1:5]
try:
    raw = json.load(open(raw_p))
except Exception:
    print("reviewer error (not a verdict): no output. Run the review again."); sys.exit(1)
if raw.get("is_error"):
    print(f"reviewer error (not a verdict): {raw.get('result', '')}. Run the review again."); sys.exit(1)
v = raw.get("structured_output")
if v is None:
    r = raw.get("result", ""); v = json.loads(r[r.find("{"):r.rfind("}") + 1])
for p in (out, local, prefix + ".last.json"):
    pathlib.Path(p).parent.mkdir(parents=True, exist_ok=True); json.dump(v, open(p, "w"), indent=1)
rf = pathlib.Path(prefix + ".rounds"); n = int(rf.read_text()) if rf.exists() else 0
rf.write_text("0" if v["approved"] else str(n + 1))
print(("APPROVED" if v["approved"] else "REJECTED") + ": " + v["summary"])
for s in v.get("scenes", []):
    if s["verdict"] == "fail": print(f"  x {s['scene']}: " + " | ".join(s["problems"]))
for f in v.get("required_fixes", []): print("  fix: " + f)
for f in v.get("suggestions", []): print("  suggestion (not blocking): " + f)
sys.exit(0 if v["approved"] else 1)
PY
