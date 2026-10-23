"""Voiceover + per-word timing for the reel "If Meta can't see your sales, it can't find you more buyers" (Kokoro
af_heart, the same voice as the other reels, at a natural pace). Writes reel_pixel_cues.json and <out_dir>/vo.wav
(44.1 kHz); timing logic in vo_kit.py.
Usage: python3 reel_pixel_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words), gap before, speed)
LINES = [
    # numbers are spoken in words (the phonemizer misreads digits) and shown as digits; "+" marks a spoken word that
    # rides with the caption word before it (reel_pixel.js merges them), so "Two minute" shows as "2-minute" and
    # "thank you" as "thank-you"
    ("meta", "If Meta can't see your sales, it can't find you more buyers.", "if Meta can't see your sales it can't find you more buyers", 0.05, 1.1),
    ("store", "This store sold twelve candles last week.", "this store sold 12 candles last week", 0.22, 1.1),
    ("shopify", "Shopify showed all twelve.", "Shopify showed all 12", 0.18, 1.08),
    ("zero", "Ads Manager showed zero.", "Ads Manager showed 0", 0.1, 1.05),
    # "every guess sent the ads to the wrong people" was heard as "every guest", whatever came after it
    ("guess", "So Meta kept guessing who buys, and kept guessing wrong.", "so Meta kept guessing who buys and kept guessing wrong", 0.25, 1.08),
    ("why", "Why?", "why", 0.22, 1.0),
    ("code", "The tracking code wasn't firing on the thank you page.", "the tracking code wasn't firing on the thank-you + page", 0.2, 1.1),
    ("fix", "Two minute fix.", "2-minute + fix", 0.26, 1.08),
    ("open", "Open Events Manager, tap Test events, and buy from your own store.", "open Events Manager tap Test events and buy from your own store", 0.1, 1.1),
    ("nothing", "Nothing?", "nothing", 0.25, 1.0),
    ("first", "Fix that first.", "fix that first", 0.12, 1.05),
    ("finds", "Meta finds buyers by watching the ones you already have.", "Meta finds buyers by watching the ones you already have", 0.3, 1.05),
]

make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_pixel_cues.json", tail=1.3)
