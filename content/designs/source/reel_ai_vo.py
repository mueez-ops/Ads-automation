"""Voiceover + per-word timing for the explainer reel "How AI answers you" (the Face ID reel's format, which did best:
a paradox hook that moves the voice up and down, the mechanism one picture per line on one continuous 3D camera,
the loop closed, then the switch). Same voice as Face ID (am_fenrir) but read faster with short gaps, because the
Face ID read felt slow: lines at 1.2-1.3x, 0.05-0.15 s between them, one short beat before the switch.
The hook: "You type a question to AI." (bright, lifting at the end) "It never reads a single word of it." (dropped,
weighty) "Not one." (low and flat) "So how does it answer you in seconds?" (a question that climbs).
Writes reel_ai_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic and the re-intonation in vo_kit.py. The
number in "You've just watched this reel for N seconds" has to be the real time when it is spoken: after a change to
the lines before it, run once, read the time printed for that word, set N.
Facts:
- Words become tokens, about 4 characters of English each (OpenAI Help Center, "What are tokens and how to count
  them?": 1 token ~ 4 characters, 100 tokens ~ 75 words). The example is tokenized for real with GPT-4's tokenizer
  (tiktoken cl100k_base, 100,277 entries): "Why is the sky blue?" -> 10445 374 279 13180 6437 30; the answer "Air
  scatters blue light more than red." -> Air| sc|atters| blue| light| more| than| red|. (26777 1156 10385 6437 3177 810
  1109 2579 13). Air scatters shorter (blue) wavelengths more than longer (red) ones: Rayleigh scattering.
- Each token ID becomes a vector of thousands of numbers (GPT-3: 12,288), and passes through dozens of layers
  (GPT-3: 96) in which attention lets each token look at the tokens before it (Brown et al. 2020, "Language Models
  are Few-Shot Learners", Table 2.1; Vaswani et al. 2017, "Attention Is All You Need").
- A forward pass costs about 2 x parameters operations per token (Kaplan et al. 2020, "Scaling Laws for Neural
  Language Models"): GPT-3, 175 billion parameters, about 350 billion per token.
- The last layer gives a score for every token in the vocabulary; one is picked (sampled), added, and the model runs
  again; chat apps stream the tokens to you as they come, which is why answers type themselves out.
- Most long-distance internet traffic travels through fiber-optic cable as pulses of light (after the first hop over
  Wi-Fi or mobile data, which the small print says).
Usage: python3 reel_ai_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed[, fx])
LINES = [
    # the hook: up and down on purpose, but quick
    ("type", "You type a question to AI.", "you type a question to AI", 0.05, 1.22, {"rise": 1.5}),
    ("never", "It never reads a single word of it.", "it never reads a single word of it", 0.06, 1.15, {"pitch": -3.5, "flat": 0.4, "gain": 1.5}),
    ("notone", "Not one.", "not one", 0.14, 1.0, {"pitch": -5.0, "flat": 0.3, "gain": 1.0}),
    ("how", "So how does it answer you in seconds?", "so how does it answer you in seconds", 0.14, 1.2, {"pitch": 1.5, "rise": 5.0}),
    # the mechanism, one picture per line
    ("fiber", "Your message is fired through fiber-optic cables, as pulses of light, to a data center.",
     "your message is fired through fiber-optic cables as pulses of light to a data center", 0.1, 1.3),
    ("tokens", "There, it's chopped into tokens: chunks of about four letters.",
     "there it's chopped into tokens chunks of about 4 letters", 0.08, 1.3),
    ("number", "Each token becomes a number.", "each token becomes a number", 0.06, 1.25),
    ("thousands", "Which points to a list of thousands of numbers.", "which points to a list of thousands of numbers", 0.08, 1.25),
    ("layers", "Now the model runs. Dozens of layers, where every token looks back at the ones before it.",
     "now the model runs dozens of layers where every token looks back at the ones before it", 0.1, 1.3),
    ("calc", "Hundreds of billions of calculations, for every token.", "hundreds of billions of calculations for every token", 0.06, 1.25),
    ("scores", "Next, it scores every token it knows, and picks one.", "next it scores every token it knows and picks one", 0.1, 1.26),
    ("again", "Then it runs again. And again. One token at a time.", "then it runs again and again one token at a time", 0.08, 1.25),
    ("types", "That's why answers type themselves out.", "that's why answers type themselves out", 0.08, 1.2),
    ("math", "It never read your words. It did math on them.", "it never read your words it did math on them", 0.14, 1.12, {"pitch": -1.5, "flat": 0.7}),
    # the switch, after a short beat of tension
    ("watched", "You've just watched this reel for thirty-four seconds.", "you've just watched this reel for 34 seconds", 0.7, 1.15),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.1, 1.18),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.1, 1.25),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.2),
]

POLISH = ("highpass=f=75,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-20dB:ratio=2.2:attack=6:release=90:makeup=2.5,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_ai_cues.json", tail=0.6,
        voice="am_fenrir", continuous=True, polish=POLISH)
