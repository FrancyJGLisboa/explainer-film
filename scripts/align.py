"""align.py <film-dir>: real word timings for the captions. Transcribes each narration clip (voice/*.wav) with local Whisper
(word timestamps), matches the heard words to the written ones, and stores lines[i].words = [[start, end], ...] (seconds from
the clip's start, one pair per written word) in voice/timing.json. Unmatched words are interpolated between their neighbours.
Captions then light each word when it is actually spoken, whatever the voice's pace or pauses."""
import json, re, sys, difflib
from pathlib import Path
import soundfile as sf
from faster_whisper import WhisperModel

film = Path(sys.argv[1]).resolve(); tp = film / "voice/timing.json"; T = json.loads(tp.read_text())
lang = (T.get("lang") or "en")[:2].lower()
model = WhisperModel("base.en" if lang == "en" else "small", compute_type="int8")
norm = lambda w: re.sub(r"[^\w]", "", w.lower())
for ln in T["lines"]:
    pcm, sr = sf.read(str(film / "voice" / ln["file"]), dtype="float32")
    if pcm.ndim > 1: pcm = pcm.mean(axis=1)
    if sr != 16000:
        import numpy as np; idx = np.linspace(0, len(pcm) - 1, int(len(pcm) * 16000 / sr)); pcm = np.interp(idx, np.arange(len(pcm)), pcm).astype("float32")
    segs, _ = model.transcribe(pcm, language=lang, word_timestamps=True, vad_filter=False, beam_size=5)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    written = ln["text"].split()
    times = [None] * len(written)
    sm = difflib.SequenceMatcher(None, [norm(w) for w in written], [norm(h[0]) for h in heard], autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): times[a + k] = [round(heard[b + k][1], 3), round(heard[b + k][2], 3)]
    dur = ln["dur"]; known = [i for i, x in enumerate(times) if x]
    for i in range(len(written)):                       # fill gaps: share the time between the nearest known words
        if times[i]: continue
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        t0 = times[lo][1] if lo is not None else 0.0; t1 = times[hi][0] if hi is not None else dur
        n = (hi if hi is not None else len(written)) - (lo if lo is not None else -1) - 1; j = i - (lo if lo is not None else -1) - 1
        times[i] = [round(t0 + (t1 - t0) * j / n, 3), round(t0 + (t1 - t0) * (j + 1) / n, 3)]
    ln["words"] = times
    print(f"  {ln['scene']:<14} {len(known)}/{len(written)} words timed from the audio")
tp.write_text(json.dumps(T, indent=1, ensure_ascii=False))
