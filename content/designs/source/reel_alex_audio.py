"""Music + sound design for the story reel "Alex spent $2,000 on Meta ads", mixed under the af_heart voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The thumps, the rise under the switch and the ringtone are
synthesized. Music (120 bpm, on a grid that puts a beat on the cut to "He fixed it"): a heartbeat and a pulse in
A minor (Am, F, Dm, E) under the hook, the full beat while he tries everything, nothing on "Still nothing.", the
heartbeat again at the switch, a dark pad when Sara takes the phone, silence on "Nothing.", the heartbeat through
the reveal, then the beat back in C major (C, G, Am, F) when he fixes it, resolving on C under the end card.
Usage: python3 reel_alex_audio.py <vo.wav> <out.wav> <sfx_cache>
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

D = json.loads((Path(__file__).parent / "reel_alex_events.json").read_text())
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


def marimba(f, dur=0.4):
    n = S.n_(dur)
    t = np.arange(n) / S.SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.12) + 0.3 * np.sin(2 * np.pi * f * 3.9 * t) * np.exp(-t / 0.03)) * np.minimum(1, t / 0.002)


def ring():
    """A phone ringing: one quick marimba phrase."""
    x = np.zeros(S.n_(0.9))
    for i, f in enumerate((1318.5, 987.77, 1318.5, 987.77, 1318.5, 1567.98)):
        m, s = marimba(f), S.n_(0.075 * i)
        x[s:s + len(m)] += m[:len(x) - s]
    return S.reverb(S.stereo(x * 0.5), 0.5, 0.25)


music, sfx = S.Track(END), S.Track(END)
for e in EV:
    k, t, g, p = e["k"], e["t"], e.get("g", 1.0), e.get("pan", 0.0)
    if k == "thump":
        sfx.add(S.sub_hit(85, 36, 0.9, 0.5), t, g)
        continue
    if k == "riser":                                   # his thumb over the switch
        sfx.add(S.riser(e["d"], 400, 4500), t, g)
        continue
    if k == "ring":
        sfx.add(ring(), t, g)
        continue
    i, align = SFX[k]
    x = load(i)
    on, pk = marks(x)
    sfx.add(pan(x, p), t - (on if align == "onset" else pk), g)

# ---------- music ----------
BEAT = 60 / 120
G0 = M["back"] % BEAT                                  # a beat on the cut to "He fixed it"
# A minor (Am, F, Dm, E) for the trouble, C major (C, G, Am, F) once it's fixed: pad chords, arpeggio, bass roots
TENSE = ([[110.0, 130.81, 164.81, 220.0, 261.63], [87.31, 110.0, 130.81, 174.61, 220.0], [73.42, 146.83, 174.61, 220.0, 293.66], [82.41, 103.83, 123.47, 164.81, 207.65]],
         [[440.0, 523.25, 659.25, 880.0], [440.0, 523.25, 698.46, 880.0], [440.0, 587.33, 698.46, 880.0], [415.3, 493.88, 659.25, 830.61]],
         [55.0, 43.65, 36.71, 41.2])
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


def groove(t0, t1, key, beat=True, plucks=True, pulse=False, pads=True, level=1.0):
    """Eighth notes from the first quarter at or after t0 to t1, on the global grid so the sections join in time.
    beat: kick on every quarter and a snap on 2 and 4; else a heartbeat (two kicks a second), or None for no kick.
    pulse: the bass on every eighth (tension) instead of the off-beats."""
    CH, ARP, ROOT = key
    k = math.ceil((t0 - G0) / (BEAT / 2) - 1e-6)
    k0 = k = k + k % 2
    while G0 + k * BEAT / 2 < t1 - 0.02:
        tt, kr = G0 + k * BEAT / 2, k - k0
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


groove(0.0, M["full"], TENSE, beat=False, plucks=False, pulse=True, level=0.9)          # the hook: a heartbeat and a pulse
groove(M["full"], M["still"], TENSE, level=0.95)                                       # everything he tried
music.add(S.pad(TENSE[0][0], M["sw"] - M["still"] + 0.3, 700), M["still"], 0.15)       # "Still nothing.": the beat stops
groove(M["sw"], M["drop"], TENSE, beat=False, plucks=False, pulse=True, level=0.9)     # his thumb over the switch
music.add(S.pad([73.42, 110.0, 146.83, 174.61, 220.0], M["hush"] - M["drop"] + 0.2, 650), M["drop"], 0.16)   # Sara takes the phone
groove(M["drop"], M["hush"], TENSE, beat=None, plucks=False, pulse=True, pads=False, level=0.55)
groove(M["after"], M["back"], TENSE, beat=False, plucks=False, pulse=True, level=0.85)   # after "Nothing.": the reveal, two months
groove(M["back"], M["end"], BRIGHT, level=0.8)                                         # fixed: the beat comes back, in C
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)

voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = S.master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.135, sfx_gain=0.3, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
