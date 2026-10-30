"""Expressive voiceover: Kokoro with each word's pitch, length, loudness and the pauses between words set by hand.

Kokoro predicts a pitch curve (Hz, one value per 12.5 ms) and hands it to its decoder. kokoro-v1.0-expr.onnx (built
by build_model from kokoro-v1.0.onnx) takes that curve as an input instead, along with a length multiplier for every
phoneme, so a line is sung to a new melody by the model itself: the voice keeps its own formants and breath, which a
pitch shift after the fact does not. Each line is synthesized twice, once to read the predicted melody and lengths,
once with the melody rewritten.

A line is written with marks on its words:
  ^word    pitch accent up (+3 semitones; each extra ^ adds 2), and 2 dB louder
  _word    pitch accent down (-3 semitones; each extra _ takes 2 more), and 1.5 dB softer
  word+    said longer (its vowels x1.45 per +, its consonants x1.1)
  word|    a pause after it (0.12 s per |)
  /N, \\N    at the end of the line: the last word glides N semitones up (/) or down (\\)
The marks are removed before the text is spoken; captions use the clean words.
"""
import json
import re
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000
HOP = 300                      # samples per pitch value (12.5 ms); a duration frame is two of them
VOWELS = set("aeiouæɐɑɒɔəɚɛɜɝɪʊʌᵻɨʉɘɵɤɯœøɶy")
F0_MAX = 380.0                 # Hz; above this the decoder starts to sound thin


def build_model(src, dst):
    """Copy of Kokoro with durations, pitch and energy exposed and four control inputs: dur_scale [1, tokens]
    multiplies each token's predicted length before rounding; the decoder gets f0 * f0_scale + f0_shift (Hz,
    [1, frames]) and energy + n_shift."""
    import onnx
    from onnx import TensorProto, helper
    m = onnx.load(str(src))
    g = m.graph
    node = {n.name: n for n in g.node}
    g.input.extend([helper.make_tensor_value_info("dur_scale", TensorProto.FLOAT, [1, "tok"]),
                    helper.make_tensor_value_info("f0_scale", TensorProto.FLOAT, [1, "f0len"]),
                    helper.make_tensor_value_info("f0_shift", TensorProto.FLOAT, [1, "f0len"]),
                    helper.make_tensor_value_info("n_shift", TensorProto.FLOAT, [1, "f0len"])])
    g.node.append(helper.make_node("Mul", ["/encoder/Div_output_0", "dur_scale"], ["dur_scaled"], name="ctl_dur"))
    node["/encoder/Round"].input[0] = "dur_scaled"
    g.node.append(helper.make_node("Mul", ["/encoder/Squeeze_output_0", "f0_scale"], ["f0_mul"], name="ctl_f0_mul"))
    g.node.append(helper.make_node("Add", ["f0_mul", "f0_shift"], ["f0_ctl"], name="ctl_f0_add"))
    node["/encoder/Reshape"].input[0] = "f0_ctl"
    g.node.append(helper.make_node("Add", ["/encoder/Squeeze_1_output_0", "n_shift"], ["n_ctl"], name="ctl_n_add"))
    node["/encoder/Reshape_1"].input[0] = "n_ctl"
    for name, srcname, ty, shape in [("duration", "/encoder/Gather_output_0", TensorProto.INT64, ["tok"]),
                                     ("dur_float", "/encoder/Div_output_0", TensorProto.FLOAT, [1, "tok"]),
                                     ("f0", "/encoder/Squeeze_output_0", TensorProto.FLOAT, [1, "f0len"]),
                                     ("n", "/encoder/Squeeze_1_output_0", TensorProto.FLOAT, [1, "f0len"])]:
        g.node.append(helper.make_node("Identity", [srcname], [name], name="expose_" + name))
        g.output.append(helper.make_tensor_value_info(name, ty, shape))
    avail = {i.name for i in g.input} | {t.name for t in g.initializer}
    pending, ordered = list(g.node), []
    while pending:                                 # the new nodes must run before the nodes now reading them
        rest = [n for n in pending if not all((not i) or i in avail for i in n.input)]
        for n in pending:
            if n not in rest:
                ordered.append(n)
                avail.update(n.output)
        if len(rest) == len(pending):
            raise RuntimeError(f"cannot order {rest[0].name}")
        pending = rest
    del g.node[:]
    g.node.extend(ordered)
    onnx.checker.check_model(m)
    onnx.save(m, str(dst))


