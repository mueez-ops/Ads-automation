"""Voiceover + per-word timing for the story reel "Alex spent $2,000 on Meta ads" (Kokoro af_heart, the same voice as
the other reels, at a natural pace; the short beats get their own lines so the pauses land). Writes
reel_alex_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_alex_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    # the phonemizer reads "$2,000" as "dollar two thousand", so amounts are spoken in words; "+" marks a spoken word that
    # rides with the caption word before it (reel_alex.js merges them), so the captions still show "$2,000" and "$20"
    ("spent", "Alex spent two thousand dollars on Meta ads.", "Alex spent $2,000 + + on Meta ads", 0.05, 1.12),
    ("none", "Not one customer.", "not one customer", 0.1, 1.05),
    ("found", "His daughter found out why in ten seconds.", "his daughter found out why in ten seconds", 0.2, 1.13),
    ("tried", "He tried everything.", "he tried everything", 0.22, 1.13),
    ("photos", "New photos.", "new photos", 0.05, 1.13),
    ("off", "Twenty dollars off.", "$20 + off", 0.05, 1.13),
    ("audience", "A new audience.", "a new audience", 0.05, 1.13),
    ("still", "Still nothing.", "still nothing", 0.14, 1.05),
    ("switch", "He opened Ads Manager to switch it all off.", "he opened Ads Manager to switch it all off", 0.16, 1.13),
    ("grabbed", "Then Sara grabbed his phone and tried to book a cleaning.", "then Sara grabbed his phone and tried to book a cleaning", 0.22, 1.15),
    ("tapped", "She tapped Book now.", "she tapped Book now", 0.1, 1.12),
    ("nothing", "Nothing.", "nothing", 0.24, 1.0),
    ("broken", "The button didn't work on phones.", "the button didn't work on phones", 0.22, 1.12),
    ("months", "Two months.", "two months", 0.1, 1.12),
    ("dead", "Every click, a dead end.", "every click a dead end", 0.06, 1.12),
    ("fixed", "He fixed it that night, and by Friday his phone was ringing.",
     "he fixed it that night and by Friday his phone was ringing", 0.24, 1.15),
    ("before", "Before you blame your ads, try booking yourself, on your phone.",
     "before you blame your ads try booking yourself on your phone", 0.26, 1.12),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_alex_cues.json", tail=1.0)
