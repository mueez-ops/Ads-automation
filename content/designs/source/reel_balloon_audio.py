"""Sound bed for the needle + water balloon reel, locked to reel_balloon_cues.json.

Act 1 (until the needle stops): drone, watch ticks, heartbeat, no music.
Act 2 (after the stop): driving beat, whooshes on each camera snap, riser, pop, logo hit, outro groove.

Usage: python3 reel_balloon_audio.py <out.wav>
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
cues = json.loads((Path(__file__).parent / "reel_balloon_cues.json").read_text())
DUR = cues["end"]
N = int(SR * DUR)
t_all = np.arange(N) / SR
out = np.zeros(N)
rng = np.random.default_rng(11)


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def lowpass(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def add(sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    if i >= N:
        return
    sig = sig[: N - i]
    out[i : i + len(sig)] += sig * gain


def tone(freq, length, attack=0.002, decay=0.1):
    n = int(SR * length)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * t) * env(n, attack, decay)


def thump(f0=110, f1=40, length=0.3, decay=0.09):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, decay)


def noise(length, k_low=1, decay=0.05, attack=0.001):
    n = int(SR * length)
    x = rng.standard_normal(n)
    if k_low > 1:
        x = lowpass(x, k_low)
    return x * env(n, attack, decay)


def hiss(length, decay):
    x = noise(length, 1, decay)
    return x - lowpass(x, 6)


def whoosh(length=0.3):
    n = int(SR * length)
    x = rng.standard_normal(n)
    dark, bright = lowpass(x, 40), x - lowpass(x, 12)
    m = np.linspace(0, 1, n)
    return (dark * (1 - m) * 3 + bright * m) * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * 0.5


stop, pop_t = cues["stop"], cues["pop"]

# ---- act 1: tension ----
act1 = t_all < stop
drone = np.sin(2 * np.pi * 55 * t_all) + 0.6 * np.sin(2 * np.pi * 55.7 * t_all) + 0.25 * np.sin(2 * np.pi * 110.4 * t_all)
drone_env = np.clip(t_all / 1.2, 0, 1) * (0.4 + 0.6 * np.clip(t_all / stop, 0, 1) ** 2) * act1
out += np.tanh(drone * 0.8) * drone_env * 0.24
for s in range(1, int(stop) + 1):
    add(tone(3200, 0.04, 0.0005, 0.006), s, 0.32)
    add(noise(0.03, 1, 0.004), s, 0.08)
t = 0.5
while t < stop - 0.25:
    bpm = 72 + 58 * (t / stop) ** 1.5
    add(thump(70, 38, 0.25, 0.07), t, 0.55)
    add(thump(62, 36, 0.22, 0.06), t + 0.16, 0.38)
    t += 60 / bpm

# ---- the dead stop: metallic clack, then a breath of silence ----
clack = tone(2900, 0.25, 0.0005, 0.05) * 0.6 + tone(4400, 0.25, 0.0005, 0.03) * 0.4
add(clack, stop, 0.7)
add(hiss(0.05, 0.006), stop, 0.5)
add(thump(160, 60, 0.2, 0.05), stop, 0.6)

# ---- act 2: drive ----
beat = 60 / 128
k = 0
while cues["snaps"][0] + k * beat < cues["punch"] - 0.05:
    tt = cues["snaps"][0] + k * beat
    add(thump(115, 42, 0.3, 0.09), tt, 0.6)
    add(hiss(0.05, 0.012), tt + beat / 2, 0.22)
    if k % 2 == 1:
        add(hiss(0.12, 0.05), tt, 0.28)  # snare-ish on the backbeat
    k += 1
for c in cues["snaps"]:
    add(whoosh(0.28), c - 0.1, 0.65)
for b in cues["beats"]:
    add(thump(170, 60, 0.22, 0.05), b, 0.4)

# riser into the pop, then silence right before it
n = int(SR * (pop_t - cues["punch"] + 0.5))
r = rng.standard_normal(n)
add((r - lowpass(r, 6)) * np.linspace(0, 1, n) ** 3, cues["punch"] - 0.5, 0.4)

# ---- the pop ----
add(noise(0.08, 1, 0.012), pop_t, 1.0)
add(thump(220, 40, 0.6, 0.14), pop_t, 1.0)
spl = noise(1.6, 3, 0.35, 0.01)
add(spl - lowpass(spl, 30), pop_t + 0.02, 0.7)
for _ in range(70):
    add(noise(0.02, 2, 0.005) * (0.3 + rng.random() * 0.5), pop_t + 0.25 + rng.random() * 1.6, 0.35)

# ---- logo + outro ----
add(whoosh(0.4), cues["logo"] - 0.3, 0.5)
add(thump(180, 45, 0.5, 0.12), cues["logo"], 0.9)
k = 0
while cues["cta"] + k * beat < DUR - 0.5:
    tt = cues["cta"] + k * beat
    add(thump(120, 42, 0.3, 0.1), tt, 0.5)
    add(hiss(0.05, 0.015), tt + beat / 2, 0.18)
    k += 1

fade = int(SR * 0.6)
out[-fade:] *= np.linspace(1, 0, fade)
out = np.tanh(out / np.max(np.abs(out)) * 1.3) * 0.85
pcm = (np.stack([out, out], axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
