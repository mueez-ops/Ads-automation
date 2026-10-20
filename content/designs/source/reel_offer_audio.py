"""Music + sound design for the reel "Bad offer, not bad ads", mixed under the af_heart voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The marker scribbles, glitch and low thumps are synthesized.
Music: a 124 bpm groove with a sub bass, softer under the alarm, tense under the targeting, stopped dead for
"BAD OFFER != MORE AD SPEND", light under the question and resolved on the logo.
Usage: python3 reel_offer_audio.py <vo.wav> <out.wav> <sfx_cache>
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_offer_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset, its loudest point, or its end)
SFX = {
    "deep": (1143, "peak"), "zoom_out": (1492, "peak"), "zoom": (2608, "peak"), "sting": (2903, "peak"),
    "whoosh_a": (1468, "peak"), "whoosh_b": (164, "peak"), "whoosh_c": (168, "peak"), "whoosh_d": (1490, "peak"),
    "whoosh_e": (1469, "peak"), "whoosh_f": (1471, "peak"), "whoosh_soft": (1489, "peak"), "rise": (1469, "peak"),
    "swish": (3115, "peak"), "slide": (175, "peak"), "arrow": (1491, "peak"), "hit": (2180, "peak"),
    "pop": (3005, "onset"), "tick": (2568, "onset"), "check": (1120, "onset"), "ping": (221, "onset"),
    "lock": (2585, "onset"), "tap": (2585, "onset"), "chime": (1107, "onset"), "select": (1109, "onset"),
    "click": (2577, "onset"), "lock_on": (3124, "onset"), "error": (1110, "onset"), "negative": (2569, "onset"),
    "sparkle": (2350, "onset"), "keys": (1397, "keys"),
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


def envelope(x):
    return np.convolve(np.abs(x).max(axis=1), np.ones(441) / 441, mode="same")


def marks(x):
    """Onset, loudest point and end of a sound, in seconds."""
    e = envelope(x)
    on = np.flatnonzero(e > e.max() * 0.1)
    return on[0] / S.SR, np.argmax(e) / S.SR, on[-1] / S.SR


def pan(x, p):
    if not p:
        return x
    a = (p + 1) * np.pi / 4
    return x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)


def scribble(dur):
    """A marker on paper: band-passed noise with a stroke rhythm."""
    n = S.n_(dur)
    tt = np.arange(n) / S.SR
    rng = np.random.default_rng(int(dur * 1000))
    x = S.bp(rng.standard_normal(n), 2200, 7500) * (0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 11 * tt))) * np.sin(np.linspace(0, np.pi, n)) ** 0.6
    return S.stereo(x * 0.5, 0.15)


music, sfx = S.Track(END), S.Track(END)
keys_cache = None
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k == "thump":
        sfx.add(S.sub_hit(85, 36, 0.9, 0.5), t, g)
        continue
    if k == "scribble":
        sfx.add(scribble(e.get("len", 0.3)), t, g)
        continue
    if k == "glitch":
        sfx.add(S.glitch(0.24), t, g)
        continue
    i, align = SFX[k]
    x = load(i)
    if align == "keys":                                  # single keystrokes cut from the recording, one per typed pair
        if keys_cache is None:
            env = envelope(x)
            hits = [j for j in range(1, len(env) - 1) if env[j] > env.max() * 0.35 and env[j] >= env[j - 1] and env[j] >= env[j + 1]]
            keys_cache, last = [], -S.SR
            for j in hits:
                if j - last > 0.04 * S.SR:
                    keys_cache.append(x[max(0, j - 200) : j + int(0.05 * S.SR)])
                    last = j
        rng = np.random.default_rng(int(t * 100))
        for n in range(int(e.get("len", 0.5) / 0.045)):
            sfx.add(pan(keys_cache[n % len(keys_cache)], rng.uniform(-0.2, 0.2)), t + n * 0.045, g * rng.uniform(0.75, 1.0))
        continue
    on, pk, off = marks(x)
    sfx.add(pan(x, p), t - {"onset": on, "peak": pk, "end": off}[align], g)

# ---------- music: A minor, 124 bpm, with a sub bass ----------
BEAT = 60 / 124
CH = [[110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 110.0, 130.81, 164.81], [130.81, 164.81, 196.0, 246.94], [98.0, 123.47, 146.83, 164.81]]
ARP = [[440.0, 523.3, 659.3, 784.0], [349.2, 440.0, 523.3, 659.3], [523.3, 659.3, 784.0, 987.8], [392.0, 493.9, 587.3, 659.3]]
ROOT = [55.0, 43.65, 65.41, 49.0]
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.4, 0.32)
    return PL[f]


def bass(f, dur):
    n = S.n_(dur)
    tt = np.arange(n) / S.SR
    x = np.tanh(1.6 * (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt))) * np.minimum(1, tt / 0.01) * np.exp(-tt / (dur * 0.6))
    return S.stereo(x * 0.6)


def groove(t0, t1, kick=True, plucks=True, hats=True, sub=True, level=1.0, bar0=0):
    k = 0
    while t0 + k * BEAT / 2 < t1 - 0.02:
        tt = t0 + k * BEAT / 2
        bar = (bar0 + k // 8) % 4
        if kick and k % 2 == 0:
            music.add(S.kick(), tt, 0.6 * level)
        if kick and k % 4 == 2:
            music.add(S.snap(), tt, 0.16 * level)
        if hats:
            music.add(S.hat(), tt, 0.09 * level)
            music.add(S.hat(), tt + BEAT / 4, 0.045 * level)
        if plucks:
            music.add(S.stereo(pl(ARP[bar][k % 4]), 0.3 if k % 2 else -0.3), tt, 0.17 * level)
        if sub and k % 2 == 1:
            music.add(bass(ROOT[bar], BEAT * 0.9), tt, 0.3 * level)
        if k % 8 == 0:
            n = min(4 * BEAT, t1 - tt)
            if n > 0.3:
                music.add(S.pad(CH[bar], n, 1300), tt, 0.14 * level)
        k += 1


groove(0, M["soft"], level=0.9)
groove(M["soft"], M["back"], kick=False, sub=False, level=0.75, bar0=1)               # softer under the alarm
groove(M["back"], M["tension"], level=1.0, bar0=2)
groove(M["tension"], M["stop"], plucks=False, hats=True, level=0.9, bar0=3)            # tight under the targeting
music.add(S.pad(CH[0], M["resolve"] - M["stop"] + 0.2, 600), M["stop"], 0.2)          # stopped dead for the formula
groove(M["resolve"], M["end"], kick=False, level=0.75, bar0=1)                         # light under the question
music.add(S.pad([110.0, 130.81, 164.81, 220.0, 261.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)

voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = S.master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.135, sfx_gain=0.36, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
