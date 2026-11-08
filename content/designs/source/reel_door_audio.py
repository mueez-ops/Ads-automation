"""Music + sound design for "Half of you won't notice a stranger swapped mid-chat. Not even the voice.", mixed under the
voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media and
commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is downloaded by id
into <sfx_cache> the first time. The rest is synthesized here: a campus on a sunny day (air, far birds), footsteps on
paving, a wooden door swooshing past, a swap (two notes trading places), a voice blip, a tape rewind, a map's rustle,
eight pips for the eight who kept giving directions, a soft murmur of talk, the door's thunk, an annoyed huff, a tap and
a flip for the ad being tweaked, a flat "meh", a marker striking out, a sparkle.
Music (120 bpm, G major): a light walk under the hook and the meeting (it stops for a beat on "swapped"); the groove
from "Ten seconds in"; no kick under the feed and a lift on "swap the first three seconds"; back for the pitch.
Usage: python3 reel_door_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
"""
import json
import math
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import uniform_filter1d

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_door_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset or its loudest point)
SFX = {
    "deep": (1143, "peak"), "zoom_out": (1492, "peak"), "whoosh_c": (168, "peak"), "whoosh_f": (1471, "peak"),
    "whoosh_soft": (1489, "peak"), "hit": (2180, "peak"), "pop": (3005, "onset"), "select": (1109, "onset"),
}
RNG = np.random.default_rng(41)


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
    if p is None or (np.isscalar(p) and not p):
        return x
    a = (np.asarray(p) + 1) * np.pi / 4
    return x * np.stack([np.cos(a), np.sin(a)], axis=-1) * np.sqrt(2)


def ring(parts, dur, n=None):
    """A struck metal or glass: (frequency, amplitude, decay seconds) partials."""
    n = n or S.n_(dur)
    tt = np.arange(n) / S.SR
    return sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)


def fade_io(x, d, a=0.3, b=0.4):
    tt = np.arange(len(x)) / S.SR
    return x * np.clip(tt / a, 0, 1) * np.clip((d - tt) / b, 0, 1)


def chirp(f, n):
    return np.sin(2 * np.pi * np.cumsum(f) / S.SR)


# ---------- the world ----------
def campus(d):                                          # a sunny campus: soft air, a few far birds
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    air = S.bp(RNG.standard_normal(n), 150, 900) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * tt))
    birds = np.zeros(n)
    for t0 in np.arange(0.6, d, 1.7):
        t1 = t0 + 0.6 * RNG.random()
        for j in range(3):
            k = S.n_(t1 + 0.09 * j); m = S.n_(0.07); u = np.arange(m) / S.SR
            f = 3200 + 900 * RNG.random() + 1500 * u / 0.07
            birds[k:k + m] += (np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.sin(np.pi * u / 0.07) * 0.06)[: n - k]
    return S.stereo(fade_io(air * 0.35 + birds, d + 0.4, 0.05, 0.3), 0.3 * np.sin(2 * np.pi * 0.05 * tt))


def steps(d):                                           # footsteps on paving
    n = S.n_(d + 0.2)
    x = np.zeros(n)
    for i, t0 in enumerate(np.arange(0.02, d, 0.34)):
        k = S.n_(t0 + 0.02 * RNG.random()); m = S.n_(0.08); u = np.arange(m) / S.SR
        x[k:k + m] += ((S.lp(RNG.standard_normal(m), 900) * 0.8 + np.sin(2 * np.pi * 95 * u) * 0.5) * np.exp(-u / 0.018) * (0.8 + 0.2 * (i % 2)))[: n - k]
    return S.stereo(x * 0.6)


def woosh_door():                                       # a wooden door carried past, close
    n = S.n_(0.9)
    tt = np.arange(n) / S.SR
    env = np.exp(-((tt - 0.38) / 0.17) ** 2)
    air = S.sweep_filter(RNG.standard_normal(n), 400, 2600, 1.2) * env
    body = np.sin(2 * np.pi * np.cumsum(90 + 40 * env) / S.SR) * env * 0.5
    x = (air * 0.8 + body) * 0.6
    return pan(S.stereo(x), np.linspace(-0.8, 0.8, n))


