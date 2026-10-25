"""Voiceover + per-word timing for the reel "Nobody tells you a cheaper ad can beat yours on Instagram" (Kokoro
af_heart, the same voice as the other reels, at a natural pace). Writes reel_auction_cues.json and <out_dir>/vo.wav
(44.1 kHz); timing logic in vo_kit.py.
The auction, in Meta's own words ("How does Facebook use machine learning to deliver ads?", Meta for Business): the
ads with the highest total value score are shown; advertiser value is the bid multiplied by the estimated action rate,
and total value combines it with ad quality; "Ads with the highest bid don't always win the auction. Ads with lower
bids often win if our system predicts a person is more likely to respond to them, or finds that they're higher
quality."
Usage: python3 reel_auction_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed)
LINES = [
    ("hook", "Nobody tells you a cheaper ad can beat yours on Instagram.", "nobody tells you a cheaper ad can beat yours on Instagram", 0.05, 1.15),
    ("auction", "Every ad you see there won an auction first.", "every ad you see there won an auction first", 0.15, 1.1),
    ("value", "And the winner is the ad with the highest total value:", "and the winner is the ad with the highest total value", 0.12, 1.1),
    ("formula", "your bid, times how likely that person is to act on it, plus your ad's quality.", "your bid times how likely that person is to act on it plus your ad's quality", 0.1, 1.1),
    ("so", "So a better ad can win with a smaller bid.", "so a better ad can win with a smaller bid", 0.3, 1.05),
    ("pitch", "We scale brands with ads that win this auction.", "we scale brands with ads that win this auction", 0.3, 1.08),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.15, 1.08),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_auction_cues.json", tail=0.6)
