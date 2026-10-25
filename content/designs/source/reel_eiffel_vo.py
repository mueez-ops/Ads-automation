"""Voiceover + per-word timing for the switch reel "Nobody tells you the Eiffel Tower has a secret apartment at the
top" (Kokoro af_heart, the same voice as the other reels, at a natural pace). Writes reel_eiffel_cues.json and
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
    ("hook", "Nobody tells you the Eiffel Tower has a secret apartment at the top.", "nobody tells you the Eiffel Tower has a secret apartment at the top", 0.05, 1.2),
    ("built", "Gustave Eiffel built it for himself.", "Gustave Eiffel built it for himself", 0.12, 1.1),
    ("offers", "Paris's rich offered fortunes to rent it for one night.", "Paris's rich offered fortunes to rent it for one night", 0.12, 1.1),
    ("no", "He said no to all of them.", "he said no to all of them", 0.05, 1.1),
    ("guest", "His most famous guest? Thomas Edison.", "his most famous guest Thomas Edison", 0.12, 1.1),
    ("wax", "And they're both still up there. In wax.", "and they're both still up there in wax", 0.12, 1.1),
    # the switch, after a beat of tension ("You've": with a bare "You just watched" the -ed is lost before "this")
    ("watched", "You've just watched this reel for seventeen seconds.", "you've just watched this reel for 17 seconds", 1.0, 0.92),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.25, 1.08),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.25, 1.08),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.15, 1.08),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_eiffel_cues.json", tail=0.6)
