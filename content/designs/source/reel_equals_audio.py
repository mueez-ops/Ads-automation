"""Music + sound design for "Why would anyone invent the equals sign?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The rest is synthesized here: the room (a candle's crackle and a low
hum), the quill scratching across the page, a metallic clang for the gold "=", a sigh, a book landing on the desk,
pages flipping, an idea's ding, two long pen strokes, the hum of the lines running to infinity, a slide whistle for
"way longer!", a calculator key and its beep.
Music (120 bpm): a low drone under the question; the groove in C major from "In 1557", a breath before "No two things
can be more equal", a warm pad as the lines run to infinity; lighter under the feed, and back for the pitch.
Usage: python3 reel_equals_audio.py <vo.wav> <out.wav> <sfx_cache>
"""
import json
import math
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import uniform_filter1d

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_equals_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset or its loudest point)
SFX = {
    "deep": (1143, "peak"), "zoom_out": (1492, "peak"), "whoosh_c": (168, "peak"), "whoosh_f": (1471, "peak"),
    "whoosh_soft": (1489, "peak"), "swish": (3115, "peak"), "hit": (2180, "peak"), "pop": (3005, "onset"),
    "tick": (2568, "onset"), "select": (1109, "onset"), "sparkle": (2350, "onset"),
}
RNG = np.random.default_rng(7)


def load(i):
    wav = CACHE / f"{i}.wav"
    if not wav.exists():
        mp3 = CACHE / f"{i}.mp3"
        urllib.request.urlretrieve(f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3", mp3)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "2", "-ar", str(S.SR), wav], check=True)
    x, sr = sf.read(wav)
    assert sr == S.SR
    x = x if x.ndim == 2 else S.stereo(x)
    return x / (np.max(np.abs(x)) + 1e-9) * 0.9


def marks(x):
    """Onset and loudest point of a sound, in seconds."""
    e = np.convolve(np.abs(x).max(axis=1), np.ones(441) / 441, mode="same")
    on = np.flatnonzero(e > e.max() * 0.1)
    return on[0] / S.SR, np.argmax(e) / S.SR


def pan(x, p):
    if not p:
        return x
    a = (p + 1) * np.pi / 4
    return x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)


def tone(f0, f1, dur, shape=1.0):
    n = S.n_(dur)
    tt = np.arange(n) / S.SR
    ph = 2 * np.pi * np.cumsum(np.geomspace(f0, f1, n)) / S.SR
    x = np.sin(ph) + 0.3 * np.sign(np.sin(ph)) * shape
    return x * np.minimum(1, tt / 0.005) * np.exp(-tt / (dur * 0.5))


def lay(*xs):
    """Stereo sounds summed from the same start."""
    xs = [x if x.ndim == 2 else S.stereo(x) for x in xs]
    out = np.zeros((max(len(x) for x in xs), 2))
    for x in xs:
        out[: len(x)] += x
    return out


def filt2(x, kind, f, order=2):
    """A Butterworth filter on each channel of a stereo array."""
    sos = signal.butter(order, f, btype=kind, fs=S.SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def ring(parts, dur, n=None):
    """A struck metal: (frequency, amplitude, decay seconds) partials."""
    n = n or S.n_(dur)
    tt = np.arange(n) / S.SR
    return sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)


def room(d):                                          # a quiet study: a low hum, a candle crackling now and then
    n = S.n_(d + 0.5)
    tt = np.arange(n) / S.SR
    hum = S.lp(RNG.standard_normal(n), 220) * 0.5
    crack = np.zeros(n)
    t0 = 0.05
    while t0 < d:
        k = S.n_(t0); m = S.n_(0.012)
        crack[k:k + m] += (S.hp(RNG.standard_normal(m), 2500) * np.exp(-np.arange(m) / (S.SR * 0.002)) * (0.2 + 0.5 * RNG.random()))[: n - k]
        t0 += 0.08 + 0.5 * RNG.random()
    x = (hum + crack) * np.minimum(1, tt / 0.2) * np.clip((d + 0.5 - tt) / 0.5, 0, 1)
    return S.stereo(x * 0.7)


def scratch(d):                                       # a quill on paper: little strokes, letter by letter
    n = S.n_(d + 0.1)
    tt = np.arange(n) / S.SR
    base = S.bp(RNG.standard_normal(n), 2200, 7500)
    env = np.clip(np.sin(2 * np.pi * 7.5 * tt + RNG.random() * 6) * 0.6 + 0.5, 0, 1) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * tt))
    gaps = (np.sin(2 * np.pi * 0.9 * tt + 1.0) > -0.85).astype(float)
    x = base * env * gaps * np.minimum(1, tt / 0.03) * np.clip((d + 0.1 - tt) / 0.1, 0, 1)
    return S.stereo(x * 0.5, 0.15)


