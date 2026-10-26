"""Voiceover + per-word timing for the explainer reel "How Face ID knows it's you" (inspired by the touchscreen
explainer: a paradox hook, a second loop, then the mechanism one picture per line, both loops closed at the end).
Low American male read (am_fenrir: Whisper hears every word as written, where the British voices lost "dots" and
"odds"), each line in one take. The hook moves the voice up and down on purpose: a weighty drop on "in total
darkness", a hushed lift on the photo, a low flat "Nothing.", a question that climbs on "asleep?", a low flat "Still
locked.", then the question that opens the explanation. Writes reel_faceid_cues.json and <out_dir>/vo.wav
(44.1 kHz); timing logic in vo_kit.py. The number in "You've just watched this reel for N seconds" has to be the real
time when it is spoken: after a change to the lines before it, run once, read the time printed for that word, set N.
Facts (Apple): Face ID projects more than 30,000 invisible IR dots (iPhone X announcement, Sept 2017); the TrueDepth
camera is a dot projector, an infrared camera and a flood illuminator; it reads the dots to make a depth map of the
face and works even in total darkness; it needs depth, "which isn't found in print or 2D digital photographs"; a part
of the neural engine inside the Secure Enclave turns the depth map and infrared image into a mathematical
representation and compares it with the enrolled face; the chance a random person unlocks it is less than 1 in
1,000,000; it checks that your eyes are open, so it's harder to unlock "when you are sleeping"
(support.apple.com/en-us/102381; Apple Platform Security).
Usage: python3 reel_faceid_vo.py <kokoro_dir> <out_dir>
"""
import sys
from pathlib import Path

from vo_kit import make_vo

# (key, spoken text, caption text (same words; "+" rides with the word before it), gap before, speed[, fx])
LINES = [
    # the hook: up and down on purpose
    ("see", "Your iPhone can see your face,", "your iPhone can see your face", 0.05, 1.15, {"rise": 2.0}),
    ("dark", "in total darkness.", "in total darkness", 0.04, 1.0, {"pitch": -5.0, "flat": 0.6, "gain": 1.5}),
    ("photo", "But show it a perfect photo of you...", "but show it a perfect photo of you", 0.3, 1.1, {"pitch": 4.0, "rise": 2.0, "gain": -4.0}),
    ("nothing", "Nothing.", "nothing", 0.4, 0.88, {"pitch": -3.0, "flat": 0.3, "gain": 1.5}),
    ("asleep", "Hold it to your face while you're asleep?", "hold it to your face while you're asleep", 0.3, 1.12, {"pitch": 2.0, "rise": 9.0}),
    ("still", "Still locked.", "still locked", 0.22, 0.98, {"pitch": -6.0, "flat": 0.3, "gain": 1.0}),
    ("how", "So how does it know it's really you?", "so how does it know it's really you", 0.35, 1.08),
    # the mechanism, one picture per line
    ("proj", "Above your screen, a projector fires over thirty thousand invisible dots at your face.",
     "above your screen a projector fires over 30,000 + invisible dots at your face", 0.18, 1.2),
    ("cam", "A camera sees the dots on your nose land closer than the ones on your cheeks.",
     "a camera sees the dots on your nose land closer than the ones on your cheeks", 0.12, 1.2),
    ("map", "That's a three D map of your face.", "that's a 3D + map of your face", 0.06, 1.12),
    ("flat", "A photo is flat. No depth. No unlock.", "a photo is flat no depth no unlock", 0.25, 1.1),
    ("darkx", "In the dark, it lights you up with infrared you can't see.", "in the dark it lights you up with infrared you can't see", 0.25, 1.2),
    ("chip", "A locked part of the chip turns that map into numbers, and compares them with your saved face.",
     "a locked part of the chip turns that map into numbers and compares them with your saved face", 0.18, 1.2),
    ("odds", "The odds a stranger gets in?", "the odds a stranger gets in", 0.15, 1.15, {"rise": 6.0}),
    ("million", "Less than one in a million.", "less than 1 in a million", 0.12, 1.08, {"pitch": -1.5, "flat": 0.6}),
    ("eyes", "And asleep? It checks that your eyes are open.", "and asleep it checks that your eyes are open", 0.3, 1.15),
    ("shut", "Eyes closed? Locked.", "eyes closed locked", 0.12, 1.05, {"pitch": -2.0, "flat": 0.5}),
    # the switch, after a beat of tension ("You've": with a bare "You just watched" the -ed is lost before "this")
    ("watched", "You've just watched this reel for thirty-nine seconds.", "you've just watched this reel for 39 seconds", 1.0, 1.08),
    ("imagine", "Imagine your ad held people that long.", "imagine your ad held people that long", 0.15, 1.2),
    ("scale", "We scale businesses with ads like this.", "we scale businesses with ads like this", 0.15, 1.2),
    ("dm", "DM us the word teardown for a free ad review.", "DM us the word teardown for a free ad review", 0.1, 1.2),
]

# close and present, but a lighter compressor than the facts reels so the hook keeps its loud and quiet lines
POLISH = ("highpass=f=75,equalizer=f=220:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=9000:t=q:w=1:g=1.5,"
          "acompressor=threshold=-20dB:ratio=2.2:attack=6:release=90:makeup=2.5,alimiter=limit=0.9")
make_vo(LINES, sys.argv[1], sys.argv[2], Path(__file__).parent / "reel_faceid_cues.json", tail=0.6,
        voice="am_fenrir", continuous=True, polish=POLISH)
