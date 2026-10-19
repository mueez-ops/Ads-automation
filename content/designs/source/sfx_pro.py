"""Stereo sound-design kit for the premium reels: filtered whooshes with pan sweeps, sub hits, risers,
reverse swells, UI ticks, key clicks, chimes, plucks (Karplus-Strong), a simple algorithmic reverb, and
a sidechained voice mix. Everything is synthesised (no samples), 44.1 kHz stereo float arrays (n, 2).
"""
import numpy as np
from scipy import signal

SR = 44100
rng = np.random.default_rng(7)


def n_(sec):
    return max(1, int(SR * sec))


def stereo(x, pan=0.0):
    """Mono -> stereo with constant-power pan (-1 left .. 1 right); pan may be an array (moving pan)."""
    p = (np.asarray(pan) + 1) * np.pi / 4
    return np.stack([x * np.cos(p), x * np.sin(p)], axis=1)


def env(n, a, d, sustain=0.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * (sustain + (1 - sustain) * np.exp(-t / d))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def sweep_filter(x, f0, f1, q=1.2, blocks=48):
    """Band-pass whose centre glides from f0 to f1 (log), processed in overlapping blocks."""
    n = len(x)
    out = np.zeros(n)
    win = np.hanning(2 * (n // blocks) + 2)
    hop = n // blocks
    for b in range(blocks + 1):
        a = b * hop
        seg = x[max(0, a - hop) : a + hop]
        if len(seg) < 16:
            continue
        fc = f0 * (f1 / f0) ** (b / blocks)
        lo, hi = max(20, fc / (1 + 1 / q)), min(SR / 2 - 100, fc * (1 + 1 / q))
        y = bp(seg, lo, hi)
        w = win[: len(y)] if len(y) <= len(win) else np.hanning(len(y))
        s0 = max(0, a - hop)
        out[s0 : s0 + len(y)] += y * w[: len(y)]
    return out / (np.max(np.abs(out)) + 1e-9)


def reverb(x, size=0.6, wet=0.25):
    """Small Schroeder reverb (4 combs + 2 allpasses) on a mono or stereo signal."""
    mono = x.ndim == 1
    xs = stereo(x) if mono else x
    out = np.zeros_like(xs)
    for ch, spread in ((0, 0), (1, 23)):
        sig = xs[:, ch]
        acc = np.zeros(len(sig))
        for d, g in ((1116, 0.84), (1188, 0.83), (1277, 0.82), (1356, 0.81)):
            d = int((d + spread) * (0.6 + size))
            b = np.zeros(d + 1); b[0] = 1
            a = np.zeros(d + 1); a[0] = 1; a[d] = -g * (0.75 + 0.2 * size)
            acc += signal.lfilter(b, a, sig)
        for d, g in ((556, 0.5), (441, 0.5)):
            d = d + spread
            b = np.zeros(d + 1); b[0] = -g; b[d] = 1
            a = np.zeros(d + 1); a[0] = 1; a[d] = -g
            acc = signal.lfilter(b, a, acc)
        out[:, ch] = lp(acc, 7000) * 0.12
    return xs * (1 - wet) + out * wet * 4


def tail(x, sec):
    return np.concatenate([x, np.zeros(n_(sec)) if x.ndim == 1 else np.zeros((n_(sec), 2))])


# ---------------- effects (all return stereo) ----------------
def whoosh(dur=0.45, f0=300, f1=4000, pan0=-0.7, pan1=0.7, air=1.0):
    n = n_(dur)
    x = sweep_filter(rng.standard_normal(n), f0, f1, q=1.0)
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2.2
    body = x * shape + lp(rng.standard_normal(n), 250) * shape * 0.6
    st = stereo(body * 0.7, np.linspace(pan0, pan1, n))
    return reverb(tail(st, 0.25), 0.4, 0.18 * air)


def swish(dur=0.18):
    n = n_(dur)
    x = hp(rng.standard_normal(n), 3000) * np.sin(np.linspace(0, np.pi, n)) ** 3
    return stereo(x * 0.5, np.linspace(0.4, -0.4, n))


def sub_hit(f0=90, f1=34, dur=1.4, click=0.6):
    n = n_(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.45)
    c = hp(rng.standard_normal(n_(0.02)), 2000) * np.exp(-np.arange(n_(0.02)) / (SR * 0.004)) * click
    body[: len(c)] += c
    return reverb(stereo(np.tanh(body * 1.6) * 0.9), 0.8, 0.22)


def impact(dur=1.6):
    n = n_(dur)
    noise_part = lp(rng.standard_normal(n), 1800) * env(n, 0.001, 0.08)
    x = np.zeros(n); h = sub_hit(110, 38, dur, 0.9)[:, 0]; x[: len(h)] += h[:n]
    x += noise_part * 0.6
    return reverb(stereo(x), 0.9, 0.3)


def riser(dur=1.2, f0=200, f1=6000):
    n = n_(dur)
    x = sweep_filter(rng.standard_normal(n), f0, f1, q=2.0)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(f0 + (f1 / 6 - f0) * (t / dur) ** 2) / SR) * 0.25
    y = (x + tone) * (t / dur) ** 2.4
    return reverb(stereo(y * 0.8, np.sin(t * 9) * 0.3), 0.6, 0.25)


def reverse_swell(dur=0.9):
    h = impact(dur * 1.2)[:, 0][::-1]
    n = n_(dur)
    h = h[-n:] * np.linspace(0, 1, n) ** 1.5
    return stereo(h * 0.8)


def tick(f=3200, dur=0.05, pan=0.0):
    n = n_(dur)
    x = np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, 0.0005, 0.008)
    return stereo(x * 0.6, pan)


def ui_pop(f0=500, f1=1400):
    n = n_(0.12)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * (t / 0.12) ** 0.5) / SR) * env(n, 0.002, 0.03)
    return reverb(stereo(x * 0.6), 0.3, 0.15)


