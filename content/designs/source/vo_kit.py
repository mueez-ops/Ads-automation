"""Shared voiceover builder for the reels (Kokoro TTS + exact per-word timing).

Each line is generated, trimmed and placed with a chosen gap. Word times (the big captions follow them) come
straight from the model's duration predictor: <kokoro_dir>/kokoro-v1.0-dur.onnx is kokoro-v1.0.onnx with the
predictor's per-token frame counts exposed as a "duration" output (see expose_durations), so the audio is
bit-identical and every phoneme has an exact start. Whisper is only used to check the words are heard.
"""
import difflib
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf


def expose_durations(src, dst):
    """Copy of the model with the duration predictor's rounded per-token frames as an extra output."""
    import onnx
    from onnx import TensorProto, helper
    m = onnx.load(str(src))
    m.graph.node.append(helper.make_node("Identity", ["/encoder/Gather_output_0"], ["duration"], name="expose_duration"))
    m.graph.output.append(helper.make_tensor_value_info("duration", TensorProto.INT64, ["tokens"]))
    onnx.save(m, str(dst))


def trim(x, sr, thr=0.004):
    """Trimmed clip and the seconds cut from its start."""
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    idx = np.where(e > thr)[0]
    a = max(0, idx[0] - int(0.04 * sr))
    return x[a : min(len(x), idx[-1] + int(0.08 * sr))], a / sr


def word_spans(k, text, spoken, cut):
    """Exact (start, end) of every word from the model's phoneme timings. The phonemizer can merge words
    ("could have" -> "kˌʊdɐv"), so each word is phonemized on its own and its phonemes are aligned to the
    phoneme stream the model actually spoke; a word starts at its first aligned phoneme."""
    words = [re.sub(r"[^\w']", "", w) for w in text.split()]
    stream = "".join(p.phoneme for p in spoken)
    own, ranges = "", []
    for w in words:
        ph = re.sub(r"[^\wɐ-˿ᴀ-ᶿ]", "", k.tokenizer.phonemize(w, "en-us"))
        ranges.append((len(own), len(own) + len(ph)))
        own += ph + " "
    to_stream = {}
    for a0, b0, n in difflib.SequenceMatcher(a=own, b=stream, autojunk=False).get_matching_blocks():
        for i in range(n):
            to_stream[a0 + i] = b0 + i
    spans = []
    for a, b in ranges:
        hit = [to_stream[i] for i in range(a, b) if i in to_stream and stream[to_stream[i]] != " "]
        spans.append((spoken[hit[0]].start - cut, spoken[hit[-1]].end - cut) if hit else None)
    for i, sp in enumerate(spans):               # a word with no aligned phoneme sits between its neighbours
        if sp is None:
            lo = next(spans[j][1] for j in range(i - 1, -1, -1) if spans[j]) if i else 0.0
            hi = next((spans[j][0] for j in range(i + 1, len(spans)) if spans[j]), lo + 0.2)
            spans[i] = (lo, hi)
            print(f"  ! no phonemes aligned for '{words[i]}', placed between neighbours")
    return spans


def line_fx(x, sr, rise_at, pitch=0.0, gain=0.0, flat=1.0, rise=0.0):
    """One line re-intoned with Praat's overlap-add (same length, same timing, the voice's own formants): moved by
    `pitch` semitones, its melody squeezed toward its median by `flat` (1 keeps it, 0 is a monotone), and with `rise`
    the last word glides up that many semitones from where it starts (a question that goes up, not down). Then `gain` dB.
    Needs praat-parselmouth (pip install praat-parselmouth)."""
    import parselmouth
    from parselmouth.praat import call
    man = call(parselmouth.Sound(x, sr), "To Manipulation", 0.01, 60, 400)
    tier = call(man, "Extract pitch tier")
    pts = [(call(tier, "Get time from index", i), call(tier, "Get value at index", i))
           for i in range(1, call(tier, "Get number of points") + 1)]
    med = np.median([v for _, v in pts])
    st = [(t, 12 * np.log2(v / med) * flat + pitch) for t, v in pts]
    if rise:
        s0 = next((v for t, v in reversed(st) if t <= rise_at), st[0][1])
        t1 = st[-1][0]
        st = [(t, v if t <= rise_at else s0 + rise * ((t - rise_at) / max(1e-3, t1 - rise_at)) ** 0.8) for t, v in st]
    call(tier, "Remove points between", 0, len(x) / sr)
    for t, v in st:
        call(tier, "Add point", t, med * 2 ** (v / 12))
    call([man, tier], "Replace pitch tier")
    y = call(man, "Get resynthesis (overlap-add)").values[0] * 10 ** (gain / 20)
    return np.pad(y, (0, max(0, len(x) - len(y))))[: len(x)]


