"""vtt2text.py <file.vtt>: plain transcript text from WebVTT subtitles (drops timings, tags and the repeated rolling lines of auto-captions)."""
import re, sys
out, last = [], None
for line in open(sys.argv[1], encoding="utf-8"):
    line = line.strip()
    if not line or line == "WEBVTT" or "-->" in line or re.match(r"^(Kind|Language|NOTE)\b", line) or line.isdigit(): continue
    line = re.sub(r"<[^>]+>", "", line).strip()
    if line and line != last: out.append(line); last = line
print(" ".join(out))
