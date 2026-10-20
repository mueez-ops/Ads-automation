"""Music + sound design for the reel "Nobody notices it", mixed under the af_heart voiceover.

Sound effects are recorded ones from the Mixkit free library (Mixkit Sound Effects Free License: allowed in
social media and commercial videos, but not to be redistributed on their own), so they are not kept in the
repo: each is downloaded by id into <sfx_cache> the first time. Music is the synthesized groove from sfx_pro:
minor and minimal, it drops out under "nobody notices it", drives under "scroll past you", holds its breath
over the three "better"s, lands on "creatives", cuts dead on "attention" and resolves on the logo.
Usage: python3 reel_notice_audio.py <vo.wav> <out.wav> <sfx_cache>
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_notice_events.json").read_text())
C, EV, M = D["cues"], D["events"], D["music"]
END = C["end"]
CACHE = Path(sys.argv[3])
CACHE.mkdir(parents=True, exist_ok=True)

# kind: (mixkit id, how the event time lines up with the sound: its onset, its loudest point, or its end)
SFX = {
    "deep": (1143, "peak"), "air": (1489, "peak"), "zoom": (2608, "peak"), "sting": (2903, "peak"),
    "whoosh_a": (1468, "peak"), "whoosh_b": (164, "peak"), "whoosh_c": (168, "peak"), "whoosh_d": (1490, "peak"),
    "whoosh_e": (1469, "peak"), "whoosh_f": (1471, "peak"), "swish": (3115, "peak"), "slide": (175, "peak"),
    "shutter_a": (1434, "onset"), "shutter_b": (1440, "onset"), "shutter_c": (1432, "peak"), "shutter_d": (1133, "peak"),
    "click_a": (2577, "onset"), "click_b": (1117, "peak"), "tap": (2585, "onset"), "check": (1120, "onset"),
    "select": (1109, "onset"), "sparkle": (2350, "onset"), "drum": (563, "onset"),
    "riser": (790, "end"), "focus": (1436, "end"), "type": (1397, "keys"),
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


music, sfx = S.Track(END), S.Track(END)


def pan(x, p):
    if not p:
        return x
    a = (p + 1) * np.pi / 4
    return x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)


def place(kind, t, g=1.0, p=0.0, **o):
    i, align = SFX[kind]
    x = load(i)
    if kind == "focus":                                  # the second motor whirr of the autofocus, ending on the shutter
        x = x[int(0.6 * S.SR) : int(0.98 * S.SR)]
    on, pk, off = marks(x)
    if align == "keys":                                  # single keystrokes cut from the recording, one per typed pair
        e = envelope(x)
        hits = [j for j in range(1, len(e) - 1) if e[j] > e.max() * 0.35 and e[j] >= e[j - 1] and e[j] >= e[j + 1]]
        keys, last = [], -S.SR
        for j in hits:
            if j - last > 0.04 * S.SR:
                keys.append(x[max(0, j - 200) : j + int(0.05 * S.SR)])
                last = j
        n = int(o.get("len", 0.5) / 0.045)
        rng = np.random.default_rng(4)
        for k in range(n):
            sfx.add(pan(keys[k % len(keys)], rng.uniform(-0.2, 0.2)), t + k * 0.045, g * rng.uniform(0.75, 1.0))
        return
    start = t - {"onset": on, "peak": pk, "end": off}[align]
    sfx.add(pan(x, p), start, g)


for e in EV:
    place(e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0), len=e.get("len", 0.5))
for t in M["betters"]:
    sfx.add(S.sub_hit(80, 36, 0.9, 0.5), t, 0.55)        # the same low thump under each "better"

# ---------- music: A minor, 120 bpm ----------
BEAT = 0.5
CH = [[110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 110.0, 130.81, 164.81], [130.81, 164.81, 196.0, 246.94], [98.0, 123.47, 146.83, 164.81]]
ARP = [[440.0, 523.3, 659.3, 784.0], [349.2, 440.0, 523.3, 659.3], [523.3, 659.3, 784.0, 987.8], [392.0, 493.9, 587.3, 659.3]]
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.45, 0.3)
    return PL[f]


def groove(t0, t1, kick=True, plucks=True, hats=True, level=1.0, bar0=0):
    k = 0
    while t0 + k * BEAT / 2 < t1 - 0.02:
        tt = t0 + k * BEAT / 2
        bar = (bar0 + k // 8) % 4
        if kick and k % 2 == 0:
            music.add(S.kick(), tt, 0.55 * level)
        if kick and k % 4 == 2:
            music.add(S.snap(), tt, 0.14 * level)
        if hats:
            music.add(S.hat(), tt, 0.09 * level)
            music.add(S.hat(), tt + BEAT / 4, 0.045 * level)
        if plucks:
            music.add(S.stereo(pl(ARP[bar][k % 4]), 0.3 if k % 2 else -0.3), tt, 0.18 * level)
        if k % 8 == 0:
            n = min(4 * BEAT, t1 - tt)
            if n > 0.3:
                music.add(S.pad(CH[bar], n, 1300), tt, 0.15 * level)
        k += 1


groove(0, M["nobody"], level=0.85)
music.add(S.pad(CH[0], M["best"] - M["nobody"] + 0.3, 500), M["nobody"], 0.2)       # space under "nobody notices it"
groove(M["best"], M["scroll"], level=0.9, bar0=1)
groove(M["scroll"], M["better"], plucks=False, level=0.85)                              # drive under "scroll past you"
music.add(S.pad(CH[3], M["drop"] - M["better"] + 0.2, 700), M["better"], 0.18)         # hold the breath over "better..."
groove(M["drop"], M["attention"] - 0.05, level=1.0, bar0=2)                           # land on "creatives"
groove(M["cta"], M["end"], kick=False, level=0.75, bar0=1)                             # light under the call to action
music.add(S.pad([110.0, 130.81, 164.81, 220.0, 261.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)   # resolve on the logo

voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = S.master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.15, sfx_gain=0.42, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
