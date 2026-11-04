"""Music + sound design for "Why would a bee sting you, if it kills her?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The rest is synthesized here: the bee buzzing in close and stopping
as she lands, the sting going in, the hive humming, a glint on the barbs, a harpoon's thunk, the hook catching, the
stinger tearing out, the venom sac pumping, a stopwatch, the alarm scent puffing out, a target lock on "marks you", the
swarm, a ding for each viewer tagged, the till on "sell".
Music (120 bpm): a low drone under the question; the groove in C major from "Because she's defending the hive!", a
breath under the pumping, a warm pad on "One sting tags you"; lighter under the feed, and back for the pitch.
Usage: python3 reel_bee_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
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

D = json.loads((Path(__file__).parent / "reel_bee_events.json").read_text())
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


def buzzer(n, f0, f1, wob=0.0, seed=0):
    """A bee's buzz: a bright, rough tone gliding from f0 to f1, with a little wobble."""
    tt = np.arange(n) / S.SR
    f = np.geomspace(f0, f1, n) * (1 + wob * np.sin(2 * np.pi * (5 + seed) * tt + seed))
    ph = 2 * np.pi * np.cumsum(f) / S.SR
    x = np.sin(ph) + 0.6 * np.sin(2 * ph + 0.3) + 0.4 * np.sin(3 * ph + 0.7) + 0.25 * np.sign(np.sin(ph)) * 0.6
    return S.lp(x, 3500) * (0.8 + 0.2 * np.sin(2 * np.pi * 31 * tt + seed))


def buzz(d):                                           # she flies in close, then lands and goes quiet
    n = S.n_(d + 0.2)
    tt = np.arange(n) / S.SR
    x = buzzer(n, 255, 205, 0.02) * np.minimum(1, tt / 0.03) * np.clip((1.0 - tt) / 0.15, 0, 1) * (0.6 + 0.4 * np.clip(tt / 0.6, 0, 1))
    return S.stereo(x * 0.5, np.clip(-0.6 + tt * 1.2, -0.6, 0.3))


def stab():                                            # the sting goes in
    n = S.n_(0.3)
    tt = np.arange(n) / S.SR
    click = S.bp(RNG.standard_normal(n), 2500, 9000) * np.exp(-tt / 0.004)
    wet = np.sin(2 * np.pi * np.cumsum(600 + 900 * np.exp(-tt / 0.03)) / S.SR) * np.exp(-tt / 0.05) * 0.4
    return lay(S.stereo((click + wet) * 0.8), S.sub_hit(110, 50, 0.3, 0.1) * 0.5)


def hivehum(d):                                        # a hive full of bees
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    x = sum(buzzer(n, f, f * 0.99, 0.01, i) * (0.5 + 0.5 * RNG.random()) for i, f in enumerate([198, 214, 229, 241, 262]))
    x = x / 5 + S.bp(RNG.standard_normal(n), 150, 600) * 0.2
    return S.stereo(x * np.minimum(1, tt / 0.15) * np.clip((d + 0.3 - tt) / 0.3, 0, 1) * 0.7)


def glint():                                           # light catching the barbs
    return S.reverb(S.stereo(ring([(3520, 0.3, 0.25), (5274, 0.2, 0.18), (7040, 0.12, 0.12)], 0.8)), 0.5, 0.25)


def thunk():                                           # a harpoon
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    knock = S.bp(RNG.standard_normal(n), 300, 2000) * np.exp(-tt / 0.02)
    return lay(S.stereo(knock * 0.6), S.sub_hit(90, 40, 0.4, 0.2) * 0.7)


def hook():                                            # the barbs catching
    n = S.n_(0.2)
    tt = np.arange(n) / S.SR
    return S.stereo((S.bp(RNG.standard_normal(n), 1200, 5000) * np.exp(-tt / 0.01) + np.sin(2 * np.pi * 420 * tt) * np.exp(-tt / 0.03) * 0.3) * 0.7)


def rip():                                             # the stinger tearing out of her body
    n = S.n_(0.6)
    tt = np.arange(n) / S.SR
    tear = S.sweep_filter(RNG.standard_normal(n), 3000, 500, 1.6) * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.18)
    snap = S.bp(RNG.standard_normal(n), 1500, 7000) * np.exp(-np.maximum(0, tt - 0.18) / 0.006) * (tt > 0.18)
    return lay(S.stereo(tear * 0.8 + snap * 0.7), S.sub_hit(100, 45, 0.5, 0.2) * 0.4)


