"""Voiceover + per-word timing for the reel "What's on the top floors of the Burj Khalifa" (Kokoro af_heart, the
same voice as the other reels, at a natural pace). Writes reel_burj_cues.json and <out_dir>/vo.wav (44.1 kHz); timing
logic in vo_kit.py. The number in "You just watched this reel for N seconds" has to be the real time when it is
spoken: after a change to the lines before it, run once, read the time printed for that word, and set N to it.
Usage: python3 reel_burj_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits
    ("hook", "Let me explain what's on the top floors of the Burj Khalifa.", "let me explain what's on the top floors of the Burj Khalifa", 0.05, 1.05),
    ("floors", "Floors one fifty-two to one fifty-four.", "floors 152 + to 154 +", 0.25, 1.0),
    ("high", "Five hundred and eighty-five meters up.", "585 + + + metres up", 0.12, 1.05),
    ("lounge", "This is The Lounge,", "this is the Lounge", 0.2, 1.05),
    ("record", "the highest lounge in the world.", "the highest lounge in the world", 0.05, 1.05),
    ("inside", "Sofas, afternoon tea, and an outdoor terrace over Dubai.", "sofas afternoon tea and an outdoor terrace over Dubai", 0.22, 1.08),
    ("booking", "And you can only get in with a booking.", "and you can only get in with a booking", 0.12, 1.08),
    # the switch, after a beat of tension
    ("watched", "You just watched this reel for nineteen seconds.", "you just watched this reel for 19 seconds", 1.4, 0.92),
    ("imagine", "Now imagine your ad held people that long.", "now imagine your ad held people that long", 0.3, 1.05),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.3, 1.05),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.2, 1.05),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_burj_cues.json", tail=1.2)