def clang():                                          # the gold "=" lands: a bright metal ring and a thud
    n = S.n_(1.6)
    tt = np.arange(n) / S.SR
    r = ring([(660, 0.4, 0.7), (1663, 0.3, 0.45), (2741, 0.2, 0.3), (3918, 0.12, 0.2), (5210, 0.08, 0.12)], 1.6)
    hitn = S.lp(RNG.standard_normal(n), 900) * np.exp(-tt / 0.02) * 0.8
    return lay(S.reverb(S.stereo(r + hitn), 0.6, 0.25), S.sub_hit(95, 45, 0.5, 0.3) * 0.7)


def sigh():                                           # a long breath out
    n = S.n_(0.8)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 400, 2200) * np.minimum(1, tt / 0.12) * np.exp(-np.maximum(0, tt - 0.2) / 0.22)
    return S.stereo(x * 0.55)


def bookthud():                                       # a heavy book on a wooden desk
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    slap = S.bp(RNG.standard_normal(n), 300, 3000) * np.exp(-tt / 0.03) * 0.7
    return lay(S.stereo(slap), S.sub_hit(110, 55, 0.4, 0.4) * 0.9)


def flip():                                           # a page turning
    n = S.n_(0.25)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 1200, 6000) * np.sin(np.pi * np.clip(tt / 0.22, 0, 1)) ** 2
    return S.stereo(x * 0.6)


def ding():                                           # an idea
    return S.reverb(S.stereo(ring([(1568, 0.5, 0.6), (3136, 0.18, 0.3), (4704, 0.08, 0.2)], 1.2)), 0.5, 0.25)


def stroke():                                         # one long pen stroke
    n = S.n_(0.42)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 1800, 6500) * np.sin(np.pi * np.clip(tt / 0.4, 0, 1)) ** 0.7
    return S.stereo(x * 0.6)


def hum(d):                                           # the twin lines: a warm shimmer
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    x = sum(a * np.sin(2 * np.pi * f * tt + f) for f, a in ((261.63, 0.3), (392.0, 0.2), (523.25, 0.15), (784.0, 0.08)))
    x = x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * tt)) * np.minimum(1, tt / 0.25) * np.clip((d + 0.3 - tt) / 0.3, 0, 1)
    return S.reverb(S.stereo(x * 0.5), 0.8, 0.35)


def slide():                                          # a slide whistle going up: "way longer!"
    n = S.n_(0.55)
    tt = np.arange(n) / S.SR
    f = 500 * (2.4 ** (tt / 0.55))
    x = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.sin(np.pi * np.clip(tt / 0.55, 0, 1)) ** 0.5 * (1 + 0.04 * np.sin(2 * np.pi * 6 * tt))
    return S.stereo(x * 0.4)


def click():                                          # a calculator key
    n = S.n_(0.06)
    tt = np.arange(n) / S.SR
    return S.stereo(S.hp(RNG.standard_normal(n), 2500) * np.exp(-tt / 0.006) * 0.8 + np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.01) * 0.3)


def beep():
    n = S.n_(0.16)
    tt = np.arange(n) / S.SR
    return S.stereo(np.sign(np.sin(2 * np.pi * 2600 * tt)) * 0.18 * np.minimum(1, tt / 0.004) * np.clip((0.16 - tt) / 0.02, 0, 1))


def snap():                                           # three words become two lines
    return lay(S.snap() * 0.9, S.stereo(ring([(2093, 0.3, 0.12)], 0.3)))


def stamp():                                          # a stamp slammed on
    n = S.n_(0.25)
    tt = np.arange(n) / S.SR
    knock = tone(180, 85, 0.14, 0.2) * 0.9
    slap = S.bp(RNG.standard_normal(n), 800, 3200) * np.exp(-tt / 0.012) * 0.6
    return lay(S.stereo(slap), knock, S.mouse_click() * 0.5)


def chime():
    return S.stereo(ring([(1318.5, 0.4, 0.5), (1975.5, 0.25, 0.4), (2637, 0.15, 0.3)], 1.2) * 0.8)


def like():                                           # a double tap: a soft pop with a sparkle
    return lay(load(3005) * 0.8, np.roll(load(2350), S.n_(0.05), axis=0) * 0.35)


SYNTH = {"clang": clang, "sigh": sigh, "bookthud": bookthud, "flip": flip, "ding": ding, "stroke": stroke, "slide": slide, "click": click,
         "beep": beep, "snap": snap, "stamp": stamp, "chime": chime, "like": like}
LONG = {"room": room, "scratch": scratch, "hum": hum}
SYN = {}
FRESH = {"flip", "stroke", "bookthud"}                 # a new take each time, so repeats don't sound copied

music, sfx = S.Track(END), S.Track(END)
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k in LONG:
        sfx.add(pan(LONG[k](e["d"]), p), t, g)
        continue
    if k in SYNTH:
        if k in FRESH or k not in SYN:
            SYN[k] = SYNTH[k]()
        sfx.add(pan(SYN[k], p), t, g)
        continue
    if k == "thump":
        sfx.add(S.sub_hit(85, 36, 0.9, 0.5), t, g)
        continue
    if k == "riser":
        sfx.add(S.riser(e["d"], 300, 4200), t, g)
        continue
    i, align = SFX[k]
    x = load(i)
    on, pk = marks(x)
    sfx.add(pan(x, p), t - (on if align == "onset" else pk), g)

