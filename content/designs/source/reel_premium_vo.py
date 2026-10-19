"""Voiceover + word timing for the premium reel "Perfect targeting is killing your ads" (Kokoro af_heart).

Each line is generated, trimmed and placed with a chosen gap; whisper then finds the word times the edit cuts on.
Writes reel_premium_cues.json and <out_dir>/vo.wav (44.1 kHz).
Usage: python3 reel_premium_vo.py <kokoro_dir> <out_dir>
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro

KDIR, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
VOICE = "af_heart"

# (key, text, gap before, speed, words to time inside the line)
LINES = [
    ("hook", "Perfect targeting is killing your ads.", 0.05, 1.18, ["killing"]),
    ("list", "Age. Interests. Location.", 0.22, 1.1, ["age", "interests", "location"]),
    ("ticked", "Every box ticked.", 0.12, 1.1, []),
    ("still", "And still, nobody buys.", 0.12, 1.08, ["nobody"]),
    ("why", "Here's why.", 0.22, 1.05, []),
    ("learns", "On Meta and TikTok, the algorithm learns from your ad, then finds the people it speaks to.", 0.95, 1.12, ["algorithm", "then", "speaks"]),
    ("thesis", "Your creative is the targeting.", 0.42, 1.0, ["targeting"]),
    ("vague", "Vague ad? No audience can save it.", 0.3, 1.1, ["no"]),
    ("sharp", "Sharp hook? Now it knows who to find.", 0.18, 1.1, ["now"]),
    ("mez", "At Mezz Media, we fix the ad first.", 0.22, 1.08, ["we"]),
    ("cta", "DM us the word teardown, and we'll review your ads for free.", 0.12, 1.08, ["teardown", "and", "free"]),
]
TAIL = 1.7

k = Kokoro(str(KDIR / "kokoro-v1.0.onnx"), str(KDIR / "voices-v1.0.bin"))
wm = WhisperModel("small.en", compute_type="int8")


def trim(x, sr, thr=0.004):
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    idx = np.where(e > thr)[0]
    return x[max(0, idx[0] - int(0.04 * sr)) : min(len(x), idx[-1] + int(0.08 * sr))]


norm = lambda w: re.sub(r"[^a-z]", "", w.lower())


def snap(x, sr, w0, w1, thr=-35.0):
    """Whisper often starts a word at the end of the previous one (a pause gets folded into the next word).
    Snap the start to the real onset: back to the end of a silence that ends just before it, or forward past
    a silence that begins just after it."""
    hop = int(0.01 * sr)
    db = np.array([20 * np.log10(np.sqrt(np.mean(x[i : i + hop] ** 2)) + 1e-9) for i in range(0, len(x) - hop, hop)])
    quiet = db < thr
    i0 = min(len(db) - 1, int(w0 / 0.01))
    j = i0                                    # forward: a >= 100 ms silence that starts within 100 ms after w0
    while j < len(db) and not quiet[j] and j < i0 + 10:
        j += 1
    if j < i0 + 10:
        k = j
        while k < len(db) and quiet[k]:
            k += 1
        if k - j >= 10 and k * 0.01 < w1:
            return k * 0.01
    j = i0                                    # backward: a >= 60 ms silence that ends within 150 ms before w0
    while j > 0 and not quiet[j - 1] and j > i0 - 15:
        j -= 1
    if j > i0 - 15 and j > 0:
        k = j
        while k > 0 and quiet[k - 1]:
            k -= 1
        if j - k >= 6:
            return j * 0.01
    return w0
clips, cues, t = [], {"lines": {}, "at": {}}, 0.0
for key, text, gap, speed, targets in LINES:
    raw, sr = k.create(text, voice=VOICE, speed=speed, lang="en-us")
    s = trim(raw, sr)
    t += gap
    x16 = np.interp(np.arange(int(len(s) * 16000 / sr)) * sr / 16000, np.arange(len(s)), s).astype(np.float32)
    words = [w for seg in wm.transcribe(x16, word_timestamps=True)[0] for w in seg.words]
    heard = " ".join(w.word.strip() for w in words)
    for tw in targets:
        hit = [snap(s, sr, w.start, w.end) for w in words if norm(w.word) == tw or (len(tw) > 4 and tw in norm(w.word))]
        cues["at"][key + ":" + tw] = round(t + (hit[0] if hit else 0.5 * len(s) / sr), 3)
        if not hit:
            print(f"  ! '{tw}' not heard in '{heard}', estimated")
    cues["lines"][key] = {"s": round(t, 3), "e": round(t + len(s) / sr, 3), "text": text.replace("Mezz", "Mez")}
    clips.append((t, s))
    print(f"{t:6.2f} {len(s)/sr:5.2f}s  {text}  | heard: {heard}")
    t += len(s) / sr
cues["voice_end"] = round(t, 3)
cues["end"] = round(t + TAIL, 3)

track = np.zeros(int(cues["end"] * sr) + sr)
for start, s in clips:
    i = int(start * sr)
    track[i : i + len(s)] += s
track = track[: int(cues["end"] * sr)]
sf.write(OUT / "vo_24k.wav", track, sr)
# light polish: high-pass, gentle presence lift, de-mud, soft compression
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", OUT / "vo_24k.wav", "-af",
                "highpass=f=70,equalizer=f=300:t=q:w=1:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80:makeup=2",
                "-ar", "44100", "-ac", "1", OUT / "vo.wav"], check=True)
(Path(__file__).parent / "reel_premium_cues.json").write_text(json.dumps(cues, indent=1))
print("voice ends", cues["voice_end"], "reel", cues["end"])
