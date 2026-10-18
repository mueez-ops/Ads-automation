"""Voiceover + timeline for the "Breaking news" launch reel (Kokoro TTS, British news-anchor read).

Generates each line, trims silence, lays the lines out back to back and writes:
  - reel_news_cues.json: start/end of every line (the renderer and the sound design both read it)
  - <out_dir>/vo.wav: the voice track at 44.1 kHz

Usage: python3 reel_news_vo.py <kokoro_dir> <out_dir>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

KDIR, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
VOICE, SPEED = "bm_george", 1.15

# (cue key, text, gap before it in seconds). Spelling is phonetic where the TTS needs help.
LINES = [
    ("breaking", "Breaking news.", 0.45),
    ("thumb", "A thumb has stopped scrolling.", 0.18),
    ("witness", "Witnesses say it stopped...", 0.15),
    ("forad", "for an ad.", 0.30),
    ("everyday", "Every day, brands pay to be scrolled past.", 0.40),
    ("scattered", "Scattered posts.", 0.12),
    ("random", "Random boosts.", 0.06),
    ("noplan", "No plan.", 0.06),
    ("connect", "So we connect the dots.", 0.22),
    ("hsos", "Hook. Story. Offer. Scale.", 0.30),
    ("build", "So we build ads...", 0.30),
    ("cant", "people can't scroll past.", 0.35),
    ("brand", "Mezz Media.", 0.70),
    ("live", "Now live.", 0.10),
    ("run", "Run a brand?", 0.45),
    ("dm", "D M us, teardown.", 0.08),
    ("free", "Your first ad review is on us.", 0.08),
    ("back", "Now... back to your scrolling.", 0.55),
]
TAIL = 1.4
WORD_BEAT = 0.5  # "Hook. Story. Offer. Scale." lands one word per beat (120 BPM)

k = Kokoro(str(KDIR / "kokoro-v1.0.onnx"), str(KDIR / "voices-v1.0.bin"))


def trim(x, sr, thr=0.006):
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    idx = np.where(e > thr)[0]
    a, b = max(0, idx[0] - int(0.05 * sr)), min(len(x), idx[-1] + int(0.06 * sr))
    return x[a:b]


def split_words(x, sr, windows):
    """Cut one read into words at the quietest point inside each window (seconds)."""
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    cuts = [0] + [int(a * sr) + int(np.argmin(e[int(a * sr) : int(b * sr)])) for a, b in windows] + [len(x)]
    return [x[cuts[i] : cuts[i + 1]] for i in range(len(cuts) - 1)]


clips, cues, t = [], {}, 0.0
for key, text, gap in LINES:
    s, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-gb")
    s = trim(s, sr)
    t += gap
    if key == "hsos":  # one read keeps the tone; each word is then placed on its own beat
        words = split_words(s, sr, [(0.25, 0.36), (0.75, 0.9), (1.3, 1.4)])
        cues["words"] = [round(t + i * WORD_BEAT, 3) for i in range(len(words))]
        for w0, w in zip(cues["words"], words):
            clips.append((w0, w))
        s = np.zeros(int((cues["words"][-1] - t) * sr) + len(words[-1]))
    else:
        clips.append((t, s))
    cues[key] = [round(t, 3), round(t + len(s) / sr, 3)]
    print(f"{t:6.2f}  {len(s)/sr:4.2f}s  {text}")
    t += len(s) / sr
cues["end"] = round(t + TAIL, 3)

track = np.zeros(int(cues["end"] * sr) + sr)
for start, s in clips:
    i = int(start * sr)
    track[i : i + len(s)] += s
track = track[: int(cues["end"] * sr)]
sf.write(OUT / "vo_24k.wav", track, sr)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", OUT / "vo_24k.wav", "-ar", "44100", "-ac", "1", OUT / "vo.wav"], check=True)
(Path(__file__).parent / "reel_news_cues.json").write_text(json.dumps(cues, indent=1))
print("duration", cues["end"])
