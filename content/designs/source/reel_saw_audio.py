"""Music + sound design for "Why would anyone push a hot dog into a saw blade?", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media
and commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is
downloaded by id into <sfx_cache> the first time. The saw itself is synthesized here: the motor's hum and the
blade's whine (40 teeth at 4,000 rpm pass at about 2,670 Hz) running from the first frame, the grit of the wood
being cut, and at the touch the whole sound falling in pitch as time slows, then a slow drone while the blade
turns in slow motion. So are the zap of the signal, the spring, the brake's clang into the teeth, the thud of the
blade dropping and the stamps on the tool companies.
Music (120 bpm), as in the Face ID reel: under the hook a low heartbeat pulse in A minor that stops dead on "finger",
so the line lands in silence; a rise under "And this saw stops"; the groove in C major under the mechanism, filtered
right down while time is slowed and hushed under "safety doesn't sell"; under the tension only a riser, a heartbeat
and a clock; a low drone on "You've just watched this reel for 34 seconds"; then the groove again on a grid that puts
a beat on "We scale businesses", resolving on C.
Usage: python3 reel_saw_audio.py <vo.wav> <out.wav> <sfx_cache>
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

D = json.loads((Path(__file__).parent / "reel_saw_events.json").read_text())
C, EV, M, SAW = D["cues"], D["events"], D["music"], D["saw"]
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


def scan():                                            # a shimmer of the signal round the blade
    n = S.n_(0.5)
    return lay(S.whoosh(0.5, 1800, 7500, -0.3, 0.3, air=0.6)[:n] * 0.7, tone(900, 1900, 0.3, 0) * 0.35)


def zap():                                             # a little electric buzz
    n = S.n_(0.28)
    tt = np.arange(n) / S.SR
    buzz = np.sign(np.sin(2 * np.pi * 120 * tt)) * 0.4 + np.sin(2 * np.pi * 240 * tt) * 0.3
    crackle = S.hp(RNG.standard_normal(n), 2500) * (RNG.random(n) < 0.08) * 1.5
    x = S.bp(buzz + crackle, 200, 7000) * np.minimum(1, tt / 0.004) * np.exp(-tt / 0.09)
    return S.stereo(x * 0.6)


def slowmo():                                          # time slows: everything falls in pitch, a low boom under it
    d = 1.1
    n = S.n_(d)
    tt = np.arange(n) / S.SR
    fall = tone(1400, 55, d, 0.4) * 0.5
    air = S.lp(RNG.standard_normal(n), 900) * np.exp(-tt / 0.35) * 0.4
    return lay(S.stereo(fall + air), S.sub_hit(70, 28, 1.0, 0.3) * 0.8)


def spring():                                          # the spring lets go: a twang
    n = S.n_(0.45)
    tt = np.arange(n) / S.SR
    f = 520 * (1 + 0.06 * np.sin(2 * np.pi * 11 * tt) * np.exp(-tt / 0.15))
    x = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.exp(-tt / 0.12) * 0.6 + np.sin(2 * np.pi * np.cumsum(2.76 * f) / S.SR) * np.exp(-tt / 0.06) * 0.25
    return lay(S.stereo(x), S.mouse_click() * 0.8)


def clang():                                           # aluminum into steel teeth: a hard metallic hit
    n = S.n_(1.2)
    tt = np.arange(n) / S.SR
    parts = [(410, 0.5, 0.35), (1130, 0.4, 0.22), (1987, 0.35, 0.15), (2871, 0.3, 0.1), (4103, 0.22, 0.07), (5290, 0.15, 0.05)]
    ring = sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)
    burst = S.hp(RNG.standard_normal(n), 1500) * np.exp(-tt / 0.02) * 0.8
    return lay(S.stereo(ring + burst), S.sub_hit(110, 40, 0.7, 0.9) * 0.9)


def thud():                                            # the blade drops under the table
    n = S.n_(0.6)
    tt = np.arange(n) / S.SR
    body = S.lp(RNG.standard_normal(n), 300) * np.exp(-tt / 0.08) * 1.2
    return lay(S.stereo(body), S.sub_hit(75, 35, 0.6, 0.6))


def stamp():                                           # a red mark slammed on
    n = S.n_(0.25)
    tt = np.arange(n) / S.SR
    knock = tone(180, 85, 0.14, 0.2) * 0.9
    slap = S.bp(RNG.standard_normal(n), 800, 3200) * np.exp(-tt / 0.012) * 0.6
    return lay(S.stereo(slap), knock, S.mouse_click() * 0.5)


SYNTH = {"scan": scan, "zap": zap, "slowmo": slowmo, "spring": spring, "clang": clang, "thud": thud, "stamp": stamp,
         "glitch": lambda: S.glitch(0.22)}
SYN = {}


def saw_layer():
    """The saw running: motor hum, blade whine, air, and the grit of the cut; at the touch it all falls in pitch
    and fades as time slows; then a low slow drone while the blade crawls round, gone when it stops dead."""
    t_end = SAW["touch"] + 0.9
    n = S.n_(t_end)
    tt = np.arange(n) / S.SR
    r = np.where(tt < SAW["touch"], 1.0, np.maximum(0.04, np.exp(-(tt - SAW["touch"]) / 0.22)))   # the speed, falling
    fade = np.where(tt < SAW["touch"], 1.0, np.exp(-(tt - SAW["touch"]) / 0.3))
    cut = np.clip((tt - SAW["cut0"]) / 0.3, 0, 1)
    f0 = 57.5
    ph = 2 * np.pi * np.cumsum(f0 * r) / S.SR
    hum = sum(a * np.sin(k * ph + k) for k, a in [(1, 0.5), (2, 0.35), (3, 0.22), (4, 0.15), (6, 0.08), (8, 0.05)])
    fw = 2667 * (1 - 0.05 * cut) * (1 + 0.004 * np.sin(2 * np.pi * 3.1 * tt)) * r
    pw = 2 * np.pi * np.cumsum(fw) / S.SR
    whine = 0.2 * np.sin(pw) + 0.07 * np.sin(2 * pw) + 0.05 * np.sin(0.5 * pw)
    air = S.bp(RNG.standard_normal(n), 400, 3000) * 0.22
    grit = S.bp(RNG.standard_normal(n), 1200, 7000) * (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * 17 * tt))) * cut * 0.3
    x = (hum * 0.55 + whine + (air + grit) * np.minimum(1, r * 1.5)) * fade
    x = x * np.minimum(1, tt / 0.02)
    out = S.stereo(x)
    # the slow-motion drone: the blade turning over, slowly
    d0, d1 = SAW["touch"] + 0.25, SAW["dead"]
    m = S.n_(d1 - d0 + 0.6)
    tm = np.arange(m) / S.SR
    drone = (np.sin(2 * np.pi * 42 * tm) * 0.5 + np.sin(2 * np.pi * 84 * tm) * 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.9 * tm))
    drone *= np.minimum(1, tm / 0.4) * np.where(tm < d1 - d0, 1.0, np.exp(-(tm - (d1 - d0)) / 0.08))
    full = np.zeros((S.n_(END), 2))
    full[: len(out)] += out[: len(full)]
    a = S.n_(d0)
    full[a : a + m] += S.stereo(drone)[: len(full) - a] * 0.5
    return full


music, sfx = S.Track(END), S.Track(END)
sfx.buf += saw_layer() * 0.55
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
GM = M["groove"] % BEAT                                # the mechanism: a beat on "The blade carries"
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


def groove(trk, t0, t1, key, beat=True, plucks=True, pulse=False, pads=True, level=1.0, g0=G0):
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
            trk.add(S.kick(), tt, 0.6 * level)
        if beat is True and kr % 4 == 2:
            trk.add(S.snap(), tt, 0.16 * level)
        if beat is False and kr % 4 == 0:
            trk.add(S.kick(), tt, 0.5 * level)
            trk.add(S.kick(), tt + 0.17, 0.3 * level)
        trk.add(S.hat(), tt, 0.09 * level)
        trk.add(S.hat(), tt + BEAT / 4, 0.045 * level)
        if plucks:
            trk.add(S.stereo(pl(ARP[bar][kr % 4]), 0.3 if kr % 2 else -0.3), tt, 0.16 * level)
        if pulse or kr % 2 == 1:
            trk.add(bass(ROOT[bar], BEAT * (0.45 if pulse else 0.9)), tt, (0.24 if pulse else 0.3) * level)
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


groove(music, 0.0, M["gap1"], DARK, beat=False, plucks=False, pulse=True, level=0.8)        # the hook, a heartbeat pulse
music.add(S.riser(M["groove"] - M["how"], 150, 2600), M["how"], 0.16)                       # "And this saw stops..."
mech = S.Track(END)
groove(mech, M["groove"], M["tense"], BRIGHT, level=0.8, g0=GM)                              # the mechanism
n = len(mech.buf)
slow = ramp(n, M["slow0"], M["slow1"], 0.2)[:, None]                                        # time slowed: the groove filtered right down
mech.buf = mech.buf * slow + filt2(mech.buf, "low", 380) * (1 - slow) * 0.7
mech.buf *= (0.15 + 0.85 * ramp(n, M["hush0"], M["hush1"], 0.12))[:, None]                 # hushed under "safety doesn't sell"
music.buf += mech.buf
music.add(S.pad([55.0, 110.0, 130.81, 164.81], M["phone"] - M["tense"] + 0.1, 420), M["tense"], 0.09)   # under the tension
music.add(S.pad([55.0, 82.41, 110.0], M["drop"] - M["phone"] + 0.2, 380), M["phone"] + 0.25, 0.08)     # "You've just watched..."
groove(music, M["drop"], M["end"], BRIGHT, level=0.85, g0=G1)                                # your ad, held that long
music.add(S.pad([130.81, 164.81, 196.0, 261.63, 329.63], END - M["end"] + 0.4, 1800), M["end"], 0.24)

def brighten(x, t0, t1, db=10.0, f=3500):
    """A lift above f for t0..t1 (crossfaded in and out), no change to timing."""
    a, b = int(t0 * S.SR) - 400, int(t1 * S.SR) + 400
    seg = x[a:b].copy()
    y = seg + S.hp(seg, f) * (10 ** (db / 20) - 1)
    fade = np.ones(len(seg)); fade[:400] = np.linspace(0, 1, 400); fade[-400:] = np.linspace(1, 0, 400)
    x[a:b] = seg * (1 - fade) + y * fade


def master(voice, music, sfx, duck=0.82, music_gain=0.32, sfx_gain=0.55, voice_gain=1.0):
    """sfx_pro.master with its two moving averages done in linear time (uniform_filter1d, the same zero-padded box)
    instead of np.convolve, which takes many minutes on a 42-second track while the renderers have the CPU."""
    v = voice if voice.ndim == 2 else S.stereo(voice)
    lvl = uniform_filter1d(np.abs(v).mean(axis=1), S.n_(0.03), mode="constant")
    lvl = lvl / (np.max(lvl) + 1e-9)
    d = 1 - duck * np.clip(lvl * 3.5, 0, 1)
    d = uniform_filter1d(d, S.n_(0.25), mode="constant")[:, None]   # slow release: no pumping between phrases
    norm = lambda x: x / (np.max(np.abs(x)) + 1e-9)
    mix = norm(v) * voice_gain + norm(music) * music_gain * d + norm(sfx) * sfx_gain * (0.4 + 0.6 * d)
    return np.tanh(mix / np.max(np.abs(mix)) * 1.15) * 0.92


voice, sr = sf.read(sys.argv[1])
assert sr == S.SR
voice = voice if voice.ndim == 1 else voice.mean(axis=1)
# "So he started his own saw company": the voice's S is soft enough that "So" can be heard as "Though" (Whisper does);
# a lift on that one onset makes it "So"
so = next(w for w in C["words"] if w["line"] == "own")
brighten(voice, so["s"] - 0.03, so["s"] + 0.09)
v = np.zeros(len(music.buf)); n = min(len(v), len(voice)); v[:n] = voice[:n]
mix = master(S.stereo(v), music.buf, sfx.buf, duck=0.7, music_gain=0.135, sfx_gain=0.3, voice_gain=1.0)
fade = S.n_(0.4); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
sf.write(sys.argv[2], mix, S.SR, subtype="PCM_16")
print("wrote", sys.argv[2])
