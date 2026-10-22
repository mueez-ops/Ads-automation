"""Voiceover + per-word timing for the reel "2,000 clicks. Zero enquiries." (Kokoro af_heart, the same voice as the
other reels, at a natural pace). Writes reel_goal_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_goal_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    ("clicks", "2,000 clicks.", "2,000 clicks", 0.05, 1.05),
    ("zero", "Zero enquiries.", "zero enquiries", 0.12, 1.05),
    ("wrong", "You asked Meta for the wrong thing.", "you asked Meta for the wrong thing", 0.2, 1.1),
    ("photo", "So you change the photo.", "so you change the photo", 0.22, 1.1),
    ("headline", "The headline.", "the headline", 0.08, 1.1),
    ("audience", "Even the audience.", "even the audience", 0.08, 1.1),
    ("nothing", "Still nothing.", "still nothing", 0.18, 1.05),
    ("because", "That's because Meta gives you exactly what you ask for.", "that's because Meta gives you exactly what you ask for", 0.25, 1.1),
    ("traffic", "Pick Traffic, and it'll find you people who click.", "pick Traffic and it'll find you people who click", 0.22, 1.1),
    ("not", "Not people who enquire.", "not people who enquire", 0.08, 1.05),
    ("leads", "Pick Leads, and it goes looking for the ones who fill in the form.", "pick Leads and it goes looking for the ones who fill in the form", 0.25, 1.1),
    ("ask", "Ask for enquiries, not clicks.", "ask for enquiries not clicks", 0.25, 1.0),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_goal_cues.json", tail=1.3)
