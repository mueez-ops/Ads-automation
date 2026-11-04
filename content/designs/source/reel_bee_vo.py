"""Voiceover + per-word timing for the explainer reel "Why would a bee sting you, if it kills her?" (a Zack D. Films topic,
"Why Bees Die After They Sting You", 115M views on YouTube; our angle: one sting tags you and the hive does the rest,
which is how retargeting works: the first ad tags who is interested, the next ads find them and sell). Same voice and
method as the armor, bell, equals, pump, Stanley and McFlurry reels: af_heart with 30% af_sarah, fast, the melody
written word by word in vo_expr.py. Writes reel_bee_cues.json and <out_dir>/vo.wav (44.1 kHz).
Facts:
- Worker honeybees have barbed stingers (queens, bumblebees, wasps and hornets have smooth ones and can sting again).
  In mammal skin the barbs catch; when the bee pulls away the stinger tears free with the venom gland and part of the
  digestive tract, and she dies (BBC Wildlife / Discover Wildlife, "Why does a bee die after it stings you?"; UC
  Agriculture and Natural Resources, Bug Squad, "Why do honey bees die when they sting?").
- The stinger's muscles keep pumping venom after it tears free, for about 45 to 60 seconds, so it is best scraped out
  quickly (entomologist Eric Mussen, UC Agriculture and Natural Resources).
- Worker bees sting to defend the colony. The sting releases an alarm pheromone from the Koschevnikov gland near the
  sting shaft; its main active compound, isopentyl acetate ("banana oil"), smells like bananas, and it draws other bees
  to the spot and makes them defensive (Bee Culture; the list of honey bee pheromones on Wikipedia).
Usage: python3 reel_bee_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_expr import make_vo

# (key, marked text (see vo_expr.py), caption text (same number of words), gap before, speed, line fx)
LINES = [
    # the hook: a question that climbs, a surprising answer
    ("why", "Why would a bee sting you,| if it ^^kills her? /6", "why would a bee sting you if it kills her", 0.05, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("hive", "Because she's defending the ^^hive!", "because she's defending the hive", 0.05, 1.15, {"reg": 1.5, "expand": 1.55}),
    # how it works
    ("barbs", "Her stinger has ^^barbs,| like a harpoon.", "her stinger has barbs like a harpoon", 0.08, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("rip", "It hooks in your skin,| and ^^rips out of her body!", "it hooks in your skin and rips out of her body", 0.06, 1.2, {"reg": 1.0, "expand": 1.55}),
    ("pump", "And it keeps pumping venom,| for up to a ^^minute.", "and it keeps pumping venom for up to a minute", 0.06, 1.2, {"reg": 0.0, "expand": 1.5}),
    ("smell", "It also leaves a smell,| like ^^bananas,| that marks you for the hive.", "it also leaves a smell like bananas that marks you for the hive", 0.06, 1.2, {"reg": 0.5, "expand": 1.55}),
    ("tags", "One sting ^^tags you.| The hive does the rest.", "one sting tags you the hive does the rest", 0.08, 1.15, {"reg": 0.5, "expand": 1.6}),
    # the switch
    ("ad", "Your first ad doesn't need to sell.| It ^^tags who's interested.", "your first ad doesn't need to sell it tags who's interested", 0.16, 1.15, {"reg": 0.0, "expand": 1.5}),
    ("next", "Then your next ads ^^find them,| and sell.", "then your next ads find them and sell", 0.08, 1.15, {"reg": 0.5, "expand": 1.5}),
    ("scale", "We scale businesses with ads ^like this.", "we scale businesses with ads like this", 0.15, 1.2, {"reg": 0.0, "expand": 1.45}),
    ("dm", "DM us the word ^teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.08, 1.2, {"reg": 0.0, "expand": 1.45}),
]

# close and punchy (the Rushmore chain): high-pass, de-mud, presence and air, compression, limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")

if __name__ == "__main__":
    make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_bee_cues.json", tail=0.6,
            voice={"af_heart": 0.7, "af_sarah": 0.3}, polish=POLISH)
