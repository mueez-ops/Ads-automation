"""Music + sound design for "Over 25? You can't hear what this box is playing.", mixed under the voiceover.

The box's real tone (about 17 kHz) is never played: it is shown as pink shells, and heard as a soft electric throb on
every pulse, so the reel is the same for every viewer and nobody is played a whine.
Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media and
commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is downloaded by id
into <sfx_cache> the first time. The rest is synthesized here: a night street, the throb of the box, a teenager's
gasp and groan, a broom on paving, running steps, a bell on "That's the point", a zap on "shrieks", the counter ticking
to 17,000, a glassy shimmer in the ear, the hair cells wilting, the hush on "Most adults hear nothing", a tap on the
phone, a short ringtone, a phone buzzing on a desk, chalk on a board, a classroom, a crowd, a ding for each buyer.
Music (120 bpm, A minor): a low drone under the hook; the groove from "It's the Mosquito"; a hush under "Most adults
hear nothing"; a lift on the ringtone; lighter under the feed, and back for the pitch.
Usage: python3 reel_mosq_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
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

D = json.loads((Path(__file__).parent / "reel_mosq_events.json").read_text())
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
RNG = np.random.default_rng(17)


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
    xs = [x if x.ndim == 2 else S.stereo(x) for x in xs]
    out = np.zeros((max(len(x) for x in xs), 2))
    for x in xs:
        out[: len(x)] += x
    return out


def ring(parts, dur, n=None):
    """A struck metal or glass: (frequency, amplitude, decay seconds) partials."""
    n = n or S.n_(dur)
    tt = np.arange(n) / S.SR
    return sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)


def fade_io(x, d, a=0.3, b=0.4):
    tt = np.arange(len(x)) / S.SR
    return x * np.clip(tt / a, 0, 1) * np.clip((d - tt) / b, 0, 1)


# ---------- the world ----------
def street(d):                                          # a night street: low traffic hum, a far car, a little wind
    n = S.n_(d + 0.5)
    tt = np.arange(n) / S.SR
    hum = S.lp(RNG.standard_normal(n), 260) * 1.4 + S.bp(RNG.standard_normal(n), 300, 900) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * tt))
    car = S.sweep_filter(RNG.standard_normal(n), 300, 1400, 1.0) * np.exp(-((tt - 1.6) / 0.9) ** 2) * 0.6
    x = fade_io(hum + car, d + 0.5, 0.2, 0.5)
    return S.stereo(x * 0.5, 0.25 * np.sin(2 * np.pi * 0.05 * tt))


def room(d):                                            # a classroom: room tone and a few soft murmurs
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    tone = S.bp(RNG.standard_normal(n), 120, 500) * 0.6
    mur = S.bp(RNG.standard_normal(n), 250, 1100) * (0.35 + 0.35 * np.clip(np.sin(2 * np.pi * 0.9 * tt) * np.sin(2 * np.pi * 0.37 * tt + 1), 0, 1))
    return S.stereo(fade_io(tone + mur, d + 0.4, 0.15, 0.3) * 0.4)


def throb():                                            # one pulse of the box: a soft electric wub (never the real whine)
    n = S.n_(0.42)
    tt = np.arange(n) / S.SR
    f = 95 + 70 * np.exp(-tt / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.exp(-tt / 0.13)
    buzz = S.bp(np.sign(np.sin(2 * np.pi * 190 * tt)) * 0.5 + RNG.standard_normal(n) * 0.2, 400, 1800) * np.exp(-tt / 0.06) * 0.22
    return S.reverb(S.stereo((body + buzz) * np.minimum(1, tt / 0.004) * 0.8), 0.45, 0.22)


def gasp():                                             # a teenager catching the sound
    n = S.n_(0.35)
    tt = np.arange(n) / S.SR
    return S.stereo(S.bp(RNG.standard_normal(n), 900, 4200) * np.sin(np.pi * np.clip(tt / 0.35, 0, 1)) ** 2 * 0.5)


def groan():                                            # "ugh": a short breathy groan, low
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    saw = 2 * ((np.cumsum(150 - 40 * tt / 0.45) / S.SR) % 1) - 1
    voc = S.bp(saw, 400, 900) * 0.5 + S.bp(RNG.standard_normal(n), 500, 1400) * 0.25
    return S.stereo(voc * np.sin(np.pi * np.clip(tt / 0.45, 0, 1)) * 0.5)


def sweep(d):                                           # a broom on paving: slow strokes
    n = S.n_(d + 0.3)
    x = np.zeros(n)
    for t0 in np.arange(0.05, d, 0.75):
        k = S.n_(t0); m = S.n_(0.38); tt = np.arange(m) / S.SR
        st = S.bp(RNG.standard_normal(m), 1800, 6500) * np.sin(np.pi * np.clip(tt / 0.38, 0, 1)) ** 1.5 * 0.6
        x[k:k + m] += st[: n - k]
    return S.stereo(x, 0.3)


def steps(d):                                           # trainers running off
    n = S.n_(d + 0.2)
    x = np.zeros(n)
    for i, t0 in enumerate(np.arange(0, d, 0.16)):
        k = S.n_(t0 + 0.02 * RNG.random()); m = S.n_(0.06); tt = np.arange(m) / S.SR
        x[k:k + m] += (S.bp(RNG.standard_normal(m), 400, 2500) * np.exp(-tt / 0.012) * (1 - 0.7 * t0 / max(d, 0.1)))[: n - k]
    return S.stereo(x * 0.7, np.linspace(0, -0.6, n))


def ding():                                             # "That's the point"
    return S.reverb(S.stereo(ring([(1046.5, 0.4, 0.5), (2093, 0.2, 0.3), (3136, 0.1, 0.2)], 1.0)), 0.5, 0.25)


def zap():                                              # "shrieks": an electric zap, kept short and band-limited
    n = S.n_(0.3)
    tt = np.arange(n) / S.SR
    f = 1400 - 800 * tt / 0.3
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / S.SR)) * 0.4 + RNG.standard_normal(n) * 0.3
    return S.stereo(S.bp(x, 800, 4500) * np.exp(-tt / 0.08) * np.minimum(1, tt / 0.002) * 0.6)


def tick():                                             # the counter
    return S.stereo(ring([(3200, 0.4, 0.012), (6400, 0.15, 0.008)], 0.05))


def shimmer():                                          # inside the ear: glassy
    parts = [(1760, 0.2, 0.5), (2217, 0.15, 0.45), (2637, 0.12, 0.4), (3520, 0.08, 0.3)]
    return S.reverb(S.stereo(ring(parts, 1.2) * 0.6), 0.6, 0.35)


def wilt():                                             # the hair cells wearing out: a soft fall
    n = S.n_(0.9)
    tt = np.arange(n) / S.SR
    f = 900 * np.exp(-tt / 0.35) + 180
    x = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.exp(-tt / 0.4) * np.minimum(1, tt / 0.01)
    return S.reverb(S.stereo(x * 0.35), 0.5, 0.25)


def hush():                                             # "Most adults hear nothing": air that closes off
    n = S.n_(0.8)
    tt = np.arange(n) / S.SR
    return S.stereo(S.sweep_filter(RNG.standard_normal(n), 3000, 400, 1.0) * np.exp(-tt / 0.25) * np.minimum(1, tt / 0.02) * 0.45)


def tap():                                              # a thumb on glass
    n = S.n_(0.08)
    tt = np.arange(n) / S.SR
    return S.stereo((S.bp(RNG.standard_normal(n), 2000, 7000) * np.exp(-tt / 0.004) + np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.01) * 0.3) * 0.6)


def ringtone():                                         # a short, bright ringtone (three marimba notes)
    n = S.n_(1.0)
    x = np.zeros(n)
    for t0, f in ((0, 1318.5), (0.12, 1567.98), (0.24, 2093.0)):
        k = S.n_(t0); m = n - k
        x[k:] += ring([(f, 0.5, 0.18), (f * 2.01, 0.12, 0.08)], 1.0, m)
    return S.reverb(S.stereo(x * 0.5), 0.4, 0.2)


def buzzphone(d):                                       # a phone vibrating on a desk
    n = S.n_(d + 0.1)
    tt = np.arange(n) / S.SR
    gate = ((tt % 0.45) < 0.3).astype(float)
    x = (np.sin(2 * np.pi * 160 * tt) * 0.6 + S.bp(RNG.standard_normal(n), 150, 600) * 0.5) * gate
    return S.stereo(S.lp(x, 1200) * 0.6 * np.clip((d + 0.1 - tt) / 0.1, 0, 1))


def chalk(d):                                           # chalk on the board
    n = S.n_(d + 0.2)
    x = np.zeros(n)
    t0 = 0.0
    while t0 < d:
        k = S.n_(t0); m = S.n_(0.08 + 0.12 * RNG.random()); tt = np.arange(m) / S.SR
        x[k:k + m] += (S.bp(RNG.standard_normal(m), 2500, 7500) * np.sin(np.pi * np.clip(tt / (m / S.SR), 0, 1)) * 0.5)[: n - k]
        t0 += 0.12 + 0.18 * RNG.random()
    return S.stereo(x, -0.2)


def crowd(d):                                           # a crowd, scrolling: a soft murmur
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 300, 1500) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * tt) * np.sin(2 * np.pi * 0.7 * tt))
    return S.stereo(fade_io(x, d + 0.4, 0.3, 0.4) * 0.35)


def tag():                                              # a buyer who stops
    return S.stereo(ring([(1760, 0.35, 0.08), (2637, 0.15, 0.06)], 0.25))


SYNTH = {"throb": throb, "gasp": gasp, "groan": groan, "ding": ding, "zap": zap, "tick": tick, "shimmer": shimmer, "wilt": wilt,
         "hush": hush, "tap": tap, "ringtone": ringtone, "tag": tag}
LONG = {"street": street, "room": room, "sweep": sweep, "steps": steps, "buzzphone": buzzphone, "chalk": chalk, "crowd": crowd}
SYN = {}
FRESH = {"tag", "tick", "throb"}          # a new take each time, so repeats don't sound copied

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
GM = M["start"] % BEAT                                 # a beat on "It's the Mosquito"
G1 = M["pitch"] % BEAT                                 # a beat on "We scale businesses"
# A minor (Am, F, C, G)
SLY = ([[110.0, 130.81, 164.81, 220.0, 261.63], [87.31, 110.0, 130.81, 174.61, 220.0], [130.81, 164.81, 196.0, 261.63, 329.63], [98.0, 123.47, 146.83, 196.0, 246.94]],
       [[440.0, 523.25, 659.25, 880.0], [440.0, 523.25, 698.46, 880.0], [523.25, 659.25, 783.99, 1046.5], [493.88, 587.33, 783.99, 987.77]],
       [55.0, 43.65, 65.41, 49.0])
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


music.add(S.pad([55.0, 82.41, 110.0, 130.81], M["start"] + 0.1, 520), 0.0, 0.24)                 # the hook: a low, tense drone
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, SLY, level=0.8, g0=GM)                            # from "It's the Mosquito"
n = len(main.buf)
main.buf *= (0.15 + 0.85 * ramp(n, *M["hush"], 0.12))[:, None]                              # "Most adults hear nothing"
music.buf += main.buf
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], 2.0, 1600), M["dawn"], 0.15)          # the ringtone
groove(music, M["feed"], M["pitch"] - 0.05, SLY, beat=None, level=0.7, g0=GM)               # the feed: no kick
groove(music, M["pitch"], M["end"], SLY, level=0.85, g0=G1)                                  # the pitch
music.add(S.pad([110.0, 130.81, 164.81, 220.0, 261.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)


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
