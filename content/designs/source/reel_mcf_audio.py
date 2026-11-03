"""Music + sound design for "Why would anyone make a spoon with a hollow handle?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The rest is synthesized here: the spoon plopping into the soft serve and
the cookie bits bouncing, air rushing through the tunnel of the handle, the mixer's hum, the holder sliding up, the
spindle seating in the handle, the motor whirring up and down, the bits churning, the cup sliding on steel, a scoop,
ticks for the row of cups, a bell on "two jobs", the feed flicking past and stopping, check marks, the blender in the ad.
Music (120 bpm): a low drone under the question; the groove in C major from "Because the McFlurry spoon is the mixer!",
a breath on "One spoon. Two jobs." with a warm pad; lighter under the feed, and back for the pitch.
Usage: python3 reel_mcf_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
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

D = json.loads((Path(__file__).parent / "reel_mcf_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset or its loudest point)
SFX = {
    "deep": (1143, "peak"), "zoom_out": (1492, "peak"), "whoosh_c": (168, "peak"), "whoosh_f": (1471, "peak"),
    "whoosh_soft": (1489, "peak"), "swish": (3115, "peak"), "hit": (2180, "peak"), "pop": (3005, "onset"),
    "select": (1109, "onset"),
}
RNG = np.random.default_rng(11)


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


def lay(*xs):
    """Stereo sounds summed from the same start."""
    xs = [x if x.ndim == 2 else S.stereo(x) for x in xs]
    out = np.zeros((max(len(x) for x in xs), 2))
    for x in xs:
        out[: len(x)] += x
    return out


def ring(parts, dur, n=None):
    """A struck metal: (frequency, amplitude, decay seconds) partials."""
    n = n or S.n_(dur)
    tt = np.arange(n) / S.SR
    return sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)


def crackles(n, d, rate, lo, hi, amp, dec=0.003):
    """Random short snaps: bits bouncing, crumbs churning."""
    x = np.zeros(n)
    t0 = RNG.exponential(rate)
    while t0 < d:
        k = S.n_(t0); m = S.n_(0.006 + 0.02 * RNG.random())
        snap = S.bp(RNG.standard_normal(m), lo, hi) * np.exp(-np.arange(m) / (S.SR * dec)) * amp * (0.3 + 0.9 * RNG.random() ** 2)
        x[k:k + m] += snap[: n - k]
        t0 += RNG.exponential(rate)
    return x


def plop():                                            # the spoon plunges into the soft serve
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    f = 80 + 240 * np.exp(-tt / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.exp(-tt / 0.09)
    wet = S.bp(RNG.standard_normal(n), 300, 2500) * np.exp(-tt / 0.03) * 0.5
    return S.stereo((body * 0.9 + wet) * np.minimum(1, tt / 0.003))


def crumbs():                                          # cookie bits bouncing on the cup
    n = S.n_(0.45)
    return S.stereo(crackles(n, 0.3, 0.025, 2000, 6500, 0.8, 0.002), 0.1)


def tunnel(d):                                         # rushing through the hollow handle
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    x = S.sweep_filter(RNG.standard_normal(n), 300, 2600, 1.4) * np.minimum(1, tt / 0.1) * np.clip((d + 0.2 - tt) / 0.25, 0, 1)
    rumble = S.lp(RNG.standard_normal(n), 120) * 1.5 * np.minimum(1, tt / 0.2) * np.clip((d + 0.2 - tt) / 0.25, 0, 1)
    return S.stereo((x * 0.7 + rumble * 0.4) * 0.8, np.linspace(-0.3, 0.3, n))


def hum(d):                                            # the mixer, switched on
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    x = (np.sin(2 * np.pi * 120 * tt) + 0.4 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sin(2 * np.pi * 360 * tt)) * 0.3 + S.bp(RNG.standard_normal(n), 200, 800) * 0.15
    return S.stereo(x * np.minimum(1, tt / 0.2) * np.clip((d + 0.3 - tt) / 0.3, 0, 1))


def lift():                                            # the holder slides up the column
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    f = 380 + 260 * tt / 0.45
    x = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * 0.3 + S.bp(RNG.standard_normal(n), 800, 3000) * 0.25
    return S.stereo(x * np.minimum(1, tt / 0.04) * np.clip((0.45 - tt) / 0.08, 0, 1) * 0.7)


def clunk():                                           # the spindle seats in the handle
    n = S.n_(0.3)
    tt = np.arange(n) / S.SR
    click = S.bp(RNG.standard_normal(n), 1500, 8000) * np.exp(-tt / 0.006) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / 0.02) * 0.4
    return lay(S.stereo(click * 0.8), S.sub_hit(140, 60, 0.25, 0.1) * 0.5)


def whirr(d):                                          # the motor spins up, whirs, and winds down
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    up = np.clip(tt / 0.3, 0, 1) ** 0.7
    down = np.clip((d + 0.2 - tt) / 0.45, 0, 1)
    f = 140 + 360 * up * (0.4 + 0.6 * down) + 6 * np.sin(2 * np.pi * 9 * tt)
    ph = 2 * np.pi * np.cumsum(f) / S.SR
    x = np.tanh(1.5 * (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph))) * 0.5 + S.bp(RNG.standard_normal(n), 1500, 5000) * 0.12 * up
    return S.stereo(S.lp(x, 4000) * np.minimum(1, tt / 0.05) * down * 0.8)


def crunch(d):                                         # the cookie bits churned through the ice cream
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    x = crackles(n, d, 0.018, 900, 5000, 0.6, 0.004) + S.bp(RNG.standard_normal(n), 300, 1200) * 0.08
    return S.stereo(x * np.minimum(1, tt / 0.1) * np.clip((d + 0.2 - tt) / 0.2, 0, 1) * 0.8)


def slide():                                           # the cup slid across the steel counter
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    return S.stereo(S.bp(RNG.standard_normal(n), 700, 3200) * np.sin(np.pi * tt / 0.4) * 0.5)


def scoop():                                           # a spoonful lifted out
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    f = 180 + 420 * tt / 0.35
    x = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.sin(np.pi * tt / 0.35) * 0.45 + S.bp(RNG.standard_normal(n), 400, 2000) * np.exp(-tt / 0.05) * 0.3
    return S.stereo(x)


def tick():                                            # a cup in the row gets its spoon
    return S.stereo(ring([(2600, 0.4, 0.03), (5200, 0.1, 0.02)], 0.12))


def ding():                                            # "two jobs": a bright bell
    return S.reverb(S.stereo(ring([(1568, 0.5, 0.6), (3136, 0.18, 0.35), (4704, 0.08, 0.2)], 1.4)), 0.5, 0.2)


def flick(d):                                          # the feed flicking past
    n = S.n_(d + 0.2)
    x = np.zeros((n, 2))
    for i, t0 in enumerate(np.linspace(0, d * 0.75, 4)):
        w = S.swish(0.14) * (0.5 + 0.15 * i)
        k = S.n_(t0); x[k:k + len(w)] += w[: n - k]
    return x


def thud():                                            # the scroll stops on the ad
    return lay(S.sub_hit(95, 45, 0.4, 0.3) * 0.8, S.stereo(ring([(700, 0.2, 0.03)], 0.1)))


def check():                                           # a job ticked off
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    a = np.sin(2 * np.pi * 1318.5 * tt) * np.exp(-tt / 0.07) * np.clip((0.09 - tt) / 0.01, 0, 1)
    b = np.zeros(n); k = S.n_(0.07); t2 = tt[: n - k]
    b[k:] = np.sin(2 * np.pi * 1760 * t2) * np.exp(-t2 / 0.12)
    return S.stereo((a + b) * 0.4 * np.minimum(1, tt / 0.003))


def blend(d):                                          # the blender in the ad
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    f = 260 + 140 * np.clip(tt / 0.25, 0, 1) + 8 * np.sin(2 * np.pi * 13 * tt)
    ph = 2 * np.pi * np.cumsum(f) / S.SR
    x = np.tanh(1.3 * (np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sin(4 * ph))) * 0.4 + S.bp(RNG.standard_normal(n), 2000, 7000) * 0.15
    return S.stereo(S.lp(x, 6000) * np.minimum(1, tt / 0.08) * np.clip((d + 0.2 - tt) / 0.2, 0, 1) * 0.7, 0.15)


SYNTH = {"plop": plop, "crumbs": crumbs, "lift": lift, "clunk": clunk, "slide": slide, "scoop": scoop, "tick": tick, "ding": ding, "thud": thud, "check": check}
LONG = {"tunnel": tunnel, "hum": hum, "whirr": whirr, "crunch": crunch, "flick": flick, "blend": blend}
SYN = {}
FRESH = {"tick", "check", "lift", "clunk"}                   # a new take each time, so repeats don't sound copied

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
GM = M["start"] % BEAT                                 # a beat on "Because the McFlurry spoon is the mixer!"
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
        if any(a <= tt <= b for a, b in M.get("quiet", [])):     # a pause in the voice that must stay clear
            k += 1
            continue
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
groove(main, M["start"], M["feed"] - 0.05, BRIGHT, level=0.8, g0=GM)                         # from "Because the McFlurry spoon is the mixer!"
n = len(main.buf)
main.buf *= (0.2 + 0.8 * ramp(n, *M["hush"], 0.12))[:, None]                                # "One spoon. Two jobs."
music.buf += main.buf
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], 2.0, 1600), M["dawn"], 0.16)                         # "One spoon. Two jobs."
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