def swap():                                             # two notes trading places
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    a = chirp(880 + 440 * np.clip(tt / 0.12, 0, 1), n) * np.exp(-tt / 0.1)
    b = chirp(1320 - 440 * np.clip(tt / 0.12, 0, 1), n) * np.exp(-tt / 0.1)
    return S.reverb(np.stack([a, b], axis=-1) * 0.35, 0.4, 0.25)


def blip2():                                            # a voice on screen
    n = S.n_(0.16)
    tt = np.arange(n) / S.SR
    f = np.where(tt < 0.07, 1250, 1650)
    return S.stereo(chirp(f, n) * np.exp(-tt / 0.06) * np.minimum(1, tt / 0.003) * 0.4)


def rewind():                                           # a tape rewinding: a fast chattering whine, up
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    f = 600 + 2600 * (tt / 0.45) ** 1.5
    x = chirp(f, n) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * tt))) * 0.35 + S.bp(RNG.standard_normal(n), 2000, 7000) * 0.15
    return S.stereo(x * np.sin(np.pi * np.clip(tt / 0.45, 0, 1)) * 0.8)


def paper():                                            # a map being opened
    n = S.n_(0.35)
    x = np.zeros(n)
    t0 = 0.0
    while t0 < 0.3:
        k = S.n_(t0); m = S.n_(0.02 + 0.03 * RNG.random()); u = np.arange(m) / S.SR
        x[k:k + m] += (S.bp(RNG.standard_normal(m), 1800, 8000) * np.exp(-u / 0.008) * (0.4 + 0.6 * RNG.random()))[: n - k]
        t0 += 0.015 + 0.03 * RNG.random()
    return S.stereo(x * 0.6)


def tick():
    return S.stereo(ring([(3200, 0.4, 0.012), (6400, 0.15, 0.008)], 0.05))


def pip():                                              # one of fifteen people
    n = S.n_(0.09)
    tt = np.arange(n) / S.SR
    f = 1600 * 2 ** (RNG.integers(0, 8) / 12)
    return S.stereo(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.02) * np.minimum(1, tt / 0.002) * 0.4, RNG.uniform(-0.6, 0.6))


def chat(d):                                            # two people talking, far under the voice
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    syl = np.clip(np.sin(2 * np.pi * 4.5 * tt + 1.5 * np.sin(2 * np.pi * 0.7 * tt)), 0, 1) ** 2
    x = (S.bp(RNG.standard_normal(n), 300, 900) * 0.6 + S.bp(RNG.standard_normal(n), 1200, 2400) * 0.25) * syl
    return S.stereo(fade_io(x, d + 0.2, 0.1, 0.2) * 0.35)


def thunk():                                            # the door bumping: a wooden knock
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    x = ring([(180, 0.6, 0.06), (410, 0.3, 0.04), (760, 0.15, 0.025)], 0.35) + S.lp(RNG.standard_normal(n), 1500) * np.exp(-tt / 0.01) * 0.4
    return S.stereo(x * 0.6)


def huff():                                             # "hmph": a short annoyed breath out of the nose
    n = S.n_(0.32)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 300, 1400) * np.sin(np.pi * np.clip(tt / 0.32, 0, 1)) ** 2 * 0.6 + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.08) * 0.15
    return S.stereo(x * 0.5)


def click():                                            # a tap on a screen
    n = S.n_(0.05)
    tt = np.arange(n) / S.SR
    return S.stereo(S.bp(RNG.standard_normal(n), 2000, 8000) * np.exp(-tt / 0.003) * 0.7 + np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt / 0.008) * 0.25)


def flip():                                             # a card flipping over
    n = S.n_(0.18)
    tt = np.arange(n) / S.SR
    x = S.sweep_filter(RNG.standard_normal(n), 1500, 6000, 1.6) * np.sin(np.pi * np.clip(tt / 0.12, 0, 1)) * 0.5
    return S.stereo(x)


