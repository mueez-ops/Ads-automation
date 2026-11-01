"""Voiceover + per-word timing for the explainer reel "Why would anyone put a bell on a grave?" (a Zack D. Films topic,
"Why Did People Put Bells On Graves?", 108M views on YouTube; our angle: the bell was never the product, peace of mind
was; find their fear, sell them the bell). Same voice and method as the armor and whale reels: af_heart with 30%
af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_bell_cues.json and <out_dir>/vo.wav (44.1 kHz). Numbers are spoken in words and shown as figures: a "+"
in the caption text rides with the word before it.
Facts:
- Wikipedia, "Safety coffin": the fear of being buried alive "peaked during the cholera epidemics of the 19th century,
  when fear of contagion led to quick burials"; most safety coffins had "a cord attached to a bell that the interred
  person could ring should they revive after the burial"; Taberger's design put the bell above ground, in a housing,
  to alert the cemetery's night watchman.
- Weird NJ, "Mr. Vester's Safety Coffin" (citing the New York Times of 2 September 1868 and Jan Bondeson's Buried
  Alive): Franz Vester of Newark patented his burial case in 1868 (US patent 81,437: a tube to the surface with a
  ladder, and a cord to a bell); at a public demonstration he stayed buried for an hour and 15 minutes; "at least
  22 patents for 'safety coffins' were applied for between 1868 and 1925".
- Phrase Finder, "Saved by the bell": "There's no evidence to show that anyone was ever saved by these coffins or
  even that they were ever put to use"; the phrase itself is boxing slang.
Usage: python3 reel_bell_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a shocked answer
    ("why", "Why would anyone put a ^^bell on a grave? /6", "why would anyone put a bell on a grave", 0.05, 1.18, {"reg": 1.0, "expand": 1.55}),
    ("alive", "In case the person ^inside wasn't ^^dead!", "in case the person inside wasn't dead", 0.05, 1.15, {"reg": 1.5, "expand": 1.5}),
    # the fear, the fix
    ("fear", "In the eighteen hundreds, people were ^^terrified of being buried _alive.",
     "in the 1800s + people were terrified of being buried alive", 0.1, 1.28, {"reg": 0.0, "expand": 1.55}),
    ("built", "So inventors built ^safety coffins.", "so inventors built safety coffins", 0.06, 1.25, {"reg": 0.5, "expand": 1.45}),
    ("cord", "Wake up underground, pull the ^cord...| and a bell ^^rings above you!",
     "wake up underground pull the cord and a bell rings above you", 0.06, 1.25, {"reg": 0.5, "expand": 1.6}),
    # the proof, the count, the twist
    ("buried", "One inventor had himself ^^buried to prove it worked.", "one inventor had himself buried to prove it worked", 0.1, 1.25, {"reg": 0.5, "expand": 1.5}),
    ("patents", "Inventors filed at least ^^twenty-two patents.", "inventors filed at least 22 patents", 0.06, 1.25, {"reg": 0.5, "expand": 1.45}),
    ("nobody", "Nobody is known to have been ^saved by one. \\3", "nobody is known to have been saved by one", 0.12, 1.15, {"reg": -1.0, "expand": 1.4}),
    ("product", "The bell was never the ^product.| Peace of ^^mind+ was.", "the bell was never the product peace of mind was",
     0.12, 1.15, {"reg": 0.0, "expand": 1.5}),
    # the switch
    ("fearW", "Find their ^^fear.", "find their fear", 0.22, 1.1, {"reg": -0.5, "expand": 1.45}),
    ("sell", "Sell them the ^^bell+.", "sell them the bell", 0.05, 1.1, {"reg": 0.5, "expand": 1.5}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_bell_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