# ---------- music ----------
BEAT = 60 / 120
GM = M["start"] % BEAT                                 # a beat on "In 1557"
G1 = M["pitch"] % BEAT                                 # a beat on "We scale businesses"
# C major (C, G, Am, F)
BRIGHT = ([[130.81, 164.81, 196.0, 261.63, 329.63], [98.0, 123.47, 146.83, 196.0, 246.94], [110.0, 130.81, 164.81, 220.0, 261.63], [87.31, 110.0, 130.81, 174.61, 220.0]],
          [[523.25, 659.25, 783.99, 1046.5], [493.88, 587.33, 783.99, 987.77], [440.0, 523.25, 659.25, 880.0], [440.0, 523.25, 698.46, 880.0]],
          [65.41, 49.0, 55.0, 43.65])
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.4, 0.34)
    return PL[f]


def bass(f, dur):
    n = S.n_(dur)
    tt = np.arange(n) / S.SR
    x = np.tanh(1.6 * (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt))) * np.minimum(1, tt / 0.01) * np.exp(-tt / (dur * 0.6))
    return S.stereo(x * 0.6)


def groove(trk, t0, t1, key, beat=True, plucks=True, pads=True, level=1.0, g0=0.0):
    """Eighth notes from the first quarter at or after t0 to t1, on the grid g0. beat: kick on every quarter and a
    snap on 2 and 4 (True), or no kick (None)."""
    CH, ARP, ROOT = key
    k = math.ceil((t0 - g0) / (BEAT / 2) - 1e-6)
    k0 = k = k + k % 2
    while g0 + k * BEAT / 2 < t1 - 0.02:
        tt, kr = g0 + k * BEAT / 2, k - k0
        bar = (kr // 8) % 4
        if beat is True and kr % 2 == 0:
            trk.add(S.kick(), tt, 0.6 * level)
        if beat is True and kr % 4 == 2:
            trk.add(S.snap(), tt, 0.16 * level)
        trk.add(S.hat(), tt, 0.09 * level)
        trk.add(S.hat(), tt + BEAT / 4, 0.045 * level)
        if plucks:
            trk.add(S.stereo(pl(ARP[bar][kr % 4]), 0.3 if kr % 2 else -0.3), tt, 0.16 * level)
        if kr % 2 == 1:
            trk.add(bass(ROOT[bar], BEAT * 0.9), tt, 0.3 * level)
        if pads and kr % 8 == 0:
            p0 = t0 if kr == 0 else tt
            n = min(tt + 4 * BEAT, t1) - p0
            if n > 0.3:
                trk.add(S.pad(CH[bar], n, 1300), p0, 0.13 * level)
        k += 1


def ramp(n, a, b, edge=0.15):
    """1 outside [a, b], 0 inside, with smooth edges (seconds)."""
    tt = np.arange(n) / S.SR
    up = np.clip((tt - (a - edge)) / edge, 0, 1) * np.clip(((b + edge) - tt) / edge, 0, 1)
    return 1 - up


music.add(S.pad([65.41, 98.0, 130.81, 155.56], M["start"] + 0.1, 520), 0.0, 0.22)               # the question: a low drone
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, BRIGHT, level=0.8, g0=GM)                         # from "In 1557"
n = len(main.buf)
main.buf *= (0.2 + 0.8 * ramp(n, *M["hush"], 0.12))[:, None]                                # "But why two lines?"
music.buf += main.buf
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], 2.2, 1600), M["dawn"], 0.16)                         # the lines run to infinity
groove(music, M["feed"], M["pitch"] - 0.05, BRIGHT, beat=None, level=0.7, g0=GM)            # the feed: no kick
groove(music, M["pitch"], M["end"], BRIGHT, level=0.85, g0=G1)                               # the pitch
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)


def master(voice, music, sfx, duck=0.82, music_gain=0.32, sfx_gain=0.55, voice_gain=1.0):
    """sfx_pro.master with its moving averages in linear time (uniform_filter1d)."""
    v = voice if voice.ndim == 2 else S.stereo(voice)
    lvl = uniform_filter1d(np.abs(v).mean(axis=1), S.n_(0.03), mode="constant")
    lvl = lvl / (np.max(lvl) + 1e-9)
    d = 1 - duck * np.clip(lvl * 3.5, 0, 1)
    d = uniform_filter1d(d, S.n_(0.25), mode="constant")[:, None]
    norm = lambda x: x / (np.max(np.abs(x)) + 1e-9)
    mix = norm(v) * voice_gain + norm(music) * music_gain * d + norm(sfx) * sfx_gain * (0.4 + 0.6 * d)
    return np.tanh(mix / np.max(np.abs(mix)) * 1.15) * 0.92


voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.14, sfx_gain=0.34, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
