"""Voiceover + per-word timing for the switch reel "This is the reality of Brez Scales" (the addxstudio explainer's
kinetic type mixed with the Rushmore/Eiffel switch format). Deep, calm male read like the reference's narrator
(am_onyx, ~86 Hz; the reference sits at 74-116 Hz and ~200 words a minute), each line in one take.
Writes reel_brez_cues.json and <out_dir>/vo.wav (44.1 kHz); timing logic in vo_kit.py. The number in "You've just
watched this reel for N seconds" has to be the real time when it is spoken: after a change to the lines before it,
run once, read the time printed for that word, set N.
Every claim is attributed, because he is a real person:
- "$400K/month before his 21st birthday", late 2022 college student in digital marketing who dropped out, "a cracked
  phone, a Canva subscription, and a TikTok account", first niche clothing, the Lambo Aventador crashed, the G-Wagon
  towed, the BMW "banged up 3 hours after buying", "notorious for wrecking rentals", "If a rented Lambo gets you a
  client that pays $10K/month, that's ROI, not a flex", "the cars, the chains, the views? That's all marketing":
  Whop blog, "From dropping out to making $400K/month at 20 years old" (2025). Whop is where he sells his mentorship.
- He ran ads for clothing brands for a percentage of profits; his main revenue comes from selling courses and
  mentorship, from a $47-97 bootcamp to an invitation-only program of about $4,800; his revenue figures have no
  independent verification: drews-review.com/brez-scales (2026); potionads.com review ("independent verification of
  revenue figures is unavailable").
Usage: python3 reel_brez_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed[, fx])
LINES = [
    ("hook", "This is the reality of Brez Scales.", "this is the reality of Brez Scales", 0.05, 1.15),
    ("claim", "He says he hit four hundred thousand dollars a month, before he turned twenty-one.",
     "he says he hit $400,000 + + + a month before he turned 21", 0.15, 1.25),
    ("loop", "But the money isn't coming from where you think.", "but the money isn't coming from where you think", 0.2, 1.15),
    ("school", "Late twenty twenty-two. He's a college student, studying digital marketing. He drops out.",
     "late 2022 + he's a college student studying digital marketing he drops out", 0.22, 1.27),
    ("start", "With a cracked phone, Canva and TikTok, he runs ads for clothing brands, for a cut of their profits.",
     "with a cracked phone Canva and TikTok he runs ads for clothing brands for a cut of their profits", 0.12, 1.3),
    ("cars", "Then came the lifestyle. A crashed Lambo. A towed G-Wagon. A BMW banged up three hours after he bought it.",
     "then came the lifestyle a crashed Lambo a towed G-Wagon a BMW banged up 3 hours after he bought it", 0.15, 1.24),
    ("rented", "Even the site that sells his mentorship calls the cars marketing. Some of them, rentals.",
     "even the site that sells his mentorship calls the cars marketing some of them rentals", 0.15, 1.24),
    ("money", "So where does the money come from? Reviewers say: mostly, selling courses.",
     "so where does the money come from reviewers say mostly selling courses", 0.18, 1.24),
    ("prices", "A forty-seven dollar bootcamp. A mentorship around forty-eight hundred.",
     "a $47 + bootcamp a mentorship around $4,800 +", 0.1, 1.2),
    ("sells", "And the lifestyle is what sells them.", "and the lifestyle is what sells them", 0.25, 1.1),
    # the switch, after a beat of tension
    ("watched", "You've just watched this reel for forty seconds.", "you've just watched this reel for 40 seconds", 1.0, 1.15),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.15, 1.17),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.15, 1.25),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.25),
]

POLISH = ("highpass=f=60,equalizer=f=200:t=q:w=1:g=-1.5,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=6:release=90:makeup=2.5,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_brez_cues.json", tail=0.6,
        voice="am_onyx", continuous=True, polish=POLISH)