def key_click(pan=0.0):
    n = n_(0.03)
    x = bp(rng.standard_normal(n), 1800, 6000) * env(n, 0.0003, 0.004) * (0.6 + 0.4 * rng.random())
    x[: n_(0.003)] += 0.3
    return stereo(x * 0.6, pan)


def mouse_click():
    a = key_click(0.1)
    b = key_click(0.1) * 0.7
    out = np.zeros((n_(0.09), 2)); out[: len(a)] += a; out[n_(0.055) : n_(0.055) + len(b)] += b[: n_(0.09) - n_(0.055)]
    return out


def shutter():
    out = np.zeros((n_(0.2), 2))
    for at, g in ((0, 1.0), (0.07, 0.8)):
        c = hp(rng.standard_normal(n_(0.03)), 1500) * env(n_(0.03), 0.0005, 0.006)
        out[n_(at) : n_(at) + len(c)] += stereo(c * g * 0.8)
    return out


def glitch(dur=0.22):
    n = n_(dur)
    t = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * (300 + 2500 * rng.random()) * t)) * 0.3
    x *= (np.floor(t * 60) % 2)
    x = np.round(x * 6) / 6 + hp(rng.standard_normal(n), 3000) * 0.2
    return stereo(x * env(n, 0.001, 0.08) * 0.6, rng.random() - 0.5)


def chime(freq=880, dur=1.6):
    n = n_(dur)
    t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (dur * d)) for r, a, d in ((1, 1, 0.5), (2.76, 0.4, 0.25), (5.4, 0.2, 0.12), (8.9, 0.1, 0.06)))
    return reverb(stereo(x * 0.4), 0.8, 0.35)


def snap():
    n = n_(0.12)
    x = bp(rng.standard_normal(n), 1200, 5000) * env(n, 0.0005, 0.02)
    return reverb(stereo(x), 0.5, 0.3)


def pluck(freq, dur=0.6, bright=0.5):
    """Karplus-Strong plucked string."""
    n = n_(dur)
    p = max(2, int(SR / freq))
    buf = rng.standard_normal(p) * 0.5
    buf = lp(buf, 2000 + 6000 * bright)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * env(n, 0.001, dur * 0.5)


def pad(freqs, dur, cutoff=1600):
    n = n_(dur)
    t = np.arange(n) / SR
    x = sum(((f * (1 + d) * t) % 1 * 2 - 1) for f in freqs for d in (-0.004, 0.0, 0.005))
    x = lp(x / (3 * len(freqs)), cutoff)
    ramp = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.5))
    return reverb(stereo(x * ramp), 0.9, 0.35)


def kick():
    n = n_(0.45)
    t = np.arange(n) / SR
    f = 42 + 110 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)
    x[: n_(0.004)] += hp(rng.standard_normal(n_(0.004)), 3000) * 0.4
    return stereo(np.tanh(x * 1.4))


def hat(open_=False):
    n = n_(0.25 if open_ else 0.05)
    x = hp(rng.standard_normal(n), 7000) * env(n, 0.0005, 0.06 if open_ else 0.012)
    return stereo(x * 0.35, 0.25)


class Track:
    def __init__(self, seconds):
        self.buf = np.zeros((n_(seconds), 2))

    def add(self, sig, at, gain=1.0):
        if sig.ndim == 1:
            sig = stereo(sig)
        i = int(at * SR)
        if i < 0:
            sig, i = sig[-i:], 0
        if i >= len(self.buf):
            return
        sig = sig[: len(self.buf) - i]
        self.buf[i : i + len(sig)] += sig * gain


def master(voice, music, sfx, duck=0.82, music_gain=0.32, sfx_gain=0.55, voice_gain=1.0):
    """Voice on top: sidechain-duck music (and a little of the SFX) under it, then soft-clip."""
    v = voice if voice.ndim == 2 else stereo(voice)
    vl = np.abs(v).mean(axis=1)
    lvl = np.convolve(vl, np.ones(n_(0.03)) / n_(0.03), mode="same")
    lvl = lvl / (np.max(lvl) + 1e-9)
    d = 1 - duck * np.clip(lvl * 3.5, 0, 1)
    d = np.convolve(d, np.ones(n_(0.08)) / n_(0.08), mode="same")[:, None]
    norm = lambda x: x / (np.max(np.abs(x)) + 1e-9)
    mix = norm(v) * voice_gain + norm(music) * music_gain * d + norm(sfx) * sfx_gain * (0.55 + 0.45 * d)
    return np.tanh(mix / np.max(np.abs(mix)) * 1.15) * 0.92
