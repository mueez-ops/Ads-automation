"""Music + sound design for "Why would anyone shoot a brand new suit of armor?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The rest is synthesized here: the musket (the crack, the boom and
the roll of black powder), the ball's whiz in slow motion, its ping off the breastplate, the tear through the plain
plate, the clanks of the suit slamming back together, a cash register for "To sell it!", the sight locking on, the
flattened ball dropping to the floor, a buzzer for "It proved nothing".
Music (120 bpm): a low drone and a riser under the question, nothing but the shot while the ball is in the air,
then the groove in C major from "To sell it!", filtered right down while the second ball flies and hushed under
"A spotless suit? It proved nothing."; lighter under the feed, and back for the pitch, resolving on C.
Usage: python3 reel_armor_audio.py <vo.wav> <out.wav> <sfx_cache>
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

D = json.loads((Path(__file__).parent / "reel_armor_events.json").read_text())
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


def musket():                                          # black powder: a crack, a boom, a long roll
    n = S.n_(1.6)
    tt = np.arange(n) / S.SR
    crack = S.hp(RNG.standard_normal(n), 900) * np.exp(-tt / 0.006) * 1.4
    body = S.lp(RNG.standard_normal(n), 1400) * np.exp(-tt / 0.09) * 1.0
    roll = S.lp(RNG.standard_normal(n), 380) * np.exp(-tt / 0.55) * np.minimum(1, tt / 0.03) * 0.8
    pre = np.zeros(n); k = S.n_(0.03); pre[:k] = S.hp(RNG.standard_normal(k), 3000) * 0.25   # the flint's snap
    x = np.roll(crack + body + roll, S.n_(0.025)) + pre
    out = lay(S.stereo(x), np.roll(S.sub_hit(70, 30, 1.2, 0.9), S.n_(0.025), axis=0) * 1.1)
    return S.reverb(out, 0.7, 0.22) if hasattr(S, "reverb") else out


def whiz(d):                                           # the ball in slow motion: a low, falling rush of air
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    air = S.sweep_filter(RNG.standard_normal(n), 2400, 500, 1.6) if hasattr(S, "sweep_filter") else S.bp(RNG.standard_normal(n), 400, 2400)
    hum = np.sin(2 * np.pi * np.cumsum(np.geomspace(180, 70, n)) / S.SR) * 0.35
    env = np.minimum(1, tt / 0.15) * np.clip((d + 0.3 - tt) / 0.3, 0, 1) * (0.55 + 0.45 * np.minimum(1, tt / d))
    return S.stereo((air * 0.7 + hum) * env)


def ping():                                            # the ball on the breastplate: a hard strike and a long ring
    n = S.n_(1.8)
    tt = np.arange(n) / S.SR
    r = ring([(523, 0.5, 0.6), (1397, 0.45, 0.4), (2350, 0.35, 0.28), (3512, 0.28, 0.2), (4870, 0.2, 0.14), (6311, 0.12, 0.1)], 1.8)
    burst = S.hp(RNG.standard_normal(n), 1800) * np.exp(-tt / 0.012) * 1.0
    return lay(S.stereo(r * np.minimum(1, tt / 0.002) + burst), S.sub_hit(120, 45, 0.6, 1.0) * 0.9)


def tear():                                            # through the plain plate: a crunch and a short, torn ring
    n = S.n_(0.7)
    tt = np.arange(n) / S.SR
    crunch = S.bp(RNG.standard_normal(n), 600, 6000) * np.exp(-tt / 0.05) * (0.6 + 0.4 * (RNG.random(n) < 0.3)) * 1.2
    r = ring([(780, 0.3, 0.12), (1905, 0.3, 0.09), (3330, 0.2, 0.07), (5120, 0.15, 0.05)], 0.7)
    return lay(S.stereo(crunch + r), S.sub_hit(95, 40, 0.5, 0.8) * 0.7)


def clank():                                           # a piece of armor slammed into place
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    r = ring([(310, 0.45, 0.16), (870, 0.35, 0.12), (1620, 0.25, 0.09), (2730, 0.18, 0.07), (4100, 0.1, 0.05)], 0.5)
    knock = S.lp(RNG.standard_normal(n), 500) * np.exp(-tt / 0.03) * 0.8
    return lay(S.stereo(r + knock), S.sub_hit(90, 40, 0.35, 0.6) * 0.6)


def cash():                                            # a register: the drawer's clatter and two bright bells
    n = S.n_(1.1)
    tt = np.arange(n) / S.SR
    clatter = S.bp(RNG.standard_normal(n), 1500, 7000) * np.exp(-tt / 0.03) * 0.6
    b1 = ring([(2093, 0.4, 0.35), (4186, 0.15, 0.2), (6280, 0.08, 0.12)], 1.1)
    b2 = np.roll(ring([(2637, 0.45, 0.45), (5274, 0.16, 0.25), (7911, 0.07, 0.15)], 1.1), S.n_(0.09))
    b2[: S.n_(0.09)] = 0
    return S.stereo(clatter + b1 + b2)


def lock():                                            # the sight locks on: two quick beeps
    n = S.n_(0.3)
    tt = np.arange(n) / S.SR
    beep = lambda t0: np.sin(2 * np.pi * 1760 * tt) * ((tt >= t0) & (tt < t0 + 0.06)) * np.exp(-np.maximum(0, tt - t0) / 0.05)
    return S.stereo((beep(0) + beep(0.1)) * 0.5)


def click():                                           # the hammer drawn back
    n = S.n_(0.2)
    tt = np.arange(n) / S.SR
    x = S.hp(RNG.standard_normal(n), 2500) * (np.exp(-tt / 0.004) + 0.6 * np.exp(-np.maximum(0, tt - 0.07) / 0.004) * (tt >= 0.07))
    return S.stereo(x * 0.8)


def drop():                                            # the flattened ball on the floor: two small ticks
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    tick = lambda t0, a: ring([(2900, a, 0.03), (5100, a * 0.5, 0.02)], 0.5) * (tt >= t0) * np.exp(-np.maximum(0, tt - t0) / 0.03)
    return S.stereo(tick(0, 0.6) + tick(0.16, 0.3))


def buzz():                                            # "It proved nothing": a low, flat buzzer
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    x = np.sign(np.sin(2 * np.pi * 98 * tt)) * 0.5 + np.sign(np.sin(2 * np.pi * 103 * tt)) * 0.3
    return S.stereo(S.lp(x, 1800) * np.minimum(1, tt / 0.01) * np.clip((0.35 - tt) / 0.06, 0, 1) * 0.6)


def ding():                                            # passed
    n = S.n_(1.2)
    return S.stereo(ring([(1318.5, 0.5, 0.5), (2637, 0.18, 0.3), (3955, 0.08, 0.2)], 1.2) * 0.8)


def shimmer():                                         # light crossing polished steel
    n = S.n_(0.9)
    tt = np.arange(n) / S.SR
    x = sum(np.sin(2 * np.pi * f * tt + f) * a for f, a in [(3520, 0.2), (4186, 0.15), (5274, 0.12), (6272, 0.08)])
    return S.stereo(x * np.sin(np.pi * np.clip(tt / 0.9, 0, 1)) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt)))


def slowmo():                                          # time slows: everything falls in pitch, a low boom under it
    d = 1.0
    n = S.n_(d)
    tt = np.arange(n) / S.SR
    fall = tone(1200, 50, d, 0.4) * 0.45
    air = S.lp(RNG.standard_normal(n), 900) * np.exp(-tt / 0.35) * 0.35
    return lay(S.stereo(fall + air), S.sub_hit(70, 28, 1.0, 0.3) * 0.8)


def thud():                                            # 39 kilos lands
    n = S.n_(0.7)
    tt = np.arange(n) / S.SR
    body = S.lp(RNG.standard_normal(n), 260) * np.exp(-tt / 0.09) * 1.3
    return lay(S.stereo(body), S.sub_hit(65, 30, 0.7, 0.7) * 1.1, clank() * 0.25)


def stamp():                                           # a stamp slammed on
    n = S.n_(0.25)
    tt = np.arange(n) / S.SR
    knock = tone(180, 85, 0.14, 0.2) * 0.9
    slap = S.bp(RNG.standard_normal(n), 800, 3200) * np.exp(-tt / 0.012) * 0.6
    return lay(S.stereo(slap), knock, S.mouse_click() * 0.5)


def scan():                                            # the sight searching
    n = S.n_(0.5)
    return lay(S.whoosh(0.5, 1800, 7500, -0.3, 0.3, air=0.6)[:n] * 0.6, tone(900, 1900, 0.3, 0) * 0.3)


def like():                                            # a double tap: a soft pop with a sparkle
    return lay(load(3005) * 0.8, np.roll(load(2350), S.n_(0.05), axis=0) * 0.35)


SYNTH = {"musket": musket, "ping": ping, "tear": tear, "clank": clank, "cash": cash, "lock": lock, "click": click,
         "drop": drop, "buzz": buzz, "ding": ding, "shimmer": shimmer, "slowmo": slowmo, "thud": thud, "stamp": stamp,
         "scan": scan, "like": like}
SYN = {}

music, sfx = S.Track(END), S.Track(END)
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k == "whiz":
        sfx.add(pan(whiz(e["d"]), p), t, g)
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


shoot = next(e["t"] for e in EV if e["k"] == "musket")
music.add(S.pad([55.0, 82.41, 110.0, 130.81], shoot + 0.1, 340), 0.0, 0.11)                 # the question: a low drone
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, BRIGHT, level=0.85, g0=GM)                        # from "To sell it!"
n = len(main.buf)
slow = ramp(n, *M["slow2"], 0.2)[:, None]                                                   # the second ball in the air
main.buf = main.buf * slow + filt2(main.buf, "low", 380) * (1 - slow) * 0.7
main.buf *= (0.25 + 0.75 * ramp(n, *M["hush"], 0.12))[:, None]                              # "A spotless suit? It proved nothing."
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
