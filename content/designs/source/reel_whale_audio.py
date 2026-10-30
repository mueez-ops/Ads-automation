"""Music + sound design for "Why would anyone pay a million dollars for whale vomit?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The rest is synthesized here: the deep sea (a low rumble), a sperm
whale's clicks (they click rather than sing), the burp and bubbles on "vomit", the perfume's spray, a record scratch
for "And it isn't even vomit", squelches and flies for the stink, the beaks' clack, waves and gulls at sea, the
boat's motor, a cash register and coins for the sale, the light switch on "the lump".
Music (120 bpm): a low drone under the question, the groove in C major from "For perfume!", hushed under "Fresh, it
stinks!", filtered right down for the years at sea and when the lump's light goes off; lighter under the feed, and
back for the pitch, resolving on C.
Usage: python3 reel_whale_audio.py <vo.wav> <out.wav> <sfx_cache>
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

D = json.loads((Path(__file__).parent / "reel_whale_events.json").read_text())
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


def underwater(d):                                    # the deep: a slow low rumble with a little movement
    n = S.n_(d + 0.6)
    tt = np.arange(n) / S.SR
    x = S.lp(RNG.standard_normal(n), 220) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * tt)) * 1.4 + np.sin(2 * np.pi * 38 * tt) * 0.25
    return S.stereo(x * np.minimum(1, tt / 0.2) * np.clip((d + 0.6 - tt) / 0.6, 0, 1))


def clicks(d):                                        # a sperm whale's coda: sharp clicks, quick then slower
    n = S.n_(d + 0.2)
    x = np.zeros(n)
    times = [0, 0.09, 0.17, 0.24, 0.42, 0.62]
    for i, t0 in enumerate(times):
        if t0 > d:
            break
        k = S.n_(t0); m = S.n_(0.012)
        tt = np.arange(m) / S.SR
        x[k:k + m] += (S.hp(RNG.standard_normal(m), 1500) * np.exp(-tt / 0.002) + np.sin(2 * np.pi * 2800 * tt) * np.exp(-tt / 0.003) * 0.5)[: n - k]
    return S.reverb(S.stereo(x), 0.8, 0.35) if hasattr(S, "reverb") else S.stereo(x)


def whalecall():                                      # a deep creak under the clicks
    n = S.n_(1.4)
    tt = np.arange(n) / S.SR
    f = 70 + 12 * np.sin(2 * np.pi * 0.7 * tt)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / S.SR)) * (RNG.random(n) < 0.6) * 0.3
    return S.stereo(S.lp(x, 600) * np.sin(np.pi * np.clip(tt / 1.4, 0, 1)) ** 2)


def burp():                                           # a big, low, wet burp
    n = S.n_(0.75)
    tt = np.arange(n) / S.SR
    f = 95 * (1 + 0.25 * np.sin(2 * np.pi * 9 * tt)) * np.exp(-tt / 1.5)
    voice = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / S.SR)) * (0.6 + 0.4 * (RNG.random(n) < 0.7))
    x = S.lp(voice, 900) * np.minimum(1, tt / 0.03) * np.clip((0.75 - tt) / 0.2, 0, 1)
    return lay(S.stereo(x * 0.9), S.sub_hit(60, 30, 0.6, 0.2) * 0.5)


def bubbles():                                        # a rush of bubbles rising
    n = S.n_(1.3)
    x = np.zeros(n)
    for i in range(40):
        t0 = RNG.random() * 1.0; k = S.n_(t0); m = S.n_(0.05)
        tt = np.arange(m) / S.SR; f0 = 300 + 900 * RNG.random()
        x[k:k + m] += (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 3 * tt / 0.05)) / S.SR) * np.exp(-tt / 0.015) * (0.3 + 0.4 * RNG.random()))[: n - k]
    return S.stereo(x)


def spray():                                          # pssht
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    return S.stereo(S.bp(RNG.standard_normal(n), 3000, 11000) * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.16) * 0.8)


def scratch():                                        # a record scratch
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    f = 400 + 1600 * np.abs(np.sin(2 * np.pi * 5 * tt))
    x = S.bp(RNG.standard_normal(n), 300, 5000) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / S.SR) * 0.35
    return S.stereo(x * np.clip((0.4 - tt) / 0.1, 0, 1))


def buzz():                                           # wrong: a low, flat buzzer
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    x = np.sign(np.sin(2 * np.pi * 98 * tt)) * 0.5 + np.sign(np.sin(2 * np.pi * 103 * tt)) * 0.3
    return S.stereo(S.lp(x, 1800) * np.minimum(1, tt / 0.01) * np.clip((0.35 - tt) / 0.06, 0, 1) * 0.6)


def squelch():                                        # something wet and soft
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    f = 160 * (1 + 0.6 * np.sin(2 * np.pi * 14 * tt)) * np.exp(-tt / 0.5)
    x = S.lp(RNG.standard_normal(n), 700) * 0.7 + np.sin(2 * np.pi * np.cumsum(f) / S.SR) * 0.5
    return S.stereo(x * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.12))


def clack():                                          # hard little beaks knocking together
    n = S.n_(0.3)
    x = np.zeros(n)
    for t0 in (0, 0.07, 0.12):
        k = S.n_(t0); m = S.n_(0.03); tt = np.arange(m) / S.SR
        x[k:k + m] += ring([(2100, 0.4, 0.01), (3700, 0.3, 0.008)], 0.03, m) * 1.0
    return S.stereo(x)


def flies(d):                                         # a fly or two buzzing round
    n = S.n_(d)
    tt = np.arange(n) / S.SR
    f = 210 + 25 * np.sin(2 * np.pi * 3 * tt)
    x = S.bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / S.SR)), 150, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt)) * 0.4
    p = np.sin(2 * np.pi * 0.9 * tt)
    return np.stack([x * (1 - p) / 2, x * (1 + p) / 2], axis=1) * np.sin(np.pi * np.clip(tt / d, 0, 1))[:, None]


def waves(d):                                         # the sea: swells of filtered noise
    n = S.n_(d + 0.5)
    tt = np.arange(n) / S.SR
    sw = 0.55 + 0.45 * np.sin(2 * np.pi * 0.45 * tt - 1.2)
    x = S.lp(RNG.standard_normal(n), 1400) * sw * 0.9
    return S.stereo(x * np.minimum(1, tt / 0.25) * np.clip((d + 0.5 - tt) / 0.5, 0, 1))


def gulls(d):                                         # two gulls far off
    n = S.n_(d)
    x = np.zeros(n)
    for t0, p in ((0.05, 1.0), (0.45, 0.7)):
        k = S.n_(t0); m = S.n_(0.35); tt = np.arange(m) / S.SR
        f = 1800 - 900 * (tt / 0.35) + 300 * np.sin(2 * np.pi * 18 * tt)
        x[k:k + m] += (np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.sin(np.pi * tt / 0.35) * 0.3 * p)[: n - k]
    return S.reverb(S.stereo(x), 0.6, 0.3) if hasattr(S, "reverb") else S.stereo(x)


def motor(d):                                         # an outboard motor idling
    n = S.n_(d)
    tt = np.arange(n) / S.SR
    x = S.lp(np.sign(np.sin(2 * np.pi * 42 * tt)) + 0.3 * RNG.standard_normal(n), 500) * 0.4
    return S.stereo(x * np.sin(np.pi * np.clip(tt / d, 0, 1)))


def cash():                                           # a register: the drawer's clatter and two bright bells
    n = S.n_(1.1)
    tt = np.arange(n) / S.SR
    clatter = S.bp(RNG.standard_normal(n), 1500, 7000) * np.exp(-tt / 0.03) * 0.6
    b1 = ring([(2093, 0.4, 0.35), (4186, 0.15, 0.2), (6280, 0.08, 0.12)], 1.1)
    b2 = np.roll(ring([(2637, 0.45, 0.45), (5274, 0.16, 0.25), (7911, 0.07, 0.15)], 1.1), S.n_(0.09))
    b2[: S.n_(0.09)] = 0
    return S.stereo(clatter + b1 + b2)


def coins():                                          # coins landing
    n = S.n_(1.0)
    x = np.zeros(n)
    for i in range(18):
        t0 = RNG.random() * 0.7; k = S.n_(t0); m = S.n_(0.25)
        f = 2500 + 3000 * RNG.random()
        x[k:k + m] += ring([(f, 0.25, 0.08), (f * 1.53, 0.12, 0.05)], 0.25, m)[: n - k]
    return S.stereo(x)


def thud():                                           # 127 kilos lands on the scale
    n = S.n_(0.7)
    tt = np.arange(n) / S.SR
    body = S.lp(RNG.standard_normal(n), 260) * np.exp(-tt / 0.09) * 1.3
    return lay(S.stereo(body), S.sub_hit(65, 30, 0.7, 0.7) * 1.1)


def switch():                                         # a big light switch: a click and a low thunk
    n = S.n_(0.3)
    tt = np.arange(n) / S.SR
    click = S.hp(RNG.standard_normal(n), 2500) * np.exp(-tt / 0.004)
    thunk = np.sin(2 * np.pi * 90 * tt) * np.exp(-tt / 0.06) * 0.6
    return S.stereo(click * 0.8 + thunk)


def chime():                                          # sweet
    return S.stereo(ring([(1318.5, 0.4, 0.5), (1975.5, 0.25, 0.4), (2637, 0.15, 0.3)], 1.2) * 0.8)


def shimmer():                                        # scent in the air
    n = S.n_(0.9)
    tt = np.arange(n) / S.SR
    x = sum(np.sin(2 * np.pi * f * tt + f) * a for f, a in [(3520, 0.2), (4186, 0.15), (5274, 0.12), (6272, 0.08)])
    return S.stereo(x * np.sin(np.pi * np.clip(tt / 0.9, 0, 1)) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)))


def scan():                                           # the X-ray coming on
    n = S.n_(0.5)
    return lay(S.whoosh(0.5, 1800, 7500, -0.3, 0.3, air=0.6)[:n] * 0.6, tone(900, 1900, 0.3, 0) * 0.3)


def like():                                           # a double tap: a soft pop with a sparkle
    return lay(load(3005) * 0.8, np.roll(load(2350), S.n_(0.05), axis=0) * 0.35)


SYNTH = {"whalecall": whalecall, "burp": burp, "bubbles": bubbles, "spray": spray, "scratch": scratch, "buzz": buzz,
         "squelch": squelch, "clack": clack, "cash": cash, "coins": coins, "thud": thud, "switch": switch, "chime": chime,
         "shimmer": shimmer, "scan": scan, "like": like}
LONG = {"underwater": underwater, "clicks": clicks, "flies": flies, "waves": waves, "gulls": gulls, "motor": motor}
SYN = {}

music, sfx = S.Track(END), S.Track(END)
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k in LONG:
        sfx.add(pan(LONG[k](e["d"]), p), t, g)
        continue
    if k in SYNTH:
        if k not in SYN:
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
GM = M["start"] % BEAT                                 # a beat on "To sell it"
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


music.add(S.pad([55.0, 82.41, 110.0, 130.81], M["start"] + 0.1, 340), 0.0, 0.11)               # the question: a low drone
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, BRIGHT, level=0.85, g0=GM)                        # from "For perfume!"
n = len(main.buf)
low = ramp(n, *M["sea"], 0.2)[:, None] * ramp(n, *M["spot"], 0.1)[:, None]                 # years at sea; the light off
main.buf = main.buf * low + filt2(main.buf, "low", 380) * (1 - low) * 0.7
main.buf *= (0.3 + 0.7 * ramp(n, *M["hush"], 0.1))[:, None]                                 # "Fresh, it stinks!"
music.buf += main.buf
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
