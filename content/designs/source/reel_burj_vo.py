"""Voiceover + per-word timing for the reel "What's on the top floors of the Burj Khalifa" (Kokoro af_heart, the
same voice as the other reels, at a natural pace). Writes reel_burj_cues.json and <out_dir>/vo.wav (44.1 kHz); timing
logic in vo_kit.py. The number in "You've just watched this reel for N seconds" has to be the real time when it is
spoken: after a change to the lines before it, run once, read the time printed for that word, and set N to it.
Usage: python3 reel_burj_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits
    ("hook", "Nobody tells you the Burj Khalifa has a lounge above its observation deck.", "nobody tells you the Burj Khalifa has a lounge above its observation deck", 0.05, 1.2),
    ("high", "It sits five hundred and eighty-five meters up.", "it sits 585 + + + metres up", 0.12, 1.1),
    ("record", "It's called The Lounge, the highest in the world,", "it's called the Lounge the highest in the world", 0.12, 1.1),
    ("inside", "with afternoon tea and a terrace over Dubai.", "with afternoon tea and a terrace over Dubai", 0.05, 1.1),
    ("booking", "And you can only get in with a booking.", "and you can only get in with a booking", 0.1, 1.1),
    # the switch, after a beat of tension
    # "You've": with a bare "You just watched" the -ed is lost before "this" and it is heard as "watch"
    ("watched", "You've just watched this reel for fifteen seconds.", "you've just watched this reel for 15 seconds", 1.0, 0.92),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.25, 1.08),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.25, 1.08),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.15, 1.08),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_burj_cues.json", tail=0.6)
