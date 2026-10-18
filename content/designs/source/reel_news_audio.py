"""Music + sound design for the "Breaking news" launch reel, mixed with the voiceover.

Reads reel_news_events.json (written by reel_news.js) and the voice track from reel_news_vo.py.
Music: urgent 120 BPM news pulse that drops out on "No plan", rebuilds through "connect the dots",
hits on Hook/Story/Offer/Scale, rises through the prompt, drops on the click, booms on the logo, then a lighter CTA groove.

Usage: python3 reel_news_audio.py <vo.wav> <out.wav>
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
D = json.loads((Path(__file__).parent / "reel_news_events.json").read_text())
C, Wd, EV = D["cues"], D["words"], D["events"]
DUR = C["end"]
N = int(SR * DUR)
music = np.zeros(N)
sfx = np.zeros(N)
rng = np.random.default_rng(5)
BEAT = C["beat"]
B0 = C["words"][0] - BEAT * np.ceil((C["words"][0] - 0.6) / BEAT)  # beat grid lands on Hook/Story/Offer/Scale


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def lp(x, k):
    k = max(1, int(k))
    return np.convolve(x, np.ones(k) / k, mode="same")


def hp(x, k):
    return x - lp(x, k)


def add(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig, i = sig[-i:], 0
    if i >= N:
        return
    sig = sig[: N - i]
    buf[i : i + len(sig)] += sig * gain


def plus(*xs):
    """Sum signals of different lengths."""
    y = np.zeros(max(len(x) for x in xs))
    for x in xs:
        y[: len(x)] += x
    return y


def osc(freq, length, kind="sin"):
    t = np.arange(int(SR * length)) / SR
    ph = (freq * t) % 1
    if kind == "saw":
        return 2 * ph - 1
    if kind == "sq":
        return np.sign(np.sin(2 * np.pi * freq * t))
    return np.sin(2 * np.pi * freq * t)


def thump(f0, f1, length, decay):
    n = int(SR * length)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, decay)


def noise(length, decay, attack=0.001):
    n = int(SR * length)
    return rng.standard_normal(n) * env(n, attack, decay)


def whoosh(length=0.35, bright=1.0):
    n = int(SR * length)
    x = rng.standard_normal(n)
    m = np.linspace(0, 1, n)
    y = lp(x, 30) * (1 - m) * 2.5 + hp(x, 10) * m * bright
    return y * np.sin(np.linspace(0, np.pi, n)) ** 1.6 * 0.6


def riser(length):
    n = int(SR * length)
    x = hp(rng.standard_normal(n), 6)
    t = np.arange(n) / SR
    f = 200 + 1800 * (t / length) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    return (x * 0.7 + tone) * (t / length) ** 2.5


def chord(freqs, length, decay, kind="saw", soft=8):
    y = sum(lp(osc(f, length, kind), soft) + 0.5 * lp(osc(f * 1.006, length, kind), soft) for f in freqs)
    return y / len(freqs) * env(len(y), 0.004, decay)


def impact(scale=1.0):
    y = thump(140, 38, 1.2, 0.35)
    y[: int(SR * 0.5)] += lp(noise(0.5, 0.12), 3) * 0.5 * scale
    return y


# ---------------- music ----------------
def kick(at, g=0.8):
    add(music, thump(120, 44, 0.35, 0.11), at, g)


def hat(at, g=0.12):
    add(music, hp(noise(0.04, 0.009), 2), at, g)


def snare(at, g=0.35):
    add(music, plus(hp(noise(0.18, 0.06), 8), thump(220, 160, 0.1, 0.03) * 0.3), at, g)


def bass(at, f, g=0.22, length=0.24):
    add(music, lp(osc(f, length, "saw"), 18) * env(int(SR * length), 0.003, 0.12), at, g)


BASSLINE = [73.4, 73.4, 87.3, 73.4, 65.4, 65.4, 98.0, 87.3]  # D D F D C C G F


def groove(t0, t1, level=1.0, hats=True, snr=True):
    k = int(np.ceil((t0 - B0) / BEAT - 1e-6))
    while B0 + k * BEAT < t1 - 0.01:
        tb = B0 + k * BEAT
        kick(tb, 0.75 * level)
        if snr and k % 2 == 1:
            snare(tb, 0.3 * level)
        for j in range(4 if hats else 0):
            hat(tb + j * BEAT / 4, (0.07 if j % 2 else 0.035) * level)
        for j in range(2):
            bass(tb + j * BEAT / 2, BASSLINE[(2 * k + j) % 8], 0.2 * level)
        k += 1


def pad(t0, t1, freqs, g=0.06):
    length = t1 - t0
    y = chord(freqs, length, 99, "saw", 40)
    n = len(y)
    y *= np.minimum(1, np.arange(n) / (0.3 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.3 * SR))
    add(music, y, t0, g)


b = C["breaking"][0]
# cold open: static, then a reversed-swell into the sting
add(sfx, hp(noise(0.34, 99), 3) * 0.5, 0, 0.5)
add(sfx, riser(0.45), b - 0.45, 0.35)
# the news sting: stacked stab + timpani hit
add(music, chord([146.8, 220.0, 293.7, 349.2, 440.0], 1.6, 0.45), b, 0.55)
add(music, impact(), b, 0.9)
add(music, chord([587.3, 880.0], 0.6, 0.12, "sq", 4), b + 0.62, 0.12)

groove(b + 0.6, C["noplan"][0], 0.9)
pad(b + 0.6, C["noplan"][0], [73.4, 110.0, 146.8, 174.6], 0.05)

# "No plan": tape stop, then near silence
tn = C["noplan"][0]
n = int(SR * 0.6)
seg_t = np.arange(n) / SR
f = 73.4 * (1 - seg_t / 0.6) ** 2
add(music, lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 20) * (1 - seg_t / 0.6), tn, 0.3)
add(music, lp(rng.standard_normal(int(SR * (C["connect"][0] - tn))), 200) * 0.6, tn + 0.4, 0.3)  # low room rumble

# connect the dots: rebuild (kick only, then hats)
groove(C["connect"][0], C["words"][0] - 0.01, 0.6, hats=True, snr=False)
add(music, riser(C["words"][0] - C["connect"][0]), C["connect"][0], 0.3)
pad(C["connect"][0], C["build"][0], [110.0, 146.8, 220.0, 261.6], 0.05)

# Hook / Story / Offer / Scale: one big hit per word, beat underneath
for i, w in enumerate(C["words"]):
    add(music, impact(), w, 0.9)
    add(music, chord([146.8 * 2 ** (i * 2 / 12), 220.0 * 2 ** (i * 2 / 12), 293.7 * 2 ** (i * 2 / 12)], 0.6, 0.18), w, 0.3)
groove(C["words"][0], C["build"][0], 0.8, hats=True, snr=False)

# prompt: just a pulse and a riser into the click
k = 0
while C["build"][0] + k * BEAT / 2 < Wd["click"]:
    add(music, thump(70, 40, 0.2, 0.06), C["build"][0] + k * BEAT / 2, 0.35)
    k += 1
add(music, riser(C["cant"][0] - C["build"][0]), C["build"][0], 0.45)

# drop: full beat through the tunnel
add(music, impact(1.3), C["cant"][0], 1.0)
groove(C["cant"][0], C["brand"][0] - 0.35, 1.0)
pad(C["cant"][0], C["brand"][0] - 0.3, [73.4, 110.0, 146.8, 220.0], 0.07)
add(music, riser(0.8), C["brand"][0] - 1.1, 0.4)

# logo boom + shimmer, then a lighter CTA groove
LOGO_HIT = C["brand"][0] - 0.14  # lands just before "Mez" so the boom doesn't mask the name
add(music, impact(1.4), LOGO_HIT, 1.1)
add(music, chord([73.4, 146.8, 220.0, 293.7, 370.0], 3.0, 1.1, "saw", 30), LOGO_HIT, 0.25)
groove(C["live"][0], C["back"][0] - 0.05, 0.55, hats=True, snr=True)
pad(C["live"][0], C["back"][0], [146.8, 185.0, 220.0, 293.7], 0.045)

# outro: news sting again
add(music, chord([146.8, 220.0, 293.7, 349.2, 440.0], 1.6, 0.5), Wd["scrolling"], 0.5)
add(music, impact(), Wd["scrolling"], 0.8)

# ---------------- sound effects ----------------
for e in EV:
    t, k = e["t"], e["k"]
    if k == "flash":
        add(sfx, hp(noise(0.1, 0.03), 3), t, 0.4)
    elif k == "slam":
        add(sfx, thump(180, 55, 0.3, 0.07), t, 0.55)
        add(sfx, hp(noise(0.08, 0.02), 4), t, 0.25)
    elif k == "hit":
        add(sfx, hp(noise(0.25, 0.06), 3), t, 0.35)  # camera-flash crack
    elif k == "whoosh":
        add(sfx, whoosh(0.4), t - 0.15, 0.6)
    elif k == "stop":
        add(sfx, thump(200, 50, 0.4, 0.1), t, 0.9)
        add(sfx, osc(2600, 0.15) * env(int(SR * 0.15), 0.0005, 0.03), t, 0.25)
    elif k == "glitch":
        for j in range(5):
            add(sfx, osc(300 + rng.random() * 3000, 0.025, "sq") * 0.5 + hp(noise(0.025, 0.01), 3), t + j * 0.03, 0.18)
    elif k == "beep":
        add(sfx, osc(1800, 0.07, "sin") * env(int(SR * 0.07), 0.002, 0.04), t, 0.25)
        add(sfx, osc(2400, 0.07, "sin") * env(int(SR * 0.07), 0.002, 0.04), t + 0.09, 0.25)
    elif k == "shutter":
        add(sfx, hp(noise(0.03, 0.006), 2), t, 0.6)
        add(sfx, hp(noise(0.04, 0.008), 2), t + 0.07, 0.5)
        add(sfx, thump(90, 30, 0.8, 0.3), t, 0.7)
    elif k == "click":
        add(sfx, hp(noise(0.015, 0.003), 2) + osc(3000, 0.015) * 0.3, t, 0.6)
    elif k == "drop":
        add(sfx, whoosh(0.6, 1.4), t - 0.1, 0.7)
    elif k == "whiteout":
        add(sfx, whoosh(0.5, 1.5), t - 0.2, 0.6)
    elif k == "sparkle":
        for j in range(14):
            fz = 2000 + rng.random() * 4000
            add(sfx, osc(fz, 0.12) * env(int(SR * 0.12), 0.001, 0.03), t + j * 0.035, 0.12)
    elif k == "ding":
        add(sfx, (osc(1318.5, 1.0) + 0.4 * osc(2637, 1.0)) * env(int(SR * 1.0), 0.002, 0.25), t, 0.22)
    elif k == "tick":
        add(sfx, osc(2200, 0.03) * env(int(SR * 0.03), 0.0005, 0.008), t, 0.3)
    elif k == "rewind":
        n = int(SR * 0.7)
        tt = np.arange(n) / SR
        fz = 300 + 2500 * (tt / 0.7) ** 2
        add(sfx, (np.sin(2 * np.pi * np.cumsum(fz) / SR) * 0.3 + hp(rng.standard_normal(n), 5) * 0.4) * np.sin(np.linspace(0, np.pi, n)), t, 0.35)
    elif k == "tvoff":
        n = int(SR * 0.35)
        tt = np.arange(n) / SR
        fz = 1500 * np.exp(-tt * 12) + 60
        add(sfx, np.sin(2 * np.pi * np.cumsum(fz) / SR) * np.exp(-tt * 6), t, 0.4)
        add(sfx, hp(noise(0.02, 0.004), 2), t + 0.3, 0.5)

# typing: one key click per character
str_len = len("Make it unskippable.")
ty0, ty1 = C["build"][0] + 0.05, C["build"][1] - 0.12
for i in range(str_len):
    add(sfx, hp(noise(0.02, 0.004), 2) * (0.6 + 0.4 * rng.random()), ty0 + (ty1 - ty0) * i / str_len, 0.3)
# feed swipes
for i in range(6):
    add(sfx, whoosh(0.22, 1.2), C["everyday"][0] + 0.2 + i * 1260 / 2900, 0.35)
add(sfx, whoosh(0.5), C["thumb"][0] - 0.1, 0.5)
# connect-the-dots plinks, rising
segT = (Wd["dots"] - C["connect"][0] - 0.35) / 8
for i in range(9):
    fz = 523.3 * 2 ** ([0, 2, 4, 7, 9, 12, 14, 16, 19][i] / 12)
    add(sfx, osc(fz, 0.3) * env(int(SR * 0.3), 0.001, 0.08), C["connect"][0] + 0.35 + i * segT, 0.18)
# tunnel: frames whooshing past
for i in range(7):
    add(sfx, whoosh(0.25, 1.3), C["cant"][0] + 0.15 + i * 0.3, 0.25)

# ---------------- mix ----------------
def read_wav(p):
    with wave.open(str(p)) as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    assert sr == SR
    return x


vo = read_wav(sys.argv[1])[:N]
vo = np.pad(vo, (0, N - len(vo)))
vo /= np.max(np.abs(vo)) + 1e-9
level = np.convolve(np.abs(vo), np.ones(int(SR * 0.04)) / (SR * 0.04), mode="same")
duck = 1 - 0.72 * np.clip(level * 7, 0, 1)
duck = np.convolve(duck, np.ones(int(SR * 0.06)) / (SR * 0.06), mode="same")
music /= np.max(np.abs(music)) + 1e-9
sfx /= np.max(np.abs(sfx)) + 1e-9
# a little presence on the voice: gentle saturation + high-shelf via added high-pass
vo = np.tanh((vo + 0.25 * hp(vo, 6)) * 1.3) / np.tanh(1.3)
# keep the brand name in the clear: the bed drops right back while "Mez Media" is said
a0, a1 = int((C["brand"][0] - 0.02) * SR), int(C["brand"][1] * SR)
clear = np.ones(N)
clear[a0:a1] = 0.15
clear = np.convolve(clear, np.ones(int(SR * 0.03)) / (SR * 0.03), mode="same")
music *= clear
sfx *= clear
mix = music * duck * 0.42 + sfx * (0.3 + 0.25 * duck) + vo * 1.25  # voice sits clearly on top
fade = int(SR * 0.4)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.25) * 0.9
# slight stereo width on music/sfx, voice centred
side = lp(music * duck * 0.08 + sfx * 0.05, 3)
L, Rr = mix + side, mix - side
pcm = (np.clip(np.stack([L, Rr], axis=1), -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[2])
