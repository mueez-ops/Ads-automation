"""Voiceover + per-word timing for the reel "Stop editing your ads every day" (Kokoro af_heart, the same voice as the
other reels, at a natural pace). Writes reel_edits_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_edits_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits
    ("stop", "Stop editing your ads every day.", "stop editing your ads every day", 0.05, 1.1),
    ("costing", "Here's what it's costing you.", "here's what it's costing you", 0.1, 1.1),
    ("monday", "Monday, a new headline.", "Monday a new headline", 0.22, 1.15),
    ("tuesday", "Tuesday, a bigger budget.", "Tuesday a bigger budget", 0.1, 1.15),
    ("wednesday", "Wednesday, a new audience.", "Wednesday a new audience", 0.1, 1.15),
    ("feels", "Feels like progress.", "feels like progress", 0.22, 1.08),
    ("isnt", "It isn't.", "it isn't", 0.16, 1.0),
    ("every", "Every one of those edits sends your ad set back into learning,", "every one of those edits sends your ad set back into learning", 0.22, 1.15),
    ("needs", "and Meta needs about fifty results in seven days to finish.", "and Meta needs about 50 results in 7 days to finish", 0.06, 1.15),
    ("daily", "Edit daily, and it never finishes.", "edit daily and it never finishes", 0.2, 1.1),
    ("pays", "Your budget pays for learning, not selling.", "your budget pays for learning not selling", 0.18, 1.1),
    ("make", "Make your changes in one go,", "make your changes in one go", 0.22, 1.15),
    ("leave", "then leave the ad alone for seven days.", "then leave the ad alone for 7 days", 0.05, 1.15),
    ("boring", "Boring ads that keep running beat clever ads that keep restarting.",
     "boring ads that keep running beat clever ads that keep restarting", 0.26, 1.1),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_edits_cues.json", tail=1.1)
