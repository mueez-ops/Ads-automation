"""Voiceover + per-word timing for the switch reel "Nobody tells you Mount Rushmore has a secret room behind Lincoln's
head", read like a fast facts short (the Eiffel reel's voice, which held viewers): af_heart with 30% of af_sarah, each
line in one take at 1.3x, tight gaps, a beat before the reveal, and a close, punchy vocal chain. Writes
reel_rushmore_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py. The number in "You've just
watched this reel for N seconds" has to be the real time when it is spoken: after a change to the lines before it,
run once, read the time printed for that word, and set N to it.
Facts (National Park Service, "Hall of Records", nps.gov/moru): the hall was to be cut into the canyon behind the
faces, its stairway meeting "the canyon mouth behind Lincoln's head"; a 70-foot tunnel was blasted between July 1938
and July 1939, for documents "such as the Constitution and the Declaration of Independence"; work halted in 1939 when
Congress directed that only the faces be carved, and the hall was never finished; on 9 August 1998 a repository of
sixteen porcelain enamel panels (a teakwood box in a titanium vault, under a granite capstone) was placed in the
floor of the hall's entry, telling how and why the memorial was carved and a short history of the United States,
"left as a record for people thousands of years from now".
Usage: python3 reel_rushmore_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits
    ("hook", "Nobody tells you Mount Rushmore has a secret room behind Lincoln's head.", "nobody tells you Mount Rushmore has a secret room behind Lincoln's head", 0.05, 1.3),
    ("sealed", "And something is sealed inside it.", "and something is sealed inside it", 0.06, 1.3),
    ("blast", "The sculptor blasted it out in nineteen thirty-eight, but never finished.", "the sculptor blasted it out in 1938 + but never finished", 0.08, 1.3),
    ("vault", "In nineteen ninety-eight, they sealed a titanium vault in its floor.", "in 1998 + they sealed a titanium vault in its floor", 0.08, 1.3),
    ("panels", "Sixteen panels inside tell America's story.", "16 panels inside tell America's story", 0.06, 1.3),
    ("reveal", "Left for people. Thousands of years from now.", "left for people thousands of years from now", 0.3, 1.15),   # a beat before the reveal
    # the switch, after a beat of tension ("You've": with a bare "You just watched" the -ed is lost before "this")
    ("watched", "You've just watched this reel for eighteen seconds.", "you've just watched this reel for 18 seconds", 1.0, 1.1),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.15, 1.25),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.15, 1.25),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.25),
]

# close and punchy: high-pass, de-mud, presence and air, harder compression, then a limiter
POLISH = ("highpass=f=90,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3500:t=q:w=1.2:g=3,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-22dB:ratio=4:attack=3:release=60:makeup=4,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_rushmore_cues.json", tail=0.6,
        voice={"af_heart": 0.7, "af_sarah": 0.3}, continuous=True, polish=POLISH)
