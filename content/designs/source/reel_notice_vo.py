"""Voiceover + per-word timing for the reel "Nobody notices it" (Kokoro af_heart, same voice as reel_premium).
Writes reel_notice_cues.json and <out_dir>/vo.wav (44.1 kHz). The timing logic lives in vo_kit.py.
Usage: python3 reel_notice_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words, British spelling), gap before, speed)
LINES = [
    ("hook", "People are beginning to realize that your business isn't failing because your product is bad.",
     "people are beginning to realise that your business isn't failing because your product is bad", 0.05, 1.08),
    ("notice", "It might be because nobody notices it.", "it might be because nobody notices it", 0.3, 1.02),
    ("best", "You could have the best product in your city.", "you could have the best product in your city", 0.4, 1.08),
    ("same", "But if your content looks like everyone else's, customers will scroll past you.",
     "but if your content looks like everyone else's customers will scroll past you", 0.3, 1.1),
    ("hooks", "Better hooks.", "better hooks", 0.4, 1.0),
    ("creatives", "Better creatives.", "better creatives", 0.24, 1.0),
    ("marketing", "Better marketing.", "better marketing", 0.24, 1.0),
    ("earn", "That's how you earn attention.", "that's how you earn attention", 0.38, 1.0),
    ("cta", "Follow us if you want your brand to stand out.", "follow us if you want your brand to stand out", 0.5, 1.05),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_notice_cues.json", tail=2.0)
