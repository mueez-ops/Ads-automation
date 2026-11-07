"""Music + sound design for "Every 3 seconds your eyes shut. You've never seen it. Not once.", mixed under the voiceover.

Recorded effects come from the Mixkit free library (Mixkit Sound Effects Free License: allowed in social media and
commercial videos, not to be redistributed on their own), so they are not kept in the repo: each is downloaded by id
into <sfx_cache> the first time. The rest is synthesized here: a quiet room at night, a blink (a soft swish of the lid
and the lids meeting), a thumb scrolling and tapping, the x-ray switching on, vision dimming, a computer beep and the
blip of a blink on the trace, fourteen pips for fourteen people, the hum of the lab and its screen, blinks snapping
into line, fourteen blinks at once, boings for the action, a logo spinning, a slow pan, scissors.
Music (120 bpm, D minor): a soft pulse under the hook; the groove from "In Tokyo"; a hush while they watch the action;
no kick under the feed, and the music blinks too: it stops for each "Blink."; back for the pitch.
Usage: python3 reel_blink_audio.py <vo.wav> <out.wav> <sfx_cache> [<stem prefix>]
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

D = json.loads((Path(__file__).parent / "reel_blink_events.json").read_text())
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
RNG = np.random.default_rng(31)


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


def ring(parts, dur, n=None):
    """A struck metal or glass: (frequency, amplitude, decay seconds) partials."""
    n = n or S.n_(dur)
    tt = np.arange(n) / S.SR
    return sum(a * np.sin(2 * np.pi * f * tt + f) * np.exp(-tt / d) for f, a, d in parts)


def fade_io(x, d, a=0.3, b=0.4):
    tt = np.arange(len(x)) / S.SR
    return x * np.clip(tt / a, 0, 1) * np.clip((d - tt) / b, 0, 1)


def chirp(f, n):
    return np.sin(2 * np.pi * np.cumsum(f) / S.SR)


# ---------- the world ----------
def night(d):                                           # a bedroom at night: low air, a few far crickets
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    air = S.lp(RNG.standard_normal(n), 250) * 1.0
    cr = np.zeros(n)
    for t0 in np.arange(0.3, d, 0.9 + 0.4 * RNG.random()):
        k = S.n_(t0); m = S.n_(0.18); u = np.arange(m) / S.SR
        cr[k:k + m] += (np.sin(2 * np.pi * 4300 * u) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * u))) * np.sin(np.pi * u / 0.18) * 0.05)[: n - k]
    return S.stereo(fade_io(air * 0.4 + cr, d + 0.4, 0.05, 0.3), 0.3 * np.sin(2 * np.pi * 0.07 * tt))


def lid():                                              # a blink: a quick soft swish of skin, a tiny wet click
    n = S.n_(0.12)
    tt = np.arange(n) / S.SR
    sw = S.sweep_filter(RNG.standard_normal(n), 4500, 1200, 1.4) * np.sin(np.pi * np.clip(tt / 0.07, 0, 1)) ** 2 * 0.5
    ck = np.sin(2 * np.pi * 1300 * tt) * np.exp(-np.clip(tt - 0.06, 0, None) / 0.006) * (tt > 0.06) * 0.35
    return S.stereo(sw + ck)


def thud():                                             # the lids meeting: a soft low tock
    n = S.n_(0.2)
    tt = np.arange(n) / S.SR
    x = np.sin(2 * np.pi * (150 - 40 * tt / 0.2) * tt) * np.exp(-tt / 0.05) + S.lp(RNG.standard_normal(n), 900) * np.exp(-tt / 0.015) * 0.4
    return S.stereo(x * np.minimum(1, tt / 0.002) * 0.6)


def tick():
    return S.stereo(ring([(3200, 0.4, 0.012), (6400, 0.15, 0.008)], 0.05))


def tap():                                              # a thumb on glass
    n = S.n_(0.08)
    tt = np.arange(n) / S.SR
    return S.stereo((S.bp(RNG.standard_normal(n), 2000, 7000) * np.exp(-tt / 0.004) + np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.01) * 0.3) * 0.6)


def scroll(d):                                          # a thumb scrolling: soft flicks on glass
    n = S.n_(d + 0.2)
    x = np.zeros(n)
    for t0 in np.arange(0.05, d, 0.42):
        k = S.n_(t0); m = S.n_(0.13); u = np.arange(m) / S.SR
        x[k:k + m] += (S.bp(RNG.standard_normal(m), 1500, 6000) * np.sin(np.pi * u / 0.13) ** 2 * 0.35)[: n - k]
    return S.stereo(x, 0.2)


def xray():                                             # the x-ray switching on: a sweep up and an electric hum
    n = S.n_(1.0)
    tt = np.arange(n) / S.SR
    sw = S.sweep_filter(RNG.standard_normal(n), 300, 5000, 1.4) * np.exp(-((tt - 0.25) / 0.2) ** 2) * 0.7
    hum = (np.sin(2 * np.pi * 110 * tt) + 0.4 * np.sin(2 * np.pi * 220 * tt)) * np.clip(tt / 0.15, 0, 1) * np.exp(-tt / 0.5) * 0.3
    return S.reverb(S.stereo(sw + hum), 0.5, 0.25)


def dim():                                              # vision dimming: a tone sliding down as a filter closes
    n = S.n_(0.7)
    tt = np.arange(n) / S.SR
    f = 900 * np.exp(-tt / 0.25) + 160
    x = S.sweep_filter(chirp(f, n) * 0.6 + RNG.standard_normal(n) * 0.15, 4000, 300, 1.0) * np.exp(-tt / 0.3) * np.minimum(1, tt / 0.01)
    return S.reverb(S.stereo(x * 0.6), 0.5, 0.25)


def snip():                                             # scissors: two short metal clicks and a snip of air
    n = S.n_(0.2)
    x = np.zeros(n)
    for t0 in (0.0, 0.045):
        k = S.n_(t0)
        x[k:] += ring([(4200, 0.35, 0.01), (6900, 0.2, 0.006), (2600, 0.15, 0.015)], 0.2, n - k)
    tt = np.arange(n) / S.SR
    x += S.bp(RNG.standard_normal(n), 3000, 9000) * np.exp(-np.abs(tt - 0.04) / 0.012) * 0.3
    return S.stereo(x * 0.8)


def lab(d):                                             # the lab: computer fans and a low hum
    n = S.n_(d + 0.4)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 180, 900) * 0.9 + (np.sin(2 * np.pi * 100 * tt) + 0.3 * np.sin(2 * np.pi * 200 * tt)) * 0.1
    return S.stereo(fade_io(x, d + 0.4, 0.15, 0.3) * 0.36)


def tv(d):                                              # the screen: a faint high-ish whine of a monitor, very low
    n = S.n_(d + 0.3)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 900, 3000) * 0.25 + np.sin(2 * np.pi * 240 * tt) * 0.05
    return S.stereo(fade_io(x, d + 0.3, 0.1, 0.2) * 0.4)


def beep(f=880, d=0.11):                                # a computer
    n = S.n_(d + 0.05)
    tt = np.arange(n) / S.SR
    x = S.lp(np.sign(np.sin(2 * np.pi * f * tt)), 3500) * np.clip((d - tt) / 0.01, 0, 1) * np.minimum(1, tt / 0.003)
    return S.stereo(x * 0.3)


def blip():                                             # a blink on the trace: a short rising bip
    n = S.n_(0.12)
    tt = np.arange(n) / S.SR
    return S.stereo(chirp(1200 + 900 * np.clip(tt / 0.05, 0, 1), n) * np.exp(-tt / 0.04) * np.minimum(1, tt / 0.003) * 0.45)


def pip():                                              # one of fourteen people
    n = S.n_(0.09)
    tt = np.arange(n) / S.SR
    f = 1800 * 2 ** (RNG.integers(0, 8) / 12)
    return S.stereo(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.02) * np.minimum(1, tt / 0.002) * 0.4, RNG.uniform(-0.6, 0.6))


def snap_in():                                          # blinks clicking into line
    n = S.n_(0.25)
    tt = np.arange(n) / S.SR
    x = S.bp(RNG.standard_normal(n), 1500, 7000) * np.exp(-tt / 0.006) * 0.6 + ring([(1568, 0.25, 0.08), (2349, 0.12, 0.05)], 0.25)
    return S.reverb(S.stereo(x * 0.7), 0.4, 0.2)


def lids14():                                           # fourteen blinks at once: a flutter
    n = S.n_(0.25)
    out = np.zeros((n, 2))
    for i in range(14):
        b = pan(lid(), (i / 13) * 1.4 - 0.7) * (0.5 + 0.5 * RNG.random())
        k = S.n_(0.05 + 0.03 * RNG.standard_normal() * 0.6)
        k = max(0, min(k, n - len(b)))
        out[k:k + len(b)] += b
    return out / 4.0


def boing():                                            # the action: a cartoon boing
    n = S.n_(0.5)
    tt = np.arange(n) / S.SR
    f = 220 * (1 + 0.45 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt / 0.15)) * (1 + 0.6 * np.exp(-tt / 0.05))
    x = chirp(f, n) * np.exp(-tt / 0.18) * np.minimum(1, tt / 0.004)
    return S.stereo(S.lp(x, 2500) * 0.55)


def spin():                                             # a logo spinning in: a whoosh that turns
    n = S.n_(1.1)
    tt = np.arange(n) / S.SR
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(12 * np.exp(-tt / 0.5) + 2) / S.SR)
    x = S.bp(RNG.standard_normal(n), 600, 3500) * lfo * np.sin(np.pi * np.clip(tt / 1.1, 0, 1)) ** 1.2
    return S.stereo(x * 0.5, 0.6 * (lfo - 0.5))


def pan_whoosh(d):                                      # a slow pan: a long, dull air
    n = S.n_(d + 0.3)
    x = S.sweep_filter(RNG.standard_normal(n), 400, 1200, 1.0) * np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1)) * 0.5
    return S.stereo(x, np.linspace(0.5, -0.5, n))


SYNTH = {"lid": lid, "thud": thud, "tick": tick, "tap": tap, "xray": xray, "dim": dim, "snip": snip, "beep": beep, "blip": blip,
         "pip": pip, "snap_in": snap_in, "lids14": lids14, "boing": boing, "spin": spin}
LONG = {"night": night, "scroll": scroll, "lab": lab, "tv": tv, "pan": pan_whoosh}
SYN = {}
FRESH = {"tick", "lid", "pip", "lids14", "boing", "snip"}   # a new take each time, so repeats don't sound copied

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
GM = M["start"] % BEAT                                 # a beat on "In Tokyo"
G1 = M["pitch"] % BEAT                                 # a beat on "We scale businesses"
# D minor (Dm, Bb, F, C)
KEY = ([[146.83, 174.61, 220.0, 293.66], [116.54, 146.83, 174.61, 233.08], [130.81, 174.61, 220.0, 261.63], [130.81, 164.81, 196.0, 261.63]],
       [[587.33, 698.46, 880.0, 1174.66], [466.16, 587.33, 698.46, 932.33], [523.25, 698.46, 880.0, 1046.5], [523.25, 659.25, 783.99, 1046.5]],
       [73.42, 58.27, 87.31, 65.41])
PL = {}


def pl(f):
    if f not in PL:
        PL[f] = S.pluck(f, 0.4, 0.38)
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


music.add(S.pad([73.42, 110.0, 146.83, 174.61], M["start"] + 0.1, 600), 0.0, 0.2)                 # the hook: a low Dm drone
groove(music, 0.05, M["start"] - 0.05, KEY, beat=None, pads=False, level=0.5, g0=0.05 % BEAT)      # and a soft pulse
main = S.Track(END)
groove(main, M["start"], M["feed"] - 0.05, KEY, level=0.8, g0=GM)                            # from "In Tokyo"
main.buf *= (0.2 + 0.8 * ramp(len(main.buf), *M["hush"], 0.12))[:, None]                     # while they watch the action
music.buf += main.buf
feed = S.Track(END)
groove(feed, M["feed"], M["pitch"] - 0.05, KEY, beat=None, level=0.72, g0=GM)               # the feed: no kick
env = np.ones(len(feed.buf))
for a, b in M["stops"]:                                                                      # the music blinks too
    env *= ramp(len(feed.buf), a, b, 0.03)
feed.buf *= env[:, None]
music.buf += feed.buf
groove(music, M["pitch"], M["end"], KEY, level=0.85, g0=G1)                                  # the pitch
music.add(S.pad([146.83, 174.61, 220.0, 293.66], END - M["end"] + 0.4, 1800), M["end"], 0.24)


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
