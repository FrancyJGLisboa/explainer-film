#!/bin/sh
# mix.sh <film-dir> <plan.json>: lay the narration over <slug>.mp4. Music ducks under the voice
# (sidechain), then loudness is normalised to -16 LUFS. Keeps the music-only cut as <slug>.music-only.mp4.
set -e
d=$1; plan=$2; slug=$(basename "$d"); FF=$(command -v ffmpeg || echo /usr/local/bin/ffmpeg)
mv -f "$d/$slug.mp4" "$d/$slug.music-only.mp4"
set -- -y -loglevel error -i "$d/$slug.music-only.mp4"
n=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1]))))" "$plan")
filt=""; labels=""
i=0
for row in $(python3 -c "import json,sys; [print(f\"{p['file']}@{int(p['at']*1000)}\") for p in json.load(open(sys.argv[1]))]" "$plan"); do
  f=${row%@*}; ms=${row#*@}; i=$((i+1))
  set -- "$@" -i "$d/voice/$f"
  filt="$filt[$i:a]aresample=48000,adelay=$ms|$ms[v$i];"; labels="$labels[v$i]"
done
filt="${filt}${labels}amix=inputs=$n:normalize=0,pan=stereo|c0=c0|c1=c0,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,volume=1.6,asplit[vk][vm];"
filt="${filt}[0:a]aresample=48000[m];[m][vk]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=450[md];"
filt="${filt}[md][vm]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
"$FF" "$@" -filter_complex "$filt" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 "$d/$slug.mp4"
echo "narrated: $d/$slug.mp4 (music-only kept as $slug.music-only.mp4)"
