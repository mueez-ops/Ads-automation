"""Music + sound design for the explainer "How Face ID knows it's really you", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The Face ID sounds (the scan shimmer, the failed-unlock buzz, the
light switch, the projector's zap, the chip's lock) are synthesized here, as are the thumps and rises.
Music (120 bpm): under the hook a low heartbeat pulse in A minor that stops dead on "Nothing." and on "Still
locked.", so those words land in silence; a rise under "So how does it know"; the groove in C major under the
mechanism; under the tension only a riser, a heartbeat and a clock; a low drone on "You've just watched this reel
for 39 seconds"; then the groove again on a grid that puts a beat on "We scale businesses", resolving on C.
Usage: python3 reel_faceid_audio.py <vo.wav> <out.wav> <sfx_cache>
"""
import json
import math
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_faceid_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset or its loudest point)
SFX = {
    "deep": (1143, "peak"), "zoom_out": (1492, "peak"), "zoom": (2608, "peak"), "sting": (2903, "peak"),
    "whoosh_b": (164, "peak"), "whoosh_c": (168, "peak"), "whoosh_d": (1490, "peak"), "whoosh_e": (1469, "peak"),
    "whoosh_f": (1471, "peak"), "whoosh_soft": (1489, "peak"), "swish": (3115, "peak"), "arrow": (1491, "peak"),
    "hit": (2180, "peak"), "pop": (3005, "onset"), "tick": (2568, "onset"), "check": (1120, "onset"),
    "tap": (2585, "onset"), "chime": (1107, "onset"), "select": (1109, "onset"), "sparkle": (2350, "onset"),
}


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


def scan():                                            # a shimmer that rises across the face
    n = S.n_(0.5)
    return lay(S.whoosh(0.5, 1800, 7500, -0.3, 0.3, air=0.6)[:n] * 0.7, tone(900, 1900, 0.3, 0) * 0.35)


def deny():                                            # the failed unlock: two low buzzes falling
    a, b = tone(330, 300, 0.11, 0.6), tone(247, 220, 0.16, 0.6)
    x = np.zeros(S.n_(0.32))
    x[: len(a)] += a
    x[S.n_(0.13): S.n_(0.13) + len(b)] += b
    return S.stereo(S.lp(x, 2500) * 0.7)


def lay(*xs):
    """Stereo sounds summed from the same start."""
    xs = [x if x.ndim == 2 else S.stereo(x) for x in xs]
    out = np.zeros((max(len(x) for x in xs), 2))
    for x in xs:
        out[: len(x)] += x
    return out


SYNTH = {
    "scan": scan,
    "deny": deny,
    "switch": lambda: lay(S.key_click() * 1.6, S.sub_hit(140, 60, 0.35, 0.9)),                  # the lights go off
    "laser": lambda: lay(tone(2600, 260, 0.38, 0.2) * 0.6, S.whoosh(0.4, 600, 9000, 0.4, -0.4, air=0.8)),   # the projector fires
    "lock": lambda: lay(S.mouse_click(), S.sub_hit(160, 70, 0.25, 0.7)),                         # into the chip
}
SYN = {}

music, sfx = S.Track(END), S.Track(END)
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k in SYNTH:
        if k not in SYN:
            SYN[k] = SYNTH[k]()
        sfx.add(pan(SYN[k], p), t, g)
        continue
    if k == "thump":
        sfx.add(S.sub_hit(85, 36, 0.9, 0.5), t, g)
        continue
    if k == "riser":
        sfx.add(S.riser(e["d"], 400, 4500), t, g)
        continue
    i, align = SFX[k]
    x = load(i)
    on, pk = marks(x)
    sfx.add(pan(x, p), t - (on if align == "onset" else pk), g)

