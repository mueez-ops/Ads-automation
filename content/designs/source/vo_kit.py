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


def make_vo(lines, kdir, out_dir, cues_path, tail, voice="af_heart"):
    """lines: (key, spoken text, caption text with the same words, gap before, speed).
    Writes the cues JSON and <out_dir>/vo.wav (44.1 kHz, lightly polished)."""
    from faster_whisper import WhisperModel
    from kokoro_onnx import Kokoro

    kdir, out_dir = Path(kdir), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if not (kdir / "kokoro-v1.0-dur.onnx").exists():
        expose_durations(kdir / "kokoro-v1.0.onnx", kdir / "kokoro-v1.0-dur.onnx")
    k = Kokoro(str(kdir / "kokoro-v1.0-dur.onnx"), str(kdir / "voices-v1.0.bin"))
    assert k.has_timings
    wm = WhisperModel("small.en", compute_type="int8")

    clips, cues, t, sr = [], {"lines": {}, "words": []}, 0.0, 24000
    for key, text, shown, gap, speed in lines:
        raw, sr, spoken = k.create_timed(text, voice=voice, speed=speed, lang="en-us", sentence_pause=0, clause_pause=0)
        s, cut = trim(raw, sr)
        t += gap
        dur = len(s) / sr
        x16 = np.interp(np.arange(int(len(s) * 16000 / sr)) * sr / 16000, np.arange(len(s)), s).astype(np.float32)
        heard = [w for seg in wm.transcribe(x16, word_timestamps=True)[0] for w in seg.words]
        want = shown.split()
        spans = word_spans(k, text, spoken, cut)
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
    # light polish: high-pass, gentle presence lift, de-mud, soft compression
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_dir / "vo_24k.wav", "-af",
                    "highpass=f=70,equalizer=f=300:t=q:w=1:g=-1.5,equalizer=f=4200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=80:makeup=2",
                    "-ar", "44100", "-ac", "1", out_dir / "vo.wav"], check=True)
    Path(cues_path).write_text(json.dumps(cues, indent=1))
    print("voice ends", cues["voice_end"], "reel", cues["end"])
    return cues
