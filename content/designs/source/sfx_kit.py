"""Small synth + sound-effect kit shared by the reel sound designs (44.1 kHz mono numpy signals)."""
import numpy as np

SR = 44100
rng = np.random.default_rng(5)


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
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig * gain


def plus(*xs):
    """Sum signals of different lengths."""
    y = np.zeros(max(len(x) for x in xs))
    for x in xs:
        y[: len(x)] += x
    return y


def osc(freq, length, kind="sin"):
    t = np.arange(int(SR * length)) / SR
    if kind == "saw":
        return 2 * ((freq * t) % 1) - 1
    if kind == "sq":
        return np.sign(np.sin(2 * np.pi * freq * t))
    return np.sin(2 * np.pi * freq * t)


def sweep(f0, f1, length, curve=2.0):
    t = np.arange(int(SR * length)) / SR
    f = f0 + (f1 - f0) * (t / length) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


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
    tone = sweep(200, 2000, length) * 0.25
    return (x * 0.7 + tone[:n]) * (t / length) ** 2.5


def chord(freqs, length, decay, kind="saw", soft=8):
    y = sum(lp(osc(f, length, kind), soft) + 0.5 * lp(osc(f * 1.006, length, kind), soft) for f in freqs)
    return y / len(freqs) * env(len(y), 0.004, decay)


def pad(freqs, length, fade=0.4):
    y = chord(freqs, length, 999, "saw", 40)
    n = len(y)
    ramp = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (fade * SR))
    return y * ramp


def impact(scale=1.0):
    y = thump(140, 38, 1.2, 0.35)
    y[: int(SR * 0.5)] += lp(noise(0.5, 0.12), 3) * 0.5 * scale
    return y


def mix_voice(music, sfx, voice, duck_depth=0.75, music_gain=0.4, sfx_gain=0.45, voice_gain=1.3):
    """Duck music and effects under the voice, put the voice clearly on top, soft-limit."""
    voice = voice / (np.max(np.abs(voice)) + 1e-9)
    level = np.convolve(np.abs(voice), np.ones(int(SR * 0.04)) / (SR * 0.04), mode="same")
    duck = 1 - duck_depth * np.clip(level * 7, 0, 1)
    duck = np.convolve(duck, np.ones(int(SR * 0.06)) / (SR * 0.06), mode="same")
    music = music / (np.max(np.abs(music)) + 1e-9)
    sfx = sfx / (np.max(np.abs(sfx)) + 1e-9)
    mix = music * duck * music_gain + sfx * (0.6 + 0.4 * duck) * sfx_gain + voice * voice_gain
    fade = int(SR * 0.4)
    mix[-fade:] *= np.linspace(1, 0, fade)
    return np.tanh(mix / np.max(np.abs(mix)) * 1.2) * 0.9