# ---------- music ----------
BEAT = 60 / 120
G0 = 0.0                                               # the hook: a beat on the first frame
GM = M["groove"] % BEAT                                # the mechanism: a beat on "Above your screen"
G1 = M["last"] % BEAT                                  # the pitch: a beat on "We scale businesses"
# C major (C, G, Am, F)
BRIGHT = ([[130.81, 164.81, 196.0, 261.63, 329.63], [98.0, 123.47, 146.83, 196.0, 246.94], [110.0, 130.81, 164.81, 220.0, 261.63], [87.31, 110.0, 130.81, 174.61, 220.0]],
          [[523.25, 659.25, 783.99, 1046.5], [493.88, 587.33, 783.99, 987.77], [440.0, 523.25, 659.25, 880.0], [440.0, 523.25, 698.46, 880.0]],
          [65.41, 49.0, 55.0, 43.65])
# A minor for the hook (Am, F, Am, E)
DARK = ([[110.0, 130.81, 164.81, 220.0], [87.31, 110.0, 130.81, 174.61], [110.0, 130.81, 164.81, 220.0], [82.41, 103.83, 123.47, 164.81]],
        [[440.0, 523.25, 659.25, 880.0], [349.23, 440.0, 523.25, 698.46], [440.0, 523.25, 659.25, 880.0], [329.63, 415.3, 493.88, 659.25]],
        [55.0, 43.65, 55.0, 41.2])
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


def groove(t0, t1, key, beat=True, plucks=True, pulse=False, pads=True, level=1.0, g0=G0):
    """Eighth notes from the first quarter at or after t0 to t1, on the grid g0 so the sections join in time.
    beat: kick on every quarter and a snap on 2 and 4; else a heartbeat (two kicks a second), or None for no kick.
    pulse: the bass on every eighth (tension) instead of the off-beats."""
    CH, ARP, ROOT = key
    k = math.ceil((t0 - g0) / (BEAT / 2) - 1e-6)
    k0 = k = k + k % 2
    while g0 + k * BEAT / 2 < t1 - 0.02:
        tt, kr = g0 + k * BEAT / 2, k - k0
        bar = (kr // 8) % 4
        if beat is True and kr % 2 == 0:
            music.add(S.kick(), tt, 0.6 * level)
        if beat is True and kr % 4 == 2:
            music.add(S.snap(), tt, 0.16 * level)
        if beat is False and kr % 4 == 0:
            music.add(S.kick(), tt, 0.5 * level)
            music.add(S.kick(), tt + 0.17, 0.3 * level)
        music.add(S.hat(), tt, 0.09 * level)
        music.add(S.hat(), tt + BEAT / 4, 0.045 * level)
        if plucks:
            music.add(S.stereo(pl(ARP[bar][kr % 4]), 0.3 if kr % 2 else -0.3), tt, 0.16 * level)
        if pulse or kr % 2 == 1:
            music.add(bass(ROOT[bar], BEAT * (0.45 if pulse else 0.9)), tt, (0.24 if pulse else 0.3) * level)
        if pads and kr % 8 == 0:
            p0 = t0 if kr == 0 else tt
            n = min(tt + 4 * BEAT, t1) - p0
            if n > 0.3:
                music.add(S.pad(CH[bar], n, 1300), p0, 0.13 * level)
        k += 1


groove(0.0, M["gap1"], DARK, beat=False, plucks=False, pulse=True, level=0.8)          # the hook, a heartbeat pulse
groove(M["gap1"] + 0.9, M["gap2"], DARK, beat=False, plucks=False, pulse=True, level=0.7)   # asleep: the pulse again
music.add(S.riser(M["groove"] - M["how"], 150, 2600), M["how"], 0.16)                        # "So how does it know..."
groove(M["groove"], M["tense"], BRIGHT, level=0.8, g0=GM)                                     # the mechanism
music.add(S.pad([55.0, 110.0, 130.81, 164.81], M["phone"] - M["tense"] + 0.1, 420), M["tense"], 0.09)   # under the tension
music.add(S.pad([55.0, 82.41, 110.0], M["drop"] - M["phone"] + 0.2, 380), M["phone"] + 0.25, 0.08)     # "You've just watched..."
groove(M["drop"], M["end"], BRIGHT, level=0.85, g0=G1)                                  # your ad, held that long
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)

voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = S.master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.135, sfx_gain=0.3, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
