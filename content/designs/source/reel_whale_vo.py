"""Voiceover + per-word timing for the explainer reel "Why would anyone pay a million dollars for whale vomit?" (a
Zack D. Films topic, "Whale Vomit Is Worth Millions", 86M views on YouTube; our angle: nobody paid for the lump, they
paid for what it does, and most ads sell the lump). Same voice and method as the armor reel (1,800 views, 19% skip
rate): af_heart with 30% af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_whale_cues.json and <out_dir>/vo.wav (44.1 kHz). Numbers are spoken in words and shown as figures: a "+"
in the caption text rides with the word before it.
Facts:
- BBC Science Focus, "The bizarre (and pretty gross) science of whale vomit": "evidence suggests that ambergris is not
  vomited up by whales at all"; sperm whales eat squid whose beaks are hard and indigestible; in around 1 to 5 per
  cent of sperm whales the beaks work into the gut, which secretes a waxy substance, and beaks and wax form a solid
  mass of ambergris; when first released it "is said to smell rather strongly of faeces", and floating on the sea in
  sunlight the scent "mellows and becomes more musky" (aged, it is described as sweet and earthy: Museums
  Victoria specimen record, Wikipedia); it is prized "as a fixative and ingredient in fine perfumes";
  possession and trade are illegal in some countries, including the US.
- Gulf News (AFP, 2021): 35 fishermen found a floating sperm whale carcass about 26 km off Aden in February 2021,
  towed it to shore, and the 127 kg lump of ambergris inside "was sold to a Gulf businessman for more than
  $1.5 million". The National: "prized by perfume makers for making scents last longer"; about $12,000 a kilo.
Usage: python3 reel_whale_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a bright answer, a twist dropped low
    ("why", "Why would anyone pay a ^^million dollars for whale ^vomit? /6", "why would anyone pay a million dollars for whale vomit",
     0.05, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("perfume", "For ^^perfume+!", "for perfume", 0.04, 1.1, {"reg": 2.0, "expand": 1.45}),
    ("isnt", "And it ^^isn't even vomit. \\4", "and it isn't even vomit", 0.12, 1.15, {"reg": -0.5, "expand": 1.55}),
    # what it is
    ("forms", "It forms in a sperm whale's ^gut,| around ^^squid beaks.", "it forms in a sperm whale's gut around squid beaks",
     0.08, 1.3, {"reg": 0.0, "expand": 1.55}),
    ("stinks", "Fresh, it ^^stinks+!", "fresh it stinks", 0.06, 1.15, {"reg": 1.5, "expand": 1.55}),
    ("sweet", "Years at sea make it ^^sweet+.", "years at sea make it sweet", 0.06, 1.15, {"reg": 0.5, "expand": 1.45}),
    # the find
    ("found", "Yemeni fishermen found a hundred and ^twenty-seven kilos ^^inside a dead whale.",
     "Yemeni fishermen found 127 + + + kilos inside a dead whale", 0.1, 1.3, {"reg": 0.0, "expand": 1.55}),
    ("sold", "It sold for ^^one and a half million dollars!", "it sold for $1.5M + + + + +", 0.06, 1.2, {"reg": 1.5, "expand": 1.55}),
    # why, and the turn
    ("last", "Why? It makes perfume ^^last+ longer.", "why it makes perfume last longer", 0.1, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("lump", "Nobody paid for the _lump.| They paid for what it ^^does.", "nobody paid for the lump they paid for what it does",
     0.1, 1.15, {"reg": 0.0, "expand": 1.55}),
    # the switch
    ("ads", "Most ads sell the ^lump.", "most ads sell the lump", 0.22, 1.2, {"reg": -0.5, "expand": 1.45}),
    ("sell", "Sell what it ^^does.", "sell what it does", 0.06, 1.1, {"reg": 0.5, "expand": 1.55}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_whale_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