def pulse(d):                                          # the venom sac pumping
    n = S.n_(d + 0.3)
    x = np.zeros(n)
    for t0 in np.arange(0, d, 0.46):
        k = S.n_(t0); m = S.n_(0.25); tt = np.arange(m) / S.SR
        th = np.sin(2 * np.pi * np.cumsum(70 + 40 * np.exp(-tt / 0.04)) / S.SR) * np.exp(-tt / 0.08) + S.bp(RNG.standard_normal(m), 300, 1500) * np.exp(-tt / 0.03) * 0.25
        x[k:k + m] += th[: n - k]
    return S.stereo(x * 0.8)


def tick():                                            # a stopwatch
    return S.stereo(ring([(3200, 0.4, 0.012), (6400, 0.15, 0.008)], 0.05))


def puff():                                            # the alarm scent puffs out
    n = S.n_(0.7)
    tt = np.arange(n) / S.SR
    return S.stereo(S.sweep_filter(RNG.standard_normal(n), 800, 3500, 1.2) * np.sin(np.pi * np.clip(tt / 0.7, 0, 1)) * 0.5)


def lock():                                            # a target locks on
    n = S.n_(0.32)
    tt = np.arange(n) / S.SR
    a = np.sin(2 * np.pi * 1200 * tt) * (tt < 0.08) + np.sin(2 * np.pi * 1800 * tt) * ((tt > 0.12) & (tt < 0.26))
    return S.stereo(a * 0.3 * np.minimum(1, tt / 0.003))


def swarm(d):                                          # the hive comes for you
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    x = sum(buzzer(n, f, f * (1.06 + 0.04 * RNG.random()), 0.03, i) * (0.5 + 0.5 * RNG.random()) for i, f in enumerate([190, 205, 222, 236, 251, 268, 280]))
    x = x / 7 * (0.5 + 0.5 * np.clip(tt / 0.8, 0, 1))
    return S.stereo(x * np.minimum(1, tt / 0.1) * np.clip((d + 0.3 - tt) / 0.35, 0, 1) * 0.9, np.sin(2 * np.pi * 0.7 * tt) * 0.4)


def tag():                                             # a viewer tagged
    return S.stereo(ring([(1760, 0.35, 0.08), (2637, 0.15, 0.06)], 0.25))


def cash():                                            # the till: a sale
    n = S.n_(0.9)
    bell = ring([(2093, 0.5, 0.35), (3136, 0.3, 0.25), (4186, 0.15, 0.18)], 0.9)
    jingle = np.zeros(n)
    for t0 in (0.05, 0.11, 0.16, 0.24):
        k = S.n_(t0); m = S.n_(0.12); tt = np.arange(m) / S.SR
        jingle[k:k + m] += (ring([(5200 + 800 * RNG.random(), 0.2, 0.03)], 0.12, m))[: n - k]
    return S.reverb(S.stereo(bell * 0.6 + jingle * 0.6), 0.5, 0.2)


def check():                                           # done
    n = S.n_(0.4)
    tt = np.arange(n) / S.SR
    a = np.sin(2 * np.pi * 1318.5 * tt) * np.exp(-tt / 0.07) * np.clip((0.09 - tt) / 0.01, 0, 1)
    b = np.zeros(n); k = S.n_(0.07); t2 = tt[: n - k]
    b[k:] = np.sin(2 * np.pi * 1760 * t2) * np.exp(-t2 / 0.12)
    return S.stereo((a + b) * 0.4 * np.minimum(1, tt / 0.003))


SYNTH = {"stab": stab, "glint": glint, "thunk": thunk, "hook": hook, "rip": rip, "tick": tick, "puff": puff, "lock": lock, "tag": tag, "cash": cash, "check": check}
LONG = {"buzz": buzz, "hivehum": hivehum, "pulse": pulse, "swarm": swarm}
SYN = {}
FRESH = {"tag", "tick"}                   # a new take each time, so repeats don't sound copied

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
GM = M["start"] % BEAT                                 # a beat on "Because she's defending the hive!"
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
groove(main, M["start"], M["feed"] - 0.05, BRIGHT, level=0.8, g0=GM)                         # from "Because she's defending the hive!"
n = len(main.buf)
main.buf *= (0.2 + 0.8 * ramp(n, *M["hush"], 0.12))[:, None]                                # under the pumping
music.buf += main.buf
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], 2.4, 1600), M["dawn"], 0.16)                         # "One sting tags you."
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