POLISH = "highpass=f=70,equalizer=f=300:t=q:w=1:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80:makeup=2"


def make_vo(lines, kdir, out_dir, cues_path, tail, voice="af_heart", continuous=False, polish=POLISH):
    """lines: (key, spoken text, caption text with the same words, gap before, speed[, fx]); fx is an optional
    {"pitch": semitones, "gain": dB, "flat": 0..1, "rise": semitones} for that line (see line_fx); the length is
    unchanged, so a line can drop, lift, flatten, hush, punch or end on a question while its word times stay exact.
    voice: a voice name, or {name: weight} to blend voices. continuous: synthesize each line as one take, so the
    intonation runs through it. polish: the ffmpeg filter chain for the finished track.
    Writes the cues JSON and <out_dir>/vo.wav (44.1 kHz)."""
    from faster_whisper import WhisperModel
    from kokoro_onnx import Kokoro

    kdir, out_dir = Path(kdir), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if not (kdir / "kokoro-v1.0-dur.onnx").exists():
        expose_durations(kdir / "kokoro-v1.0.onnx", kdir / "kokoro-v1.0-dur.onnx")
    k = Kokoro(str(kdir / "kokoro-v1.0-dur.onnx"), str(kdir / "voices-v1.0.bin"))
    assert k.has_timings
    if isinstance(voice, dict):
        voice = sum(w * k.get_voice_style(n) for n, w in voice.items())
    wm = WhisperModel("small.en", compute_type="int8")

    clips, cues, t, sr = [], {"lines": {}, "words": []}, 0.0, 24000
    for key, text, shown, gap, speed, *fx in lines:
        raw, sr, spoken = k.create_timed(text, voice=voice, speed=speed, lang="en-us", sentence_pause=0, clause_pause=0, continuous=continuous)
        s, cut = trim(raw, sr)
        spans = word_spans(k, text, spoken, cut)
        if fx:
            s = line_fx(s, sr, spans[-1][0], **fx[0])
        t += gap
        dur = len(s) / sr
        x16 = np.interp(np.arange(int(len(s) * 16000 / sr)) * sr / 16000, np.arange(len(s)), s).astype(np.float32)
        heard = [w for seg in wm.transcribe(x16, word_timestamps=True)[0] for w in seg.words]
        want = shown.split()
        assert len(spans) == len(want), (key, len(spans), len(want))
        for w, (a, b) in zip(want, spans):
            cues["words"].append({"w": w, "s": round(t + a, 3), "e": round(t + b, 3), "line": key})
        cues["lines"][key] = {"s": round(t, 3), "e": round(t + dur, 3), "text": shown}
        clips.append((t, s))
        print(f"{t:6.2f} {dur:5.2f}s  {text}  | heard: {' '.join(w.word.strip() for w in heard)}")
        t += dur
    cues["voice_end"] = round(t, 3)
    cues["end"] = round(t + tail, 3)
    cues["at"] = {f"{w['line']}:{w['w']}": w["s"] for w in cues["words"]}

    track = np.zeros(int(cues["end"] * sr) + sr)
    for start, s in clips:
        i = int(start * sr)
        track[i : i + len(s)] += s
    track = track[: int(cues["end"] * sr)]
    sf.write(out_dir / "vo_24k.wav", track, sr)
    # the default polish: high-pass, gentle presence lift, de-mud, soft compression
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_dir / "vo_24k.wav", "-af", polish,
                    "-ar", "44100", "-ac", "1", out_dir / "vo.wav"], check=True)
    Path(cues_path).write_text(json.dumps(cues, indent=1))
    print("voice ends", cues["voice_end"], "reel", cues["end"])
    return cues
