"""Adds a Piper TTS voiceover to the balloon reel's sound bed, ducking the bed under the voice.

Usage: python3 reel_voiceover.py <voice.onnx> <bed.wav> <out.wav>
"""
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

VOICE, BED, OUT = sys.argv[1:4]
SR = 44100

# (start second, text). Spelling is phonetic where the TTS needs help.
LINES = [
    (7.15, "You watched this for seven seconds."),
    (9.25, "Now imagine it was your brand."),
    (11.2, "We make content people can't scroll past."),
    (15.45, "Mezz Media."),
    (16.5, "Run a skincare brand? D M, teardown, for a free ad review."),
]


def read_wav(p):
    with wave.open(str(p)) as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    return x, sr


bed, bsr = read_wav(BED)
assert bsr == SR
voice = np.zeros_like(bed)
tmp = Path(tempfile.mkdtemp())
for i, (start, text) in enumerate(LINES):
    f = tmp / f"l{i}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", VOICE, "-f", str(f), "--length-scale", "0.86", "--sentence-silence", "0.05"],
                   input=text.encode(), check=True, capture_output=True)
    x, sr = read_wav(f)
    x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)  # resample to 44.1k
    i0 = int(start * SR)
    seg = x[: len(voice) - i0]
    voice[i0 : i0 + len(seg)] += seg
    print(f"{start:5.2f}s  {len(x)/SR:4.2f}s  {text}")

voice /= np.max(np.abs(voice)) + 1e-9
# duck the bed while the voice speaks (smoothed envelope, -9 dB)
level = np.convolve(np.abs(voice), np.ones(int(SR * 0.05)) / (SR * 0.05), mode="same")
duck = 1 - 0.65 * np.clip(level * 8, 0, 1)
duck = np.convolve(duck, np.ones(int(SR * 0.08)) / (SR * 0.08), mode="same")
mix = bed * duck * 0.75 + voice * 0.95
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.2) * 0.9
pcm = (np.stack([mix, mix], axis=1) * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", OUT)
