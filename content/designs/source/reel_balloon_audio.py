"""Sound design for the needle + water balloon reel, locked to reel_balloon_cues.json.

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


def whoosh(length=0.3):
    n = int(SR * length)
    x = rng.standard_normal(n)
    dark, bright = lowpass(x, 40), x - lowpass(x, 12)
    m = np.linspace(0, 1, n)
    return (dark * (1 - m) * 3 + bright * m) * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * 0.5


pop_t = cues["pop"]

# 1. tension drone: two detuned low sines, swelling until the pop
drone_env = np.clip(t_all / 1.5, 0, 1) * (0.35 + 0.65 * np.clip(t_all / pop_t, 0, 1) ** 2)
drone_env[t_all >= cues["punch"]] *= np.clip(1 - (t_all[t_all >= cues["punch"]] - cues["punch"]) / 0.15, 0, 1)
drone = (np.sin(2 * np.pi * 55 * t_all) + 0.6 * np.sin(2 * np.pi * 55.7 * t_all) + 0.25 * np.sin(2 * np.pi * 110.4 * t_all))
drone *= 1 + 0.25 * np.sin(2 * np.pi * 0.5 * t_all)
out += np.tanh(drone * 0.8) * drone_env * 0.22

# 2. watch-tick on every elapsed second (matches the attention timer)
for s in range(1, int(cues["punch"]) + 1):
    add(tone(3200, 0.04, 0.0005, 0.006), s, 0.32)
    add(noise(0.03, 1, 0.004), s, 0.1)

# 3. heartbeat, speeding up from 70 to 130 bpm
t = 0.6
while t < cues["punch"] - 0.2:
    bpm = 70 + 60 * (t / cues["punch"]) ** 1.5
    add(thump(70, 38, 0.25, 0.07), t, 0.55)
    add(thump(62, 36, 0.22, 0.06), t + 0.16, 0.38)
    t += 60 / bpm

# 4. whooshes / hits for camera cuts and text
for c in (cues["macroIn"], cues["macroOut"]):
    add(whoosh(0.25), c - 0.18, 0.5)
    add(thump(140, 50, 0.3, 0.08), c, 0.5)
add(tone(1760, 0.6, 0.002, 0.25) * 0.6 + tone(2640, 0.6, 0.002, 0.2) * 0.3, cues["held"], 0.4)  # "7 seconds" ding
for c, lags in ((cues["textA"], (0.35,)), (cues["textB"], (0.35,)), (cues["textC"], (0.0, 0.3, 0.6))):
    for lag in lags:
        add(whoosh(0.22), c + lag - 0.05, 0.4)
        add(thump(160, 55, 0.25, 0.06), c + lag, 0.45)

# 5. riser into the pop, then near-silence for the last beat
n = int(SR * 0.9)
r = rng.standard_normal(n)
r = (r - lowpass(r, 6)) * np.linspace(0, 1, n) ** 3
add(r, pop_t - 0.9, 0.35)

# 6. the pop: sharp crack + body thump + water splash tail + droplet patter
add(noise(0.08, 1, 0.012) * 1.0, pop_t, 1.0)
add(thump(220, 40, 0.6, 0.14), pop_t, 1.0)
splash = noise(1.6, 3, 0.35, 0.01) - lowpass(noise(1.6, 3, 0.35, 0.01), 30)
add(splash, pop_t + 0.02, 0.7)
for i in range(70):
    tt = pop_t + 0.25 + rng.random() * 2.2
    add(noise(0.02, 2, 0.005) * (0.3 + rng.random() * 0.5), tt, 0.35)

# 7. logo hit + light outro groove under the call to action
add(thump(180, 45, 0.5, 0.12), cues["logo"], 0.9)
add(whoosh(0.4), cues["logo"] - 0.3, 0.5)
beat = 60 / 118
k = 0
while cues["cta"] + k * beat < DUR - 0.6:
    tt = cues["cta"] + k * beat
    add(thump(120, 42, 0.3, 0.1), tt, 0.5)
    add(noise(0.05, 1, 0.015) - lowpass(noise(0.05, 1, 0.015), 6), tt + beat / 2, 0.18)
    k += 1

fade = int(SR * 0.8)
out[-fade:] *= np.linspace(1, 0, fade)
out = np.tanh(out / np.max(np.abs(out)) * 1.3) * 0.85
pcm = (np.stack([out, out], axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1])
