"""voice.py <film-dir>: narrate src/narration.json with Kokoro (free, local, Apache-2.0) -> voice/*.wav + voice/timing.json

narration.json:
  { "voice": "af_heart", "speed": 0.9, "lang": "en-us",
    "lines": [ { "scene": "hook", "text": "At first, the money barely moves.", "delay": 0.5 }, ... ] }
  delay = beats after the scene starts (default 0.5). Voices: af_heart (soft, A), af_bella (clear, A-),
  af_nicole (whispery ASMR, B-), bf_emma (British), pf_dora / pm_alex (pt-br, lang "pt-br").
  "own": the creator's cloned voice, if a local tool exists at ~/voz (voz.py speak()); optional "wpm" (default 150 PT / 160 EN).
Prints each line's length in beats so scene lengths can be set to fit (voice first, then the storyboard).
Runs with the venv that film.sh sets up (~/.cache/explainer-film/tts).
"""
import json, math, re, sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

TTS = Path.home() / ".cache/explainer-film/tts"
film = Path(sys.argv[1]).resolve()
spec = json.loads((film / "src/narration.json").read_text())
bpm = float(re.search(r"const BPM = ([\d.]+)", (film / "src/scenes.js").read_text()).group(1))
beat = 60 / bpm
OWN = spec.get("voice") == "own"                  # "own": the creator's cloned voice via a local tool at ~/voz (voz.py speak()); optional
if OWN:
    sys.path.insert(0, str(Path.home() / "voz"))
    try: from voz import speak as own_speak
    except ImportError: sys.exit('voice "own" needs the cloned-voice tool at ~/voz (voz.py with speak()); use a Kokoro voice instead')
else:
    k = Kokoro(str(TTS / "kokoro-v1.0.onnx"), str(TTS / "voices-v1.0.bin"))
out = film / "voice"; out.mkdir(exist_ok=True)
for old in out.glob("*.wav"): old.unlink()
LANGS = {"en": "en-us", "en_us": "en-us", "en-us": "en-us", "en-gb": "en-gb", "en_gb": "en-gb", "british": "en-gb",
         "pt": "pt-br", "pt_br": "pt-br", "pt-br": "pt-br", "es": "es", "fr": "fr-fr", "it": "it", "ja": "ja", "zh": "zh", "hi": "hi"}
norm = lambda l: LANGS.get(str(l).lower().replace(" ", ""), l)       # accept en / en-US / en_US / pt ...
voice, speed, lang = spec.get("voice", "af_heart"), spec.get("speed", 0.9), norm(spec.get("lang", "en-us"))
timing, need = [], {}
for i, ln in enumerate(spec["lines"]):
    f = f"{i:02d}_{ln['scene']}.wav"
    if OWN:                                          # slow on CPU (about 12 s per second of speech), cached per sentence by voz
        own_speak(ln["text"], str(out / f), lang=norm(ln.get("lang", lang))[:2], wpm=spec.get("wpm", 150 if norm(lang).startswith("pt") else 160))
        audio, sr = sf.read(out / f, dtype="float32")
    else:
        audio, sr = k.create(ln["text"], voice=ln.get("voice", voice), speed=ln.get("speed", speed), lang=norm(ln.get("lang", lang)))
        sf.write(out / f, audio, sr)
    dur = len(audio) / sr; delay = ln.get("delay", 0.5)
    hop = sr // 30                                  # loudness envelope at 30 fps, for lip-sync (voiceLevel in the kit)
    rms = [float((audio[j:j + hop] ** 2).mean() ** .5) for j in range(0, len(audio), hop)]
    top = sorted(rms)[int(len(rms) * .95)] or 1
    env = [round(min(1, r / top), 2) for r in rms]
    timing.append({"file": f, "scene": ln["scene"], "delay": delay, "dur": round(dur, 3), "text": ln["text"], "env": env})
    need[ln["scene"]] = need.get(ln["scene"], 0) + delay + dur / beat + 0.5    # + half a beat of air after each line
(out / "timing.json").write_text(json.dumps({"voice": voice, "lang": lang, "lines": timing}, indent=1))
print(f"voice {voice}, {len(timing)} lines, {sum(t['dur'] for t in timing):.1f} s of speech")
for s, n in need.items():
    print(f"  {s:<14} needs >= {math.ceil(n)} beats")
print("Set SC beats to at least these (round up so scenes start on bar lines where you can), then film.sh check.")
