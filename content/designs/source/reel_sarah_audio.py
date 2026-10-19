"""Music + sound design for the Sarah reel, mixed under Mueez's own cleaned voiceover.

Act 1 (the logo ad): low, tense pulse. "Gone" drops it out; "Meta was watching" is a cold drone.
The rewind tape-spins back; act 2 (the problem ad) is warmer and lifts into the final three hits.

Usage: python3 reel_sarah_audio.py <voice.wav> <out.wav>
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

from sfx_kit import SR, add, chord, hp, impact, lp, mix_voice, noise, osc, pad, plus, riser, sweep, thump, whoosh, env

D = json.loads((Path(__file__).parent / "reel_sarah_events.json").read_text())
C, EV = D["cues"], D["events"]
L, H = C["lines"], C["hits"]
N = int(SR * C["end"])
music, sfx = np.zeros(N), np.zeros(N)
BEAT = 60 / 100


def pulse(t0, t1, notes, level=1.0, kick=True):
    k = 0
    while t0 + k * BEAT / 2 < t1:
        tt = t0 + k * BEAT / 2
        f = notes[k % len(notes)]
        add(music, lp(osc(f, 0.28, "saw"), 22) * env(int(SR * 0.28), 0.004, 0.11), tt, 0.22 * level)
        if kick and k % 2 == 0:
            add(music, thump(100, 42, 0.3, 0.1), tt, 0.5 * level)
        add(music, hp(noise(0.03, 0.007), 2), tt + BEAT / 4, 0.04 * level)
        k += 1


# act 1: tense pulse in D minor, until "Gone"
pulse(0, H["gone"], [73.4, 73.4, 87.3, 73.4, 65.4, 65.4, 77.8, 73.4], 0.9)
add(music, pad([73.4, 110.0, 146.8, 174.6], H["gone"]), 0, 0.05)
# cold drone under "the part nobody tells you" / Meta watching / skips / dislike
add(music, pad([55.0, 82.4, 110.0, 155.6], L["rewind"]["s"] - H["gone"]), H["gone"] + 0.2, 0.07)
pulse(L["skip"]["s"], L["rewind"]["s"], [55.0, 55.0, 58.3, 55.0], 0.6, kick=True)
# act 2: warmer, after the rewind
add(music, pad([98.0, 146.8, 196.0, 246.9], C["voice_end"] - L["same"]["s"] + 0.5), L["same"]["s"], 0.06)
pulse(L["problem"]["s"], C["voice_end"], [98.0, 98.0, 123.5, 98.0, 110.0, 110.0, 146.8, 123.5], 0.8)
add(music, riser(L["final"]["s"] - L["notices"]["s"]), L["notices"]["s"], 0.25)
add(music, chord([98.0, 146.8, 196.0, 246.9, 293.7], 3.0, 1.2, "saw", 30), C["voice_end"] + 0.15, 0.4)

for e in EV:
    t, k = e["t"], e["k"]
    if k == "tick":
        for i in range(8):
            add(sfx, osc(3000, 0.02) * env(int(SR * 0.02), 0.0005, 0.004), t + i * 0.25, 0.25)
    elif k == "whoosh":
        add(sfx, whoosh(0.45, 1.3), t - 0.1, 0.7)
    elif k == "land":
        add(sfx, thump(160, 60, 0.25, 0.06), t, 0.5)
    elif k == "pop":
        add(sfx, sweep(400, 1400, 0.08) * env(int(SR * 0.08), 0.002, 0.03), t, 0.4)
    elif k in ("slam", "hit"):
        add(sfx, impact(), t, 0.7 if k == "hit" else 0.5)
    elif k == "stamp":
        add(sfx, plus(thump(120, 50, 0.3, 0.06), hp(noise(0.06, 0.015), 3) * 0.6), t, 0.9)
    elif k == "drawer":
        add(sfx, plus(lp(noise(0.35, 0.12), 6), thump(90, 40, 0.3, 0.08)), t, 0.7)
    elif k == "eye":
        add(sfx, sweep(60, 180, 1.2, 1.0) * env(int(SR * 1.2), 0.3, 0.6), t, 0.35)
    elif k == "blip":
        add(sfx, osc(880, 0.09, "sq") * env(int(SR * 0.09), 0.001, 0.03) * 0.4, t, 0.45)
        add(sfx, osc(587, 0.09, "sq") * env(int(SR * 0.09), 0.001, 0.03) * 0.4, t + 0.07, 0.45)
    elif k == "fall":
        add(sfx, sweep(900, 120, 1.1, 0.7) * env(int(SR * 1.1), 0.01, 0.6), t, 0.3)
    elif k == "rewind":
        n = int(SR * 0.95)
        add(sfx, (sweep(2500, 300, 0.95, 0.5)[:n] * 0.3 + hp(np.random.default_rng(3).standard_normal(n), 5) * 0.35) * np.sin(np.linspace(0, np.pi, n)), t, 0.6)
    elif k == "stop":
        add(sfx, plus(thump(200, 50, 0.4, 0.1), osc(2600, 0.12) * env(int(SR * 0.12), 0.0005, 0.03) * 0.3), t, 0.9)
    elif k == "tap":
        add(sfx, plus(hp(noise(0.015, 0.003), 2), osc(2400, 0.04) * env(int(SR * 0.04), 0.0005, 0.01) * 0.4), t, 0.7)
        add(sfx, (osc(1318.5, 0.6) + 0.4 * osc(2637, 0.6)) * env(int(SR * 0.6), 0.002, 0.18), t + 0.15, 0.2)
    elif k == "rise":
        for i, f in enumerate([523.3, 659.3, 784.0, 1046.5]):
            add(sfx, osc(f, 0.35) * env(int(SR * 0.35), 0.002, 0.1), t + i * 0.18, 0.18)
    elif k == "glitch":
        for j in range(4):
            add(sfx, osc(400 + j * 700, 0.025, "sq") * 0.4, t + j * 0.03, 0.12)
    elif k == "boom":
        add(sfx, impact(1.3), t, 1.0)


def read(p):
    with wave.open(str(p)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        assert w.getframerate() == SR
    return x


voice = read(sys.argv[1])[:N]
voice = np.pad(voice, (0, N - len(voice)))
mix = mix_voice(music, sfx, voice)
pcm = (np.stack([mix, mix], axis=1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", sys.argv[2])
