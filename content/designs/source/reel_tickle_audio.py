"""Music + sound design for "You can't tickle yourself. Unless it lands 0.2 seconds late.", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media and
commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is downloaded by id
into <sfx_cache> the first time. The giggle (2885, "Funny Giggling") and the lab laugh (411, "Human male casual laugh")
are Mixkit recordings too, cut short. The rest is synthesized here: a living room, fingers on a hoodie, a playful
trill on "tickle", the robots' small servo motors, an x-ray scan, the two signals (touch and prediction) and their
cancelling, the clicks of the dial, a 1999 lab hum, a computer beep, a flat "meh" on "barely a tickle", the counter
rolling to 200 ms, a sparkle on "someone else did it", a mute that cuts a sound off.
Music (120 bpm, C major): light plucks under the hook; the groove from "London scientists"; a breath under "No delay:
barely a tickle"; a lift on "feels like someone else did it"; no kick under the feed and a drop on "Muted."; back for
the pitch.
Usage: python3 reel_tickle_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
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

D = json.loads((Path(__file__).parent / "reel_tickle_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset or its loudest point, longest part kept in s)
SFX = {
    "deep": (1143, "peak", None), "zoom_out": (1492, "peak", None), "whoosh_c": (168, "peak", None), "whoosh_f": (1471, "peak", None),
    "whoosh_soft": (1489, "peak", None), "swish": (3115, "peak", None), "hit": (2180, "peak", None), "pop": (3005, "onset", None),
    "select": (1109, "onset", None), "giggle": (2885, "onset", 0.75), "laugh": (411, "onset", 1.3),
}
RNG = np.random.default_rng(23)


def load(i, keep=None):
    wav = CACHE / f"{i}.wav"
    if not wav.exists():
        mp3 = CACHE / f"{i}.mp3"
        urllib.request.urlretrieve(f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3", mp3)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "2", "-ar", str(S.SR), wav], check=True)
    x, sr = sf.read(wav)
    assert sr == S.SR
    x = x if x.ndim == 2 else S.stereo(x)
    if keep:                                              # cut short, from its first sound, with a fade
        on = marks(x)[0]
        x = x[S.n_(max(0, on - 0.02)): S.n_(max(0, on - 0.02) + keep)].copy()
        f = S.n_(0.18); x[-f:] *= np.linspace(1, 0, f)[:, None]
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
def room(d):                                            # a quiet living room: low room tone, a little air
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    x = S.lp(RNG.standard_normal(n), 300) * 1.2 + S.bp(RNG.standard_normal(n), 400, 1400) * 0.12 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * tt))
    return S.stereo(fade_io(x, d + 0.4, 0.05, 0.3) * 0.4)


def rustle(d):                                          # fingers going on a hoodie (or foam on a palm): soft scratchy bursts
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    am = np.abs(np.sin(2 * np.pi * 4.3 * tt + 0.6 * np.sin(2 * np.pi * 1.1 * tt))) ** 1.5
    x = S.bp(RNG.standard_normal(n), 1400, 6500) * am * (0.75 + 0.25 * RNG.random(n))
    return S.stereo(fade_io(x, d + 0.2, 0.03, 0.15) * 0.55, 0.2 * np.sin(2 * np.pi * 0.7 * tt))


def trill():                                            # "tickle": three quick bright notes, up
    n = S.n_(0.6)
    x = np.zeros(n)
    for t0, f in ((0, 1046.5), (0.045, 1318.5), (0.09, 1568.0)):
        k = S.n_(t0)
        x[k:] += ring([(f, 0.5, 0.09), (f * 3.0, 0.08, 0.03)], 0.6, n - k)
    return S.reverb(S.stereo(x * 0.5), 0.35, 0.2)


def servo(d):                                           # a small robot motor: a soft whine that follows the hand back and forth
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    sp = np.abs(np.sin(7 * tt))                          # the movement's speed
    f = 420 + 260 * sp
    x = chirp(f, n) * 0.5 + chirp(f * 2.01, n) * 0.2 + S.bp(np.sign(np.sin(2 * np.pi * 95 * tt)) * 0.3, 200, 1200) * 0.4
    return S.stereo(fade_io(x * (0.35 + 0.65 * sp), d + 0.2, 0.08, 0.2) * 0.32)


def xray():                                             # the x-ray switching on: a sweep up and an electric hum
    n = S.n_(1.0)
    tt = np.arange(n) / S.SR
    sw = S.sweep_filter(RNG.standard_normal(n), 300, 5000, 1.4) * np.exp(-((tt - 0.25) / 0.2) ** 2) * 0.7
    hum = (np.sin(2 * np.pi * 110 * tt) + 0.4 * np.sin(2 * np.pi * 220 * tt) + 0.2 * np.sin(2 * np.pi * 330 * tt)) * np.clip(tt / 0.15, 0, 1) * np.exp(-tt / 0.5) * 0.3
    return S.reverb(S.stereo(sw + hum), 0.5, 0.25)


def zing():                                             # a nerve signal: a fast upward zip
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    f = 500 + 2200 * np.clip(tt / 0.14, 0, 1) ** 0.7
    x = chirp(f, n) * np.exp(-tt / 0.09) * np.minimum(1, tt / 0.004)
    return S.reverb(S.stereo(x * 0.4), 0.4, 0.25)


def cancel():                                           # the two signals meet and cancel: a soft fall, a hush
    n = S.n_(0.6)
    tt = np.arange(n) / S.SR
    f = 1100 * np.exp(-tt / 0.12) + 160
    x = chirp(f, n) * np.exp(-tt / 0.18) * 0.45 + S.sweep_filter(RNG.standard_normal(n), 3000, 300, 1.0) * np.exp(-tt / 0.15) * 0.3
    return S.reverb(S.stereo(x * np.minimum(1, tt / 0.005)), 0.5, 0.3)


def click():                                            # a detent on the dial
    n = S.n_(0.05)
    tt = np.arange(n) / S.SR
    return S.stereo(S.bp(RNG.standard_normal(n), 2000, 8000) * np.exp(-tt / 0.003) * 0.7 + np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt / 0.008) * 0.25)


def lab(d):                                             # a 1999 lab: computer fans and a low hum
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 180, 900) * 0.9 + (np.sin(2 * np.pi * 100 * tt) + 0.3 * np.sin(2 * np.pi * 200 * tt)) * 0.12
    return S.stereo(fade_io(x, d + 0.4, 0.15, 0.3) * 0.38)


def beep(f=880, d=0.13):                                # a computer of the time
    n = S.n_(d + 0.05)
    tt = np.arange(n) / S.SR
    x = S.lp(np.sign(np.sin(2 * np.pi * f * tt)), 3500) * np.clip((d - tt) / 0.01, 0, 1) * np.minimum(1, tt / 0.003)
    return S.stereo(x * 0.3)


def beep2():                                            # the delay set: two notes up
    a, b = beep(880, 0.08), beep(1320, 0.12)
    out = np.zeros((S.n_(0.25), 2))
    out[: len(a)] += a
    k = S.n_(0.1); out[k:k + len(b)] += b[: len(out) - k]
    return out


def flat():                                             # "barely a tickle": a flat, deflating "meh"
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    f = 233 - 60 * np.clip((tt - 0.15) / 0.3, 0, 1)
    saw = 2 * ((np.cumsum(f) / S.SR) % 1) - 1
    x = S.bp(saw, 300, 1500) * np.sin(np.pi * np.clip(tt / 0.5, 0, 1)) ** 0.7
    return S.reverb(S.stereo(x * 0.45), 0.3, 0.15)


def tick():                                             # the counter
    return S.stereo(ring([(3200, 0.4, 0.012), (6400, 0.15, 0.008)], 0.05))


def sparkle():                                          # "someone else did it": glitter
    n = S.n_(1.0)
    x = np.zeros(n)
    for i in range(9):
        k = S.n_(0.03 * i + 0.01 * RNG.random()); f = 2000 * 2 ** (RNG.integers(0, 12) / 12) * (1 + (i % 3))
        x[k:] += ring([(f, 0.25, 0.12)], 1.0, n - k) * (1 - i / 12)
    return S.reverb(S.stereo(x * 0.4), 0.6, 0.35)


def mute():                                             # a sound cut off: a short tone closing down
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    f = 640 * np.exp(-tt / 0.08) + 140
    x = S.sweep_filter(chirp(f, n) + 0.3 * RNG.standard_normal(n), 2500, 200, 1.0) * np.exp(-tt / 0.07) * np.minimum(1, tt / 0.003)
    return S.stereo(x * 0.55)


SYNTH = {"tick2": trill, "xray": xray, "zing": zing, "cancel": cancel, "click": click, "beep": beep, "beep2": beep2, "flat": flat,
         "tick": tick, "sparkle": sparkle, "mute": mute}
LONG = {"room": room, "rustle": rustle, "servo": servo, "lab": lab}
SYN = {}
FRESH = {"tick", "click", "zing", "mute"}             # a new take each time, so repeats don't sound copied

music, sfx = S.Track(END), S.Track(END)
LOADED = {}
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
    i, align, keep = SFX[k]
    if k not in LOADED:
        LOADED[k] = load(i, keep)
    x = LOADED[k]
    on, pk = marks(x)
    sfx.add(pan(x, p), t - (on if align == "onset" else pk), g)

# ---------- music ----------
BEAT = 60 / 120
GM = M["start"] % BEAT                                 # a beat on "London scientists"
G1 = M["pitch"] % BEAT                                 # a beat on "We scale businesses"
# C major (C, Am, F, G)
KEY = ([[130.81, 164.81, 196.0, 261.63, 329.63], [110.0, 130.81, 164.81, 220.0, 261.63], [87.31, 110.0, 130.81, 174.61, 220.0], [98.0, 123.47, 146.83, 196.0, 246.94]],
       [[523.25, 659.25, 783.99, 1046.5], [440.0, 523.25, 659.25, 880.0], [440.0, 523.25, 698.46, 880.0], [493.88, 587.33, 783.99, 987.77]],
       [65.41, 55.0, 43.65, 49.0])
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


def groove(trk, t0, t1, key, beat=True, plucks=True, pads=True, level=1.0, g0=0.0, bassline=True):
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
        if bassline and kr % 2 == 1:
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


GH = 0.05 % BEAT                                        # the hook's own grid, from the first frame
groove(music, 0.0, M["start"] - 0.05, KEY, beat=None, pads=False, level=0.6, g0=GH)          # the hook: light plucks, no kick
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, KEY, level=0.8, g0=GM)                            # from "London scientists"
n = len(main.buf)
main.buf *= (0.15 + 0.85 * ramp(n, *M["hush"], 0.12))[:, None]                              # "No delay: barely a tickle"
music.buf += main.buf
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63, 392.0], 1.8, 1800), M["dawn"], 0.16)   # "feels like someone else did it"
feed = S.Track(END)
groove(feed, M["feed"], M["pitch"] - 0.05, KEY, beat=None, level=0.7, g0=GM)                # the feed: no kick
feed.buf *= (0.12 + 0.88 * ramp(len(feed.buf), *M["mute"], 0.06))[:, None]                    # "Muted."
music.buf += feed.buf
groove(music, M["pitch"], M["end"], KEY, level=0.85, g0=G1)                                  # the pitch
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
