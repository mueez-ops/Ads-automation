"""Music + sound design for the premium reel, mixed under the af_heart voiceover.

Music: warm minimal electronic at 120 bpm (rounded kick, muted plucks, airy pad, light shaker).
It drops to a filtered pad from "nobody buys" through the prompt, slams back on the flash, breathes after
"targeting", and resolves on the logo. Every cut and UI action has its own sound (reel_premium_events.json).
Usage: python3 reel_premium_audio.py <vo.wav> <out.wav>
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

import sfx_pro as S

D = json.loads((Path(__file__).parent / "reel_premium_events.json").read_text())
C, EV, SH = D["cues"], D["events"], {s["key"]: s for s in D["shots"]}
L, A = C["lines"], C["at"]
END, FLASH = C["end"], D["flashAt"]
music, sfx = S.Track(END), S.Track(END)
BEAT = 0.5
rng = np.random.default_rng(3)

# chords (Fmaj7, Am7, Dm7, G6) and their pluck arpeggios
CH = [[87.31, 130.81, 164.81, 220.0], [110.0, 130.81, 164.81, 196.0], [73.42, 110.0, 130.81, 174.61], [98.0, 123.47, 146.83, 164.81]]
ARP = [[349.2, 440.0, 523.3, 659.3], [440.0, 523.3, 659.3, 784.0], [293.7, 349.2, 440.0, 523.3], [392.0, 493.9, 587.3, 659.3]]
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.5, 0.35)
    return PL[f]


def groove(t0, t1, kick=True, plucks=True, shaker=True, level=1.0, bar0=0):
    k = 0
    while t0 + k * BEAT / 2 < t1 - 0.01:
        tt = t0 + k * BEAT / 2
        bar = (bar0 + k // 8) % 4
        if kick and k % 2 == 0:
            music.add(S.kick(), tt, 0.55 * level)
        if kick and k % 4 == 2:
            music.add(S.snap(), tt, 0.16 * level)
        if shaker:
            music.add(S.hat(), tt, 0.10 * level)
            music.add(S.hat(), tt + BEAT / 4, 0.05 * level)
        if plucks:
            music.add(S.stereo(pl(ARP[bar][k % 4]), 0.3 if k % 2 else -0.3), tt, 0.20 * level)
        if k % 8 == 0:
            n = min(4 * BEAT, t1 - tt)
            if n > 0.3:
                music.add(S.pad(CH[bar], n, 1400), tt, 0.16 * level)
        k += 1


nobody = A["still:nobody"]
groove(0, nobody, level=0.9)
music.add(S.pad(CH[1], FLASH - nobody + 0.3, 600), nobody, 0.18)          # near-silence: filtered pad only
groove(FLASH, A["thesis:targeting"], level=1.0)
groove(A["thesis:targeting"] + 0.15, SH["end"]["s"], level=0.95, bar0=2)  # 150 ms of air after "targeting"
music.add(S.pad([87.31, 130.81, 174.61, 220.0, 261.63], 3.0, 2000), SH["end"]["s"], 0.25)   # resolve on the logo

for e in EV:
    t, k, i = e["t"], e["k"], e.get("i", 0)
    if k == "whip":
        sfx.add(S.whoosh(0.38, 400, 6000, -0.8, 0.8), t - 0.12, 0.75)
    elif k == "swish":
        sfx.add(S.swish(0.2), t - 0.05, 0.6)
    elif k == "sweep":
        sfx.add(S.whoosh(0.55, 700, 9000, -0.6, 0.6, air=1.5), t - 0.2, 0.6)
    elif k == "punch":
        sfx.add(S.kick(), t, 0.45); sfx.add(S.swish(0.12), t - 0.03, 0.35)
    elif k == "rack":
        sfx.add(S.whoosh(0.32, 3000, 700, 0.3, -0.3), t, 0.45)
    elif k == "cut":
        sfx.add(S.tick(2600, 0.04), t, 0.35)
    elif k == "sub":
        sfx.add(S.sub_hit(), t, 0.9)
    elif k == "tick":
        sfx.add(S.tick(3600, 0.05, 0.2), t, 0.45)
    elif k == "slice":
        sfx.add(S.whoosh(0.22, 2500, 11000, -0.5, 0.5), t - 0.04, 0.7); sfx.add(S.tick(5200, 0.12), t + 0.12, 0.45)
        sfx.add(S.reverse_swell(0.6), t + 0.35, 0.35)
    elif k == "check":
        sfx.add(S.tick(2300 * 2 ** (i / 12), 0.06), t + 0.12, 0.6); sfx.add(S.key_click(), t + 0.12, 0.5); sfx.add(S.swish(0.12), t - 0.04, 0.3)
    elif k == "rustle":
        n = S.n_(0.7); x = S.bp(rng.standard_normal(n), 1500, 7000) * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * (0.6 + 0.4 * np.abs(np.sin(np.arange(n) / S.SR * 60)))
        sfx.add(S.stereo(x * 0.35, np.linspace(-0.3, 0.3, n)), t, 0.6)
    elif k == "scroll":
        dur = e.get("dur", 0.6); n = S.n_(dur); tt = np.arange(n) / S.SR
        x = S.bp(rng.standard_normal(n), 900, 5000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (25 + 30 * tt / dur) * tt))) * np.minimum(1, tt / 0.05)
        sfx.add(S.stereo(x * 0.3), t, 0.6)
    elif k == "stop":
        sfx.add(S.tick(1800, 0.06), t, 0.6); sfx.add(S.kick(), t, 0.25)
    elif k == "thud":
        sfx.add(S.sub_hit(70, 38, 0.6, 0.2), t, 0.5)
    elif k == "key":
        sfx.add(S.key_click(rng.random() * 0.4 - 0.2), t, 0.55)
    elif k == "click":
        sfx.add(S.mouse_click(), t, 0.8)
    elif k == "riser_short":
        sfx.add(S.riser(0.62, 400, 9000), t, 0.85)
    elif k == "shimmer":
        sfx.add(S.chime(1760, 1.4), t, 0.4); sfx.add(S.whoosh(0.4, 3000, 12000, 0, 0, air=2), t - 0.05, 0.4)
    elif k == "scan":
        n = S.n_(1.0); tt = np.arange(n) / S.SR
        x = (np.sin(2 * np.pi * 140 * tt) + 0.5 * np.sin(2 * np.pi * 281 * tt)) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.linspace(0, np.pi, n))
        sfx.add(S.stereo(x * 0.25, np.linspace(-0.2, 0.2, n)), t, 0.22)   # sits under 'Meta and TikTok': keep it low
    elif k == "blip":
        sfx.add(S.ui_pop(600 * 2 ** (i * 4 / 12), 1500 * 2 ** (i * 4 / 12)), t, 0.5)
    elif k == "pluck":
        sfx.add(S.stereo(S.pluck([523.3, 587.3, 659.3, 784.0, 880.0, 1046.5][i % 6], 0.7, 0.6), -0.4 + 0.16 * i), t, 0.35)
    elif k == "pop":
        sfx.add(S.ui_pop(500 + i * 150, 1300 + i * 200), t, 0.55)
    elif k == "swell":
        sfx.add(S.reverse_swell(0.55), t, 0.6)
    elif k == "ripple":
        sfx.add(S.tick(2600 * 2 ** (-i / 12), 0.04, -0.5 + i * 0.14), t, 0.4)
    elif k == "flyby":
        sfx.add(S.whoosh(0.3, 500, 7000, -0.9 if i % 2 else 0.9, 0.9 if i % 2 else -0.9), t, 0.45)
    elif k == "scribble":
        n = S.n_(0.32); tt = np.arange(n) / S.SR
        x = S.bp(rng.standard_normal(n), 2500, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 14 * tt))) * np.sin(np.linspace(0, np.pi, n))
        sfx.add(S.stereo(x * 0.35, 0.2), t, 0.6)
    elif k == "send":
        sfx.add(S.whoosh(0.28, 900, 7000, -0.2, 0.6), t, 0.55)
    elif k == "whoosh_soft":
        sfx.add(S.whoosh(0.45, 300, 3000, -0.4, 0.4), t - 0.1, 0.35)
    elif k == "riser":
        sfx.add(S.riser(0.9), t, 0.4)
    elif k == "chime":
        sfx.add(S.chime(1318.5, 2.2), t, 0.45)

voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = S.master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.14, sfx_gain=0.26, voice_gain=1.0)
fade = S.n_(0.5); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
