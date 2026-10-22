"""Voiceover + per-word timing for the reel "47 leads. Zero sales." (Kokoro af_heart, the same voice as the other
reels, read fast). Writes reel_leads_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_leads_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    ("got", "He got 47 leads from his ads...", "he got 47 leads from his ads", 0.05, 1.22),
    ("zero", "and made zero sales.", "and made zero sales", 0.22, 1.12),
    ("blamed", "So he blamed Meta Ads.", "so he blamed Meta ads", 0.28, 1.2),
    ("off", "He wanted to turn everything off.", "he wanted to turn everything off", 0.1, 1.22),
    ("checked", "But then he checked the leads.", "but then he checked the leads", 0.28, 1.18),
    ("half", "Half weren't even serious buyers.", "half weren't even serious buyers", 0.12, 1.15),
    ("wasnt", "The problem wasn't just getting leads.", "the problem wasn't just getting leads", 0.28, 1.2),
    ("right", "It was attracting the right people, and following up properly.",
     "it was attracting the right people and following up properly", 0.1, 1.2),
    ("fix", "More leads won't fix a broken sales process.", "more leads won't fix a broken sales process", 0.28, 1.12),
    ("cta", "Follow for marketing lessons most businesses learn the expensive way.",
     "follow for marketing lessons most businesses learn the expensive way", 0.28, 1.2),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_leads_cues.json", tail=1.1)
