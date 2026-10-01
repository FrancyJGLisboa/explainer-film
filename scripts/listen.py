"""listen.py <film-dir>: transcribe the finished narrated film (local Whisper) and compare it with the script.
Checks (1) each narration line was spoken as written (a mispronounced or garbled word shows up as a mismatch) and
(2) the burned-in captions keep time with the voice (each caption word vs when it is actually heard).
Needs voice/timing.json, voice/plan.json, voice/captions.json and <slug>.mp4. Runs in the tts venv (film.sh sets it up).
Exit 1 on a failure; the report is also written to voice/listen.md."""
import json, re, subprocess, sys, pathlib, statistics, difflib, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent)); from numwords import to_digits

d = pathlib.Path(sys.argv[1]).resolve(); slug = d.name
timing = json.load(open(d / "voice/timing.json")); plan = json.load(open(d / "voice/plan.json"))
caps = json.load(open(d / "voice/captions.json")) if (d / "voice/captions.json").exists() else []
nar = json.load(open(d / "src/narration.json")) if (d / "src/narration.json").exists() else {}
lang = (timing.get("lang") or nar.get("lang") or "en-us")[:2].lower()   # the narration's language picks the model (English-only base.en, else multilingual small)
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
def words_to_num(ws):          # "eighty" -> 80, "three hundred sixty" -> 360, so "$80" and "eighty dollars" compare equal
    out, cur, have = [], 0, False
    def flush():
        nonlocal cur, have
        if have: out.append(str(cur)); cur, have = 0, False
    for w in ws:
        if w in ONES: cur += ONES.index(w); have = True
        elif w in TENS: cur += TENS.index(w) * 10; have = True
        elif w == "hundred" and have: cur *= 100
        elif w == "thousand" and have: cur *= 1000; 
        elif w == "and" and have: continue
        else: flush(); out.append(w)
    flush(); return out
def norm(text):
    t = text.lower().replace("%", " percent ").replace("&", " and ")
    t = re.sub(r"\$(\d[\d,]*)", r"\1 dollars", t); t = re.sub(r"(\d),(\d)", r"\1\2", t)
    t = re.sub(r"[^a-z0-9à-ÿ' ]", " ", t).replace("'", "")
    return [w for w in to_digits(t.split(), lang) if w not in ("dollars", "dollar", "uh", "um", "reais", "real")]   # spelled numbers and digits compare equal, PT and EN

audio = pathlib.Path(tempfile.mkdtemp()) / "a.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(d / f"{slug}.mp4"), "-ac", "1", "-ar", "16000", str(audio)], check=True)
from faster_whisper import WhisperModel
model = WhisperModel("base.en" if lang == "en" else "small", compute_type="int8")
import soundfile as sf
pcm, _sr = sf.read(str(audio), dtype="float32")
segs, _ = model.transcribe(pcm, language=lang, word_timestamps=True, vad_filter=False, beam_size=5)
heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]

fails, report = [], [f"# listen: {slug}\n", "## Lines (script vs heard)\n"]
at = {p["file"]: p["at"] for p in plan}
for ln in timing["lines"]:
    a = at.get(ln["file"]); 
    if a is None: continue
    win = [w for w, s, e in heard if a - .3 <= s <= a + ln["dur"] + .3]
    exp, got = norm(ln["text"]), norm(" ".join(win))
    r = difflib.SequenceMatcher(None, exp, got).ratio()
    miss = [" ".join(exp[i1:i2]) + (" -> " + " ".join(got[j1:j2]) if j2 > j1 else " -> (not heard)") for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, exp, got).get_opcodes() if op in ("replace", "delete")]
    report.append(f"- {r:.0%} `{ln['scene']}`: {ln['text']}" + (f"\n  - heard: {' '.join(win)}\n  - differs: {'; '.join(miss)}" if r < 1 else ""))
    if r < .8: fails.append(f"line in '{ln['scene']}' was not heard as written ({r:.0%} match): {'; '.join(miss)}. Respell the word the way it should sound (e.g. 'A D M', 'eighty dollars'), run film.sh voice, and render again")
if caps:
    cw = [(norm(c["w"]) or [""])[0] for c in caps]; hw = [(norm(w) or [""])[0] for w, s, e in heard]
    drift = []
    for blk in difflib.SequenceMatcher(None, cw, hw, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            if cw[blk.a + k]: drift.append(caps[blk.a + k]["at"] - heard[blk.b + k][1])
    if drift:
        med = statistics.median(drift); bad = [x for x in drift if abs(x) > .5]
        report.append(f"\n## Captions vs voice\n{len(drift)} words matched; median caption lead {med:+.2f} s (negative = caption early), {len(bad)} words off by more than 0.5 s, worst {max(drift, key=abs):+.2f} s")
        if abs(med) > .25 or len(bad) > .1 * len(drift): fails.append(f"captions drift from the voice: median {med:+.2f} s, {len(bad)} of {len(drift)} words off by > 0.5 s")
(d / "voice/listen.md").write_text("\n".join(report) + "\n")
print("\n".join(report))
if fails:
    print("\nLISTEN FAILED:\n  " + "\n  ".join(fails)); sys.exit(1)
print("\nLISTEN CLEAN: every line heard as written; captions keep time with the voice.")
