"""Voiceover + per-word timing for the switch reel "Nobody tells you the Eiffel Tower has a secret apartment at the
top", read like a fast facts short: af_heart with 30% of af_sarah for a livelier pitch, each line in one take at 1.3x,
tight gaps, a beat before the reveal, and a close, punchy vocal chain (more presence, harder compression). Writes reel_eiffel_cues.json and
<out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py. The number in "You've just watched this reel for N seconds"
has to be the real time when it is spoken: after a change to the lines before it, run once, read the time printed
for that word, and set N to it.
Usage: python3 reel_eiffel_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits
    ("hook", "Nobody tells you the Eiffel Tower has a secret apartment at the top.", "nobody tells you the Eiffel Tower has a secret apartment at the top", 0.05, 1.3),
    ("built", "Gustave Eiffel built it for himself.", "Gustave Eiffel built it for himself", 0.06, 1.3),
    # "Rich Parisians": in this voice "Paris's rich" is heard as "Harris' rich" after the line before it
    ("offers", "Rich Parisians offered fortunes to rent it for one night.", "rich Parisians offered fortunes to rent it for one night", 0.06, 1.3),
    ("no", "He said no to all of them.", "he said no to all of them", 0.05, 1.3),
    ("guest", "His most famous guest? Thomas Edison.", "his most famous guest Thomas Edison", 0.08, 1.3),
    ("wax", "And they're both still up there.", "and they're both still up there", 0.08, 1.3),
    ("reveal", "In. Wax.", "in wax", 0.3, 1.1),                  # a beat before the reveal, and two beats in it ("In wax" runs to "and wax")
    # the switch, after a beat of tension ("You've": with a bare "You just watched" the -ed is lost before "this")
    ("watched", "You've just watched this reel for fifteen seconds.", "you've just watched this reel for 15 seconds", 1.0, 1.1),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.15, 1.25),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.15, 1.25),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.25),
]

# close and punchy: high-pass, de-mud, presence and air, harder compression, then a limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_eiffel_cues.json", tail=0.6,
        voice={"af_heart": 0.7, "af_sarah": 0.3}, continuous=True, polish=POLISH)
