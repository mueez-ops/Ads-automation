"""Voiceover + per-word timing for the reel "The cheaper business lost the customer" (Kokoro af_heart, the same
voice as the other reels, read fast). Writes reel_cheap_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Kokoro reads a lone "A" as the article ("uh"), so the spoken text spells the letter "Eigh"; the captions show "A".
Usage: python3 reel_cheap_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    ("two", "Two businesses sold almost the same service.", "two businesses sold almost the same service", 0.05, 1.3),
    ("cheaper", "One was cheaper.", "one was cheaper", 0.08, 1.22),
    ("chose", "The customer chose the expensive one.", "the customer chose the expensive one", 0.08, 1.22),
    ("a_ad", "Business Eigh advertised a low price.", "business A advertised a low price", 0.18, 1.3),
    ("b_ad", "Business B explained exactly who its service was for, and what problem it solved.",
     "business B explained exactly who its service was for and what problem it solved", 0.1, 1.32),
    ("a_price", "Eigh competed on price.", "A competed on price", 0.18, 1.15),
    ("b_value", "B made the value easier to understand.", "B made the value easier to understand", 0.08, 1.24),
    ("lesson", "The lesson?", "the lesson", 0.2, 1.12),
    ("low", "A low price doesn't automatically make an offer attractive.", "a low price doesn't automatically make an offer attractive", 0.1, 1.24),
    ("rescue", "Your ad can't rescue an offer customers don't understand.", "your ad can't rescue an offer customers don't understand", 0.2, 1.22),
    ("cta", "Follow for more practical marketing breakdowns.", "follow for more practical marketing breakdowns", 0.22, 1.22),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_cheap_cues.json", tail=1.1)
