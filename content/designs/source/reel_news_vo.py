"""Voiceover + timeline for the "Breaking news" launch reel (Kokoro TTS, British news-anchor read).

Generates each line, trims silence, lays the lines out back to back and writes:
  - reel_news_cues.json: start/end of every line (the renderer and the sound design both read it)
  - <out_dir>/vo.wav: the voice track at 44.1 kHz

Usage: python3 reel_news_vo.py <kokoro_dir> <out_dir>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

KDIR, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
VOICE, SPEED = "bm_lewis", 1.3  # deepest British male voice, fast anchor read

# (cue key, text, gap before it in seconds). Spelling is phonetic where the TTS needs help.
LINES = [
    ("breaking", "Breaking news.", 0.35),
    ("thumb", "A thumb has stopped scrolling.", 0.10),
    ("witness", "Witnesses say it stopped...", 0.10),
    ("forad", "for an ad.", 0.18),
    ("everyday", "Every day, brands pay to be scrolled past.", 0.22),
    ("scattered", "Scattered posts.", 0.08),
    ("random", "Random boosts.", 0.04),
    ("noplan", "No plan.", 0.04),
    ("connect", "So we connect the dots.", 0.14),
    ("hsos", "Hook. Story. Offer. Scale.", 0.18),
    ("build", "So we build ads...", 0.18),
    ("cant", "people can't scroll past.", 0.20),
    ("brand", "Mezz Media.", 0.40),  # read slower (see SLOWER) so the "M" isn't swallowed
    ("live", "Now live.", 0.06),
    ("run", "Run a brand?", 0.30),
    ("dm", "D M us, teardown.", 0.05),
    ("free", "Your first ad review is on us.", 0.05),
    ("back", "Now... back to your scrolling.", 0.35),
]
TAIL = 1.2
SLOWER = {"brand": 1.12}  # per-line speed overrides
WORD_BEAT = 0.4  # "Hook. Story. Offer. Scale." lands one word per beat (150 BPM); the music uses the same grid
# Words the visuals hit exactly: (name, line, word as whisper spells it, fallback position in the line 0..1)
WORD_HITS = [("stop1", "thumb", "stopped", 0.36), ("stop2", "witness", "stopped", 0.58), ("scrolled", "everyday", "scrolled", 0.6),
             ("dots", "connect", "dots", 0.56), ("cant", "cant", "can't", 0.12), ("scroll", "cant", "scroll", 0.4),
             ("teardown", "dm", "tear", 0.45), ("back", "back", "back", 0.12), ("scrolling", "back", "scrolling", 0.56)]

k = Kokoro(str(KDIR / "kokoro-v1.0.onnx"), str(KDIR / "voices-v1.0.bin"))


PRE = 0.07  # extra lead-in kept before each line so soft starts like the "M" in "Mez" aren't clipped


def trim(x, sr, thr=0.006):
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    idx = np.where(e > thr)[0]
    a, b = max(0, idx[0] - int(0.05 * sr)), min(len(x), idx[-1] + int(0.06 * sr))
    return x[a:b]


def lead_in(x, sr):
    """The same line with PRE seconds more of its own onset (placed PRE earlier, so timing is unchanged)."""
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    a = max(0, np.where(e > 0.006)[0][0] - int((0.05 + PRE) * sr))
    return x[a:]


def split_words(x, sr, n):
    """Cut one read into n words at its n-1 longest pauses."""
    quiet = np.convolve(np.abs(x), np.ones(240) / 240, mode="same") < 0.006
    runs, i = [], 0
    while i < len(x):
        if quiet[i]:
            j = i
            while j < len(x) and quiet[j]:
                j += 1
            if i > 0 and j < len(x):
                runs.append((j - i, (i + j) // 2))
            i = j
        else:
            i += 1
    cuts = sorted(c for _, c in sorted(runs, reverse=True)[: n - 1])
    cuts = [0] + cuts + [len(x)]
    return [x[cuts[i] : cuts[i + 1]] for i in range(n)]


clips, cues, t = [], {}, 0.0
for key, text, gap in LINES:
    raw, sr = k.create(text, voice=VOICE, speed=SLOWER.get(key, SPEED), lang="en-gb")
    s = trim(raw, sr)
    t += gap
    if key == "hsos":  # one read keeps the tone; each word is then placed on its own beat
        words = split_words(s, sr, 4)
        cues["words"] = [round(t + i * WORD_BEAT, 3) for i in range(len(words))]
        for w0, w in zip(cues["words"], words):
            clips.append((w0, w))
        s = np.zeros(int((cues["words"][-1] - t) * sr) + len(words[-1]))
    else:
        full = lead_in(raw, sr)[: len(s) + int(PRE * sr)]
        clips.append((t - PRE, np.concatenate([np.zeros(int(PRE * sr) - (len(full) - len(s))), full]) if len(full) - len(s) < int(PRE * sr) else full))
    cues[key] = [round(t, 3), round(t + len(s) / sr, 3)]
    print(f"{t:6.2f}  {len(s)/sr:4.2f}s  {text}")
    t += len(s) / sr
cues["end"] = round(t + TAIL, 3)
cues["beat"] = WORD_BEAT

track = np.zeros(int(cues["end"] * sr) + sr)
for start, s in clips:
    i = int(start * sr)
    track[i : i + len(s)] += s
track = track[: int(cues["end"] * sr)]
sf.write(OUT / "vo_24k.wav", track, sr)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", OUT / "vo_24k.wav", "-ar", "44100", "-ac", "1", OUT / "vo.wav"], check=True)
# find the exact moments of the words the visuals hit
from faster_whisper import WhisperModel  # noqa: E402

x16 = np.interp(np.arange(int(len(track) * 16000 / sr)) * sr / 16000, np.arange(len(track)), track).astype(np.float32)
said = [w for seg in WhisperModel("base.en", compute_type="int8").transcribe(x16, word_timestamps=True)[0] for w in seg.words]
cues["at"] = {}
for name, line, word, frac in WORD_HITS:
    a, b = cues[line]
    hit = [w.start for w in said if word in w.word.lower().replace(" ", "") and a - 0.15 <= w.start <= b]
    cues["at"][name] = round(hit[0] if hit else a + (b - a) * frac, 3)
    print(f"{name:10s} {cues['at'][name]:6.2f}  {'whisper' if hit else 'estimated'}")
(Path(__file__).parent / "reel_news_cues.json").write_text(json.dumps(cues, indent=1))
print("duration", cues["end"])