def parse(marked):
    """Clean text, and per word: accent semitones, length factor, pause seconds; plus the final glide."""
    glide = 0.0
    tail = re.search(r"\s*([/\\])(\d+(?:\.\d+)?)$", marked)
    if tail:
        glide = float(tail.group(2)) * (1 if tail.group(1) == "/" else -1)
        marked = marked[: tail.start()]
    words, marks = [], []
    for raw in marked.split():
        up = len(re.match(r"\^*", raw).group())
        down = len(re.match(r"_*", raw).group())
        core = raw.lstrip("^_")
        pauses = len(re.search(r"\|*$", core).group())
        core = core.rstrip("|")
        m = re.match(r"^(.*?)(\++)([^\w']*)$", core)        # word++, or word++, with punctuation after
        longer = 0
        if m:
            longer = len(m.group(2))
            core = m.group(1) + m.group(3)
        acc = (3 + 2 * (up - 1)) if up else (-(3 + 2 * (down - 1)) if down else 0)
        words.append(core)
        marks.append({"acc": acc, "len": longer, "pause": 0.12 * pauses})
    return " ".join(words), marks, glide


class Engine:
    def __init__(self, kdir, voice):
        import onnxruntime as rt
        from kokoro_onnx import Kokoro
        kdir = Path(kdir)
        if not (kdir / "kokoro-v1.0-expr.onnx").exists():
            build_model(kdir / "kokoro-v1.0.onnx", kdir / "kokoro-v1.0-expr.onnx")
        if not (kdir / "kokoro-v1.0-dur.onnx").exists():
            from vo_kit import expose_durations
            expose_durations(kdir / "kokoro-v1.0.onnx", kdir / "kokoro-v1.0-dur.onnx")
        self.k = Kokoro(str(kdir / "kokoro-v1.0-dur.onnx"), str(kdir / "voices-v1.0.bin"))
        self.sess = rt.InferenceSession(str(kdir / "kokoro-v1.0-expr.onnx"), providers=["CPUExecutionProvider"])
        self.voice = sum(w * self.k.get_voice_style(n) for n, w in voice.items()) if isinstance(voice, dict) \
            else self.k.get_voice_style(voice)

    def run(self, toks, speed, dur_scale, f0_shift=None):
        """One pass; with f0_shift the decoder sings that curve (Hz) instead of the predicted one."""
        n = len(toks)
        feeds = {"tokens": np.array([[0, *toks, 0]], dtype=np.int64),
                 "style": self.voice[min(n, len(self.voice)) - 1].astype(np.float32),
                 "speed": np.array([speed], dtype=np.float32),
                 "dur_scale": dur_scale[None].astype(np.float32),
                 "f0_scale": (np.ones((1, 1)) if f0_shift is None else np.zeros((1, len(f0_shift)))).astype(np.float32),
                 "f0_shift": (np.zeros((1, 1)) if f0_shift is None else f0_shift[None]).astype(np.float32),
                 "n_shift": np.zeros((1, 1), dtype=np.float32)}
        a, d, f0, df = self.sess.run(["audio", "duration", "f0", "dur_float"], feeds)
        return np.asarray(a).ravel(), np.asarray(d).ravel(), np.asarray(f0).ravel(), np.asarray(df).ravel()

    def word_tokens(self, words, stream):
        """Token range of every word in the phoneme stream the model speaks (words are phonemized one by one and
        aligned, because the phonemizer can merge neighbours)."""
        import difflib
        own, ranges = "", []
        for w in words:
            ph = self.k.tokenizer.known(self.k.tokenizer.phonemize(re.sub(r"[^\w']", "", w) or w, "en-us")).strip()
            ph = re.sub(r"[^\wɐ-˿ᴀ-ᶿ]", "", ph)
            ranges.append((len(own), len(own) + len(ph)))
            own += ph + " "
        to_stream = {}
        for a0, b0, n in difflib.SequenceMatcher(a=own, b=stream, autojunk=False).get_matching_blocks():
            for i in range(n):
                to_stream[a0 + i] = b0 + i
        out = []
        for a, b in ranges:
            hit = [to_stream[i] for i in range(a, b) if i in to_stream and stream[to_stream[i]] != " "]
            out.append((hit[0], hit[-1] + 1) if hit else None)
        for i, r in enumerate(out):                 # a word with nothing aligned sits between its neighbours
            if r is None:
                lo = next((out[j][1] for j in range(i - 1, -1, -1) if out[j]), 0)
                hi = next((out[j][0] for j in range(i + 1, len(out)) if out[j]), lo + 1)
                out[i] = (lo, max(lo + 1, hi))
        return out

    def line(self, marked, speed=1.2, reg=0.0, expand=1.5):
        """Audio (24 kHz) of one marked line and the (start, end) seconds of each word.
        reg: semitones the whole line moves; expand: how far its own peaks are pushed above its median (the low
        notes stay where the voice puts them, with a soft floor, as a real voice widens its range upward)."""
        text, marks, glide = parse(marked)
        words = text.split()
        stream = self.k.tokenizer.known(" ".join(self.k.tokenizer.phonemize(text, "en-us").split()))
        toks = self.k.tokenizer.tokenize(stream)
        assert len(toks) == len(stream) and len(toks) < 500, (text, len(toks), len(stream))
        spans = self.word_tokens(words, stream)
        dur_scale = np.ones(len(toks) + 2)
        if any(mk["len"] for mk in marks):            # longer words: frames are whole, so aim each token at a count
            _, d0, _, df = self.run(toks, speed, dur_scale)
            for (a, b), mk in zip(spans, marks):
                for i in range(a, b) if mk["len"] else ():
                    vowel = stream[i] in VOWELS
                    want = max(d0[1 + i] + (1 if vowel else 0), round(df[1 + i] * (1.45 if vowel else 1.1) ** mk["len"]))
                    dur_scale[1 + i] = (want + 0.1) / max(df[1 + i], 1e-3)
        _, d, f0, _ = self.run(toks, speed, dur_scale)
        edge = np.concatenate([[0], np.cumsum(d)]) * 2           # pitch-frame edge of every padded token
        voiced = f0 > 60
        med = np.median(f0[voiced])
        st = np.where(voiced, 12 * np.log2(np.where(voiced, f0, med) / med), 0.0)
        st = np.where(st > 0, st * expand, st)       # the peaks climb; the floor stays where the voice has it
        t = np.arange(len(f0))
        for (a, b), mk in zip(spans, marks):
            if not mk["acc"]:
                continue
            seg = stream[a:b]
            at = seg.find("ˈ") if "ˈ" in seg else seg.find("ˌ")
            v = next((i for i in range(max(at, 0), len(seg)) if seg[i] in VOWELS), None)
            v = a + (v if v is not None else len(seg) // 2)
            peak = 0.5 * (edge[1 + v] + edge[2 + v])
            width = max(6.0, (edge[1 + b] - edge[1 + a]) / 3)
            st = st + mk["acc"] * np.exp(-0.5 * ((t - peak) / width) ** 2)
        glide_from = len(f0)
        if glide:                                    # the last word slides from where it starts, whatever was predicted
            a, b = spans[-1]
            t0, t1 = int(edge[1 + a]), int(edge[1 + b])
            on = next((i for i in range(t0, t1) if voiced[i]), t0)
            ramp = np.clip((t - on) / max(1, t1 - on), 0, 1)
            st = np.where(t >= on, st[on] + glide * ramp, st)
            glide_from = on
        st = np.maximum(st, -7 + 2 * np.tanh((st + 7) / 2)) + reg   # a soft floor 7-9 semitones under the median
        creak = voiced & (f0 < med * 2 ** (-7 / 12)) & (t < glide_from)   # the voice's own low creak is left alone:
        target = np.where(voiced & ~creak, np.minimum(med * 2 ** (st / 12), F0_MAX), f0)   # lifting it squeaks
        audio, d2, _, _ = self.run(toks, speed, dur_scale, target)
        self.last = {"f0": f0, "target": target, "edge": edge, "spans": spans, "stream": stream}
        assert np.array_equal(d, d2)
        samp = np.concatenate([[0], np.cumsum(d)]) * 2 * HOP
        assert samp[-1] == len(audio), (samp[-1], len(audio))
        # loudness: accented words up, low words down, with soft edges
        gain = np.zeros(len(audio))
        for (a, b), mk in zip(spans, marks):
            if mk["acc"]:
                s0, s1 = int(samp[1 + a]), int(samp[1 + b])
                gain[s0:s1] += 2.0 if mk["acc"] > 0 else -1.5
        k = int(0.03 * SR)
        gain = np.convolve(gain, np.ones(k) / k, mode="same")
        audio = audio * 10 ** (gain / 20)
        # word times, then the pauses (silence cut in at the gap after the word)
        times = [[samp[1 + a] / SR, samp[1 + b] / SR] for a, b in spans]
        out, last, shift = [], 0, 0.0
        for i, ((a, b), mk) in enumerate(zip(spans, marks)):
            if mk["pause"] and i + 1 < len(spans):
                cut = int(0.5 * (samp[1 + b] + samp[1 + spans[i + 1][0]]))
                out += [audio[last:cut], np.zeros(int(mk["pause"] * SR))]
                last = cut
                for j in range(i + 1, len(times)):
                    times[j] = [times[j][0] + mk["pause"], times[j][1] + mk["pause"]]
        out.append(audio[last:])
        return np.concatenate(out), times, words


def trim(x, thr=0.004):
    """Trimmed clip and the seconds cut from its start."""
    e = np.convolve(np.abs(x), np.ones(240) / 240, mode="same")
    idx = np.where(e > thr)[0]
    a = max(0, idx[0] - int(0.03 * SR))
    return x[a: min(len(x), idx[-1] + int(0.07 * SR))], a / SR


def make_vo(lines, kdir, out_dir, cues_path, tail, voice, polish):
    """lines: (key, marked text, caption text (same words), gap before, speed, {"reg": st, "expand": x}).
    Writes the cues JSON (line and word times) and <out_dir>/vo.wav (44.1 kHz); every line is checked by Whisper."""
    from faster_whisper import WhisperModel
    eng = Engine(kdir, voice)
    wm = WhisperModel("small.en", compute_type="int8")
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    clips, cues, t = [], {"lines": {}, "words": []}, 0.0
    for key, marked, shown, gap, speed, fx in lines:
        audio, times, words = eng.line(marked, speed, **fx)
        s, cut = trim(audio)
        t += gap
        want = shown.split()
        assert len(want) == len(times), (key, len(want), len(times))
        for w, (a, b) in zip(want, times):
            cues["words"].append({"w": w, "s": round(t + a - cut, 3), "e": round(t + b - cut, 3), "line": key})
        dur = len(s) / SR
        cues["lines"][key] = {"s": round(t, 3), "e": round(t + dur, 3), "text": shown}
        x16 = np.interp(np.arange(int(len(s) * 16000 / SR)) * SR / 16000, np.arange(len(s)), s).astype(np.float32)
        heard = " ".join(w.word.strip() for seg in wm.transcribe(x16, word_timestamps=True)[0] for w in seg.words)
        clips.append((t, s))
        print(f"{t:6.2f} {dur:5.2f}s  {' '.join(words)}  | heard: {heard}")
        t += dur
    cues["voice_end"] = round(t, 3)
    cues["end"] = round(t + tail, 3)
    cues["at"] = {f"{w['line']}:{w['w']}": w["s"] for w in cues["words"]}
    track = np.zeros(int(cues["end"] * SR) + SR)
    for start, s in clips:
        i = int(start * SR)
        track[i: i + len(s)] += s
    track = track[: int(cues["end"] * SR)]
    sf.write(out_dir / "vo_24k.wav", track, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out_dir / "vo_24k.wav", "-af", polish,
                    "-ar", "44100", "-ac", "1", out_dir / "vo.wav"], check=True)
    Path(cues_path).write_text(json.dumps(cues, indent=1))
    print("voice ends", cues["voice_end"], "reel", cues["end"])
    return cues