def flat():                                             # "most won't see it": a flat, deflating "meh"
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    f = 233 - 60 * np.clip((tt - 0.15) / 0.3, 0, 1)
    saw = 2 * ((np.cumsum(f) / S.SR) % 1) - 1
    return S.reverb(S.stereo(S.bp(saw, 300, 1500) * np.sin(np.pi * np.clip(tt / 0.5, 0, 1)) ** 0.7 * 0.45), 0.3, 0.15)


def scratch():                                          # a marker striking a line through
    n = S.n_(0.28)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 1500, 6000) * (0.6 + 0.4 * np.sin(2 * np.pi * 60 * tt)) * np.sin(np.pi * np.clip(tt / 0.28, 0, 1)) ** 0.8
    return S.stereo(x * 0.5)


def sparkle():                                          # glitter
    n = S.n_(1.0)
    x = np.zeros(n)
    for i in range(9):
        k = S.n_(0.03 * i + 0.01 * RNG.random()); f = 2000 * 2 ** (RNG.integers(0, 12) / 12) * (1 + (i % 3))
        x[k:] += ring([(f, 0.25, 0.12)], 1.0, n - k) * (1 - i / 12)
    return S.reverb(S.stereo(x * 0.4), 0.6, 0.35)


SYNTH = {"woosh_door": woosh_door, "swap": swap, "blip2": blip2, "rewind": rewind, "paper": paper, "tick": tick, "pip": pip, "thunk": thunk,
         "huff": huff, "click": click, "flip": flip, "flat": flat, "scratch": scratch, "sparkle": sparkle}
LONG = {"campus": campus, "steps": steps, "chat": chat}
SYN = {}
FRESH = {"tick", "pip", "paper", "click", "flip", "scratch", "woosh_door"}   # a new take each time, so repeats don't sound copied

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
    i, align = SFX[k]
    x = load(i)
    on, pk = marks(x)
    sfx.add(pan(x, p), t - (on if align == "onset" else pk), g)

# ---------- music ----------
BEAT = 60 / 120
GM = M["start"] % BEAT                                 # a beat on "Ten seconds in"
G1 = M["pitch"] % BEAT                                 # a beat on "We scale businesses"
# G major (G, Em, C, D)
KEY = ([[196.0, 246.94, 293.66, 392.0], [164.81, 196.0, 246.94, 329.63], [130.81, 164.81, 196.0, 261.63], [146.83, 185.0, 220.0, 293.66]],
       [[783.99, 987.77, 1174.66, 1567.98], [659.25, 783.99, 987.77, 1318.51], [523.25, 659.25, 783.99, 1046.5], [587.33, 739.99, 880.0, 1174.66]],
       [98.0, 82.41, 65.41, 73.42])
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.4, 0.4)
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


intro = S.Track(END)
groove(intro, 0.05, M["start"] - 0.05, KEY, beat=None, pads=False, level=0.55, g0=0.05 % BEAT)    # a light walk
intro.buf *= (0.05 + 0.95 * ramp(len(intro.buf), *M["stop"], 0.04))[:, None]                     # a stop on "swapped"
music.buf += intro.buf
groove(music, M["start"], M["feed"] - 0.05, KEY, level=0.8, g0=GM)                              # from "Ten seconds in"
groove(music, M["feed"], M["pitch"] - 0.05, KEY, beat=None, level=0.7, g0=GM)                   # the feed: no kick
music.add(S.pad([196.0, 246.94, 293.66, 392.0, 493.88], 1.8, 1800), M["lift"], 0.16)           # "swap the first three seconds"
groove(music, M["pitch"], M["end"], KEY, level=0.85, g0=G1)                                      # the pitch
music.add(S.pad([196.0, 246.94, 293.66, 392.0], END - M["end"] + 0.4, 1800), M["end"], 0.24)


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


if len(sys.argv) > 4:                                   # stems, for checking levels
    sf.write(sys.argv[4] + "_sfx.wav", sfx.buf / (np.max(np.abs(sfx.buf)) + 1e-9), S.SR, subtype="PCM_16")
    sf.write(sys.argv[4] + "_music.wav", music.buf / (np.max(np.abs(music.buf)) + 1e-9), S.SR, subtype="PCM_16")
voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.14, sfx_gain=0.34, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
