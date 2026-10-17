"""Synthesises the launch reel's beat and sound effects so they land on the animation cues.

Usage: python3 reel_audio.py <reel_launch.js> <out.wav>
Reads scene times from reel_launch_cues.json and item timings from the reel's HTML.
"""
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 20.0
BPM = 124
rng = np.random.default_rng(7)

src = Path(sys.argv[1]).read_text()
scenes = json.loads((Path(sys.argv[1]).parent / "reel_launch_cues.json").read_text())
out = np.zeros(int(SR * DUR))


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def lowpass(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def add(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(out):
        return
    sig = sig[: len(out) - i]
    out[i : i + len(sig)] += sig * gain


def kick(f0=120, f1=42, length=0.35):
    n = int(SR * length)
    t = np.arange(n) / SR
    freq = f1 + (f0 - f1) * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(n, 0.002, 0.12)


def hat(length=0.06):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    return (noise - lowpass(noise, 6)) * env(n, 0.001, 0.018)


def slam():
    n = int(SR * 0.05)
    click = (rng.standard_normal(n) - lowpass(rng.standard_normal(n), 3)) * env(n, 0.0005, 0.008)
    s = kick(160, 50, 0.28) * 0.9
    s[:n] += click * 0.5
    return s


def whoosh(length=0.28):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    # brighter as it goes: blend a dark and a bright version of the noise
    dark, bright = lowpass(noise, 40), noise - lowpass(noise, 12)
    mix = np.linspace(0, 1, n)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return (dark * (1 - mix) * 3 + bright * mix) * shape * 0.5


def pop():
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 880 * t * (1 + 0.6 * np.exp(-t * 60))) * env(n, 0.001, 0.03)


def tick():
    n = int(SR * 0.03)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env(n, 0.0005, 0.006)


def riser(length=0.6):
    n = int(SR * length)
    noise = rng.standard_normal(n)
    return (noise - lowpass(noise, 8)) * np.linspace(0, 1, n) ** 2.5 * 0.6


# --- backing groove: four-on-the-floor kick, off-beat hats, soft bass pulse ---
beat = 60 / BPM
b = 0
while b * beat < DUR - 0.8:
    t = b * beat
    add(kick(), t, 0.55)
    add(hat(), t + beat / 2, 0.22)
    n = int(SR * beat * 0.45)
    tt = np.arange(n) / SR
    root = 55 if (b // 8) % 2 == 0 else 49
    add(np.tanh(2.2 * np.sin(2 * np.pi * root * tt)) * env(n, 0.005, 0.09), t + beat / 2, 0.16)
    b += 1

# --- cue-locked effects ---
blocks = re.split(r'<div class="scene" id="', src)[1:]
items = {}
for blk in blocks:
    sid = blk.split('"', 1)[0]
    items[sid] = [(a, float(at)) for a, at in re.findall(r'data-a="(\w+)" data-at="([\d.]+)"', blk)]
for sid in ("s7", "s8", "s9"):  # generated from a template in the reel script
    items[sid] = [("slam", 0.0), ("up", 0.15), ("wipe", 0.35)]

for sc in scenes:
    start = sc["t"][0]
    add(whoosh(0.18), max(0, start - 0.12), 0.35)  # transition into every cut
    for a, at in items.get(sc["id"], []):
        t = start + at
        if a == "slam":
            add(slam(), t, 0.8)
        elif a == "wipe":
            add(whoosh(), t - 0.05, 0.6)
        elif a == "pop":
            add(pop(), t, 0.45)
        elif a in ("up", "track"):
            add(whoosh(0.2), t, 0.25)
    if sc["id"] == "s3":  # counter ticks while 0.0s -> 0.5s
        for k in range(10):
            add(tick(), start + 0.1 + k * 0.07, 0.35)
    if sc["id"] == "s6":  # green flash: riser into a big hit
        add(riser(), start - 0.6, 0.5)
        add(kick(200, 38, 0.6), start, 1.0)

# fade out the last 0.8s, normalise, soft-clip
out[-int(SR * 0.8):] *= np.linspace(1, 0, int(SR * 0.8))
out = np.tanh(out / np.max(np.abs(out)) * 1.4) * 0.85
pcm = (np.stack([out, out], axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[2])
