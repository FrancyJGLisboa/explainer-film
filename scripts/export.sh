#!/bin/sh
# export.sh <film-dir>: the file to upload. <slug>.<platform>.mp4 (H.264 High, yuv420p, fast start, AAC 48 kHz,
# loudness -14 LUFS, the level TikTok/Reels/Shorts/YouTube normalise to) + <slug>.cover.jpg (a frame with the idea on screen).
set -e
d=$(cd "$1" && pwd); slug=$(basename "$d"); in=$d/$slug.mp4
FF=$(command -v ffmpeg || echo /usr/local/bin/ffmpeg); FP=$(command -v ffprobe || echo /usr/local/bin/ffprobe)
plat=$(sed -n "s/^const PLATFORM = '\([a-z]*\)'.*/\1/p" "$d/src/head.js"); plat=${plat:-youtube}
[ -f "$in" ] || { echo "export: $in not found (render first)"; exit 1; }
dur=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$in"); secs=${dur%.*}
case "$plat" in shorts) max=180;; reels) max=180;; tiktok) max=600;; x) max=140;; instagram|linkedin|square) max=600;; *) max=100000;; esac
[ "$secs" -gt "$max" ] && echo "warning: $secs s is longer than $plat allows ($max s); make it shorter or pick another platform"
H=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['handle'])" "$d/src/brand.json" 2>/dev/null || python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['handle'])" "$HOME/.config/explainer-film/brand.json" 2>/dev/null || true)
META=""; [ -n "$H" ] && META="-metadata artist=$H -metadata copyright=$H -metadata comment=Original_by_$H"
"$FF" -v error -y -i "$in" -vf "scale=out_range=tv,format=yuv420p" -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 18 -maxrate 12M -bufsize 24M \
  -af "loudnorm=I=-14:TP=-1:LRA=11" -c:a aac -b:a 192k -ar 48000 -movflags +faststart $META "$d/$slug.$plat.mp4"
"$FF" -v error -y -ss "$(python3 -c "print(round($dur * .45, 2))")" -i "$in" -frames:v 1 -q:v 2 "$d/$slug.cover.jpg"
size=$(du -h "$d/$slug.$plat.mp4" | cut -f1)
echo "ready to upload: $d/$slug.$plat.mp4 ($size, $secs s, -14 LUFS) + cover $slug.cover.jpg"
