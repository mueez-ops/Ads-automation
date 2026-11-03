"""Voiceover + per-word timing for the explainer reel "Why would anyone make a spoon with a hollow handle?" (a Zack D.
Films topic, "McFlurry Spoon Looks Weird", 166M views on YouTube, their most watched; our angle: the spoon does two jobs,
and so must the first second of an ad: stop the scroll and show what you sell). Same voice and method as the armor,
bell, equals, pump and Stanley reels: af_heart with 30% af_sarah, fast, the melody written word by word in vo_expr.py.
Writes reel_mcf_cues.json and <out_dir>/vo.wav (44.1 kHz).
Facts:
- The McFlurry spoon's hollow handle clips onto the McFlurry machine, which spins it to mix the toppings into the soft
  serve; the crew then hand it over in the cup and it is the spoon you eat with. McDonald's (October 2023): "True McFlurry
  fans know the spoon doubles as a spindle, which restaurant crew use to mix the perfect amount of sweet toppings into
  our creamy soft serve" (CNN, Fox Business, Scripps News, October 2023).
- The McFlurry was first made on 7 June 1995 in Bathurst, New Brunswick, by franchisee Ron McLellan; the hollow-handled
  spoon was developed the same year with the packaging supplier Flurry International (McDonald's Canada newsroom,
  "From Canada with Love: Celebrating 30 Delicious Years of the McFlurry").
- So each McFlurry is mixed by its own spoon ("every cup gets its own mixer"), which the customer then keeps.
- In late October 2023 McDonald's said its U.S. restaurants would switch to a reusable spindle, cleaned after each
  McFlurry, and serve the dessert with a smaller spoon, to cut single-use plastic (CNN; Fox Business; Scripps News).
Usage: python3 reel_mcf_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a surprising answer
    ("why", "Why would anyone make a spoon with a ^^hollow handle? /6", "why would anyone make a spoon with a hollow handle", 0.05, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("mixer", "Because the McFlurry spoon is the ^^mixer!", "because the McFlurry spoon is the mixer", 0.05, 1.15, {"reg": 1.5, "expand": 1.55}),
    # how it works
    ("plug", "The machine plugs into the ^handle,| and ^^spins it!", "the machine plugs into the handle and spins it", 0.08, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("whip", "It whips the toppings through the ^^ice cream.", "it whips the toppings through the ice cream", 0.06, 1.2, {"reg": 0.0, "expand": 1.5}),
    ("stays", "Then it stays in the cup,| and you ^^eat with it!", "then it stays in the cup and you eat with it", 0.06, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("own", "So every cup gets its ^^own mixer.", "so every cup gets its own mixer", 0.06, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("jobs", "One spoon.| ^^Two jobs.", "one spoon two jobs", 0.1, 1.1, {"reg": 0.5, "expand": 1.6}),
    # the switch
    ("ad", "Your ad's first second needs ^^two jobs too.", "your ad's first second needs two jobs too", 0.16, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("stop", "Stop the ^^scroll,| and show what you ^^sell.", "stop the scroll and show what you sell", 0.08, 1.15, {"reg": 0.5, "expand": 1.5}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_mcf_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
