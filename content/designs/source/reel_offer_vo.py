"""Voiceover + per-word timing for the reel "Bad offer, not bad ads" (Kokoro af_heart, the same voice as the
other reels, read faster). Writes reel_offer_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_offer_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    ("hook", "I'd fix this before spending another dollar on ads.", "i'd fix this before spending another dollar on ads", 0.05, 1.15),
    ("cost", "Your ads aren't always too expensive.", "your ads aren't always too expensive", 0.25, 1.15),
    ("offer", "Sometimes, your offer isn't fine.", "sometimes your offer isn't fine", 0.15, 1.12),
    ("wake", "Nobody wakes up wanting to buy your service.", "nobody wakes up wanting to buy your service", 0.25, 1.15),
    ("problem", "They want a problem solved.", "they want a problem solved", 0.12, 1.1),
    ("stop", "Stop advertising what you do.", "stop advertising what you do", 0.25, 1.15),
    ("start", "Start communicating why it matters.", "start communicating why it matters", 0.12, 1.12),
    ("because", "Because better targeting can't fix an offer people don't want.",
     "because better targeting can't fix an offer people don't want", 0.25, 1.15),
    ("cta", "Agree or disagree? Tell me below.", "agree or disagree tell me below", 0.35, 1.1),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_offer_cues.json", tail=1.8)
