#!/bin/sh
# reference.sh <film-dir> <video-file-or-url>: study a reference video's GRAMMAR (never its content).
# Writes <film>/refs/: source video, frames/ (every 0.5 s), sheet.jpg (contact sheet, 1 frame/s),
# analysis.md (duration, cuts and shot lengths, dominant palette) and style.md (a guide for the maker to fill in).
set -e
d=$(cd "$1" && pwd); src=$2; R=$d/refs; mkdir -p "$R/frames"
FF=$(command -v ffmpeg || echo /usr/local/bin/ffmpeg); FP=$(command -v ffprobe || echo /usr/local/bin/ffprobe)
case "$src" in
  http*://*) command -v yt-dlp >/dev/null || { echo "yt-dlp is needed for links: brew install yt-dlp (or pass a downloaded file)"; exit 1; }
             rm -f "$R"/source.*; yt-dlp -q -f "bv*[height<=720]+ba/b[height<=720]/b" --merge-output-format mp4 -o "$R/source.%(ext)s" "$src"; V=$(ls "$R"/source.* | head -1) ;;
  *) [ -f "$src" ] || { echo "no such file: $src"; exit 1; }; cp "$src" "$R/source.${src##*.}"; V=$R/source.${src##*.} ;;
esac
dur=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$V"); dur=${dur%.*}
[ "$dur" -gt 180 ] && echo "note: only the first 180 s are studied" && dur=180
rm -f "$R"/frames/*.jpg
"$FF" -v error -y -t 180 -i "$V" -vf "fps=2,scale=640:-2" -q:v 4 "$R/frames/f_%04d.jpg"
cols=6; rows=$(( (dur + cols - 1) / cols )); [ "$rows" -lt 1 ] && rows=1
"$FF" -v error -y -t 180 -i "$V" -vf "fps=1,scale=320:-2,tile=${cols}x${rows}:padding=4:color=black" -frames:v 1 -q:v 3 "$R/sheet.jpg"
# cuts: scene-change detection
"$FF" -v info -t 180 -i "$V" -vf "select='gt(scene,0.32)',showinfo" -f null - 2>&1 | sed -n 's/.*pts_time:\([0-9.]*\).*/\1/p' > "$R/cuts.txt" || true
# palette: 8 dominant colours
"$FF" -v error -y -t 180 -i "$V" -vf "fps=1,scale=320:-2,palettegen=max_colors=8:reserve_transparent=0:stats_mode=full" "$R/palette.png"
"$FF" -v error -y -i "$R/palette.png" -f rawvideo -pix_fmt rgb24 "$R/palette.rgb"
python3 - "$R" "$dur" <<'PY'
import sys, pathlib
R = pathlib.Path(sys.argv[1]); dur = float(sys.argv[2])
cuts = [float(x) for x in (R / "cuts.txt").read_text().split()]
edges = [0.0] + cuts + [dur]; shots = [round(b - a, 2) for a, b in zip(edges, edges[1:]) if b - a > .05]
raw = (R / "palette.rgb").read_bytes(); cols = []
for i in range(0, len(raw) - 2, 3):
    h = "#%02x%02x%02x" % tuple(raw[i:i + 3])
    if h not in cols: cols.append(h)
lum = lambda h: sum(int(h[i:i + 2], 16) * w for i, w in ((1, .2126), (3, .7152), (5, .0722)))
cols = sorted(cols, key=lum)[:8]
med = sorted(shots)[len(shots) // 2] if shots else dur
frames = sorted(p.name for p in (R / "frames").glob("*.jpg"))
(R / "analysis.md").write_text(f"""# Reference analysis (measured)

- Duration studied: {dur:.0f} s; frames every 0.5 s in `refs/frames/` ({len(frames)} files); contact sheet `refs/sheet.jpg` (1 frame per second, left to right)
- Cuts detected: {len(cuts)} -> {len(shots)} shots; median shot {med:.2f} s; shortest {min(shots) if shots else 0:.2f} s; longest {max(shots) if shots else 0:.2f} s
- Cut times (s): {', '.join(f'{c:.2f}' for c in cuts) or 'none (one continuous shot)'}
- Dominant palette, dark to light: {' '.join(cols)}
- At 96 bpm one beat is 0.625 s: the median shot is about {med / .625:.1f} beats
""")
style = R / "style.md"
if not style.exists():
    style.write_text(f"""# Reference style guide (fill in from sheet.jpg, the frames and analysis.md)

Take the GRAMMAR of the reference, never its content: no copied characters, logos, text, products or scenes.

- **Palette roles** (map the measured colours {' '.join(cols)} to BG / DEEP / DISC / TEXT / HERO / THREAD, keeping red for danger):
- **Type** (weight, case, size relative to frame, where words sit):
- **Shot length** (median {med:.2f} s, about {med / .625:.1f} beats; how it varies through the film):
- **Transitions** (morph, match cut, whip, push, hard cut; how often):
- **Camera** (static, slow push, pans, parallax depth, zooms into detail):
- **Motion feel** (springy overshoot, linear, eased; speed):
- **Texture** (flat, grain, gradients, outlines, shadows):
- **How text enters and exits**:
- **What to borrow in this film** (3-5 concrete moves):
""")
print((R / "analysis.md").read_text())
PY
rm -f "$R/palette.rgb"
echo "next: open refs/sheet.jpg and a few refs/frames, fill in refs/style.md, then set src/head.js from it"
